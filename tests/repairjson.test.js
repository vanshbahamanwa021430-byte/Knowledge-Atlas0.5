import test from 'node:test'; import assert from 'node:assert/strict';
import { repairJson } from '../src/ai.js';
test('repairJson fixes LaTeX backslashes, raw newlines and trailing commas', () => {
  const r = JSON.parse(repairJson('{"q":"\\frac{1}{2} \\theta","s":"a\nb","x":[1,],"ok":"q\\"t"}'));
  assert.equal(r.q, '\\frac{1}{2} \\theta'); assert.equal(r.s, 'a\nb'); assert.deepEqual(r.x, [1]); assert.equal(r.ok, 'q"t');
});
