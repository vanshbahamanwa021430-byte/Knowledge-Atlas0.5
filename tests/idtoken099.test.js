import test from 'node:test'; import assert from 'node:assert/strict';
import { setFreeProxy, testConnection, setIdTokenSource } from '../src/ai.js';
const URL = 'https://script.google.com/macros/s/AKfyTEST_123/exec';
const cfg = { key: 'device-00000000-0000-4000-8000-000000000000', server: { url: URL, model: 'auto', free: true } };
const ok = () => new Response(JSON.stringify({ status: 200, body: { choices: [{ message: { content: '{"ok":true}' } }] } }));
test('free proxy gets the Google ID token when signed in, and none otherwise', async () => {
  setFreeProxy(URL, 'tok'); let body;
  globalThis.fetch = async (u, init) => { body = JSON.parse(init.body); return ok(); };
  setIdTokenSource(async () => 'ID.TOKEN.X'); await testConnection(cfg); assert.equal(body.idToken, 'ID.TOKEN.X');
  setIdTokenSource(async () => { throw Error('no'); }); await testConnection(cfg); assert.ok(!('idToken' in body));
  setIdTokenSource(null); setFreeProxy('');
});
