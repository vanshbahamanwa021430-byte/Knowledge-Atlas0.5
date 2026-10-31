// Optional Google sign-in + sync to the user's own Drive appDataFolder. The app works fully without it.
// Android: our GoogleDrive Capacitor plugin (Google Authorization API). Web: Google Identity Services token client.
// Client IDs are build-time config (VITE_GOOGLE_WEB_CLIENT_ID, VITE_GOOGLE_ANDROID=1); without them the option is hidden.
import { registerPlugin } from '@capacitor/core';
import { platform } from './platform.js';
import { normalizePrefs } from './migrate.js';
import { drive, syncRound, diffForLocal, SYNC_FORMAT, SYNC_VERSION, DriveError, hasDriveScope } from './sync.js';
import { syncLocalTables, applySyncDiff, syncFlags, BACKUP_PREFS, SECRET_PREFS, readPref, getBlob, saveBlob, listBlobIds } from './storage.js';

export const SCOPES = ['https://www.googleapis.com/auth/drive.appdata', 'openid', 'email', 'profile'];
const env = import.meta.env || {};
export const WEB_CLIENT_ID = String(env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim();
const ANDROID_ON = String(env.VITE_GOOGLE_ANDROID || '') === '1';
const desktop = () => !!globalThis.window?.atlasNative?.googleToken;
export const cloudAvailable = () => platform() === 'android' ? ANDROID_ON : platform() === 'ios' ? false /* needs a native iOS sign-in plugin: see docs/ios.md */ : platform() === 'web' ? !!WEB_CLIENT_ID && (location.protocol === 'https:' || location.hostname === 'localhost' || desktop()) : false;
const GoogleDrive = registerPlugin('GoogleDrive');

const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };
export const account = () => read('prvlar-sync-account', null);          // { email, name, picture } — no tokens stored
export const syncStatus = () => read('prvlar-sync-status', { at: 0, size: 0, error: '', conflicts: 0 });
export const syncPrefs = () => read('prvlar-sync-prefs', { auto: true, encrypt: false, keys: false });
export const setSyncPrefs = p => write('prvlar-sync-prefs', { ...syncPrefs(), ...p });
let token = null, tokenExp = 0, passphrase = '';
export const setPassphrase = p => { passphrase = String(p || ''); };
export const hasPassphrase = () => !!passphrase;

