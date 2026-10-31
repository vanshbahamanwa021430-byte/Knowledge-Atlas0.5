import test from 'node:test'; import assert from 'node:assert/strict';
import { migrateStore, normalizePrefs, newKey } from '../src/migrate.js';
import { syncRound } from '../src/sync.js';
const mem = init => { const m = new Map(Object.entries(init)); return { get length() { return m.size; }, key: i => [...m.keys()][i], getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
test('old Knowledge Atlas settings are copied to Prvlar keys, never overwritten, old kept', () => {
  const s = mem({ 'ka-name': '"A"', 'ka-theme': '"dark"', 'prvlar-theme': '"light"', other: '1' });
  assert.equal(migrateStore(s), 1);
  assert.equal(s.getItem('prvlar-name'), '"A"'); assert.equal(s.getItem('prvlar-theme'), '"light"'); assert.equal(s.getItem('ka-name'), '"A"');
  assert.equal(migrateStore(s), 0);
  assert.equal(newKey('ka-x'), 'prvlar-x'); assert.equal(newKey('x'), 'x');
});
test('old snapshot/backup prefs map only known keys', () => {
  assert.deepEqual(normalizePrefs({ 'ka-theme': 'dark', 'ka-upes-me': 1, 'prvlar-name': 'B', 'ka-name': 'A' }, ['prvlar-theme', 'prvlar-name']), { 'prvlar-theme': 'dark', 'ka-upes-me': 1, 'prvlar-name': 'B' });
});
test('sync reads the old Knowledge Atlas Drive snapshot when no Prvlar one exists, and writes a new file', async () => {
  const files = { 'knowledge-atlas-sync.json': { id: 'old', body: { format: 'knowledge-atlas-sync', version: 1, tables: { documents: { d1: { v: { id: 'd1' }, t: 1 } } }, prefs: {} } } };
  const created = [], reads = [];
  const d = { list: async (n = 'prvlar-sync.json') => files[n] ? [{ id: files[n].id }] : [], read: async id => { reads.push(id); return Object.values(files).find(f => f.id === id).body; }, create: async (n, j) => { created.push(n); return { size: 1 }; }, update: async () => ({ size: 1 }) };
  const r = await syncRound(d, { format: 'prvlar-sync', version: 1, tables: {}, prefs: {} });
  assert.deepEqual(reads, ['old']); assert.deepEqual(created, ['prvlar-sync.json']); assert.equal(r.created, true);
});
