import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, normalizeTiming, resolveMinutes, autoMinutes, canPause, describeTiming, dueWarning, activeMs, leftMs, tickQuestion, questionExpired, fmtDuration } from '../src/timing.js';

test('presets and normalisation', () => {
  assert.deepEqual(PRESETS, [0, 15, 30, 45, 60, 90, 120, 180]);
  assert.deepEqual(normalizeTiming(null), { mode: 'auto', minutes: 30, perQ: 0, practice: false });
  assert.equal(normalizeTiming({ mode: 'weird', minutes: -5, perQ: 99999 }).mode, 'auto');
  assert.equal(normalizeTiming({ minutes: -5 }).minutes, 1); assert.equal(normalizeTiming({ perQ: 99999 }).perQ, 1800);
});
test('no limit, preset, custom and auto minutes', () => {
  assert.equal(resolveMinutes({ mode: 'none' }), 0);
  assert.equal(resolveMinutes({ mode: 'preset', minutes: 45 }), 45);
  assert.equal(resolveMinutes({ mode: 'custom', minutes: 135 }), 135);
  // Auto from the original paper: 180 min paper → plan already scaled to 60 min stays 60.
  assert.equal(resolveMinutes({ mode: 'auto' }, { paperMinutes: 60 }), 60);
  assert.equal(autoMinutes({ paperMinutes: 180, paperMarks: 300, questions: Array(25).fill({ marks: 4 }) }), 60);   // JEE-style: 100/300 of 180 min
  assert.equal(autoMinutes({ paperMinutes: 120, paperQuestions: 100, questions: Array(50).fill({ type: 'mcq' }) }), 60);
  assert.equal(autoMinutes({ questions: [...Array(10).fill({ type: 'mcq', marks: 1 }), ...Array(10).fill({ type: 'written', marks: 2 })] }), 50);
  assert.equal(autoMinutes({}), 30);
  assert.equal(describeTiming({ mode: 'preset', minutes: 90 }), '1 h 30 min'); assert.equal(describeTiming({ mode: 'none' }), 'No limit');
  assert.match(describeTiming({ mode: 'auto' }, { paperMinutes: 45 }), /45 min \(auto\)/);
});
test('pause only when untimed or practice', () => {
  assert.ok(canPause({ mode: 'none' })); assert.ok(canPause({ mode: 'preset', minutes: 30, practice: true })); assert.ok(!canPause({ mode: 'preset', minutes: 30 }));
});
test('warnings at 10, 5 and 1 minute, each once, and none for short or untimed tests', () => {
  assert.equal(dueWarning(11 * 60000, [], 30), null);
  assert.equal(dueWarning(9.9 * 60000, [], 30), 600);
  assert.equal(dueWarning(4 * 60000, [600], 30), 300);
  assert.equal(dueWarning(4 * 60000, [600, 300], 30), null);
  assert.equal(dueWarning(30000, [], 30), 60);   // jumped past several: only the latest fires
  assert.equal(dueWarning(9 * 60000, [], 10), null); assert.equal(dueWarning(4 * 60000, [], 10), 300);   // 10-min test: no "10 min left"
  assert.equal(dueWarning(1000, [], 0), null);
});
test('pauses are excluded from elapsed and remaining time', () => {
  const s = 0, now = 30 * 60000, pauses = [{ from: 5 * 60000, to: 10 * 60000 }, { from: 25 * 60000 }];
  assert.equal(activeMs(s, now, pauses), 20 * 60000);
  assert.equal(leftMs(s, 30, now, pauses), 10 * 60000); assert.equal(leftMs(s, 0, now), Infinity);
});
test('per-question time accumulates, caps long gaps, and expires', () => {
  let t = {}; t = tickQuestion(t, 'q1', 1000); t = tickQuestion(t, 'q1', 1000); t = tickQuestion(t, 'q2', 60000); t = tickQuestion(t, null, 1000);
  assert.deepEqual(t, { q1: 2000, q2: 5000 });
  assert.ok(questionExpired({ q1: 30000 }, 'q1', 30)); assert.ok(!questionExpired({ q1: 29000 }, 'q1', 30)); assert.ok(!questionExpired({ q1: 1e9 }, 'q1', 0));
  assert.equal(fmtDuration(3723000), '1 h 2 min'); assert.equal(fmtDuration(65000), '1 min 5 s'); assert.equal(fmtDuration(42000), '42 s');
});
