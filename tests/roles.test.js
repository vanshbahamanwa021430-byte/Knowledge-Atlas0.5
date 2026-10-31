import test from 'node:test'; import assert from 'node:assert/strict';
import { addRole, removeRole, roleList, roleOf, can, CODEV_TABS, sha256Hex, BETA_FLAGS } from '../src/devlog.js';
const mem = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
test('roles: add as hash, recognise, change, remove', async () => {
  const s = mem();
  await assert.rejects(addRole('x@example.com', 'codev', s), /Gmail/);
  await assert.rejects(addRole('a@gmail.com', 'admin', s), /Unknown role/);
  const h = await addRole('Co.Dev@Gmail.com ', 'codev', s);
  assert.ok(!s.getItem('ka-roles').includes('gmail'));
  assert.equal(await roleOf('co.dev@gmail.com', s), 'codev');
  await addRole('co.dev@gmail.com', 'tester', s); assert.equal(roleList(s).length, 1);
  assert.equal(await roleOf('co.dev@gmail.com', s), 'tester');
  removeRole(h, s); assert.equal(await roleOf('co.dev@gmail.com', s), null);
  assert.equal(await roleOf('', s), null);
});
test('roles: published roles.json is recognised; owner always wins', async () => {
  const s = mem(); const h = await sha256Hex('t@gmail.com');
  assert.equal(await roleOf('t@gmail.com', s, [{ h, role: 'tester' }, { h: 'bad', role: 'codev' }]), 'tester');
  s.setItem('ka-owners', JSON.stringify([h]));
  assert.equal(await roleOf('t@gmail.com', s, [{ h, role: 'tester' }]), 'owner');
  await assert.rejects(addRole('t@gmail.com', 'codev', s), /already an owner/);
});
test('roles: permissions', () => {
  assert.ok(can('owner', 'roles') && can('owner', 'pack') && can('owner', 'keys'));
  assert.ok(can('codev', 'dev') && !can('codev', 'roles') && !can('codev', 'pack') && !can('codev', 'keys'));
  assert.ok(can('tester', 'beta') && can('tester', 'report') && !can('tester', 'dev'));
  assert.ok(!can(null, 'beta'));
  assert.deepEqual(CODEV_TABS.filter(t => ['pack', 'owners', 'access', 'db', 'data', 'ai'].includes(t)), []);
  assert.ok(BETA_FLAGS.every(([k]) => k.startsWith('preview-')));
});
