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
import { aiDecision } from '../src/aigate.js';
test('ECC H1: every non-local AI path needs adult + consent', () => {
  assert.equal(aiDecision({ local: true, age: 'minor' }), 'ok');
  assert.equal(aiDecision({ age: 'unknown', consent: true }), 'ask-age');
  assert.equal(aiDecision({ age: 'minor', consent: true }), 'minor');
  assert.equal(aiDecision({ age: 'adult', consent: false }), 'ask-consent');
  assert.equal(aiDecision({ age: 'adult', consent: true }), 'ok');
});
import { ageRecheckAllowed } from '../src/age.js';
import { scrub } from '../src/aireport.js';
import { createRequire } from 'node:module';
test('ECC M7: minor result blocks an immediate re-check for 30 days', () => {
  const s = mem(); checkAge('2012-01-01', s, T); assert.equal(ageRecheckAllowed(s, T), false); assert.equal(ageRecheckAllowed(s, new Date(2026, 11, 5)), true);
  const a = mem(); checkAge('1990-01-01', a, T); assert.equal(ageRecheckAllowed(a, T), true);
});
test('ECC L1: report scrub covers refresh tokens and client secrets', () => { const t = scrub('1//' + 'a'.repeat(30) + ' GOCSPX-' + 'b'.repeat(20)); assert.ok(!/1\/\/a|GOCSPX-b/.test(t), t); });
test('ECC M5/L3: importer and AI host checks refuse private, CGNAT and mapped IPv6 hosts', () => {
  const g = createRequire(import.meta.url)('../electron/net-guard.cjs');
  for (const u of ['http://172.20.0.1/x', 'http://0.0.0.0/', 'http://[::1]/', 'https://printer.local/', 'http://100.64.1.1/', 'file:///etc/passwd', 'https://u:p@example.com/']) assert.ok(!g.publicUrlAllowed(new URL(u)), u);
  assert.ok(g.publicUrlAllowed(new URL('https://example.com/paper.pdf'))); assert.ok(!g.aiUrlAllowed(new URL('https://[::ffff:7f00:1]/v1'))); assert.ok(!g.aiUrlAllowed(new URL('https://100.100.1.1/v1')));
});
