import test from 'node:test'; import assert from 'node:assert/strict';
import worker from '../proxy/worker.js';
const ORIGIN = 'https://example.github.io';
const kv = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => m.set(k, v), m }; };
const env = (o = {}) => ({ GEMINI_KEY: 'secret-key', ALLOWED_ORIGINS: ORIGIN + ',app://atlas', DEVICE_LIMIT: '2', GLOBAL_LIMIT: '3', COUNTS: kv(), ...o });
const dev = n => 'device-' + String(n).padStart(8, '0') + '-0000-4000-8000-000000000000';
const req = (o = {}) => new Request('https://p.workers.dev/v1/chat/completions', { method: 'POST', headers: { Origin: o.origin ?? ORIGIN, Authorization: 'Bearer ' + (o.dev ?? dev(1)), 'Content-Type': 'application/json' }, body: o.body ?? JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'hi' }] }) });
test('proxy: origin check, device limit, global cap, key never returned', async () => {
  const calls = []; globalThis.fetch = async (u, init) => { calls.push({ u, init }); return new Response('{"choices":[{"message":{"content":"{}"}}]}', { status: 200 }); };
  const e = env();
  assert.equal((await worker.fetch(req({ origin: 'https://evil.example' }), e)).status, 403);
  assert.equal((await worker.fetch(req({ dev: 'nope' }), e)).status, 400);
  assert.equal((await worker.fetch(req(), e)).status, 200);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer secret-key');
  assert.equal(JSON.parse(calls[0].init.body).model, 'gemini-flash-latest');
  assert.equal((await worker.fetch(req(), e)).status, 200);
  const r3 = await worker.fetch(req(), e); assert.equal(r3.status, 429); const j = await r3.json(); assert.match(j.error.message, /PRVLAR_LIMIT/); assert.ok(!JSON.stringify(j).includes('secret-key'));
  assert.equal((await worker.fetch(req({ dev: dev(2) }), e)).status, 200);   // global 3 reached now
  assert.equal((await worker.fetch(req({ dev: dev(3) }), e)).status, 429);
  assert.ok(![...e.COUNTS.m.keys()].some(k => k.includes(dev(1))), 'device id stored hashed');
});
test('proxy: not configured, too large, CORS preflight', async () => {
  assert.equal((await worker.fetch(req(), env({ GEMINI_KEY: '' }))).status, 503);
  assert.equal((await worker.fetch(req({ body: JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(12500000) }] }) }), env())).status, 413);
  const pre = await worker.fetch(new Request('https://p/v1/chat/completions', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env());
  assert.equal(pre.status, 204); assert.equal(pre.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});
