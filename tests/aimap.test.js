import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlocks, outlinePrompt, applyOutline, matchSections, flatMap, headingish } from '../src/aimap.js';
import { organiseMap } from '../src/ai.js';
import { outline } from '../src/structure.js';

// A PDF as the app stores it: one section per page, titled by its first line, all at one level.
const pdf = { name: 'beam-notes.pdf', sections: [
  { ref: 'Page 1', title: 'Beam design notes', level: 1, text: 'Beam design notes\nPrepared for the site team\nLoads on the beam\nBeams carry loads from slabs and walls.\nDead loads are permanent and include self weight.' },
  { ref: 'Page 2', title: 'Live loads depend on the use', level: 1, text: 'Live loads depend on the use of the floor and come from the loading code.\nAnalysis\nThe maximum moment is wL²/8 at mid span.' },
  { ref: 'Page 3', title: 'Shear force is largest at supports', level: 1, text: 'Shear force is largest at the supports and equals wL/2.\nDetailing\nCover protects the steel from corrosion.' }
] };
const allText = sections => sections.map(s => s.text).join('\n').replace(/\s+/g, ' ');

test('headings start new blocks and pages are kept', () => {
  assert.ok(headingish('Loads on the beam')); assert.ok(headingish('3.1 Shear design'));
  assert.ok(!headingish('Beams carry loads from slabs and walls.')); assert.ok(!headingish('and continues on this line'));
  const b = buildBlocks(pdf);
  assert.ok(b.some(x => x.text.startsWith('Loads on the beam') && x.page === 'Page 1'));
  assert.ok(b.some(x => x.text.startsWith('Analysis') && x.page === 'Page 2'));
  assert.deepEqual(b.map(x => x.n), b.map((_, i) => i));
  assert.equal(b.map(x => x.text).join('\n').replace(/\s+/g, ' '), allText(pdf.sections));   // nothing lost
});

test('long documents are cut into at most 400 blocks and the prompt stays small', () => {
  const big = { name: 'big.pdf', sections: Array.from({ length: 300 }, (_, i) => ({ ref: 'Page ' + (i + 1), title: 'x', level: 1, text: Array.from({ length: 12 }, (_, k) => `Heading ${k}\nSome body text on page ${i + 1} line ${k} that goes on for a while.`).join('\n') })) };
  const b = buildBlocks(big);
  assert.ok(b.length <= 400, String(b.length));
  const p = outlinePrompt(big, b);
  assert.ok(p.length < 40000, String(p.length));
  assert.match(p, /\[0\] \(Page 1\) \| Heading 0/);
});

test('the outline regroups blocks without losing or inventing text', () => {
  const b = buildBlocks(pdf);
  const at = t => b.find(x => x.text.startsWith(t)).n;
  const reply = { title: 'Beam design notes', outline: [
    { title: 'Loads on the beam', level: 1, start: at('Loads on the beam') },
    { title: 'Analysis', level: '1', start: String(at('Analysis')) },
    { title: 'Bending moment', level: 3, start: at('Analysis') },          // jumps a level: clamped to 2
    { title: 'Shear force', level: 2, start: at('Shear force') },
    { title: 'Detailing', level: 1, start: at('Detailing') },
    { title: 'Ghost', level: 1, start: 999 }                               // points outside the document: ignored
  ] };
  const s = applyOutline(pdf, b, reply);
  // Blocks before the first topic become an introduction; the title wraps the main topics.
  assert.deepEqual(s.map(x => [x.title, x.level]), [['Beam design notes', 1], ['Introduction', 2], ['Loads on the beam', 2], ['Analysis', 2], ['Bending moment', 3], ['Shear force', 3], ['Detailing', 2]]);
  assert.equal(s[0].text, '');
  assert.equal(allText(s.filter(x => x.text)), allText(pdf.sections));
  assert.ok(s.find(x => x.title === 'Loads on the beam').ref.endsWith('(pp. 1–2)'), s.find(x => x.title === 'Loads on the beam').ref);
  assert.equal(s.find(x => x.title === 'Detailing').ref, 'Detailing (p. 3)');
  const nodes = outline({ name: pdf.name, sections: s });
  assert.equal(nodes.find(n => n.title === 'Bending moment').parent, nodes.find(n => n.title === 'Analysis').id);
});

