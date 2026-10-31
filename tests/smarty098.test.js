import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { classify, checkSize, looksLikeText, clip, xlsxText, readAttachment, attachmentBlock, MAX_TEXT } from '../src/attach.js';
import { normalizeSkill, upsertSkill, removeSkill, parseSlash, suggestSkill, skillPrompt, slug } from '../src/skills.js';
import { webSearchAnswer } from '../src/ai.js';

test('attachments: every type is classified', () => {
  assert.equal(classify('a.PDF'), 'pdf'); assert.equal(classify('x.jpg'), 'image'); assert.equal(classify('p', 'image/png'), 'image');
  assert.equal(classify('d.docx'), 'docx'); assert.equal(classify('s.pptx'), 'pptx'); assert.equal(classify('b.xlsx'), 'xlsx');
  assert.equal(classify('c.csv'), 'csv'); assert.equal(classify('main.py'), 'text'); assert.equal(classify('n.md'), 'text');
  assert.equal(classify('v.m4a'), 'audio'); assert.equal(classify('blob.bin'), 'unknown');
});
test('attachments: size limits, text sniffing, clipping', () => {
  assert.match(checkSize('image', 9 * 1048576), /limit is 8 MB/); assert.equal(checkSize('pdf', 1000), '');
  assert.ok(looksLikeText(new TextEncoder().encode('hello\nworld'))); assert.ok(!looksLikeText(new Uint8Array([0, 1, 2, 3])));
  assert.match(clip('x'.repeat(MAX_TEXT + 10)), /cut: 10 more/);
});
test('attachments: XLSX read on device', async () => {
  const z = new JSZip();
  z.file('xl/sharedStrings.xml', '<sst><si><t>Name</t></si><si><t>Marks</t></si><si><t>Asha</t></si></sst>');
  z.file('xl/worksheets/sheet1.xml', '<worksheet><sheetData><row><c t="s"><v>0</v></c><c t="s"><v>1</v></c></row><row><c t="s"><v>2</v></c><c><v>91</v></c></row></sheetData></worksheet>');
  const t = await xlsxText(await JSZip.loadAsync(await z.generateAsync({ type: 'uint8array' })));
  assert.match(t, /Name\tMarks\nAsha\t91/);
});
const fileOf = (name, content, type = '') => { const b = typeof content === 'string' ? new TextEncoder().encode(content) : content; return { name, type, size: b.length, text: async () => new TextDecoder().decode(b), arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) }; };
test('attachments: text, audio note, unknown text, unreadable binary, prompt block', async () => {
  const a = await readAttachment(fileOf('q.py', 'print(1)')); assert.equal(a.kind, 'text'); assert.equal(a.text, 'print(1)');
  const au = await readAttachment(fileOf('talk.mp3', new Uint8Array(10))); assert.match(au.note, /transcript/);
  const u = await readAttachment(fileOf('notes.weird', 'plain words here')); assert.equal(u.kind, 'text');
  await assert.rejects(readAttachment(fileOf('x.bin', new Uint8Array([0, 0, 1, 2]))), /can’t be read on the device/);
  const big = { ...fileOf('huge.pdf', 'x'), size: 30 * 1048576 }; await assert.rejects(readAttachment(big), /Too big/);
  const pdf = await readAttachment(fileOf('a.pdf', 'x'), { parseFile: async () => ({ sections: [{ ref: 'Page 1', text: 'Ohm law' }] }) }); assert.match(pdf.text, /\[Page 1\]\nOhm law/);
  assert.match(attachmentBlock([a, au]), /untrusted reference text[\s\S]*File 1: q\.py[\s\S]*File 2: talk\.mp3/);
});
test('skills: create, unique names, edit, delete, slash and suggestions', () => {
  const s1 = normalizeSkill({ title: 'Flashcard maker', when: 'revise a chapter with flashcards', steps: '1. Find key facts\n- Write Q and A' });
  assert.equal(s1.name, 'flashcard-maker'); assert.deepEqual(s1.steps, ['Find key facts', 'Write Q and A']);
  assert.throws(() => normalizeSkill({ title: '', steps: 'x' }), /name/); assert.throws(() => normalizeSkill({ title: 'x', steps: '' }), /step/);
  let l = upsertSkill([], s1); const s2 = normalizeSkill({ title: 'Flashcard maker', steps: 'a' }); l = upsertSkill(l, s2);
  assert.deepEqual(l.map(x => x.name).sort(), ['flashcard-maker', 'flashcard-maker-2']);
  l = upsertSkill(l, { ...s1, title: 'Flashcards', when: 'revise a chapter with flashcards' }); assert.equal(l.length, 2);
  assert.equal(parseSlash('/flashcard-maker chapter 3', l).rest, 'chapter 3'); assert.equal(parseSlash('/nope hi', l).skill, null);
  assert.equal(suggestSkill('make flashcards to revise this chapter', l)?.id, s1.id); assert.equal(suggestSkill('what is gravity', l), null);
  assert.match(skillPrompt(s1), /SKILL TO FOLLOW[\s\S]*1\. Find key facts/);
  assert.equal(removeSkill(l, s1.id).length, 1); assert.equal(slug('  Hello, World!  '), 'hello-world');
});
test('web search: Gemini grounding parsed with sources; non-Gemini key degrades', async () => {
  let sent;
  const fake = async (url, o) => { sent = { url, body: JSON.parse(o.body) }; return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Answer.' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://a.example/x', title: 'A' } }, { web: { uri: 'https://a.example/x', title: 'A' } }, { web: { uri: 'https://b.example', title: 'B' } }] } }] }) }; };
  const r = await webSearchAnswer('AIzaTEST', 'q', { fetchImpl: fake });
  assert.equal(r.text, 'Answer.'); assert.deepEqual(r.sources.map(s => s.title), ['A', 'B']); assert.deepEqual(sent.body.tools, [{ google_search: {} }]);
  await assert.rejects(webSearchAnswer('gsk_x', 'q', { fetchImpl: fake }), e => e.code === 'NO_GROUNDING');
  await assert.rejects(webSearchAnswer('AIzaX', 'q', { fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'quota' } }) }) }), e => e.code === 'RATE');
});

import { userContent } from '../src/ai.js';
import { readAttachment as readAtt2 } from '../src/attach.js';
test('audio: MP3/WAV attached and sent to Gemini/Prvlar free as input_audio; other providers get text only', async () => {
  const a = await readAtt2(new File([new Uint8Array(100)], 'lecture.mp3', { type: 'audio/mpeg' }), { toDataURL: async () => 'data:audio/mpeg;base64,QUJD', parseFile: async () => ({ sections: [] }) });
  assert.equal(a.audio, 'data:audio/mpeg;base64,QUJD');
  const parts = userContent({ endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' }, 'q', [a.audio]);
  assert.deepEqual(parts[1], { type: 'input_audio', input_audio: { data: 'QUJD', format: 'mp3' } });
  assert.equal(userContent({ free: true, endpoint: 'x' }, 'q', ['data:audio/wav;base64,QQ=='])[1].input_audio.format, 'wav');
  assert.equal(userContent({ endpoint: 'https://api.groq.com/openai/v1/chat/completions' }, 'q', [a.audio]), 'q');
  const o = await readAtt2(new File([new Uint8Array(10)], 'x.ogg', { type: 'audio/ogg' }), { toDataURL: async () => '' });
  assert.ok(!o.audio && /MP3/.test(o.note));
});
