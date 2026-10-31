import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExam, gradeWritten, explainSection, providerFor, PROVIDERS, chatEndpoint } from '../src/ai.js';

const doc = { name: 'D', sections: Array.from({ length: 6 }, (_, i) => ({ ref: 'Section ' + (i + 1), text: 'Detailed source material. '.repeat(60) })) };
const exam = n => Array.from({ length: n }, (_, i) => ({ id: 'q' + i, type: i < 10 ? 'mcq' : 'written', prompt: 'Question number ' + i + ' about the text?', marks: 99, source: 'Section ' + ((i % 6) + 1), solution: 'Model solution text.', rubric: 'Rubric text here.', options: i < 10 ? ['a', 'b', 'c', 'd'] : undefined, correct: i < 10 ? '1' : undefined }));
const reply = obj => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] }) });
const realFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = realFetch; });

test('generateExam retries once, coerces marks and flags sources', async () => {
  let calls = 0;
  globalThis.fetch = async (url, opts) => { calls++; assert.match(opts.headers.Authorization, /^Bearer sk-test/); return reply({ questions: exam(calls === 1 ? 19 : 20) }); };
  const q = await generateExam(doc, 'sk-test');
  assert.equal(calls, 2); assert.equal(q.length, 20);
  assert.equal(q[0].marks, 1); assert.equal(q[15].marks, 5); assert.equal(q[0].correct, 1);
  assert.ok(q.every(x => x.sourceVerified === true));
});
test('generateExam gives up after two invalid replies', async () => {
  globalThis.fetch = async () => reply({ questions: exam(3) });
  await assert.rejects(() => generateExam(doc, 'k'), /valid 20-question/);
});
test('generateExam refuses documents that are too short without calling the API', async () => {
  globalThis.fetch = async () => { throw Error('should not be called'); };
  await assert.rejects(() => generateExam({ name: 'S', sections: [{ ref: 'A', text: 'tiny' }] }, 'k'), /too short/);
});
test('HTTP errors surface the provider message', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Incorrect API key' } }) });
  await assert.rejects(() => generateExam(doc, 'bad'), /401.*Incorrect API key/);
});
test('gradeWritten coerces and clamps, and blank answers score zero', async () => {
  const qs = [{ id: 'w1', type: 'written', marks: 5, prompt: 'p', rubric: 'r', solution: 's', source: 'x' }, { id: 'w2', type: 'written', marks: 5, prompt: 'p', rubric: 'r', solution: 's', source: 'x' }, { id: 'm', type: 'mcq', marks: 1 }];
  globalThis.fetch = async () => reply({ grades: [{ id: 'w1', awarded: '9', feedback: 'ok' }, { id: 'w2', awarded: 4, feedback: 'blank?' }] });
  const g = await gradeWritten(doc, 'k', qs, { w1: 'an answer', w2: '   ' });
  assert.deepEqual(g.map(x => x.awarded), [5, 0]);
  assert.ok(g.every(x => x.method === 'AI provisional'));
});
test('explainSection returns text and rejects empty output', async () => {
  globalThis.fetch = async () => reply({ explanation: ' Simple words. ' });
  assert.equal(await explainSection('T', 'text', 'k'), 'Simple words.');
  globalThis.fetch = async () => reply({});
  await assert.rejects(() => explainSection('T', 'text', 'k'), /no explanation/);
});
test('network failure gives a friendly message', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(() => explainSection('T', 'x', 'k'), /Could not reach/);
});

