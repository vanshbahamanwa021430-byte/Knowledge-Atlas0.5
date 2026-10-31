import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptPack, decryptPack, isPackEnvelope, ownerPackController, memoryStore, importModule, OWNER_PACK_FORMAT } from '../src/ownerpack.js';

const MODULE = `export async function activate(ctx, pack) { ctx.log.push('on:' + pack.data.word); ctx.hooks.word = pack.data.word; return { deactivate() { ctx.log.push('off'); delete ctx.hooks.word; } }; }`;
const PACK = { packVersion: 't1', built: 1, module: MODULE, data: { word: 'hello', big: 'x'.repeat(50000) }, assets: { photo: 'data:image/webp;base64,AAAA' } };
const PASS = 'correct horse battery';

test('encrypt/decrypt round-trip, wrong passphrase and tampering are rejected', async () => {
  const env = await encryptPack(PACK, PASS, 1000);
  assert.ok(isPackEnvelope(env)); assert.equal(env.format, OWNER_PACK_FORMAT); assert.equal(env.encrypted, 'AES-GCM');
  assert.doesNotMatch(JSON.stringify(env), /hello|activate|xxxx/, 'nothing readable in the envelope');
  assert.ok(env.data.length < 20000, 'compressed before encryption');
  const back = await decryptPack(env, PASS);
  assert.equal(back.module, MODULE); assert.deepEqual(back.data, PACK.data); assert.deepEqual(back.assets, PACK.assets);
  await assert.rejects(decryptPack(env, 'wrong passphrase'), /Wrong owner-pack passphrase/);
  const bad = { ...env, data: env.data.slice(0, -8) + 'AAAAAAAA' };
  await assert.rejects(decryptPack(bad, PASS), /Wrong|damaged/);
  await assert.rejects(decryptPack({ format: 'x' }, PASS), /not a Prvlar owner pack/);
  await assert.rejects(encryptPack(PACK, 'short'), /at least 12/);
});

test('the module loads from source', async () => {
  const m = await importModule('export const x = 41 + 1;');
  assert.equal(m.x, 42);
});

function setup({ owner = true, remoteEnv = null } = {}) {
  const ctx = { log: [], hooks: {} }, cacheBox = { v: null }, drive = { v: remoteEnv, downloads: 0, uploads: 0 };
  const deps = {
    ctx, secure: memoryStore(),
    cache: { get: async () => cacheBox.v, set: async v => { cacheBox.v = v; }, del: async () => { cacheBox.v = null; } },
    isOwner: async e => owner && e === 'owner@example.com',
    remote: { download: async () => { drive.downloads++; if (drive.offline) throw Error('offline'); return drive.v; }, upload: async env => { drive.uploads++; drive.v = env; } }
  };
  return { ctx, cacheBox, drive, deps, c: ownerPackController(deps) };
}

test('owner sign-in: downloads from Drive, asks for the passphrase once, then activates', async () => {
  const env = await encryptPack(PACK, PASS, 1000);
  const { ctx, cacheBox, drive, deps, c } = setup({ remoteEnv: env });
  assert.equal((await c.sync('owner@example.com')).reason, 'locked');
  assert.equal(drive.downloads, 1); assert.ok(cacheBox.v, 'cached encrypted for offline use');
  assert.equal((await c.sync('owner@example.com', { passphrase: 'nope nope nope' })).reason, 'bad-pass');
  assert.ok(!c.isActive());
  assert.ok((await c.sync('owner@example.com', { passphrase: PASS })).ok);
  assert.ok(c.isActive()); assert.equal(ctx.hooks.word, 'hello'); assert.equal(c.status().status, 'on'); assert.equal(c.status().version, 't1');
  assert.equal(await deps.secure.get('owner-pack-pass'), PASS, 'passphrase kept in secure storage');
});

test('offline restart: activates from the cache and the stored passphrase without Drive', async () => {
  const env = await encryptPack(PACK, PASS, 1000);
  const { ctx, drive, deps, c } = setup({ remoteEnv: env });
  await c.sync('owner@example.com', { passphrase: PASS });
  await c.deactivate();                       // simulate an app restart
  drive.offline = true; const before = drive.downloads;
  const c2 = ownerPackController(deps);
  assert.ok((await c2.sync('owner@example.com')).ok);
  assert.equal(drive.downloads, before, 'no network needed'); assert.equal(ctx.hooks.word, 'hello');
});

test('sign-out or a non-owner account removes the pack, cache and passphrase', async () => {
  const env = await encryptPack(PACK, PASS, 1000);
  const { ctx, cacheBox, deps, c } = setup({ remoteEnv: env });
  await c.sync('owner@example.com', { passphrase: PASS });
  assert.equal((await c.sync('someone@example.com')).reason, 'not-owner');
  assert.ok(!c.isActive()); assert.equal(ctx.hooks.word, undefined); assert.deepEqual(ctx.log, ['on:hello', 'off']);
  assert.equal(cacheBox.v, null); assert.equal(await deps.secure.get('owner-pack-pass'), null);
  await c.sync('owner@example.com', { passphrase: PASS }); await c.sync('');   // signed out
  assert.ok(!c.isActive()); assert.equal(cacheBox.v, null);
});

test('install from a file: verifies, uploads to Drive, caches and activates; no pack in Drive → missing', async () => {
  const { drive, cacheBox, c } = setup();
  assert.equal((await c.sync('owner@example.com', { passphrase: PASS })).reason, 'missing');
  const env = await encryptPack(PACK, PASS, 1000);
  await assert.rejects(c.install(env, 'wrong passphrase'), /Wrong/);
  assert.equal(drive.uploads, 0);
  const s = await c.install(env, PASS);
  assert.equal(s.status, 'on'); assert.equal(drive.uploads, 1); assert.ok(cacheBox.v);
});

test('import from file works without Drive; a failed Drive upload still installs locally', async () => {
  const env = await encryptPack(PACK, PASS, 1000);
  const a = setup(); const r1 = await a.c.install(env, PASS, { upload: false });
  assert.equal(r1.status, 'on'); assert.equal(a.drive.uploads, 0); assert.ok(a.cacheBox.v);
  const b = setup(); b.deps.remote.upload = async () => { throw Error('Allow Drive access to sync.'); };
  const r2 = await b.c.install(env, PASS);
  assert.equal(r2.status, 'on'); assert.match(r2.driveError, /Allow Drive access/);
  await assert.rejects(setup().c.install(env, 'wrong passphrase', { upload: false }), /Wrong/);
});
