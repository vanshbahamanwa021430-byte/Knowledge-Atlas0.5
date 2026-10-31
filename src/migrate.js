// 0.9.8 rename (Knowledge Atlas → Prvlar): settings moved from 'ka-*' to 'prvlar-*' keys.
// Runs first, before any module reads settings. Old keys are copied (not deleted), so nothing is lost and a
// downgrade still finds them. Pure helpers are exported for tests.
export const LEGACY_PREFIX = 'ka-', PREFIX = 'prvlar-';
export const newKey = k => k.startsWith(LEGACY_PREFIX) ? PREFIX + k.slice(LEGACY_PREFIX.length) : k;
export function migrateStore(store) {
  if (!store) return 0;
  let n = 0;
  try {
    const keys = []; for (let i = 0; i < store.length; i++) keys.push(store.key(i));
    for (const k of keys) if (k && k.startsWith(LEGACY_PREFIX) && store.getItem(newKey(k)) === null) { store.setItem(newKey(k), store.getItem(k)); n++; }
    if (n) store.setItem('prvlar-migrated', JSON.stringify({ from: 'knowledge-atlas', keys: n, at: Date.now() }));
  } catch { /* storage unavailable */ }
  return n;
}
// Snapshot/backup prefs from older versions use 'ka-*' names: map the ones this app knows.
export function normalizePrefs(prefs, known) {
  if (!prefs || typeof prefs !== 'object') return prefs;
  const out = {};
  for (const [k, v] of Object.entries(prefs)) { const nk = newKey(k); if (nk !== k && known.includes(nk)) { if (!(nk in prefs)) out[nk] = v; } else out[k] = v; }
  return out;
}
migrateStore(globalThis.localStorage);
