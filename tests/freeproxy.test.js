import test from 'node:test'; import assert from 'node:assert/strict';
import { setFreeProxy, SERVER_PRESETS, testConnection, isFreeLimit, describeAI } from '../src/ai.js';
const URL = 'https://script.google.com/macros/s/AKfyTEST_123/exec';
const cfg = { key: 'device-00000000-0000-4000-8000-000000000000', server: { url: URL, model: 'auto', free: true } };
test('free proxy: hidden until configured; Apps Script request carries token + device in a simple text/plain body', async () => {
  assert.equal(setFreeProxy(''), false); assert.ok(!SERVER_PRESETS.prvlar);
  assert.equal(setFreeProxy(URL, 'tok'), true); assert.equal(SERVER_PRESETS.prvlar.label, 'Prvlar free (limited)');
  let seen; globalThis.fetch = async (u, init) => { seen = { u, init }; return new Response(JSON.stringify({ status: 200, body: { choices: [{ message: { content: '{"ok":true}' } }] } })); };
  const r = await testConnection(cfg);
  assert.ok(r.ok); assert.equal(seen.u, URL); assert.equal(seen.init.headers['Content-Type'], 'text/plain;charset=utf-8'); assert.ok(!seen.init.headers.Authorization);
  const b = JSON.parse(seen.init.body); assert.equal(b.token, 'tok'); assert.equal(b.device, cfg.key); assert.ok(Array.isArray(b.payload.messages));
  assert.equal(describeAI(cfg), 'Prvlar free (limited)');
});
test('free proxy: daily limit surfaces as PRVLAR_LIMIT', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ status: 429, body: { error: { message: 'PRVLAR_LIMIT: You have used today’s free messages.' } } }));
  await assert.rejects(testConnection(cfg), e => isFreeLimit(e));
  setFreeProxy('');
});