let gis = null;
const loadGis = () => (gis ??= new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => res(window.google); s.onerror = () => { gis = null; rej(Error('Could not load Google sign-in. Check your connection.')); }; document.head.append(s); }));
const DRIVE_SCOPE = SCOPES[0];
const scopeError = (tok = '') => Object.assign(Error('Allow Drive access to sync. Google did not give Prvlar permission to use its app folder in your Drive.'), { reason: 'scope', token: tok });
async function getToken(interactive, consent = false) {
  if (!consent && token && Date.now() < tokenExp - 60000) return token;
  if (platform() === 'android') {
    const r = await GoogleDrive.authorize({ scopes: SCOPES, silent: !interactive });
    if (r.scopes && !hasDriveScope(r.scopes)) throw scopeError(r.accessToken);
    token = r.accessToken; tokenExp = Date.now() + 50 * 60000; return token;
  }
  if (desktop()) {
    if (!interactive && !token) throw Object.assign(Error('Sign-in needed'), { code: 'NEEDS_UI' });
    const r = await window.atlasNative.googleToken(WEB_CLIENT_ID, SCOPES.join(' '), consent);
    if (r?.error) throw Error(r.error === 'access_denied' ? 'Sign-in was cancelled.' : 'Google sign-in failed: ' + r.error);
    if (r.scope && !hasDriveScope(r.scope)) throw scopeError(r.access_token);
    token = r.access_token; tokenExp = Date.now() + r.expires_in * 1000; return token;
  }
  const g = await loadGis();
  return new Promise((res, rej) => {
    const c = g.accounts.oauth2.initTokenClient({ client_id: WEB_CLIENT_ID, scope: SCOPES.join(' '), prompt: consent ? 'consent' : interactive ? '' : 'none', hint: account()?.email, include_granted_scopes: true,
      callback: r => { if (r.error) return rej(Error(r.error === 'access_denied' ? 'Sign-in was cancelled.' : 'Google sign-in failed: ' + r.error)); if (!g.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)) return rej(scopeError(r.access_token)); token = r.access_token; tokenExp = Date.now() + (Number(r.expires_in) || 3600) * 1000; res(token); },
      error_callback: e => rej(Error(e?.type === 'popup_closed' ? 'Sign-in was cancelled.' : 'Google sign-in failed.')) });
    c.requestAccessToken();
  });
}
// A Drive client for the signed-in account (appDataFolder only). Used by sync and the owner pack.
export async function driveClient(interactive = false) { return drive(await getToken(interactive)); }
// Ask Google again for Drive (app folder) access, showing the consent screen.
export async function grantDrive() { token = null; tokenExp = 0; await getToken(true, true); setStatus({ error: '', reason: '' }); }
export async function signIn() {
  let t; try { t = await getToken(true); } catch (e) { if (e.reason !== 'scope') throw e; t = e.token; setStatus({ error: e.message, reason: 'scope' }); }
  const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${t}` } });
  const u = r.ok ? await r.json() : {};
  write('prvlar-sync-account', { email: u.email || '', name: u.name || '', picture: u.picture || '' });
  return account();
}
export function signOut() {
  if (token && platform() === 'web') try { window.google?.accounts?.oauth2?.revoke(token, () => {}); } catch { /* ignore */ }
  token = null; tokenExp = 0; passphrase = '';
  localStorage.removeItem('prvlar-sync-account'); localStorage.removeItem('prvlar-sync-status');
}

// Local snapshot. Preferences carry a change time so the newest edit wins; secrets only if the user opted in AND encrypts.
function prefsSnapshot(withSecrets) {
  const last = read('prvlar-sync-prefseen', {}), out = {}, now = Date.now();
  const keys = [...BACKUP_PREFS, 'prvlar-notes', 'prvlar-visited', ...(withSecrets ? SECRET_PREFS : [])];
  for (const k of keys) { const v = readPref(k); if (v === undefined) continue; const s = JSON.stringify(v); const u = last[k]?.s === s ? last[k].u : now; out[k] = { v, u }; last[k] = { s, u }; }
  write('prvlar-sync-prefseen', last); return out;
}
export async function localSnapshot() {
  const p = syncPrefs();
  return { format: SYNC_FORMAT, version: SYNC_VERSION, at: Date.now(), tables: await syncLocalTables(), prefs: prefsSnapshot(p.keys && p.encrypt) };
}
let running = null;
export function syncNow(opts = {}) { return (running ??= doSync(opts).finally(() => { running = null; })); }
async function doSync({ interactive = false } = {}) {
  if (!account()) return syncStatus();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return setStatus({ error: 'Offline — will sync when you are back online.' });
  const p = syncPrefs();
  if (p.encrypt && !passphrase) return setStatus({ error: 'Enter your sync passphrase to sync.' });
  try {
    const d = drive(await getToken(interactive));
    const local = await localSnapshot();
    const { merged, size } = await syncRound(d, local, { pass: p.encrypt ? passphrase : '' });
    const { put, del } = diffForLocal(local, merged);
    const tombs = Object.fromEntries(Object.entries(merged.tables).map(([t, v]) => [t, v.tombs]));
    await applySyncDiff(put, del, tombs);
    const known = [...BACKUP_PREFS, 'prvlar-notes', 'prvlar-visited', ...SECRET_PREFS];
    merged.prefs = Object.fromEntries(Object.entries(normalizePrefs(Object.fromEntries(Object.entries(merged.prefs || {}).map(([k, x]) => [k, x])), known)));
    for (const [k, { v }] of Object.entries(merged.prefs || {})) if (!(p.keys && p.encrypt) && SECRET_PREFS.includes(k)) continue; else write(k, v);
    prefsSnapshot(p.keys && p.encrypt);
    const blobBytes = await syncBlobs(d);
    return setStatus({ at: Date.now(), size: size + blobBytes, error: '', reason: '', conflicts: merged.conflicts.length, changed: Object.values(put).reduce((a, x) => a + x.length, 0) + Object.values(del).reduce((a, x) => a + x.length, 0) });
  } catch (e) {
    if (e instanceof DriveError && e.status === 401) { token = null; }
    if (e?.reason === 'scope') { token = null; return setStatus({ error: e.message, reason: 'scope' }); }
    if (e?.code === 'NEEDS_UI' || /NEEDS_UI|Sign-in needed/.test(e?.message || '')) return setStatus({ error: 'Tap “Sync now” to confirm your Google account.' });
    return setStatus({ error: e.message || 'Sync failed.', reason: e?.reason || '' });
  }
}
// Original PDFs (page pictures) are immutable: upload the ones the cloud lacks, download the ones this device lacks.
async function syncBlobs(d) {
  const files = await d.listAll(), cloud = new Map(files.filter(f => f.name.startsWith('blob-')).map(f => [f.name.slice(5, -5), f])), mine = await listBlobIds();
  let bytes = files.reduce((a, f) => a + Number(f.size || 0), 0);
  for (const id of mine) if (!cloud.has(id)) { const b = await getBlob(id); if (!b) continue; const u8 = b instanceof Uint8Array ? b : new Uint8Array(b); if (u8.length > 25e6) continue; let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); const r = await d.create(`blob-${id}.json`, { id, b64: btoa(s) }); bytes += Number(r?.size || s.length); }
  for (const [id, f] of cloud) if (!mine.includes(id)) { const j = await d.read(f.id); if (j?.b64) await saveBlob(id, Uint8Array.from(atob(j.b64), c => c.charCodeAt(0))); }
  return bytes;
}
function setStatus(s) { const v = { ...syncStatus(), ...s }; write('prvlar-sync-status', v); listeners.forEach(f => f(v)); return v; }
const listeners = new Set();
export const onSyncStatus = f => listeners.add(f);
export async function deleteCloudData() {
  const d = drive(await getToken(true)); const files = await d.listAll();
  for (const f of files) if (!/^(prvlar|ka)-owner-pack\.json$/.test(f.name)) await d.remove(f.id);   // the owner pack is not sync data
  setStatus({ at: 0, size: 0, error: '', conflicts: 0 }); return files.length;
}
// Auto sync: on open, a few seconds after a change, every 10 minutes while online, and when coming back online.
let timer = null, started = false;
export function startAutoSync() {
  if (started) return; started = true;
  const kick = (ms = 4000) => { if (!account() || !syncPrefs().auto) return; clearTimeout(timer); timer = setTimeout(() => syncNow().catch(() => {}), ms); };
  syncFlags.onChange = () => kick(5000);
  addEventListener('online', () => kick(1000));
  setInterval(() => { if (navigator.onLine !== false) kick(0); }, 10 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') kick(0); });
  kick(2500);
}
