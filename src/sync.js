// Cloud sync to the user's OWN Google Drive (appDataFolder, scope drive.appdata). No server of ours is involved.
// Pure, unit-tested parts: record merging (last writer wins, tombstones for deletes), snapshot encryption
// (AES-GCM, key from a passphrase with PBKDF2) and a small Drive v3 REST client.
// 0.9.8 rename: new files are Prvlar-named; the old Knowledge Atlas snapshot is still read (and its format accepted).
export const SYNC_FORMAT = 'prvlar-sync', LEGACY_SYNC_FORMAT = 'knowledge-atlas-sync', SYNC_VERSION = 1, SNAPSHOT_NAME = 'prvlar-sync.json', LEGACY_SNAPSHOT_NAME = 'knowledge-atlas-sync.json';
export const SYNC_TABLES = ['documents', 'attempts', 'settings', 'cards', 'sessions', 'plans', 'days', 'profiles', 'traces'];
export const TABLE_KEY = { settings: 'key', days: 'day' };
// Settings rows that never leave the device (AI keys, big re-downloadable caches, sync's own state).
export const LOCAL_ONLY_SETTINGS = /^(pack-|ownerPack|sync-|ai-key|api-key)/i;
export const keyOf = (table, r) => r?.[TABLE_KEY[table] || 'id'];
export const stamp = r => Number(r?._u || r?.updatedAt || r?.updated || r?.submittedAt || r?.created || r?.at || 0);

// Merges two sides of one table. Each side: { rows: [record], tombs: { key: deletedAt } }.
// Newest change wins; a delete wins over an older edit and loses to a newer one. Equal times: keep local.
export function mergeTable(table, local = {}, remote = {}) {
  const rows = new Map(), tombs = { ...(remote.tombs || {}) };
  for (const [k, t] of Object.entries(local.tombs || {})) tombs[k] = Math.max(t, tombs[k] || 0);
  const put = (r, side) => { const k = keyOf(table, r); if (k == null) return; const have = rows.get(String(k)); if (!have || stamp(r) > stamp(have.r) || (stamp(r) === stamp(have.r) && side === 'local')) rows.set(String(k), { r, side }); };
  for (const r of remote.rows || []) put(r, 'remote');
  for (const r of local.rows || []) put(r, 'local');
  const conflicts = [];
  for (const [k, { r }] of rows) {
    if (tombs[k] != null) { if (tombs[k] >= stamp(r)) { rows.delete(k); continue; } delete tombs[k]; }
    const l = (local.rows || []).find(x => String(keyOf(table, x)) === k), o = (remote.rows || []).find(x => String(keyOf(table, x)) === k);
    if (l && o && stamp(l) !== stamp(o) && JSON.stringify(l) !== JSON.stringify(o)) conflicts.push({ table, key: k, kept: stamp(l) > stamp(o) ? 'local' : 'remote' });
  }
  return { rows: [...rows.values()].map(x => x.r), tombs, conflicts };
}
export function mergeSnapshots(local, remote) {
  const out = { format: SYNC_FORMAT, version: SYNC_VERSION, tables: {}, prefs: {}, conflicts: [] };
  for (const t of SYNC_TABLES) { const m = mergeTable(t, local?.tables?.[t], remote?.tables?.[t]); out.tables[t] = { rows: m.rows, tombs: m.tombs }; out.conflicts.push(...m.conflicts); }
  const lp = local?.prefs || {}, rp = remote?.prefs || {};
  for (const k of new Set([...Object.keys(lp), ...Object.keys(rp)])) out.prefs[k] = !(k in rp) || (k in lp && (lp[k].u || 0) >= (rp[k].u || 0)) ? lp[k] : rp[k];
  out.at = Math.max(local?.at || 0, remote?.at || 0);
  return out;
}
// What changed locally compared with the merged result (to write back to Dexie).
export function diffForLocal(local, merged) {
  const put = {}, del = {};
  for (const t of SYNC_TABLES) {
    const have = new Map((local?.tables?.[t]?.rows || []).map(r => [String(keyOf(t, r)), r]));
    put[t] = merged.tables[t].rows.filter(r => { const h = have.get(String(keyOf(t, r))); return !h || stamp(h) !== stamp(r) || JSON.stringify(h) !== JSON.stringify(r); });
    const keep = new Set(merged.tables[t].rows.map(r => String(keyOf(t, r))));
    del[t] = [...have.keys()].filter(k => !keep.has(k));
  }
  return { put, del };
}

// ---- Encryption (optional): PBKDF2-SHA256 (210k rounds) → AES-GCM 256. ----
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u => { let s = ''; const a = new Uint8Array(u); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(pass, salt, rounds) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: rounds, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const clampRounds = r => Math.min(2000000, Math.max(1000, Number(r) || 210000));   // ECC L4: crafted files cannot hang decrypt
export async function encryptJSON(obj, pass, rounds = 600000) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass, salt, rounds), enc.encode(JSON.stringify(obj)));
  return { format: SYNC_FORMAT, encrypted: 'AES-GCM', kdf: 'PBKDF2-SHA256', rounds, salt: b64(salt), iv: b64(iv), data: b64(ct) };
}
export async function decryptJSON(box, pass) {
  try { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, await deriveKey(pass, unb64(box.salt), clampRounds(box.rounds)), unb64(box.data)); return JSON.parse(dec.decode(pt)); }
  catch { throw Error('Wrong passphrase, or the cloud copy is damaged.'); }
}
export const isEncrypted = x => !!x?.encrypted;

