import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTable, mergeSnapshots, diffForLocal, encryptJSON, decryptJSON, drive, syncRound, SNAPSHOT_NAME, DriveError } from '../src/sync.js';

// In-memory Google Drive v3 (appDataFolder only), speaking the same REST shapes the app uses.
function mockDrive() {
  const files = new Map(); let n = 0; const log = [];
  const parseMultipart = body => { const parts = body.split(/--ka[a-z0-9]+/).filter(p => p.includes('\r\n\r\n')); const get = p => p.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''); return { meta: JSON.parse(get(parts[0])), data: get(parts[1]) }; };
  const fetchImpl = async (url, o = {}) => {
    const u = new URL(url), m = o.method || 'GET'; log.push(`${m} ${u.pathname}`);
    if (o.headers?.Authorization !== 'Bearer good') return { ok: false, status: 401 };
    const res = (status, body) => ({ ok: status < 300, status, json: async () => body });
    if (m === 'GET' && u.pathname === '/drive/v3/files') {
      assert.equal(u.searchParams.get('spaces'), 'appDataFolder');
      const q = u.searchParams.get('q'), name = q && q.match(/name='([^']+)'/)[1];
      return res(200, { files: [...files.values()].filter(f => !name || f.name === name).map(({ id, name, size }) => ({ id, name, size })) });
    }
    const id = u.pathname.split('/').pop();
    if (m === 'GET') return files.has(id) ? res(200, JSON.parse(files.get(id).data)) : res(404, {});
    if (m === 'POST') { const { meta, data } = parseMultipart(o.body); assert.deepEqual(meta.parents, ['appDataFolder']); const f = { id: 'f' + ++n, name: meta.name, data, size: data.length }; files.set(f.id, f); return res(200, { id: f.id, size: String(f.size) }); }
    if (m === 'PATCH') { const { data } = parseMultipart(o.body); const f = files.get(id); f.data = data; f.size = data.length; return res(200, { id, size: String(f.size) }); }
    if (m === 'DELETE') { files.delete(id); return { ok: true, status: 204 }; }
    return res(400, {});
  };
  return { files, log, fetchImpl };
}
const snap = (tables, prefs = {}) => ({ format: 'knowledge-atlas-sync', version: 1, tables, prefs });

