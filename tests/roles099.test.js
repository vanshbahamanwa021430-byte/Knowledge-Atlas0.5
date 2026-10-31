import test from 'node:test'; import assert from 'node:assert/strict';
import { migrateRoles099, roleList, can, ROLES } from '../src/devlog.js';
const mem = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) }; };
test('friend role is a complimentary Pro grant without the Developer panel', () => {
  assert.equal(ROLES.friend, 'Complimentary Pro'); assert.ok(can('friend', 'beta')); assert.ok(!can('friend', 'dev'));
});
test('0.9.9 migration keeps the existing grant as friend, once', () => {
  const s = mem(), h = 'a'.repeat(64);
  s.setItem('prvlar-roles', JSON.stringify([{ h, role: 'codev' }, { h: 'b'.repeat(64), role: 'tester' }]));
  assert.equal(migrateRoles099(s), 1);
  assert.deepEqual(roleList(s).map(r => r.role), ['friend', 'tester']);
  s.setItem('prvlar-roles', JSON.stringify([{ h, role: 'codev' }])); assert.equal(migrateRoles099(s), 0);
});
