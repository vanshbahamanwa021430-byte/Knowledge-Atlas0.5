import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
import { copyMissing } from '../src/storage.js';

test('0.9.8 M2: legacy DB copy adds only missing rows, never overwrites newer Prvlar edits, and is all-or-nothing', async () => {
  const t = new Dexie('m2-target'); t.version(1).stores({ documents: 'id', settings: 'key' }); await t.open();
  await t.documents.put({ id: 'a', name: 'edited in Prvlar' });
  const n = await copyMissing(t, [['documents', [{ id: 'a', name: 'old' }, { id: 'b', name: 'old b' }]], ['settings', [{ key: 'x', value: 1 }]]]);
  assert.equal(n, 2);
  assert.equal((await t.documents.get('a')).name, 'edited in Prvlar');
  assert.equal((await t.documents.get('b')).name, 'old b');
  assert.equal(await copyMissing(t, [['documents', [{ id: 'b', name: 'again' }]]]), 0);   // a re-run is a no-op
  await assert.rejects(copyMissing(t, [['documents', [{ id: 'c' }]], ['settings', [{ key: 'y' }, { nokey: 1 }]]]));
  assert.equal(await t.documents.get('c'), undefined, 'failed copy rolled back');
  t.close();
});
