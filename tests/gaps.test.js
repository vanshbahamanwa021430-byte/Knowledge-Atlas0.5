import test from 'node:test'; import assert from 'node:assert/strict';
import { findGaps, gapSentence, topicScores } from '../src/gaps.js';
test('root concept behind weak topics', () => {
  const res = [{ topic: 'shear force', awarded: 1, marks: 5 }, { topic: 'bending moment', awarded: 1, marks: 5 }, { topic: 'equilibrium equations', awarded: 2, marks: 5 }, { topic: 'units', awarded: 5, marks: 5 }];
  const g = findGaps(res, { 'shear force': ['equilibrium equations', 'units'], 'bending moment': ['equilibrium equations'] });
  assert.equal(g.roots[0].concept, 'equilibrium equations');
  assert.match(gapSentence(g.roots[0]), /shear force.*equilibrium equations is incomplete/);
  assert.ok(!g.roots.some(r => r.concept === 'units'));
});
test('scores aggregate', () => { assert.equal(topicScores([{ topic: 'a', awarded: 1, marks: 2 }, { topic: 'a', awarded: 1, marks: 2 }])[0].score, 0.5); });
