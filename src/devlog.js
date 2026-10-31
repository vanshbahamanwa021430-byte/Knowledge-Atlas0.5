// Owner mode + developer tools data. Owner mode is a CONVENIENCE switch, not security: anyone with the source or
// a debugger can turn it on. It only unlocks harmless diagnostics; nothing legally sensitive is gated behind it.
// The owner is recognised by the SHA-256 of the Google account email, so no address is stored in the app.
export const OWNER_HASHES = ['0956f72b9bd526ea127273cde3f42675158de98011a7e157c4110e9b0c1b349d'];
export async function sha256Hex(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export const normEmail = e => String(e || '').trim().toLowerCase();
// Extra owners added in the Developer panel: stored as hashes in 'ka-owners' (synced with the owner's own Drive).
export function addedOwners(store = globalThis.localStorage) { try { const a = JSON.parse(store.getItem('ka-owners') || '[]'); return Array.isArray(a) ? a.filter(h => /^[0-9a-f]{64}$/.test(h)) : []; } catch { return []; } }
export const ownerHashes = store => [...new Set([...OWNER_HASHES, ...addedOwners(store)])];
export async function isOwnerEmail(email, store = globalThis.localStorage) { const e = normEmail(email); return !!e && ownerHashes(store).includes(await sha256Hex(e)); }
export const isGmail = e => /^[a-z0-9.+_-]+@(gmail|googlemail)\.com$/.test(normEmail(e));
export async function addOwner(email, store = globalThis.localStorage) {
  if (!isGmail(email)) throw Error('Enter a Gmail address.');
  const h = await sha256Hex(normEmail(email)), list = addedOwners(store);
  if (!OWNER_HASHES.includes(h) && !list.includes(h)) store.setItem('ka-owners', JSON.stringify([...list, h]));
  return h;
}
export function removeOwner(hash, store = globalThis.localStorage) {
  if (OWNER_HASHES.includes(hash)) throw Error('Built-in owners can only be removed in the code (see docs/owner-mode.md).');
  store.setItem('ka-owners', JSON.stringify(addedOwners(store).filter(h => h !== hash)));
}

// Masks anything that looks like a credential before it is shown or exported.
export function maskSecrets(v) {
  if (v == null) return v;
  if (typeof v === 'string') return v
    .replace(/([?&](?:key|api_key|apikey|token|access_token)=)[^&\s"]+/gi, '$1•••')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{6,}/g, '$1•••')
    .replace(/\b(AIza[0-9A-Za-z_-]{4})[0-9A-Za-z_-]{10,}/g, '$1•••')
    .replace(/\b((?:sk|gsk|xai|ya29)[-_.][A-Za-z0-9]{2})[A-Za-z0-9._-]{8,}/g, '$1•••');
  if (Array.isArray(v)) return v.map(maskSecrets);
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, /^(authorization|x-api-key|api-key|x-goog-api-key|x-auth-token|x-rapidapi-key|key|apikey|token|password|secret)$/i.test(k) ? '•••' : maskSecrets(x)]));
  return v;
}
// Small ring buffers kept in memory (logs, AI requests) and in localStorage (crashes).
export function ring(max) { const a = []; return { push(x) { a.push(x); if (a.length > max) a.splice(0, a.length - max); return x; }, all: () => a.slice(), clear() { a.length = 0; } }; }
export const logs = ring(300), requests = ring(60);
export const perf = { renders: 0, renderMs: 0, slowest: 0 };
export function recordRender(ms) { perf.renders++; perf.renderMs += ms; perf.slowest = Math.max(perf.slowest, ms); }
export function recordRequest({ url, headers, body, status, ms, error, chars }) {
  let model = ''; try { model = JSON.parse(body || '{}').model || ''; } catch { /* not JSON */ }
  return requests.push({ at: Date.now(), url: maskSecrets(String(url || '')), headers: maskSecrets(headers || {}), model, status: status ?? null, ms: Math.round(ms || 0), error: error ? maskSecrets(String(error)).slice(0, 300) : '', bytes: (body || '').length, chars: chars || 0, preview: maskSecrets(String(body || '').slice(0, 600)) });
}
const CRASH_KEY = 'ka-crashlog';
export function crashes(store = globalThis.localStorage) { try { return JSON.parse(store.getItem(CRASH_KEY) || '[]'); } catch { return []; } }
export function recordCrash(err, store = globalThis.localStorage) {
  const list = [...crashes(store), { at: Date.now(), msg: maskSecrets(String(err?.message || err)).slice(0, 500), stack: maskSecrets(String(err?.stack || '')).slice(0, 1500) }].slice(-30);
  try { store.setItem(CRASH_KEY, JSON.stringify(list)); } catch { /* full */ } return list;
}
export const clearCrashes = (store = globalThis.localStorage) => store.removeItem(CRASH_KEY);
// Preview feature flags (owner-only toggles for unfinished UI). Unknown names are ignored.
export const FLAGS = [['verbose-ai', 'Log full AI prompts in the request inspector'], ['show-render-time', 'Show render time in the corner'], ['preview-compact-home', 'Preview: compact Home dashboard']];
export function flags(store = globalThis.localStorage) { try { const f = JSON.parse(store.getItem('ka-flags') || '{}'); return Object.fromEntries(FLAGS.map(([k]) => [k, f[k] === true])); } catch { return {}; } }
export function setFlag(name, on, store = globalThis.localStorage) { if (!FLAGS.some(f => f[0] === name)) return flags(store); const f = { ...flags(store), [name]: !!on }; store.setItem('ka-flags', JSON.stringify(f)); return f; }
export function installLogCapture(target = globalThis) {
  if (target.__kaLog) return; target.__kaLog = true;
  for (const lvl of ['log', 'info', 'warn', 'error']) { const orig = console[lvl].bind(console); console[lvl] = (...a) => { logs.push({ at: Date.now(), lvl, msg: maskSecrets(a.map(x => typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })()).join(' ')).slice(0, 800) }); orig(...a); }; }
  target.addEventListener?.('error', e => recordCrash(e.error || e.message));
  target.addEventListener?.('unhandledrejection', e => recordCrash(e.reason));
}
