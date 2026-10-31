// Owner pack: owner-only content shipped outside the app. The app (APK, web, desktop) contains none of it.
// Format: a JSON envelope { format: 'ka-owner-pack', version, encrypted: 'AES-GCM', kdf: 'PBKDF2-SHA256', salt, iv, data }.
// Plaintext: { format, version, built, module: '<ES module source>', data: {...}, assets: { name: 'data:…' } }.
// Stored in the owner's own Google Drive (appDataFolder, file OWNER_PACK_NAME), cached encrypted on the device for
// offline use, decrypted with a key derived from the owner's passphrase (PBKDF2-SHA256 → AES-GCM). The passphrase
// is kept in secure storage (Android Keystore through the AtlasSecure plugin; elsewhere wrapped by a
// non-extractable WebCrypto key in IndexedDB). Signing out or a non-owner sign-in removes the cache and passphrase.
export const OWNER_PACK_FORMAT = 'ka-owner-pack', OWNER_PACK_VERSION = 1, OWNER_PACK_NAME = 'ka-owner-pack.json';
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function pipe(bytes, Stream) { if (!globalThis[Stream]) return null; return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new globalThis[Stream]('gzip'))).arrayBuffer()); }
async function deriveKey(pass, salt, rounds) {
  const base = await crypto.subtle.importKey('raw', enc.encode(String(pass)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptPack(pack, pass, rounds = 310000) {
  if (!pass || String(pass).length < 8) throw Error('Use a passphrase of at least 8 characters.');
  const plain = enc.encode(JSON.stringify({ ...pack, format: OWNER_PACK_FORMAT, version: OWNER_PACK_VERSION }));
  const gz = await pipe(plain, 'CompressionStream');
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass, salt, rounds), gz || plain));
  return { format: OWNER_PACK_FORMAT, version: OWNER_PACK_VERSION, encrypted: 'AES-GCM', kdf: 'PBKDF2-SHA256', rounds, gzip: !!gz, salt: b64(salt), iv: b64(iv), data: b64(ct) };
}
export const isPackEnvelope = x => x?.format === OWNER_PACK_FORMAT && x.encrypted === 'AES-GCM' && typeof x.data === 'string';
export async function decryptPack(env, pass) {
  if (!isPackEnvelope(env)) throw Error('This is not a Prvlar owner pack.');
  let pt;
  try { pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv) }, await deriveKey(pass, unb64(env.salt), env.rounds || 310000), unb64(env.data))); }
  catch { throw Error('Wrong owner-pack passphrase, or the pack is damaged.'); }
  if (env.gzip) { const u = await pipe(pt, 'DecompressionStream'); if (!u) throw Error('This device cannot unpack the owner pack.'); pt = u; }
  const pack = JSON.parse(dec.decode(pt));
  if (pack.format !== OWNER_PACK_FORMAT || typeof pack.module !== 'string') throw Error('The owner pack is incomplete.');
  return pack;
}

// Secure storage for the passphrase. Tests pass a memory store.
export function memoryStore() { const m = new Map(); return { get: async k => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); }, del: async k => { m.delete(k); } }; }
export function webSecureStore(dbName = 'ka-secure') {
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open(dbName, 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, f) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', mode), q = f(t.objectStore('kv')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
  const wrapKey = async () => { let k = await tx('readonly', s => s.get('__wrap')); if (!k) { k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await tx('readwrite', s => s.put(k, '__wrap')); } return k; };
  return {
    async get(k) { const v = await tx('readonly', s => s.get(k)); if (!v) return null; try { return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: v.iv }, await wrapKey(), v.ct)); } catch { return null; } },
    async set(k, val) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await wrapKey(), enc.encode(val)); await tx('readwrite', s => s.put({ iv, ct }, k)); },
    async del(k) { await tx('readwrite', s => s.delete(k)); }
  };
}
export function nativeSecureStore(plugin) {
  return { get: async k => (await plugin.get({ key: k }))?.value ?? null, set: (k, v) => plugin.set({ key: k, value: v }), del: k => plugin.remove({ key: k }) };
}

// Turn the pack's module source into a live module. Browsers: a Blob URL; Node (tests): a data: URL.
export async function importModule(code) {
  if (typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined' && globalThis.document) {
    const u = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try { return await import(/* @vite-ignore */ u); } finally { URL.revokeObjectURL(u); }
  }
  return import(/* @vite-ignore */ 'data:text/javascript;base64,' + b64(enc.encode(code)));
}

// The controller. deps: { cache: { get, set, del } (encrypted envelope), secure, remote: { download(), upload(env) }, isOwner(email), importModule, ctx }
const PASS_KEY = 'owner-pack-pass';
export function ownerPackController(deps) {
  let active = null;
  const S = { status: 'off', error: '', version: '', built: 0 };
  const set = p => Object.assign(S, p);
  async function load(env, pass) {
    const pack = await decryptPack(env, pass);
    const mod = await (deps.importModule || importModule)(pack.module);
    if (typeof mod.activate !== 'function') throw Error('The owner pack has no activate().');
    const handle = (await mod.activate(deps.ctx, pack)) || {};
    active = { handle, pack };
    set({ status: 'on', error: '', version: pack.packVersion || '', built: pack.built || 0 });
    return pack;
  }
  return {
    status: () => ({ ...S }),
    isActive: () => !!active,
    // Called after sign-in and at boot. Owner → activate from cache or Drive. Non-owner/signed out → remove everything.
    async sync(email, { passphrase, interactive = false, preferRemote = false } = {}) {
      if (!email || !(await deps.isOwner(email))) { await this.remove(); return { ok: false, reason: 'not-owner' }; }
      let pass = passphrase || await deps.secure.get(PASS_KEY);
      let env = preferRemote ? null : await deps.cache.get();
      if (!env && deps.remote) { try { env = await deps.remote.download(); } catch (e) { set({ status: 'error', error: e.message }); } if (env) await deps.cache.set(env); }
      if (!env) { set({ status: active ? 'on' : 'missing', error: S.error || 'No owner pack in your Drive yet. Upload one from the Developer panel.' }); return { ok: false, reason: 'missing' }; }
      if (!pass) { set({ status: 'locked', error: '' }); return { ok: false, reason: 'locked' }; }
      if (active) return { ok: true, already: true };
      try { await load(env, pass); if (passphrase) await deps.secure.set(PASS_KEY, passphrase); return { ok: true }; }
      catch (e) { set({ status: 'locked', error: e.message }); if (!passphrase) await deps.secure.del(PASS_KEY); if (interactive) throw e; return { ok: false, reason: 'bad-pass' }; }
    },
    // Owner installs a pack from a file: checks the passphrase, uploads to their Drive, caches and activates.
    // upload: false = this device only (no Drive needed). A failed Drive upload still installs locally (driveError says why).
    async install(env, passphrase, { upload = true } = {}) {
      await decryptPack(env, passphrase);
      let driveError = '';
      if (upload && deps.remote) { try { await deps.remote.upload(env); } catch (e) { driveError = e.message || 'Drive upload failed.'; } }
      await deps.cache.set(env); await deps.secure.set(PASS_KEY, passphrase);
      if (active) await this.deactivate();
      await load(env, passphrase); return { ...this.status(), driveError };
    },
    async deactivate() { const a = active; active = null; if (a?.handle?.deactivate) await a.handle.deactivate(); set({ status: 'off', error: '' }); },
    async remove() { await this.deactivate(); await deps.cache.del(); await deps.secure.del(PASS_KEY); }
  };
}
