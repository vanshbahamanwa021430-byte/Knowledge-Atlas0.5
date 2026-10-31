import test from 'node:test';
import assert from 'node:assert/strict';
import { splitSections, outline, sourceContext, contextInfo, verifySources, headingOf } from '../src/structure.js';

test('markdown headings build nested sections', () => {
  const s = splitSections('# Body\n## Lungs\nGas exchange.\n### Alveoli\nTiny sacs.\n## Airways\nTubes.');
  assert.deepEqual(s.map(x => [x.title, x.level]), [['Body', 1], ['Lungs', 2], ['Alveoli', 3], ['Airways', 2]]);
  assert.equal(s[2].text, 'Tiny sacs.');
});
test('numbered, chapter and ALL CAPS headings are detected when no markdown exists', () => {
  assert.equal(headingOf('1.2 Cell structure').level, 2);
  assert.equal(headingOf('Chapter 4').level, 1);
  assert.equal(headingOf('THE CIRCULATORY SYSTEM').level, 2);
  assert.equal(headingOf('This is an ordinary sentence.'), null);
  assert.equal(headingOf('1. Wash your hands first.'), null);
});
test('markdown mode ignores caps/numbered lookalikes', () => {
  const s = splitSections('# Title\nNOTE\n1 Something Here\nbody');
  assert.equal(s.length, 1);
});
test('text without headings becomes Part N chunks', () => {
  const para = 'word '.repeat(120);
  const s = splitSections(Array(10).fill(para).join('\n'), { maxPart: 1500 });
  assert.ok(s.length >= 2); assert.equal(s[0].ref, 'Part 1');
});
test('duplicate headings get unique refs', () => {
  const s = splitSections('# Intro\na\n# Summary\nb\n# Summary\nc');
  assert.deepEqual(s.map(x => x.ref), ['Intro', 'Summary', 'Summary (2)']);
});
test('outline nests by level and tolerates old stored docs', () => {
  const o = outline({ name: 'D', sections: [{ ref: 'A', title: 'A', level: 1, text: 'x' }, { ref: 'B', title: 'B', level: 2, text: 'y' }, { ref: 'C', title: 'C', level: 1, text: 'z' }] });
  assert.deepEqual(o.map(n => [n.id, n.parent, n.depth]), [['root', null, 0], ['s0', 'root', 1], ['s1', 's0', 2], ['s2', 'root', 1]]);
  const old = outline({ name: 'Old', sections: [{ ref: 'Page 1', text: 'First line\nmore' }] });
  assert.equal(old[1].title, 'First line'); assert.equal(old[1].parent, 'root');
});
test('sourceContext keeps short docs whole and samples long ones across sections', () => {
  const doc = { name: 'D', sections: Array.from({ length: 50 }, (_, i) => ({ ref: 'Page ' + (i + 1), text: 'x'.repeat(1000) })) };
  const ctx = sourceContext(doc, 10000);
  assert.ok(ctx.length <= 10000);
  assert.ok(ctx.includes('[Page 1]') && ctx.includes('[Page 50]'), 'covers both ends, not just the start');
  assert.equal(contextInfo(doc, 10000).truncated, true);
  assert.equal(sourceContext({ name: 'S', sections: [{ ref: 'A', text: 'hi' }] }), '[A]\nhi');
});
test('verifySources flags labels that are not in the document', () => {
  const doc = { sections: [{ ref: 'Page 2', text: 't' }] };
  const r = verifySources(doc, [{ source: 'Page 2, para 1' }, { source: 'Chapter 9' }]);
  assert.deepEqual(r.map(q => q.sourceVerified), [true, false]);
});
