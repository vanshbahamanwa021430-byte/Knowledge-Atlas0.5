import test from 'node:test'; import assert from 'node:assert/strict';
import { layoutText, findGutter } from '../src/pdflayout.js';
const W = 600;
const col = (x, label, n) => Array.from({ length: n }, (_, k) => ({ str: `${label}${k}`, x, y: 100 + k * 14, w: 220, h: 10 }));
test('two columns read left column first', () => {
  const items = [...col(40, 'L', 12), ...col(330, 'R', 12)];
  assert.ok(findGutter(items, W) > 260);
  const t = layoutText(items, W).split('\n').filter(Boolean);
  assert.equal(t[0], 'L0'); assert.equal(t[11], 'L11'); assert.equal(t[12], 'R0');
});
test('single column untouched', () => { assert.equal(layoutText([{ str: 'Hello', x: 40, y: 10, w: 50, h: 10 }, { str: 'world', x: 95, y: 10, w: 50, h: 10 }], W), 'Hello world'); });
test('tables become markdown tables', () => {
  const row = (y, a) => a.map((s, i) => ({ str: s, x: 40 + i * 150, y, w: 40, h: 10 }));
  const t = layoutText([...row(10, ['Load', 'Span', 'Moment']), ...row(24, ['10', '2', '20']), ...row(38, ['5', '4', '20'])], W);
  assert.match(t, /^\| Load \| Span \| Moment \|\n\| --- \|/); assert.match(t, /\| 5 \| 4 \| 20 \|$/);
});
test('equations kept as math', () => { assert.equal(layoutText([{ str: 'M = wL^2 / 8', x: 40, y: 10, w: 120, h: 10 }], W), '$$ M = wL^2 / 8 $$'); });
