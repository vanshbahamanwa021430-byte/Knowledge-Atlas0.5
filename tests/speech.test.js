import test from 'node:test';
import assert from 'node:assert/strict';
import { chunks } from '../src/speech.js';
import { notifId } from '../src/notify.js';

test('read aloud splits text into sentence-sized pieces', () => {
  const c = chunks('One. Two is here! ' + 'x'.repeat(500), 220);
  assert.equal(c[0], 'One. Two is here!');
  assert.ok(c.every(p => p.length <= 220));
  assert.deepEqual(chunks(''), []);
});
test('notification ids are stable 32-bit integers', () => {
  assert.equal(notifId('abc'), notifId('abc'));
  assert.notEqual(notifId('abc:1'), notifId('abc:7'));
  assert.ok(Number.isInteger(notifId('x')) && notifId('x') < 2 ** 31);
});