test('unordered, duplicate and empty items are cleaned up; bad replies are refused', () => {
  const doc = { name: 'n.md', sections: [{ ref: 'A', title: 'A', level: 1, text: 'Alpha one.\n\nAlpha two.\n\nBeta one.\n\nBeta two.' }] };
  const b = buildBlocks(doc);
  assert.equal(b.length, 4);
  const s = applyOutline(doc, b, { outline: [{ title: 'Beta', level: 1, start: 2 }, { title: 'Alpha', level: 1, start: 0 }, { title: 'Alpha again', level: 1, start: 2 }] });
  assert.deepEqual(s.map(x => x.title), ['Alpha', 'Alpha again']);       // "Beta" had no text of its own and no sections
  assert.match(s[1].text, /Beta one/);
  assert.throws(() => applyOutline(doc, b, {}), /no outline/);
  assert.throws(() => applyOutline(doc, b, { outline: [{ title: 'x', start: 40 }] }), /did not point/);
  // Same titles get numbered refs.
  const t = applyOutline(doc, b, { outline: [{ title: 'Part', level: 1, start: 0 }, { title: 'Part', level: 1, start: 2 }] });
  assert.deepEqual(t.map(x => x.ref), ['Part', 'Part (2)']);
});

test('original headings stay in the text when two sections are merged', () => {
  const doc = { name: 'm.md', sections: [{ ref: 'Dead', title: 'Dead loads', level: 2, text: 'Permanent weights.' }, { ref: 'Live', title: 'Live loads', level: 2, text: 'Use of the floor.' }] };
  const b = buildBlocks(doc);
  assert.deepEqual(b.map(x => x.lead), ['Dead loads', 'Live loads']);
  assert.match(outlinePrompt(doc, b), /\[1\] # Live loads \| Use of the floor\./);
  const s = applyOutline(doc, b, { outline: [{ title: 'Loads', level: 1, start: 0 }] });
  assert.equal(s[0].text, 'Permanent weights.\n\nLive loads\nUse of the floor.');
});

test('notes and progress can follow the text to the new map', () => {
  const b = buildBlocks(pdf);
  const s = applyOutline(pdf, b, { outline: [{ title: 'Loads', level: 1, start: 0 }, { title: 'Analysis', level: 1, start: b.find(x => x.text.startsWith('Analysis')).n }] });
  const m = matchSections(pdf.sections, s);
  assert.equal(m.get(0), 0); assert.equal(m.get(1), 0); assert.equal(m.get(2), 1);
  const back = matchSections(s, pdf.sections);                            // and back again when the original headings return
  assert.equal(back.get(0), 0); assert.equal(back.get(1), 1);
  assert.ok(flatMap(pdf)); assert.ok(!flatMap({ sections: s }));
});

test('organiseMap asks the AI, retries once with the reason, and keeps the text', async () => {
  const realFetch = globalThis.fetch;
  const bodies = [];
  globalThis.fetch = async (url, opts) => {
    bodies.push(JSON.parse(opts.body));
    const content = bodies.length === 1 ? { outline: [] } : { title: 'Beam design notes', outline: [{ title: 'Loads', level: 1, start: 0 }, { title: 'Analysis', level: 1, start: 3 }] };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }) };
  };
  try {
    const s = await organiseMap(pdf, 'sk-test');
    assert.equal(bodies.length, 2);
    assert.match(bodies[0].messages[0].content, /study outline/);
    assert.match(bodies[0].messages[1].content, /\[0\] \(Page 1\)/);
    assert.match(bodies[1].messages[1].content, /could not be used: The AI returned no outline/);
    assert.equal(s[0].title, 'Beam design notes');
    assert.equal(allText(s.filter(x => x.text)), allText(pdf.sections));
  } finally { globalThis.fetch = realFetch; }
});
