import test from 'node:test'; import assert from 'node:assert/strict';
import { ageOn, checkAge, ageStatus, isAdult } from '../src/age.js';
import { makeReport, addReport, listReports, setStatus, exportReports } from '../src/aireport.js';
const mem = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), dump: () => [...m.values()].join('|') }; };
const T = new Date(2026, 9, 31);
test('age from date of birth, birthdays and bad dates', () => {
  assert.equal(ageOn('2008-10-31', T), 18); assert.equal(ageOn('2008-11-01', T), 17); assert.equal(ageOn('2026-02-31', T), null); assert.equal(ageOn('2030-01-01', T), null); assert.equal(ageOn('', T), null);
});
test('only the result is stored, never the date of birth', () => {
  const s = mem(); assert.equal(ageStatus(s), 'unknown');
  assert.equal(checkAge('2009-05-14', s, T), 'minor'); assert.ok(!s.dump().includes('2009')); assert.ok(!isAdult(s));
  assert.equal(checkAge('1990-05-14', s, T), 'adult'); assert.ok(isAdult(s)); assert.ok(!s.dump().includes('1990'));
  assert.throws(() => checkAge('nope', s, T));
});
test('AI answer report: categories, excerpt limits, status audit trail, export', () => {
  const s = mem();
  assert.throws(() => makeReport({ category: 'other', answer: 'x' }));
  const r = addReport(makeReport({ category: 'inaccurate', note: 'wrong unit', answer: 'M = wL/8', context: 'doc '.repeat(500) }), s);
  assert.ok(r.context.length <= 300); assert.equal(r.status, 'new');
  setStatus(r.id, 'reviewing', 'owner@x', s); setStatus(r.id, 'resolved', 'owner@x', s);
  const got = listReports(s)[0]; assert.equal(got.status, 'resolved'); assert.equal(got.audit.length, 3); assert.match(got.audit[2].action, /reviewing → resolved/); assert.equal(got.audit[1].by, 'owner@x');
  assert.throws(() => setStatus(r.id, 'bogus', 'x', s));
  assert.equal(JSON.parse(exportReports(s)).reports.length, 1);
});
