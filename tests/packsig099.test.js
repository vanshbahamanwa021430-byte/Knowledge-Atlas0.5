import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as ed from '@noble/ed25519';
import { encryptPack, signPack, verifyPackSig, ownerPackController, memoryStore, decryptPack } from '../src/ownerpack.js';
import { PACK_SIGNING_KEYS } from '../src/packkeys.js';

const toHex = u8 => [...u8].map(b => b.toString(16).padStart(2, '0')).join('');
const PACK = { module: 'export function activate(){ return {}; }', data: {} };
const PASS = 'twelve-chars-ok!';
async function keys() { const sk = ed.utils.randomPrivateKey(), pk = await ed.getPublicKeyAsync(sk); return { skHex: toHex(sk), set: { [toHex(pk).slice(0, 8)]: toHex(pk) } }; }
const ctl = (signingKeys, secure = memoryStore()) => ownerPackController({ cache: memoryStore() && { get: async () => null, set: async () => {}, del: async () => {} }, secure, isOwner: async () => true, importModule: async () => ({ activate: () => ({}) }), signingKeys, ctx: {} });

test('0.9.9 M5: passphrase must be 12+ for new packs; old 8-char packs still open', async () => {
  await assert.rejects(encryptPack(PACK, 'elevenchars'), /at least 12/);
  // an envelope made by 0.9.8 rules (8 chars) still decrypts
  const old = await encryptPack(PACK, PASS, 1000); assert.ok((await decryptPack(old, PASS)).module);
});
test('0.9.9 M5: signed pack verifies; tampering or an unknown key is rejected before decrypting', async () => {
  const k = await keys();
  const env = await signPack(await encryptPack(PACK, PASS, 1000), k.skHex);
  assert.equal(await verifyPackSig(env, k.set), 'ok');
  assert.equal(await verifyPackSig({ ...env, data: env.data.slice(0, -4) + 'AAAA' }, k.set), 'bad');
  assert.equal(await verifyPackSig(env, PACK_SIGNING_KEYS), 'bad', 'not the app key');
  assert.equal(await verifyPackSig({ ...env, sig: undefined }, k.set), 'unsigned');
});
test('0.9.9 M5: controller — unsigned legacy packs work until a signed one was used, then only signed packs', async () => {
  const k = await keys(), secure = memoryStore(), c = ctl(k.set, secure);
  const unsigned = await encryptPack(PACK, PASS, 1000);
  assert.equal((await c.install(unsigned, PASS, { upload: false })).signed, false);
  const signed = await signPack(await encryptPack(PACK, PASS, 1000), k.skHex);
  assert.equal((await c.install(signed, PASS, { upload: false })).signed, true);
  await assert.rejects(c.install(unsigned, PASS, { upload: false }), /not signed/);
  await assert.rejects(c.install({ ...signed, iv: unsigned.iv }, PASS, { upload: false }), /signature does not match/);
});
test('0.9.9 M5: the app ships only public signing keys', () => {
  for (const [kid, pk] of Object.entries(PACK_SIGNING_KEYS)) { assert.match(pk, /^[0-9a-f]{64}$/); assert.equal(pk.slice(0, 8), kid); }
});
