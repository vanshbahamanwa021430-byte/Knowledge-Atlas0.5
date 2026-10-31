import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { db, exportAll, importAll, bumpDay } = await import('../src/storage.js');

const doc = { id: 'd1', name: 'a.md', created: 1, sections: [{ ref: 'A', text: 'x' }] };

test('a format-1 backup (0.6 and earlier) restores, and the new tables stay empty', async () => {
  await importAll({ format: 'knowledge-atlas-backup', version: 1, documents: [doc], attempts: [{ id: 'a1', documentId: 'd1', submittedAt: 2 }], settings: [{ key: 'k', value: 1 }], notes: { 'd1::s0': 'n' }, visited: { d1: ['s0'] } });
  assert.equal(await db.documents.count(), 1);
  assert.equal(await db.cards.count(), 0);
  assert.equal(JSON.parse(localStorage.getItem('ka-notes'))['d1::s0'], 'n');
});

test('format 2 round trip: cards, sessions, plans, days and preferences, never the AI key', async () => {
  localStorage.setItem('ka-key', JSON.stringify('secret')); localStorage.setItem('ka-theme', JSON.stringify('anime')); localStorage.setItem('ka-goals', JSON.stringify({ dailyMinutes: 45 }));
  await db.cards.put({ id: 'c1', documentId: 'd1', front: 'f', back: 'b', due: 1 });
  await db.plans.put({ id: 'p1', kind: 'exam', title: 'X', date: '2026-11-01' });
  await db.sessions.put({ id: 's1', documentId: 'd1', day: '2026-10-29', minutes: 25 });
  await bumpDay('2026-10-29', { reviews: 3 });
  await db.profiles.put({ id: 'custom-x', schema: 'ka-exam-profile', name: 'X', kind: 'custom', pattern: { sections: [] } });
  const b = await exportAll();
  assert.equal(b.version, 3); assert.equal(b.profiles.length, 1);
  assert.ok(!JSON.stringify(b).includes('secret'));
  assert.equal(b.prefs['ka-theme'], 'anime');
  await Promise.all(['cards', 'plans', 'sessions', 'days', 'profiles'].map(t => db[t].clear()));
  localStorage.setItem('ka-theme', JSON.stringify('light'));
  await importAll(JSON.parse(JSON.stringify(b)));
  await importAll(JSON.parse(JSON.stringify(b)));      // restoring twice doesn't double the counters
  assert.equal(await db.cards.count(), 1); assert.equal(await db.plans.count(), 1); assert.equal(await db.profiles.count(), 1);
  assert.equal((await db.days.get('2026-10-29')).reviews, 3);
  assert.equal(JSON.parse(localStorage.getItem('ka-theme')), 'anime');
});

test('rejects files that are not backups', async () => {
  await assert.rejects(importAll({ hello: 1 }), /not a Prvlar backup/);
});
