// 0.9.8 review M1/L3/L4: run proxy/apps-script/Code.gs in a sandbox with fake Apps Script services.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const SRC = readFileSync(new URL('../proxy/apps-script/Code.gs', import.meta.url), 'utf8');
const KEY = 'AIzaFAKEKEYFORTESTS0000000000000000000';
function load(fetchReply) {
  const props = { GEMINI_KEY: KEY, APP_TOKEN: 'tok-9f3a' }, logs = [], fetched = [];
  const ctx = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; }, getProperties: () => ({ ...props }), deleteProperty: k => { delete props[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Logger: { log: s => logs.push(String(s)) },
    Utilities: { getUuid: () => 'uuid', formatDate: (d, z, f) => f.length > 10 ? '2026-10-31-18-00' : '2026-10-31', DigestAlgorithm: { SHA_256: 1 }, computeDigest: (a, s) => [...createHash('sha256').update(s).digest()] },
    ContentService: { MimeType: { JSON: 1 }, createTextOutput: t => ({ setMimeType: () => JSON.parse(t) }) },
    UrlFetchApp: { fetch: (u, o) => { fetched.push(u); return fetchReply(u, o); } },
    JSON, Date, Number, String, Array, Math, Object, encodeURIComponent,
  };
  vm.createContext(ctx); vm.runInContext(SRC, ctx);
  return { ctx, props, logs, fetched };
}
const ok = () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: 'hi' } }] }) });
const post = (g, body) => g.ctx.doPost({ postData: { contents: JSON.stringify(body) } });
const dev = 'device-' + '0'.repeat(8) + '-0000-0000-0000-' + '0'.repeat(12);
const msg = (c = 'hello') => ({ token: 'tok-9f3a', eligible: true, device: dev, payload: { messages: [{ role: 'user', content: c }] } });

test('proxy: ignores the client "account" field — rotating it cannot bypass the per-device limit', () => {
  const g = load(ok);
  for (let i = 0; i < 30; i++) assert.equal(post(g, { ...msg(), account: 'acct-' + i }).status, i < 20 ? 200 : 429);   // minute cap hits first at 20
  g.props['m:2026-10-31-18-00'] = '0';
  for (let i = 0; i < 15; i++) post(g, { ...msg(), account: 'x' + i });
  const r = post(g, { ...msg(), account: 'fresh' });
  assert.equal(r.status, 429); assert.match(r.body.error.message, /PRVLAR_LIMIT/);
});
test('proxy: global per-minute cap across devices', () => {
  const g = load(ok); let last;
  for (let i = 0; i < 21; i++) last = post(g, { ...msg(), device: 'device-' + String(i).padStart(8, '0') + '-0000-0000-0000-000000000000' });
  assert.equal(last.status, 429); assert.match(last.body.error.message, /PRVLAR_BUSY/);
});
test('proxy: validates roles, parts and length', () => {
  const g = load(ok);
  assert.equal(post(g, { ...msg(), payload: { messages: [{ role: 'tool', content: 'x' }] } }).status, 400);
  assert.equal(post(g, { ...msg(), payload: { messages: [{ role: 'user', content: [{ type: 'file', file: {} }] }] } }).status, 400);
  assert.equal(post(g, { ...msg(), payload: { messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'https://evil/x.png' } }] }] } }).status, 400);
  assert.equal(post(g, msg('x'.repeat(130000))).status, 413);
  assert.equal(post(g, { ...msg(), payload: { messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }, { type: 'input_audio', input_audio: { data: 'AAAA', format: 'wav' } }] }] } }).status, 200);
});
test('proxy: every copy of the key is masked in errors; token is not logged', () => {
  const g = load(() => ({ getResponseCode: () => 400, getContentText: () => JSON.stringify({ error: { message: `bad ${KEY} and again ${KEY}` } }) }));
  const r = post(g, msg()); assert.ok(!JSON.stringify(r).includes(KEY)); assert.equal((JSON.stringify(r).match(/\*\*\*/g) || []).length, 2);
  g.ctx.setup(); g.ctx.status(); assert.ok(!g.logs.join('\n').includes('tok-9f3a'), 'APP_TOKEN printed'); assert.ok(!g.logs.join('\n').includes(KEY));
});

test('0.9.9: direct proxy request without the eligibility flag is rejected (frontend bypass)', () => {
  const g = load(ok); const b = msg(); delete b.eligible;
  const r = post(g, b); assert.equal(r.status, 403); assert.match(JSON.stringify(r), /18 or over/); assert.equal(g.fetched.length, 0);
  assert.equal(post(g, { ...msg(), eligible: 'yes' }).status, 403);
});
test('0.9.9: with ALLOWED_AUD set, a request without a valid ID token is rejected; a valid one passes', () => {
  const g = load((u) => /tokeninfo/.test(u) ? ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ aud: 'cid', sub: '42', email_verified: 'true', exp: String(Math.floor(Date.now() / 1000) + 600) }) }) : ok());
  g.props.ALLOWED_AUD = 'cid';
  assert.equal(post(g, msg()).status, 401);
  assert.equal(post(g, { ...msg(), idToken: 'x.y.z' }).status, 200);
});
test('0.9.9: proxy stores no message content (minimal data)', () => {
  const g = load(ok); post(g, msg('my secret essay text'));
  assert.ok(!JSON.stringify(g.props).includes('secret essay')); assert.ok(!g.logs.join(' ').includes('secret essay'));
});
