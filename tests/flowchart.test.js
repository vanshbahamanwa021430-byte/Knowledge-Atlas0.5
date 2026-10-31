import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutTree, layoutVertical, chartNodes, defaultCollapsed, wrapLabel, flowchartSVG, countDescendants, childrenMap } from '../src/flowchart.js';
import { outline } from '../src/structure.js';

const doc = { name: 'Beams', sections: [
  { ref: 'Loads', title: 'Loads', level: 1, text: 'a' },
  { ref: 'Dead', title: 'Dead load', level: 2, text: 'b' },
  { ref: 'Live', title: 'Live load', level: 2, text: 'c' },
  { ref: 'Design', title: 'Design', level: 1, text: 'd' }
] };

test('layout puts leaves on their own rows and parents between children', () => {
  const nodes = outline(doc);
  const { pos, rows, maxDepth } = layoutTree(nodes);
  assert.equal(rows, 3); assert.equal(maxDepth, 2);
  assert.equal(pos.get('s1').y, 0); assert.equal(pos.get('s2').y, 1); assert.equal(pos.get('s3').y, 2);
  assert.equal(pos.get('s0').y, 0.5);
  assert.equal(pos.get('root').y, (0.5 + 2) / 2);
});
test('folding a branch hides its descendants and reports how many', () => {
  const nodes = outline(doc);
  const { pos, rows } = layoutTree(nodes, new Set(['s0']));
  assert.equal(rows, 2); assert.ok(!pos.has('s1')); assert.ok(!pos.has('s2'));
  assert.equal(countDescendants('s0', childrenMap(nodes)), 2);
  const { svg } = flowchartSVG(nodes, { collapsed: new Set(['s0']) });
  assert.match(svg, /data-toggle="s0"/); assert.match(svg, /Show 2 hidden sections/);
  assert.doesNotMatch(svg, /data-node="s1"/);
});
test('large documents open folded to the top level', () => {
  const big = { name: 'Big', sections: Array.from({ length: 60 }, (_, i) => ({ ref: 'r' + i, title: 'T' + i, level: i % 3 === 0 ? 1 : 2, text: 'x' })) };
  const nodes = outline(big), c = defaultCollapsed(nodes);
  assert.equal(c.size, 20);
  assert.equal(defaultCollapsed(outline(doc)).size, 0);
});
test('labels wrap to two lines with an ellipsis and are escaped', () => {
  assert.deepEqual(wrapLabel('Introduction'), ['Introduction']);
  const l = wrapLabel('Chapter 3: Reinforced concrete beam design and detailing rules for slabs');
  assert.equal(l.length, 2); assert.ok(l[1].endsWith('…')); assert.ok(l.every(x => x.length <= 25));
  const { svg } = flowchartSVG(outline({ name: '<b>&"x"', sections: [{ ref: 'a', title: '<script>', level: 1, text: '' }] }));
  assert.doesNotMatch(svg, /<script>|<b>/); assert.match(svg, /&lt;script&gt;/);
});
test('selected node is highlighted and scale changes only the drawn size', () => {
  const nodes = outline(doc);
  const a = flowchartSVG(nodes, { selected: 's3' }), b = flowchartSVG(nodes, { scale: 0.5 });
  assert.match(a.svg, /fc-sel" data-node="s3"/);
  assert.equal(a.width, b.width);
  assert.match(b.svg, new RegExp(`width="${Math.round(a.width / 2)}"`));
});
test('a single top heading becomes the chart root', () => {
  const one = { name: 'file.md', sections: [{ ref: 'Title', title: 'Title', level: 1, text: '' }, { ref: 'A', title: 'A', level: 2, text: 'a' }, { ref: 'B', title: 'B', level: 2, text: 'b' }] };
  const c = chartNodes(outline(one));
  assert.equal(c[0].id, 's0'); assert.equal(c[0].parent, null); assert.equal(c[0].depth, 0);
  assert.equal(c[1].depth, 1);
  assert.equal(chartNodes(outline(doc)).length, outline(doc).length);   // two top headings: unchanged
});
test('vertical layout stacks boxes in reading order and fits a phone', () => {
  const nodes = outline(doc);
  const { order } = layoutVertical(nodes);
  assert.deepEqual(order.map(o => o.id), ['root', 's0', 's1', 's2', 's3']);
  assert.deepEqual(layoutVertical(nodes, new Set(['s0'])).order.map(o => o.id), ['root', 's0', 's3']);
  const v = flowchartSVG(nodes, { direction: 'vertical', collapsed: new Set(['s0']) });
  assert.ok(v.width <= 360, 'fits a 360px-wide phone at 100%: ' + v.width);
  assert.match(v.svg, />\+2</);
});
test('open section is marked, studied sections get a check, levels get map names', async () => {
  const { levelNames } = await import('../src/flowchart.js');
  const { svg } = flowchartSVG(outline(doc), { selected: 's1', animate: true, visited: new Set(['s1']) });
  assert.match(svg, /class="flowchart is-h fc-anim"/);
  assert.match(svg, /fc-seen fc-sel" data-node="s1"[^>]*aria-current="true"/);
  assert.equal((svg.match(/class="fc-mark is-done"/g) || []).length, 1);      // s1 studied
  assert.equal((svg.match(/class="fc-mark"/g) || []).length, 1);              // s2 not yet
  assert.doesNotMatch(svg, /fc-pin/);
  assert.equal(levelNames(doc)[1], 'Chapter');
  assert.equal(levelNames({ sections: [{ ref: 'Page 1' }, { ref: 'Page 2' }] })[1], 'Page');
  assert.equal(levelNames({ sections: [{ ref: 'Slide 1' }] })[1], 'Slide');
});
test('the phone map can be drawn to the width of the screen', () => {
  const nodes = outline(doc);
  const a = flowchartSVG(nodes, { direction: 'vertical', vWidth: 400 });
  assert.equal(a.width, 400);
  assert.match(a.svg, /class="flowchart is-v"/);
  assert.doesNotMatch(a.svg, /data-node="root"/);                          // the title is the page header on phones
  assert.match(a.svg, /data-toggle="s0"/);                                 // chapters with sections can fold
});
