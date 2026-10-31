import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { normalizeProfile, levelMix, allocate, buildPlan, scoreQuestion, GENERIC_MIX } from '../src/examprofile.js';
const dir = new URL('../src/exams/', import.meta.url);
const all = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL(f, dir))));

test('every built-in profile is valid and totals match', () => {
  assert.ok(all.length >= 7);
  for (const raw of all) {
    const p = normalizeProfile(raw);
    const marks = p.pattern.sections.reduce((a, s) => a + s.count * s.marks, 0);
    assert.equal(marks, p.pattern.totalMarks, raw.id);
    assert.ok(p.sources.length, raw.id);
  }
});
test('JEE Main pattern', () => {
  const p = normalizeProfile(all.find(x => x.id === 'jee-main'));
  assert.equal(p.pattern.totalQuestions, 75); assert.equal(p.pattern.totalMarks, 300);
});
test('rejects bad profiles', () => {
  assert.throws(() => normalizeProfile({ id: 'X Y', name: 'a' }));
  assert.throws(() => normalizeProfile({ id: 'a', name: 'a', pattern: { sections: [{ type: 'essay', count: 1, marks: 1 }] } }));
});
test('difficulty mix by level', () => {
  const p = { difficulty: { easy: 27, medium: 60, hard: 13 } };
  assert.deepEqual(levelMix(p, 0), { easy: 27, medium: 60, hard: 13 });
  const h = levelMix(p, 1), e = levelMix(p, -1);
  assert.ok(h.hard > 13 && h.easy < 27); assert.ok(e.easy > 27 && e.hard < 13);
  for (const m of [h, e]) assert.equal(m.easy + m.medium + m.hard, 100);
  assert.deepEqual(levelMix({}, 0), GENERIC_MIX);
});
test('allocate sums', () => { assert.deepEqual(allocate(10, [1, 1, 2]), [3, 2, 5]); assert.equal(allocate(7, [3, 3, 1]).reduce((a, b) => a + b), 7); });
test('plan keeps sections and size', () => {
  const p = normalizeProfile(all.find(x => x.id === 'jee-advanced')), plan = buildPlan(p, 0, 12);
  assert.equal(plan.slots.length, 12); assert.equal(new Set(plan.slots.map(s => s.section)).size, 4);
});
test('marking incl. negative and partial', () => {
  assert.equal(scoreQuestion({ type: 'mcq', marks: 4, negative: 1, correct: 2 }, 2), 4);
  assert.equal(scoreQuestion({ type: 'mcq', marks: 4, negative: 1, correct: 2 }, 1), -1);
  assert.equal(scoreQuestion({ type: 'mcq', marks: 4, negative: 1, correct: 2 }, null), 0);
  assert.equal(scoreQuestion({ type: 'numerical', marks: 4, negative: 1, answer: 5, tolerance: 0 }, '5'), 4);
  assert.equal(scoreQuestion({ type: 'numerical', marks: 4, negative: 1, answer: 5 }, '5.4'), -1);
  const m = { type: 'multi', marks: 4, negative: 2, correct: [0, 2, 3], partial: 'jee-advanced' };
  assert.equal(scoreQuestion(m, [0, 2, 3]), 4); assert.equal(scoreQuestion(m, [0, 2]), 2); assert.equal(scoreQuestion(m, [0, 1]), -2);
  assert.equal(scoreQuestion({ ...m, partial: 'none', negative: 0 }, [0]), 0);
});

import { validatePlanQuestions, extractQuestions, mostRepeated, profileFromAnalysis, answerText, correctText } from '../src/examprofile.js';
test('AI questions are checked against the plan; marks come from the plan', () => {
  const plan = { slots: [
    { n: 1, type: 'mcq', marks: 4, negative: 1, section: 'A' }, { n: 2, type: 'multi', marks: 4, negative: 2, partial: 'jee-advanced', section: 'B' },
    { n: 3, type: 'numerical', marks: 4, negative: 0, answerFormat: 'integer', section: 'C' }, { n: 4, type: 'written', marks: 5, section: 'D' }] };
  const o = ['a', 'b', 'c', 'd'];
  const qs = validatePlanQuestions([
    { slot: 1, prompt: 'Which one is right?', options: o, correct: 2, source: '[P1]', solution: 'Because.', marks: 99 },
    { slot: 2, prompt: 'Which are right here?', options: o, correct: [3, 1], source: '[P1]', solution: 'Because.' },
    { slot: 3, prompt: 'How many apples are there?', answer: 4.6, source: '[P1]', solution: 'Count.' },
    { slot: 4, prompt: 'Explain the idea fully.', rubric: 'point a; point b', source: '[P1]', solution: 'Model.' }], plan);
  assert.equal(qs[0].marks, 4); assert.deepEqual(qs[1].correct, [1, 3]); assert.equal(qs[2].answer, 5); assert.equal(qs[1].partial, 'jee-advanced');
  assert.equal(correctText(qs[1]), 'B. b; D. d'); assert.equal(answerText(qs[1], [3]), 'D. d');
  assert.throws(() => validatePlanQuestions([{ slot: 1, prompt: 'Which one is right?', options: ['a'], correct: 0, source: 's', solution: 'solution' }], { slots: [plan.slots[0]] }), /4 options/);
});
test('repeated questions across papers', () => {
  const p1 = 'Q1. Explain the first law of thermodynamics with an example. [5 marks]\nQ2. Derive the Carnot efficiency of an engine.';
  const p2 = '1. Explain first law of thermodynamics with a suitable example\n2) Define entropy and its units.';
  const p3 = 'Q.1 Derive Carnot efficiency for a heat engine.';
  assert.equal(extractQuestions(p1).length, 2);
  const r = mostRepeated([p1, p2, p3]);
  assert.equal(r.length, 2); assert.ok(r.every(x => x.times === 2));
});
test('profile from an AI analysis', () => {
  const p = profileFromAnalysis({ sections: [{ name: 'Short', type: 'written', count: 5, marks: 4 }, { name: 'Bad', type: 'essay', count: 1, marks: 1 }], difficulty: { easy: 40, medium: 40, hard: 20 }, repeated: [{ question: 'Define entropy.', times: 3 }] }, { id: 'papers-mech', name: 'End Sem', kind: 'papers', papers: 4 });
  assert.equal(p.kind, 'papers'); assert.equal(p.pattern.sections.length, 1); assert.equal(p.meta.repeated[0].times, 3); assert.match(p.coverage.note, /4 papers/);
});
