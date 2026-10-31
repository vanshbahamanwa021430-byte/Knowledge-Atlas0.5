import test from 'node:test';
import assert from 'node:assert/strict';
import { splitBlocks, extractMath, commonsResults, commonsUrl, FREE_LICENSE } from '../src/visuals.js';
import { toLines, questionRegions, matchFigure } from '../src/figures.js';
import { needsOcr } from '../src/ocr.js';

test('mermaid and svg blocks are split out; other code stays text', () => {
  const p = splitBlocks('Intro\n```mermaid\nflowchart TD\nA-->B\n```\nmid\n```svg\n<svg viewBox="0 0 10 10"></svg>\n```\n```js\nx=1\n```');
  assert.deepEqual(p.map(x => x.type), ['text', 'mermaid', 'text', 'svg', 'text']);
  assert.equal(p[1].body, 'flowchart TD\nA-->B'); assert.match(p[4].body, /```js/);
  assert.deepEqual(splitBlocks(''), []);
});
test('maths is extracted, money is not', () => {
  const r = extractMath('KE = $\\frac{1}{2}mv^2$; costs $5 and $10; $$E=mc^2$$ and \\(a+b\\)');
  assert.equal(r.math.length, 3); assert.ok(r.text.includes('$5 and $10'));
  assert.ok(r.math.some(m => m.display && m.tex === 'E=mc^2'));
});
const page = (title, lic, artist) => ({ title: 'File:' + title, index: 1, imageinfo: [{ thumburl: 'https://upload/x.jpg', descriptionurl: 'https://commons/' + title, extmetadata: { LicenseShortName: { value: lic }, Artist: { value: `<a href="u">${artist}</a>` }, LicenseUrl: { value: 'https://cc/l' } } }] });
test('Commons: only free licences, author and licence kept', () => {
  const r = commonsResults({ query: { pages: { 1: page('Heart.jpg', 'CC BY-SA 4.0', 'Ann'), 2: page('X.jpg', 'CC BY-NC 2.0', 'Bob'), 3: page('Y.jpg', 'Public domain', 'Cy'), 4: page('Z.jpg', 'All rights reserved', 'Di'), 5: page('W.jpg', 'CC BY-ND 3.0', 'Ed') } } });
  assert.deepEqual(r.map(x => x.title), ['Heart.jpg', 'Y.jpg']); assert.equal(r[0].author, 'Ann'); assert.equal(r[0].license, 'CC BY-SA 4.0');
  assert.ok(FREE_LICENSE.test('CC0')); assert.match(commonsUrl('heart'), /origin=\*/); assert.deepEqual(commonsResults(null), []);
});
test('question regions: a figure gap is detected, plain questions are not', () => {
  const lines = toLines([{ text: '1. Find the current in the circuit', y0: 100, y1: 112 }, { text: 'shown below.', y0: 100, y1: 112, x: 300 }, { text: 'R1', y0: 180, y1: 186 }, { text: '2. Define energy.', y0: 330, y1: 342 }, { text: 'Q3 State Ohm’s law.', y0: 360, y1: 372 }]);
  assert.equal(lines[0].text, '1. Find the current in the circuit shown below.');
  const r = questionRegions(lines, 842);
  assert.deepEqual(r.map(x => [x.q, x.figure]), [[1, true], [2, false], [3, false]]);
  assert.deepEqual(questionRegions([], 842), []);
});
test('figures attach by id or by wording', () => {
  const figs = [{ id: 'F1', text: '1. Find the current in the circuit shown below', img: 'data:a' }, { id: 'F2', text: '5. Sketch the graph of velocity against time', img: 'data:b' }];
  assert.equal(matchFigure({ prompt: 'x', figure: 'F2' }, figs).img, 'data:b');
  assert.equal(matchFigure({ prompt: 'Find the current through R2 in the circuit shown' }, figs).id, 'F1');
  assert.equal(matchFigure({ prompt: 'Define entropy' }, figs), null); assert.equal(matchFigure({ prompt: 'a' }, []), null);
});
