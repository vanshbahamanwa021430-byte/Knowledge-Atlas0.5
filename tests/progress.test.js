import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, addDays, lastDays, streaks, xpTotal, levelFor, earnedBadges, errorEntries, weakTopics, daysUntil, recommend, nextPhase } from '../src/progress.js';

test('day keys and day arithmetic, across month and year ends', () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59).getTime()), '2026-01-05');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.deepEqual(lastDays(3, '2026-10-01'), ['2026-09-29', '2026-09-30', '2026-10-01']);
  assert.equal(daysUntil('2026-11-05', '2026-10-29'), 7);
  assert.equal(daysUntil('2026-10-28', '2026-10-29'), -1);
});

test('streak counts consecutive days ending today', () => {
  const s = streaks(['2026-10-27', '2026-10-28', '2026-10-29'], '2026-10-29');
  assert.deepEqual(s, { current: 3, longest: 3, today: true });
});
test('a streak that ran until yesterday is still alive today', () => {
  assert.equal(streaks(['2026-10-27', '2026-10-28'], '2026-10-29').current, 2);
  assert.equal(streaks(['2026-10-27', '2026-10-28'], '2026-10-29').today, false);
});
test('a missed day breaks the streak, the longest streak is remembered', () => {
  const s = streaks(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-20', '2026-10-27'], '2026-10-29');
  assert.equal(s.current, 0); assert.equal(s.longest, 4);
  assert.deepEqual(streaks([], '2026-10-29'), { current: 0, longest: 0, today: false });
  assert.equal(streaks(new Set(['2026-12-31', '2027-01-01']), '2027-01-01').current, 2);
});

test('XP, levels and badges', () => {
  assert.equal(xpTotal({ minutes: 30, reviews: 10, sections: 2, tests: [80, 55] }), 30 + 20 + 10 + 16 + 11);
  assert.deepEqual([levelFor(0).level, levelFor(99).level, levelFor(100).level, levelFor(300).level], [1, 1, 2, 3]);
  const l = levelFor(150); assert.equal(l.into, 50); assert.equal(l.need, 200);
  const ids = earnedBadges({ tests: 1, bestPercent: 95, longest: 3, reviews: 5, minutes: 0, sections: 0, fixed: 0 }).map(b => b.id);
  assert.deepEqual(ids, ['first-test', 'ace', 'streak-3']);
});

const attempt = {
  id: 'a1', documentId: 'd', submittedAt: 5, answers: { m1: '0', m2: '1', w1: 'short' },
  questions: [{ id: 'm1', type: 'mcq', marks: 1, source: '1.1 Dead loads' }, { id: 'm2', type: 'mcq', marks: 1, source: '1.1 Dead loads' }, { id: 'w1', type: 'written', marks: 5, source: '2. Analysis' }, { id: 'w2', type: 'written', marks: 5, source: '2. Analysis' }],
  grades: [{ id: 'm1', awarded: 0 }, { id: 'm2', awarded: 1 }, { id: 'w1', awarded: 2, method: 'AI provisional' }, { id: 'w2', awarded: 0, method: 'self assessment pending' }]
};
test('error log lists wrong and partly right answers, skips unmarked ones', () => {
  const e = errorEntries([attempt, { ...attempt, id: 'a0', submittedAt: 1 }]);
  assert.deepEqual(e.map(x => x.key), ['a1:m1', 'a1:w1', 'a0:m1', 'a0:w1']);
  assert.equal(e[0].answer, '0');
});

test('weak topics across tests, lowest score first', () => {
  const doc = { id: 'd', name: 'beam.md', sections: [
    { ref: '1. Loads', title: '1. Loads', level: 1, text: 'x' }, { ref: '1.1 Dead loads', title: '1.1 Dead loads', level: 2, text: 'x' }, { ref: '2. Analysis', title: '2. Analysis', level: 1, text: 'x' }] };
  const w = weakTopics([attempt], doc);
  assert.deepEqual(w.map(x => [x.topic, x.percent]), [['Analysis', 20], ['Loads', 50]]);
});

test('recommendations: due cards first, then exam-driven revision', () => {
  const r = recommend({ dueByDoc: { d: 12 }, weak: [{ docId: 'd', topic: 'Analysis', percent: 20 }], exams: [{ title: 'Finals', date: '2026-10-31', documentId: 'd' }], openErrors: 3, unstudied: [{ docId: 'd', left: 4 }], docTitle: () => 'Beam design', today: '2026-10-29' });
  assert.equal(r[0].kind, 'cards');
  assert.equal(r[1].kind, 'weak'); assert.match(r[1].title, /Analysis.*Finals/); assert.match(r[1].why, /in 2 days/);
  assert.ok(r.some(x => x.kind === 'errors'));
  assert.ok(r.length <= 4);
  assert.deepEqual(recommend({}), []);
});

test('focus timer: a long break after every 4th focus block', () => {
  assert.deepEqual(nextPhase('focus', 0), { phase: 'short', cycle: 1 });
  assert.deepEqual(nextPhase('focus', 3), { phase: 'long', cycle: 4 });
  assert.deepEqual(nextPhase('short', 1), { phase: 'focus', cycle: 1 });
  assert.deepEqual(nextPhase('focus', 1, { longEvery: 2 }), { phase: 'long', cycle: 2 });
});
