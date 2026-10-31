import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestions, gradeMCQ, makeAttempt, isDue } from '../src/engine.js';

const items = Array.from({ length: 20 }, (_, i) => ({ id: 'q' + i, type: i < 10 ? 'mcq' : 'written', prompt: 'Explain concept number ' + i + ' from the provided document.', marks: i < 10 ? 1 : 5, source: 'page 1', solution: 'A model answer from the original document.', rubric: 'Award marks for correct key points.', options: i < 10 ? ['A', 'B', 'C', 'D'] : undefined, correct: i < 10 ? 2 : undefined }));

test('validates mixed 20-question examination', () => assert.equal(validateQuestions(items).length, 20));
test('rejects malformed answer key', () => { const copy = structuredClone(items); copy[0].correct = 8; assert.throws(() => validateQuestions(copy)); });
test('rejects wrong count, duplicates and wrong mix', () => {
  assert.throws(() => validateQuestions(items.slice(0, 19)));
  const dup = structuredClone(items); dup[1].id = dup[0].id; assert.throws(() => validateQuestions(dup), /Duplicate/);
  const mix = structuredClone(items); Object.assign(mix[0], { type: 'written', rubric: 'Some rubric text here' }); assert.throws(() => validateQuestions(mix), /10 MCQ/);
});
test('grades MCQ without AI', () => { const g = gradeMCQ(items, { q0: '2', q1: '1' }); assert.equal(g[0].awarded, 1); assert.equal(g[1].awarded, 0); });
test('blank answer is never marked correct, even when the key is option 0', () => {
  const q = [{ id: 'a', type: 'mcq', marks: 1, correct: 0 }];
  assert.equal(gradeMCQ(q, { a: '' })[0].awarded, 0);
  assert.equal(gradeMCQ(q, {})[0].awarded, 0);
  assert.equal(gradeMCQ(q, { a: '0' })[0].awarded, 1);
});
test('timer reaches deadline', () => { assert.equal(isDue(0, 30, 1800000), true); assert.equal(isDue(0, 30, 1799999), false); });
test('makeAttempt totals, percent and provisional flag', () => {
  globalThis.crypto ??= { randomUUID: () => 'x' };
  const grades = [{ id: 'a', awarded: 3, max: 5, method: 'AI provisional' }, { id: 'b', awarded: 1, max: 1, method: 'answer key' }];
  const a = makeAttempt('d', [{ marks: 5 }, { marks: 1 }], {}, 0, 1, grades, 'Doc');
  assert.equal(a.earned, 4); assert.equal(a.total, 6); assert.equal(a.percent, 67); assert.equal(a.provisional, true); assert.equal(a.documentName, 'Doc');
  assert.equal(makeAttempt('d', [], {}, 0, 1, []).percent, 0);
});

test('ids are valid v4 UUIDs, also on engines without crypto.randomUUID', async () => {
  const { uuid } = await import('../src/platform.js');
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(uuid(), re);
  const desc = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.crypto), 'randomUUID');
  const proto = Object.getPrototypeOf(globalThis.crypto);
  const saved = proto.randomUUID;
  try {
    Object.defineProperty(proto, 'randomUUID', { value: undefined, configurable: true, writable: true });
    const a = uuid(), b = uuid();
    assert.match(a, re); assert.notEqual(a, b);
  } finally { Object.defineProperty(proto, 'randomUUID', { ...desc, value: saved, configurable: true, writable: true }); }
});