test('merge: newest edit wins, both sides keep their new records', () => {
  const m = mergeTable('documents', { rows: [{ id: 'a', t: 'local', _u: 20 }, { id: 'b', _u: 5 }] }, { rows: [{ id: 'a', t: 'remote', _u: 10 }, { id: 'c', _u: 7 }] });
  assert.deepEqual(m.rows.map(r => r.id).sort(), ['a', 'b', 'c']); assert.equal(m.rows.find(r => r.id === 'a').t, 'local');
  assert.deepEqual(m.conflicts, [{ table: 'documents', key: 'a', kept: 'local' }]);
  const m2 = mergeTable('documents', { rows: [{ id: 'a', t: 'local', _u: 10 }] }, { rows: [{ id: 'a', t: 'remote', _u: 30 }] });
  assert.equal(m2.rows[0].t, 'remote');
});
test('merge: tombstones delete older copies, lose to newer edits; settings keyed by key, days by day', () => {
  const m = mergeTable('notes', { rows: [], tombs: { x: 50 } }, { rows: [{ id: 'x', _u: 40 }, { id: 'y', _u: 60 }], tombs: { y: 55 } });
  assert.deepEqual(m.rows.map(r => r.id), ['y']); assert.equal(m.tombs.x, 50); assert.equal(m.tombs.y, undefined);
  assert.equal(mergeTable('settings', { rows: [{ key: 'k', value: 1, _u: 2 }] }, { rows: [{ key: 'k', value: 2, _u: 3 }] }).rows[0].value, 2);
  assert.equal(mergeTable('days', { rows: [{ day: '2026-10-31', n: 1, _u: 9 }] }, { rows: [] }).rows[0].n, 1);
});
test('snapshots: prefs by change time; diff tells the device what to write and delete', () => {
  const local = snap({ documents: { rows: [{ id: 'a', _u: 1 }, { id: 'gone', _u: 1 }] } }, { 'ka-theme': { v: 'dark', u: 10 }, 'ka-name': { v: 'A', u: 1 } });
  const remote = snap({ documents: { rows: [{ id: 'b', _u: 2 }], tombs: { gone: 5 } } }, { 'ka-theme': { v: 'glass', u: 5 }, 'ka-name': { v: 'B', u: 8 } });
  const m = mergeSnapshots(local, remote);
  assert.equal(m.prefs['ka-theme'].v, 'dark'); assert.equal(m.prefs['ka-name'].v, 'B');
  const d = diffForLocal(local, m);
  assert.deepEqual(d.put.documents.map(r => r.id), ['b']); assert.deepEqual(d.del.documents, ['gone']);
});
test('encryption round-trip; wrong passphrase is refused; ciphertext hides the data', async () => {
  const data = snap({ documents: { rows: [{ id: 'a', title: 'Secret notes about thermodynamics' }] } });
  const box = await encryptJSON(data, 'correct horse battery', 1000);
  assert.equal(box.encrypted, 'AES-GCM'); assert.ok(!JSON.stringify(box).includes('thermodynamics'));
  assert.deepEqual(await decryptJSON(box, 'correct horse battery'), data);
  await assert.rejects(decryptJSON(box, 'wrong pass'), /Wrong passphrase/);
  const box2 = await encryptJSON(data, 'correct horse battery', 1000); assert.notEqual(box.iv, box2.iv);
});
test('Drive client: create / list / read / update / delete inside appDataFolder', async () => {
  const D = mockDrive(), d = drive('good', D.fetchImpl);
  const f = await d.create(SNAPSHOT_NAME, { a: 1 });
  assert.equal((await d.list()).length, 1); assert.deepEqual(await d.read(f.id), { a: 1 });
  await d.update(f.id, { a: 2 }); assert.deepEqual(await d.read(f.id), { a: 2 });
  await d.remove(f.id); assert.equal((await d.listAll()).length, 0);
  await assert.rejects(drive('expired', D.fetchImpl).list(), e => e instanceof DriveError && e.status === 401);
  await assert.rejects(drive('good', async () => { throw TypeError('offline'); }).list(), /offline/);
});
test('two devices sync through Drive: edits, deletes and a conflict converge', async () => {
  const D = mockDrive(), d = drive('good', D.fetchImpl);
  const phone = snap({ documents: { rows: [{ id: 'doc1', title: 'Physics', _u: 100 }, { id: 'doc2', title: 'Old', _u: 100 }] } });
  const r1 = await syncRound(d, phone); assert.equal(r1.created, true);
  const laptop = snap({ documents: { rows: [{ id: 'doc1', title: 'Physics (edited on laptop)', _u: 200 }, { id: 'doc3', title: 'Maths', _u: 150 }], tombs: { doc2: 180 } } });
  const r2 = await syncRound(d, laptop);
  assert.deepEqual(r2.merged.tables.documents.rows.map(r => r.id).sort(), ['doc1', 'doc3']); assert.equal(r2.merged.conflicts.length, 1);
  const r3 = await syncRound(d, phone); const back = diffForLocal(phone, r3.merged);
  assert.equal(back.put.documents.find(r => r.id === 'doc1').title, 'Physics (edited on laptop)'); assert.deepEqual(back.del.documents, ['doc2']);
  assert.equal([...D.files.values()].length, 1);
});
test('encrypted cloud copy needs the passphrase; with it, sync works and Drive only holds ciphertext', async () => {
  const D = mockDrive(), d = drive('good', D.fetchImpl);
  await syncRound(d, snap({ documents: { rows: [{ id: 'a', title: 'Private diary', _u: 1 }] } }), { pass: 'long passphrase' });
  assert.ok(![...D.files.values()][0].data.includes('Private diary'));
  await assert.rejects(syncRound(d, snap({})), /encrypted/);
  const r = await syncRound(d, snap({}), { pass: 'long passphrase' }); assert.equal(r.merged.tables.documents.rows[0].title, 'Private diary');
});
