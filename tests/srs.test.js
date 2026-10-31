import test from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, dueQueue, deckStats, validateCards, cardFromQuestion, startOfDay, whenLabel, preview, DAY, MIN_EASE } from '../src/srs.js';

const T0 = new Date(2026, 9, 1, 10, 0).getTime();
const card = (extra = {}) => ({ ...newCard({ front: 'What is a dead load?', back: 'The weight of the structure itself.' }, T0), ...extra });

test('a new card is due straight away and keeps its text', () => {
  const c = card();
  assert.equal(c.due, T0); assert.equal(c.reps, 0); assert.equal(c.ease, 2.5); assert.equal(c.last, 0);
  assert.throws(() => newCard({ front: ' ', back: 'x' }), /front and a back/);
});

test('SM-2 intervals grow 1 → 6 → interval × ease for "good" answers', () => {
  let c = review(card(), 4, T0);
  assert.equal(c.reps, 1); assert.equal(c.interval, 1); assert.equal(c.ease, 2.5);
  assert.equal(startOfDay(c.due), startOfDay(T0) + DAY);           // tomorrow (early morning), not 24 h later
  c = review(c, 4, c.due);
  assert.equal(c.interval, 6);
  c = review(c, 4, c.due);
  assert.equal(c.interval, 15);                                     // round(6 × 2.5)
  assert.ok(c.due > T0 + 20 * DAY);
});

test('"again" resets the card, counts a lapse, lowers ease and brings it back in 10 minutes', () => {
  let c = review(review(card(), 4, T0), 4, T0 + DAY);
  const before = c.ease;
  c = review(c, 1, T0 + 7 * DAY);
  assert.equal(c.reps, 0); assert.equal(c.interval, 0); assert.equal(c.lapses, 1);
  assert.ok(c.ease < before);
  assert.equal(c.due, T0 + 7 * DAY + 10 * 60000);
  // a brand-new card forgotten on its first view is not a lapse
  assert.equal(review(card(), 1, T0).lapses, 0);
});

test('ease never drops below 1.3, easy answers jump further than good ones', () => {
  let c = card();
  for (let i = 0; i < 12; i++) c = review(c, 3, T0 + i * DAY);
  assert.ok(c.ease >= MIN_EASE);
  assert.equal(review(card(), 3, T0).ease, 2.36);
  const good = review(card(), 4, T0), easy = review(card(), 5, T0);
  assert.ok(easy.interval > good.interval); assert.ok(easy.ease > good.ease);
});

test('review does not change the card it was given and clamps grades', () => {
  const c = card(); const copy = { ...c };
  review(c, 4, T0); assert.deepEqual(c, copy);
  assert.equal(review(c, 9, T0).reps, 1);
  assert.equal(review(c, -2, T0).reps, 0);
});

test('due queue: overdue cards first, then new cards up to the daily limit, filtered by document', () => {
  const a = { ...card(), id: 'a', documentId: 'd1', last: 1, due: T0 - 2 * DAY };
  const b = { ...card(), id: 'b', documentId: 'd1', last: 1, due: T0 - 5 * DAY };
  const c = { ...card(), id: 'c', documentId: 'd2', last: 1, due: T0 + DAY };
  const n1 = { ...card(), id: 'n1', documentId: 'd1', created: 5 }, n2 = { ...card(), id: 'n2', documentId: 'd1', created: 3 };
  const all = [a, b, c, n1, n2];
  assert.deepEqual(dueQueue(all, { now: T0 }).map(x => x.id), ['b', 'a', 'n2', 'n1']);
  assert.deepEqual(dueQueue(all, { now: T0, newLimit: 1 }).map(x => x.id), ['b', 'a', 'n2']);
  assert.deepEqual(dueQueue(all, { now: T0, documentId: 'd2' }).map(x => x.id), []);
  const s = deckStats(all, T0);
  assert.deepEqual([s.total, s.due, s.fresh, s.learning], [5, 2, 2, 3]);
});

test('AI cards are validated: empty and duplicate cards dropped, other field names accepted', () => {
  const out = validateCards([{ front: 'What is X?', back: 'Y' }, { front: 'what is x', back: 'dup' }, { question: 'Why Z?', answer: 'Because.' }, { front: '', back: 'b' }, null]);
  assert.deepEqual(out, [{ front: 'What is X?', back: 'Y' }, { front: 'Why Z?', back: 'Because.' }]);
  assert.throws(() => validateCards([]), /no usable/);
  assert.throws(() => validateCards('nope'), /no flashcards/);
});

test('a wrong test answer becomes a card with a stable id and the right option on the back', () => {
  const q = { id: 'q1', type: 'mcq', prompt: 'Which load is permanent?', options: ['Live', 'Dead', 'Wind', 'Snow'], correct: 1, solution: 'Dead loads are permanent.', source: '1.1 Dead loads' };
  const c = cardFromQuestion(q, { id: 'att', documentId: 'd', submittedAt: T0 }, 's2');
  assert.equal(c.id, 'err:att:q1'); assert.equal(c.origin, 'mistake'); assert.equal(c.nodeId, 's2');
  assert.match(c.front, /B\. Dead/); assert.match(c.back, /^B\. Dead/);
});

test('time labels and button previews', () => {
  assert.equal(whenLabel(10 * 60000), '10m'); assert.equal(whenLabel(3 * DAY), '3d'); assert.equal(whenLabel(60 * DAY), '2mo');
  const p = preview(card(), T0);
  assert.deepEqual(p.map(g => g.key), ['again', 'hard', 'good', 'easy']);
  assert.equal(p[0].label2, '10m');
});
