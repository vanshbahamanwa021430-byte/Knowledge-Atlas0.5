// 0.9.3 AI fixes (found with real keys, tested here with mocks; no real keys).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { testConnection, PROVIDERS, pickChatModel, isBadKeyResponse } from '../src/ai.js';
import { buildPlan, planPrompt, normalizeProfile, estimateDifficulty, syllabusMatch, examDocWarning, profileFromAnalysis } from '../src/examprofile.js';
const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; });
const json = (status, body) => ({ ok: status < 300, status, json: async () => body });
const ok = obj => json(200, { choices: [{ message: { content: JSON.stringify(obj) } }] });

test('Groq uses openai/gpt-oss-120b', () => { assert.equal(PROVIDERS.groq.model, 'openai/gpt-oss-120b'); });
test('model-not-found 404: lists /models and retries with an available chat model, then remembers it', async () => {
  const seen = [];
  globalThis.fetch = async (url, o) => {
    if (url.endsWith('/models')) { assert.match(o.headers.Authorization, /^Bearer gsk_test/); return json(200, { data: [{ id: 'whisper-large-v3' }, { id: 'allam-2-7b' }, { id: 'openai/gpt-oss-20b' }, { id: 'qwen/qwen3.8-27b' }] }); }
    const m = JSON.parse(o.body).model; seen.push(m);
    return m === 'openai/gpt-oss-20b' ? ok({ ok: true }) : json(404, { error: { message: `The model \`${m}\` does not exist or you do not have access to it.` } });
  };
  const r = await testConnection('gsk_test123');
  assert.deepEqual(seen, ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']); assert.equal(r.model, 'openai/gpt-oss-20b');
  await testConnection('gsk_test123'); assert.equal(seen.at(-1), 'openai/gpt-oss-20b', 'fallback model remembered');
});
test('pickChatModel skips speech/guard models and prefers known chat models', () => {
  assert.equal(pickChatModel([{ id: 'whisper-large-v3' }, { id: 'llama-guard-4' }, { id: 'llama-3.3-70b-versatile' }], 'x'), 'llama-3.3-70b-versatile');
  assert.equal(pickChatModel(['models/gemini-flash-latest'], 'gemini-flash-lite-latest'), 'gemini-flash-latest');
  assert.equal(pickChatModel([], 'x'), null);
});
test('bad key: Groq 401 keeps the provider message and the friendly hint', async () => {
  globalThis.fetch = async () => json(401, { error: { message: 'Invalid API Key' } });
  await assert.rejects(testConnection('gsk_bad'), e => /Invalid API Key\. Groq \(free tier\) rejected the API key\. Check it was copied completely\./.test(e.message));
});
test('bad key: Gemini 400 "API key not valid" is treated as an invalid key', async () => {
  globalThis.fetch = async () => json(400, [{ error: { message: 'API key not valid. Please pass a valid API key.' } }]);
  await assert.rejects(testConnection('AIzaBAD'), e => /Google Gemini \(free tier\) rejected the API key\. Check it was copied completely/.test(e.message));
  assert.ok(isBadKeyResponse(400, 'Please pass a valid API key')); assert.ok(!isBadKeyResponse(400, 'Bad JSON')); assert.ok(isBadKeyResponse(403, ''));
});
test('exam plan prompt restricts questions to the syllabus subjects', () => {
  const jee = normalizeProfile(JSON.parse(fs.readFileSync(new URL('../src/exams/jee-main.json', import.meta.url), 'utf8')));
  const plan = buildPlan(jee, 0, 8); assert.deepEqual(plan.subjects, ['Physics', 'Chemistry', 'Mathematics']);
  const pr = planPrompt(plan, '[1 Cell] Mitochondria...');
  assert.match(pr, /SYLLABUS: this exam tests only Physics, Chemistry, Mathematics/); assert.match(pr, /skip any other material/);
});
test('difficulty is measured from the papers, not the generic 30/50/20', () => {
  const papers = ['Q1. Define entropy. [4 marks]\nQ2. List the laws of thermodynamics. [4 marks]\nQ3. State Kelvin-Planck statement. [4 marks]\nQ4. Explain the Carnot cycle with a diagram. [10 marks]\nQ5. Derive the efficiency of the Otto cycle in detail. [20 marks]',
    'Q1. Define enthalpy. [4 marks]\nQ2. Compare Otto and Diesel cycles. [10 marks]\nQ3. Analyse the Rankine cycle with reheat and derive its efficiency. [20 marks]'];
  const d = estimateDifficulty(papers); assert.equal(d.questions, 8); assert.equal(d.easy + d.medium + d.hard, 100);
  assert.notDeepEqual([d.easy, d.medium, d.hard], [30, 50, 20]); assert.ok(d.easy >= 40 && d.hard >= 20, JSON.stringify(d));
  const p = profileFromAnalysis({ sections: [{ name: 'A', type: 'written', count: 5, marks: 4 }], difficulty: { easy: 30, medium: 50, hard: 20 } }, { id: 'uni-x', name: 'X', measured: d });
  assert.equal(p.difficulty.easy, d.easy); assert.match(p.difficulty.basis, /Measured from 8 questions/);
  assert.equal(estimateDifficulty(['too short']), null);
});
test('warns when the document does not match the chosen exam', () => {
  const jee = normalizeProfile(JSON.parse(fs.readFileSync(new URL('../src/exams/jee-main.json', import.meta.url), 'utf8')));
  const bio = 'The cell is the unit of life. Mitochondria make ATP. DNA and RNA carry genes; chromosomes separate in mitosis and meiosis. Enzymes are proteins. Plant and animal tissue, hormones, membrane, nucleus. '.repeat(3);
  const phys = 'Newton laws: force equals mass times acceleration. Velocity, momentum and energy; work and power; electric current and voltage; magnetic field; lens optics and waves; thermodynamics and heat; equation, derivative, integral, matrix; atom, molecule, bond, reaction. '.repeat(3);
  assert.match(examDocWarning(jee, bio), /doesn’t look like JEE/); assert.equal(examDocWarning(jee, phys), null);
  assert.equal(syllabusMatch(['Physics'], 'short').share, null); assert.equal(syllabusMatch(['Art'], 'x'), null);
  const ups = normalizeProfile({ id: 'papers-t', name: 'End Sem · Thermodynamics', kind: 'papers', pattern: { sections: [{ name: 'A', type: 'written', count: 5, marks: 4 }] }, topics: [{ name: 'Carnot cycle' }, { name: 'Entropy' }, { name: 'Rankine cycle' }, { name: 'Otto cycle' }] });
  assert.match(examDocWarning(ups, bio), /covers few of/); assert.equal(examDocWarning(ups, 'Entropy and the Carnot and Otto and Rankine cycle'), null);
});
test('NEET (Biology (Botany and Zoology)) matches biology notes', () => {
  const neet = normalizeProfile(JSON.parse(fs.readFileSync(new URL('../src/exams/neet-ug.json', import.meta.url), 'utf8')));
  assert.equal(examDocWarning(neet, 'The cell is the unit of life. Mitochondria make ATP. DNA RNA gene chromosome mitosis meiosis enzyme protein plant animal tissue hormone membrane nucleus. '.repeat(3)), null);
});
