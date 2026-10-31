import test from 'node:test';
import assert from 'node:assert/strict';
import { drive, classifyDriveError, hasDriveScope, DRIVE_APPDATA } from '../src/sync.js';
const body = (reason, status = '') => ({ error: { code: 403, message: 'x', errors: [{ reason }], status } });
const res = (status, b) => ({ ok: status < 300, status, json: async () => b });

test('Drive 403 reasons map to specific messages', () => {
  assert.equal(classifyDriveError(403, body('insufficientPermissions', 'PERMISSION_DENIED')).reason, 'scope');
  assert.equal(classifyDriveError(403, { error: { code: 403, status: 'PERMISSION_DENIED', details: [{ reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' }] } }).reason, 'scope');
  const q = classifyDriveError(403, body('storageQuotaExceeded')); assert.equal(q.reason, 'quota'); assert.match(q.message, /storage is full/);
  assert.equal(classifyDriveError(403, body('userRateLimitExceeded')).reason, 'rate');
  assert.equal(classifyDriveError(429, null).reason, 'rate');
  assert.equal(classifyDriveError(403, body('accessNotConfigured')).reason, 'disabled');
  assert.equal(classifyDriveError(401, null).reason, 'auth');
  assert.match(classifyDriveError(403, body('appNotAuthorizedToFile')).message, /refused/);
  assert.match(classifyDriveError(403, body('insufficientPermissions')).message, /Allow Drive access/);
});

test('rate limits retry with backoff, then succeed; scope errors do not retry', async () => {
  let n = 0; const waits = [];
  const f = async () => (++n < 3 ? res(429, body('rateLimitExceeded')) : res(200, { files: [{ id: 'a' }] }));
  const d = drive('t', f, { sleep: async ms => { waits.push(ms); } });
  assert.deepEqual(await d.list(), [{ id: 'a' }]); assert.equal(n, 3); assert.equal(waits.length, 2); assert.ok(waits[1] > waits[0]);
  let m = 0; const d2 = drive('t', async () => { m++; return res(403, body('insufficientPermissions')); }, { sleep: async () => {} });
  await assert.rejects(d2.list(), e => e.reason === 'scope'); assert.equal(m, 1);
  let k = 0; const d3 = drive('t', async () => { k++; return res(429, null); }, { retries: 2, sleep: async () => {} });
  await assert.rejects(d3.list(), e => e.reason === 'rate'); assert.equal(k, 3);
});

test('requests use appDataFolder and multipart upload', async () => {
  const calls = [];
  const d = drive('tok', async (url, opt) => { calls.push({ url, opt }); return res(200, { id: 'x', files: [] }); });
  await d.list(); await d.create('a.json', { v: 1 });
  assert.match(calls[0].url, /spaces=appDataFolder/);
  assert.match(calls[1].url, /^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?uploadType=multipart/);
  assert.match(calls[1].opt.headers['Content-Type'], /^multipart\/related; boundary=/);
  assert.match(calls[1].opt.body, /"parents":\["appDataFolder"\]/);
  assert.equal(calls[1].opt.headers.Authorization, 'Bearer tok');
});

test('granted scope check (granular consent)', () => {
  assert.ok(hasDriveScope(`openid email ${DRIVE_APPDATA}`));
  assert.ok(!hasDriveScope('openid https://www.googleapis.com/auth/userinfo.email'));
  assert.ok(!hasDriveScope(''));
});