// ---- Drive v3 (appDataFolder only). fetchImpl is injectable for tests. ----
const API = 'https://www.googleapis.com/drive/v3', UP = 'https://www.googleapis.com/upload/drive/v3';
// Granted scopes come back space-separated; on Google's granular consent the Drive box can be left unticked.
export const DRIVE_APPDATA = 'https://www.googleapis.com/auth/drive.appdata';
export const hasDriveScope = granted => String(granted || '').split(/[\s,]+/).includes(DRIVE_APPDATA);
export class DriveError extends Error { constructor(status, msg, reason = '') { super(msg); this.status = status; this.reason = reason; } }
// Drive error bodies: { error: { code, message, errors: [{ reason }], status, details: [{ reason }] } }.
const SCOPE_REASONS = /insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientScopes|insufficient_scope/i;
const RATE_REASONS = /rateLimitExceeded|userRateLimitExceeded|RATE_LIMIT_EXCEEDED|backendError|internalError/i;
export function classifyDriveError(status, body) {
  const e = body?.error || {};
  const reasons = [...(e.errors || []).map(x => x.reason), ...(e.details || []).map(x => x.reason), e.status, typeof body?.error === 'string' ? body.error : '', e.message].filter(Boolean).join(' ');
  if (status === 401) return new DriveError(401, 'Google sign-in expired. Sign in again to sync.', 'auth');
  if (SCOPE_REASONS.test(reasons)) return new DriveError(status, 'Allow Drive access to sync. Google did not give Prvlar permission to use its app folder in your Drive.', 'scope');
  if (/storageQuotaExceeded|quotaExceeded/i.test(reasons) && !/rate/i.test(reasons)) return new DriveError(status, 'Your Google Drive storage is full. Free up space in Google Drive, then sync again.', 'quota');
  if (/accessNotConfigured|SERVICE_DISABLED/i.test(reasons)) return new DriveError(status, 'Google Drive sync is not enabled for this app yet. Please try again later.', 'disabled');
  if (status === 429 || RATE_REASONS.test(reasons) || status >= 500) return new DriveError(status, 'Google Drive is busy. Sync will retry later.', 'rate');
  if (status === 403) return new DriveError(403, `Google Drive refused the request${e.message ? ': ' + e.message : ''}.`, 'forbidden');
  return new DriveError(status, `Google Drive error ${status}.`, '');
}
export function drive(token, fetchImpl = globalThis.fetch, { retries = 3, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  const call = async (url, opt = {}) => {
    for (let attempt = 0; ; attempt++) {
      let r; try { r = await fetchImpl(url, { ...opt, headers: { Authorization: `Bearer ${token}`, ...(opt.headers || {}) } }); } catch { throw new DriveError(0, 'You are offline. Sync will retry when you are back online.', 'offline'); }
      if (r.ok || r.status === 204) return r.status === 204 ? null : r.json();
      let body = null; try { body = await r.json(); } catch { /* no JSON body */ }
      const err = classifyDriveError(r.status, body);
      if (err.reason === 'rate' && attempt < retries) { await sleep(Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250)); continue; }
      throw err;
    }
  };
  const multipart = (meta, body) => { const b = 'ka' + Math.random().toString(36).slice(2); return { headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--` }; };
  return {
    list: async (name = SNAPSHOT_NAME) => (await call(`${API}/files?spaces=appDataFolder&fields=files(id,name,size,modifiedTime)&q=${encodeURIComponent(`name='${name}'`)}`)).files || [],
    listAll: async () => (await call(`${API}/files?spaces=appDataFolder&fields=files(id,name,size,modifiedTime)&pageSize=1000`)).files || [],
    read: id => call(`${API}/files/${id}?alt=media`),
    create: (name, json) => call(`${UP}/files?uploadType=multipart&fields=id,size,modifiedTime`, { method: 'POST', ...multipart({ name, parents: ['appDataFolder'] }, JSON.stringify(json)) }),
    update: (id, json) => call(`${UP}/files/${id}?uploadType=multipart&fields=id,size,modifiedTime`, { method: 'PATCH', ...multipart({}, JSON.stringify(json)) }),
    remove: id => call(`${API}/files/${id}`, { method: 'DELETE' })
  };
}
// One sync round: read the cloud copy, merge with local, write the result back. Returns the merged snapshot.
export async function syncRound(d, local, { pass = '' } = {}) {
  const [file] = await d.list();
  const [legacy] = file ? [] : await d.list(LEGACY_SNAPSHOT_NAME).catch(() => []);
  let remote = null;
  const src = file || legacy;
  if (src) { const raw = await d.read(src.id); remote = isEncrypted(raw) ? (pass ? await decryptJSON(raw, pass) : (() => { throw Error('Your cloud copy is encrypted. Enter your sync passphrase.'); })()) : raw; }
  const merged = mergeSnapshots(local, remote);
  merged.at = Date.now();
  const out = pass ? await encryptJSON(merged, pass) : merged;
  const meta = file ? await d.update(file.id, out) : await d.create(SNAPSHOT_NAME, out);
  return { merged, size: Number(meta?.size || JSON.stringify(out).length), created: !file };
}
