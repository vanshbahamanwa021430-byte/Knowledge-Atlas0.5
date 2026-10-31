import Dexie from 'dexie';

export const db = new Dexie('knowledge-atlas-personal-v2');
db.version(1).stores({ documents: 'id,created', attempts: 'id,documentId,submittedAt', settings: 'key' });
// 0.7: flashcards (spaced repetition), study sessions (minutes per document and day), planner items (exams and to-dos)
// and daily activity counters. Only new tables are added, so existing documents, results and settings stay as they are.
db.version(2).stores({
  documents: 'id,created', attempts: 'id,documentId,submittedAt', settings: 'key',
  cards: 'id,documentId,due', sessions: 'id,documentId,day', plans: 'id,kind,date', days: 'day'
});
// 0.9: exam profiles made on this device (Custom exam and End Sem). Built-in profiles ship with the app.
db.version(3).stores({
  documents: 'id,created', attempts: 'id,documentId,submittedAt', settings: 'key',
  cards: 'id,documentId,due', sessions: 'id,documentId,day', plans: 'id,kind,date', days: 'day', profiles: 'id,kind'
});
// 0.9.5: Smarty learner memory (one trace per tutor chat, practice round or test).
db.version(4).stores({
  documents: 'id,created', attempts: 'id,documentId,submittedAt', settings: 'key',
  cards: 'id,documentId,due', sessions: 'id,documentId,day', plans: 'id,kind,date', days: 'day', profiles: 'id,kind', traces: 'id,kind,at'
});
// 0.9.5: binary blobs (original PDFs for page pictures).
db.version(5).stores({
  documents: 'id,created', attempts: 'id,documentId,submittedAt', settings: 'key',
  cards: 'id,documentId,due', sessions: 'id,documentId,day', plans: 'id,kind,date', days: 'day', profiles: 'id,kind', traces: 'id,kind,at', blobs: 'id'
});
// 0.9.5: deletions remembered for cloud sync (tombstones), so a delete on one device removes it on the others.
db.version(6).stores({
  documents: 'id,created', attempts: 'id,documentId,submittedAt', settings: 'key',
  cards: 'id,documentId,due', sessions: 'id,documentId,day', plans: 'id,kind,date', days: 'day', profiles: 'id,kind', traces: 'id,kind,at', blobs: 'id', tombs: 'id,t'
});
// Every change is stamped with _u (last-writer-wins merge); every delete leaves a tombstone. Sync applies its own
// changes with SYNC_APPLY set, so they keep the remote stamp.
export const SYNCED = ['documents', 'attempts', 'settings', 'cards', 'sessions', 'plans', 'days', 'profiles', 'traces'];
export const syncFlags = { applying: false, onChange: null };
const KEY = { settings: 'key', days: 'day' };
for (const t of SYNCED) {
  const tb = db.table(t);
  tb.hook('creating', function (pk, obj) { if (!syncFlags.applying) { obj._u = Date.now(); this.onsuccess = () => syncFlags.onChange?.(t); } });
  tb.hook('updating', function (mods) { if (!syncFlags.applying) { this.onsuccess = () => syncFlags.onChange?.(t); return { _u: Date.now() }; } });
  tb.hook('deleting', function (pk) { if (!syncFlags.applying) { const at = Date.now(); this.onsuccess = () => { db.tombs.put({ id: `${t}:${pk}`, t, k: String(pk), at }).catch(() => {}); syncFlags.onChange?.(t); }; } });
}
export async function syncLocalTables() {
  const tables = {}, tombs = await db.tombs.toArray();
  for (const t of SYNCED) tables[t] = { rows: await db.table(t).toArray(), tombs: Object.fromEntries(tombs.filter(x => x.t === t).map(x => [x.k, x.at])) };
  return tables;
}
export async function applySyncDiff(put, del, tombs) {
  syncFlags.applying = true;
  try {
    await db.transaction('rw', [...SYNCED.map(t => db.table(t)), db.tombs], async () => {
      for (const t of SYNCED) { if (put[t]?.length) await db.table(t).bulkPut(put[t]); if (del[t]?.length) await db.table(t).bulkDelete(del[t].map(k => KEY[t] === 'day' || KEY[t] === 'key' ? k : k)); }
      for (const t of SYNCED) for (const [k, at] of Object.entries(tombs[t] || {})) await db.tombs.put({ id: `${t}:${k}`, t, k, at });
    });
  } finally { syncFlags.applying = false; }
}
export const listBlobIds = async () => (await db.blobs.toCollection().primaryKeys()).map(String);
export const SECRET_PREFS = ['ka-key', 'ka-ai', 'ka-runner'];
export { readPref };
export const saveBlob = (id, data) => db.blobs.put({ id, data });
export const getBlob = async id => (await db.blobs.get(id))?.data;
export const deleteBlob = id => db.blobs.delete(id);
export const EXTRA_TABLES = ['cards', 'sessions', 'plans', 'days', 'profiles', 'traces'];
export const getTraces = () => db.traces.toArray();
export const saveTrace = t => db.traces.put(t);
export const clearTraces = () => db.traces.clear();
export const getProfiles = () => db.profiles.toArray();
export const saveProfile = p => db.profiles.put(p);
export const deleteProfile = id => db.profiles.delete(id);
// Small preferences kept in localStorage that belong in a backup (never the AI key).
export const BACKUP_PREFS = [   // the owner pack may push its own keys
 'ka-theme', 'ka-goals', 'ka-focus', 'ka-reading', 'ka-remind', 'ka-autocards', 'ka-exam-pick', 'ka-uni-me', 'ka-name', 'ka-uisize', 'ka-stream', 'ka-code', 'ka-docs-only', 'ka-onboarded', 'ka-owners', 'ka-flags',
];

