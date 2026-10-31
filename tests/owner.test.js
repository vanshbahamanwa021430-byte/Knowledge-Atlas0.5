import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OWNER_HASHES, sha256Hex, isOwnerEmail, addOwner, removeOwner, addedOwners, ownerHashes, maskSecrets, ring, recordRequest, requests, recordCrash, crashes, flags, setFlag } from '../src/devlog.js';
const mem = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

test('built-in owners are hashes; an email matches only by hash, case/space-insensitive', async () => {
  const s = mem();
  assert.ok(OWNER_HASHES.length >= 1 && OWNER_HASHES.every(h => /^[0-9a-f]{64}$/.test(h)));
  assert.ok(!await isOwnerEmail('someone@googlemail.com', s)); assert.ok(!await isOwnerEmail('', s));
  const h = await addOwner('Test.Owner@googlemail.com', s);
  assert.equal(h, await sha256Hex('test.owner@googlemail.com')); assert.ok(await isOwnerEmail('  TEST.owner@GoogleMail.com ', s));
});
test('the owner email is not in the source code (only its hash)', () => {
  for (const f of ['src/devlog.js', 'src/main.js', 'src/cloud.js']) assert.ok(!new RegExp(['baha' + 'manwa', '@g' + 'mail\\.com'].join('|'), 'i').test(readFileSync(new URL('../' + f, import.meta.url), 'utf8')), f);
});
test('owners manager: add Gmail as hash, remove it, built-in cannot be removed', async () => {
  const s = mem();
  await assert.rejects(addOwner('dev@example.com', s), /Gmail/);
  const h = await addOwner('Co.Dev+x@googlemail.com', s);
  assert.deepEqual(addedOwners(s), [h]); assert.ok(!s.getItem('ka-owners').includes('googlemail'));
  assert.ok(await isOwnerEmail('co.dev+x@googlemail.com', s)); await addOwner('co.dev+x@googlemail.com', s); assert.equal(addedOwners(s).length, 1);
  assert.equal(ownerHashes(s).length, 2);
  assert.throws(() => removeOwner(OWNER_HASHES[0], s), /Built-in/);
  removeOwner(h, s); assert.ok(!await isOwnerEmail('co.dev+x@googlemail.com', s));
  s.setItem('ka-owners', '["not-a-hash", 5]'); assert.deepEqual(addedOwners(s), []);
});
const G = 'AI' + 'za', Q = 'gs' + 'k_';   // fake key prefixes, split so secret scanners don't flag the test
test('AI request inspector masks keys in URLs, headers and bodies', () => {
  const r = recordRequest({ url: `https://generativelanguage.googleapis.com/v1/x?key=${G}SyABCDEFGHIJKLMNOPQRSTUV`, headers: { Authorization: `Bearer ${Q}abcdefghijklmnop`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'm1', apiKey: 'sk-abcdefghijklmnopqrstu' }), status: 200, ms: 12.3 });
  const all = JSON.stringify(r);
  assert.ok(!new RegExp(`${G}SyABCDEFGH|${Q}abcdefghijklmnop|sk-abcdefghijklmnopqrstu`).test(all), all);
  assert.equal(r.headers.Authorization, '•••'); assert.equal(r.headers['Content-Type'], 'application/json'); assert.equal(r.model, 'm1'); assert.equal(requests.all().at(-1), r);
  assert.equal(maskSecrets('token ya29.a0AfH6SMBxyzxyzxyz'), 'token ya29.a0•••');
});
test('ring buffers, crash log and feature flags', () => {
  const b = ring(3); [1, 2, 3, 4, 5].forEach(x => b.push(x)); assert.deepEqual(b.all(), [3, 4, 5]);
  const s = mem(); for (let i = 0; i < 35; i++) recordCrash(Error('boom ' + i + ` key=${G}SyABCDEFGHIJKLMNOP`), s);
  assert.equal(crashes(s).length, 30); assert.ok(!new RegExp(G + 'SyABCDEF').test(JSON.stringify(crashes(s))));
  assert.equal(flags(s)['verbose-ai'], false); setFlag('verbose-ai', true, s); assert.equal(flags(s)['verbose-ai'], true);
  setFlag('unknown-flag', true, s); assert.ok(!('unknown-flag' in flags(s)));
});
