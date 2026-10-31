// Custom OpenAI-compatible endpoint + fallback chain, against a real local mock server.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { isPrivateHost, chatEndpoint, fetchModels, shouldFallback, testConnection, describeAI, userContent, resolveAI, smartyAnswer } from '../src/ai.js';

function server(handler) {
  return new Promise(res => { const s = http.createServer((req, rsp) => { let b = ''; req.on('data', c => b += c); req.on('end', () => handler(req, rsp, b ? JSON.parse(b) : null)); }); s.listen(0, '127.0.0.1', () => res(s)); });
}
const reply = (rsp, status, obj) => { rsp.writeHead(status, { 'content-type': 'application/json' }); rsp.end(JSON.stringify(obj)); };
const ok = content => ({ choices: [{ message: { content: JSON.stringify(content) } }] });
const base = s => `http://127.0.0.1:${s.address().port}/v1`;
const seen = [];
const good = await server((req, rsp, body) => { seen.push({ url: req.url, auth: req.headers.authorization, body });
  if (req.url === '/v1/models') return reply(rsp, 200, { data: [{ id: 'llama-3' }, { id: 'qwen' }] });
  reply(rsp, 200, ok({ ok: true, answer: 'From the server [S1].', topic: 'T', general: false })); });
const e401 = await server((q, rsp) => reply(rsp, 401, { error: { message: 'bad key' } }));
const e429 = await server((q, rsp) => reply(rsp, 429, { error: { message: 'rate limited' } }));
const e400 = await server((q, rsp) => reply(rsp, 400, { error: { message: 'malformed request' } }));
const dead = 'http://127.0.0.1:1/v1';
const cfg = (url, extra = {}) => ({ key: 'k1', server: { url, model: 'auto', ...extra } });
test.after(() => [good, e401, e429, e400].forEach(s => s.close()));

test('http only for private/local hosts', () => {
  for (const h of ['localhost', '127.0.0.1', '10.1.2.3', '172.20.0.5', '192.168.1.20', 'pc.local', '100.100.1.1']) assert.ok(isPrivateHost(h), h);
  for (const h of ['8.8.8.8', '172.32.0.1', 'example.com', '193.168.1.1']) assert.ok(!isPrivateHost(h), h);
  assert.throws(() => chatEndpoint('http://example.com/v1'), /local network/);
  assert.equal(chatEndpoint('https://example.com/v1'), 'https://example.com/v1/chat/completions');
  assert.equal(chatEndpoint('192.168.1.20:3001'), 'http://192.168.1.20:3001/v1/chat/completions');
});
test('fetch models from /v1/models with the key', async () => {
  assert.deepEqual(await fetchModels(base(good), 'k1'), ['llama-3', 'qwen']);
  assert.equal(seen.at(-1).auth, 'Bearer k1');
  await assert.rejects(fetchModels(base(e401), 'x'), /rejected the API key/);
});
test('custom endpoint answers, test connection works, model "auto" is sent', async () => {
  const r = await smartyAnswer('q', [{ docName: 'd', ref: 'Page 1', page: 1, text: 't' }], cfg(base(good)));
  assert.equal(r.text, 'From the server [1].'); assert.equal(seen.at(-1).body.model, 'auto');
  assert.ok((await testConnection(cfg(base(good)))).ok);
});
test('vision: image parts only when the model can see images', () => {
  const img = 'data:image/jpeg;base64,AAAA';
  assert.equal(typeof userContent(resolveAI(cfg('http://localhost:1/v1')), 'hi', [img]), 'string');
  const parts = userContent(resolveAI(cfg('http://localhost:1/v1', { vision: true })), 'hi', [img]);
  assert.equal(parts[1].type, 'image_url'); assert.equal(parts[1].image_url.url, img);
  assert.equal(userContent({ endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' }, 'x', [img]).length, 2);
});
test('fallback: unreachable, 401 and 429 move on to the next provider', async () => {
  const chain = { chain: [cfg(dead), cfg(base(e401)), cfg(base(e429)), cfg(base(good))] };
  const n = seen.length;
  const r = await smartyAnswer('q', [{ docName: 'd', ref: 'p', text: 't' }], chain);
  assert.equal(r.text, 'From the server [1].'); assert.equal(seen.length, n + 1);
  assert.match(describeAI(chain), /→/);
});
test('fallback stops on errors another provider would not fix (400)', async () => {
  const n = seen.length;
  await assert.rejects(smartyAnswer('q', [{ docName: 'd', ref: 'p', text: 't' }], { chain: [cfg(base(e400)), cfg(base(good))] }), /malformed/);
  assert.equal(seen.length, n);
});
test('all providers failing reports the last error; empty chain is explained', async () => {
  await assert.rejects(smartyAnswer('q', [{ docName: 'd', ref: 'p', text: 't' }], { chain: [cfg(dead), cfg(base(e429))] }), /429/);
  await assert.rejects(smartyAnswer('q', [{ docName: 'd', ref: 'p', text: 't' }], { chain: [] }), /Set up Smarty’s brain/);
  assert.ok(shouldFallback(Error('Could not reach the AI service.'))); assert.ok(!shouldFallback(Error('AI request failed (400). x')));
});