test('provider is detected from the key prefix', async () => {
  assert.equal(providerFor('AIzaSyExample'), PROVIDERS.gemini);
  assert.equal(providerFor(' gsk_example '), PROVIDERS.groq);
  assert.equal(providerFor('sk-proj-example'), PROVIDERS.openai);
  const seen = [];
  globalThis.fetch = async (url, opts) => { seen.push([url, JSON.parse(opts.body), opts.headers.Authorization]); return reply({ explanation: 'x' }); };
  await explainSection('T', 'text', '  AIzaKey  ');
  await explainSection('T', 'text', 'gsk_key');
  assert.match(seen[0][0], /generativelanguage\.googleapis\.com\/v1beta\/openai\/chat\/completions$/);
  assert.equal(seen[0][1].model, 'gemini-flash-lite-latest');
  assert.equal('temperature' in seen[0][1], false);
  assert.equal(seen[0][2], 'Bearer AIzaKey');
  assert.match(seen[1][0], /api\.groq\.com\/openai\/v1\/chat\/completions$/);
});
test('retries without JSON mode when a model rejects it', async () => {
  const bodies = [];
  globalThis.fetch = async (url, opts) => {
    const b = JSON.parse(opts.body); bodies.push(b);
    if (b.response_format) return { ok: false, status: 400, json: async () => ({ error: { message: 'response_format json_object is not supported' } }) };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '```json\n{"explanation":"Fenced."}\n```' } }] }) };
  };
  assert.equal(await explainSection('T', 'text', 'AIza'), 'Fenced.');
  assert.equal(bodies.length, 2);
});
test('free-tier rate limit gives a clear message', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ([{ error: { message: 'Resource exhausted' } }]) });
  await assert.rejects(() => explainSection('T', 'x', 'AIza'), /429.*Resource exhausted.*Gemini.*limit reached/);
});

test('self-hosted router: address normalised, model "auto", key optional', async () => {
  assert.equal(chatEndpoint('localhost:3001'), 'http://localhost:3001/v1/chat/completions');
  assert.equal(chatEndpoint('http://192.168.1.20:20128/v1/'), 'http://192.168.1.20:20128/v1/chat/completions');
  assert.equal(chatEndpoint('https://x.example/v1/chat/completions'), 'https://x.example/v1/chat/completions');
  assert.throws(() => chatEndpoint(''), /server address/);
  const seen = [];
  globalThis.fetch = async (url, opts) => { seen.push([url, JSON.parse(opts.body), opts.headers]); return reply({ explanation: 'ok' }); };
  await explainSection('T', 'text', { key: 'server-key', server: { url: 'http://localhost:3001/v1', model: '' } });
  await explainSection('T', 'text', { key: '', server: { url: 'http://localhost:20128/v1', model: 'gemini/gemini-flash' } });
  assert.equal(seen[0][0], 'http://localhost:3001/v1/chat/completions');
  assert.equal(seen[0][1].model, 'auto'); assert.equal(seen[0][2].Authorization, 'Bearer server-key');
  assert.equal(seen[1][1].model, 'gemini/gemini-flash'); assert.equal('Authorization' in seen[1][2], false);
});
test('cloud mode without a key fails before any request', async () => {
  globalThis.fetch = async () => { throw Error('should not be called'); };
  await assert.rejects(() => explainSection('T', 'x', ''), /Set up Smarty’s brain/);
});
test('router 401 explains which key to use', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: 'Invalid API key' }) });
  await assert.rejects(() => explainSection('T', 'x', { key: 'k', server: { url: 'localhost:3001' } }), /401.*Invalid API key/);
});
test('LiteRT-LM preset sends model, backend and context in the model string', async () => {
  const { SERVER_PRESETS } = await import('../src/ai.js');
  const p = SERVER_PRESETS.litertlm;
  let sent;
  globalThis.fetch = async (url, opts) => { sent = [url, JSON.parse(opts.body)]; return reply({ explanation: 'ok' }); };
  await explainSection('T', 'text', { key: '', server: { url: p.url, model: p.model } });
  assert.equal(sent[0], 'http://localhost:9379/v1/chat/completions');
  assert.equal(sent[1].model, 'gemma,cpu,16384');
  assert.deepEqual(sent[1].response_format, { type: 'json_object' });
});
test('connection check sends no document text and reports the service', async () => {
  const { testConnection, describeAI } = await import('../src/ai.js');
  let body;
  globalThis.fetch = async (url, opts) => { body = JSON.parse(opts.body); return reply({ ok: true }); };
  const r = await testConnection('AIzaKey');
  assert.equal(r.ok, true); assert.match(r.name, /Gemini/);
  assert.ok(JSON.stringify(body.messages).length < 300);
  assert.match(describeAI({ key: '', server: { url: 'localhost:9379' } }), /your AI server \(http:\/\/localhost:9379\/v1\)/);
  assert.equal(describeAI(''), '');
});