// Ask the browser not to evict our data under storage pressure (important on Android).
export async function requestPersistence() { try { return await navigator.storage?.persist?.(); } catch { return false; } }

export async function saveDocument(doc) { await db.documents.put(doc); }
export async function getDocuments() { return db.documents.orderBy('created').reverse().toArray(); }
export async function saveAttempt(attempt) { await db.attempts.put(attempt); }
// All attempts (newest first), or only those of one document.
export async function getAttempts(documentId) {
  const rows = documentId ? await db.attempts.where('documentId').equals(documentId).toArray() : await db.attempts.toArray();
  return rows.sort((a, b) => b.submittedAt - a.submittedAt);
}
export async function getSetting(key) { return (await db.settings.get(key))?.value; }
export async function setSetting(key, value) { await db.settings.put({ key, value }); }

/* ---------- flashcards, sessions, planner, daily counters ---------- */
export const getCards = () => db.cards.toArray();
export const saveCards = cards => db.cards.bulkPut(cards);
export const deleteCard = id => db.cards.delete(id);
export const getSessions = () => db.sessions.toArray();
export const saveSession = s => db.sessions.put(s);
export const getPlans = () => db.plans.toArray();
export const savePlan = p => db.plans.put(p);
export const deletePlan = id => db.plans.delete(id);
export const getDays = () => db.days.toArray();
// Adds to today's counters, e.g. bumpDay('2026-10-29', { reviews: 1, correct: 1 }).
export async function bumpDay(day, add) {
  await db.transaction('rw', db.days, async () => {
    const row = (await db.days.get(day)) || { day };
    for (const [k, v] of Object.entries(add)) row[k] = (row[k] || 0) + v;
    await db.days.put(row);
  });
}

const readLocal = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } };
const readPref = k => { try { const v = localStorage.getItem(k); return v === null ? undefined : JSON.parse(v); } catch { return undefined; } };

// Backup format 3 adds exam profiles; format 2 added flashcards, study sessions, planner items, daily counters and preferences.
// Format 1 backups (0.6 and earlier) still restore: the new parts are simply absent.
export async function exportAll() {
  const prefs = {};
  for (const k of BACKUP_PREFS) { const v = readPref(k); if (v !== undefined) prefs[k] = v; }
  return {
    format: 'knowledge-atlas-backup', version: 3, exported: Date.now(),
    documents: await db.documents.toArray(), attempts: await db.attempts.toArray(), settings: (await db.settings.toArray())
      .filter(s => !/^(pack-|ownerPack)/.test(s.key)),   // owner-pack data is re-downloadable, large and private
    notes: readLocal('ka-notes'), visited: readLocal('ka-visited'),
    cards: await db.cards.toArray(), sessions: await db.sessions.toArray(), plans: await db.plans.toArray(), days: await db.days.toArray(), profiles: await db.profiles.toArray(), prefs
  };
}

export async function importAll(data) {
  if (!data || data.format !== 'knowledge-atlas-backup' || !Array.isArray(data.documents)) throw Error('This is not a Knowledge Atlas backup file.');
  const list = k => (Array.isArray(data[k]) ? data[k] : []);
  await db.transaction('rw', [db.documents, db.attempts, db.settings, db.cards, db.sessions, db.plans, db.days, db.profiles], async () => {
    await db.documents.bulkPut(data.documents.filter(d => d && d.id && Array.isArray(d.sections)));
    await db.attempts.bulkPut(list('attempts').filter(a => a && a.id));
    await db.settings.bulkPut(list('settings').filter(s => s && s.key));
    await db.cards.bulkPut(list('cards').filter(c => c && c.id && c.front && c.back));
    await db.sessions.bulkPut(list('sessions').filter(s => s && s.id && s.day));
    await db.plans.bulkPut(list('plans').filter(p => p && p.id && p.kind));
    await db.profiles.bulkPut(list('profiles').filter(p => p && p.id && p.schema === 'ka-exam-profile' && p.pattern));
    // Daily counters: keep the larger value of each counter, so restoring twice doesn't double them.
    for (const d of list('days').filter(d => d && d.day)) {
      const have = (await db.days.get(d.day)) || { day: d.day };
      for (const [k, v] of Object.entries(d)) if (k !== 'day' && typeof v === 'number') have[k] = Math.max(have[k] || 0, v);
      await db.days.put(have);
    }
  });
  localStorage.setItem('ka-notes', JSON.stringify({ ...readLocal('ka-notes'), ...(data.notes || {}) }));
  // Sections already studied: merge both lists per document.
  const visited = readLocal('ka-visited');
  for (const [id, list] of Object.entries(data.visited || {})) if (Array.isArray(list)) visited[id] = [...new Set([...(visited[id] || []), ...list])];
  localStorage.setItem('ka-visited', JSON.stringify(visited));
  if (data.prefs && typeof data.prefs === 'object') for (const k of BACKUP_PREFS) if (k in data.prefs) localStorage.setItem(k, JSON.stringify(data.prefs[k]));
}
