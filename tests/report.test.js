import test from 'node:test';
import assert from 'node:assert/strict';
import { scrub, buildReport, allowReport, issueUrl, mailtoUrl, postReport, parseCsv, reportText } from '../src/report.js';
const mem = () => { const m = {}; return { getItem: k => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

test('reports remove keys, emails and long numbers', () => {
  const t = scrub('key AIza' + 'x'.repeat(30) + ' gsk_' + 'y'.repeat(30) + ' mail me@example.com phone 9876543210 url?token=abc');
  assert.doesNotMatch(t, /AIza|gsk_|example\.com|9876543210|abc/);
  const r = buildReport({ text: 'it broke me@example.com', kind: 'user', error: Object.assign(Error('boom'), { stack: 'Error: boom\n at x' }), diag: { version: '0.9.8', platform: 'web', userAgent: 'UA', screen: '1x1', theme: 'light', online: true, log: ['warn: a@b.co'] } });
  assert.equal(r.text, 'it broke [email]'); assert.equal(r.diag.log[0], 'warn: [email]'); assert.equal(r.contact, undefined);
  assert.match(reportText(r), /Error: boom/);
});
test('per-device rate limits', () => {
  const s = mem(), t0 = 1e12; const auto = msg => buildReport({ kind: 'auto', error: Error(msg) });
  assert.ok(allowReport(s, auto('a'), t0)); assert.ok(!allowReport(s, auto('a'), t0 + 1000), 'same error once a day');
  assert.ok(allowReport(s, auto('b'), t0 + 2000)); assert.ok(allowReport(s, auto('c'), t0 + 3000)); assert.ok(!allowReport(s, auto('d'), t0 + 4000), '3 per hour');
  assert.ok(allowReport(s, auto('e'), t0 + 3600001));
  const u = mem(); for (let i = 0; i < 5; i++) assert.ok(allowReport(u, buildReport({ text: 'x' }), t0 + i)); assert.ok(!allowReport(u, buildReport({ text: 'x' }), t0 + 9));
});
test('GitHub issue and mailto fallbacks', () => {
  const r = buildReport({ text: 'Timer froze\nmore' });
  const u = issueUrl('owner/repo', r); assert.match(u, /^https:\/\/github\.com\/owner\/repo\/issues\/new\?template=bug\.yml&labels=user-report&title=Timer%20froze&body=/);
  assert.equal(issueUrl('', r), ''); assert.match(mailtoUrl('o@x.io', r), /^mailto:o@x\.io\?subject=/); assert.equal(mailtoUrl('', r), '');
});
test('Apps Script POST is no-cors text/plain, only to script.google.com', async () => {
  let call; const f = async (u, o) => { call = { u, o }; return {}; };
  assert.equal(await postReport('https://evil.example/x', {}, f), false);
  assert.equal(await postReport('https://script.google.com/macros/s/AKfy123/exec', { v: 1 }, f), true);
  assert.equal(call.o.mode, 'no-cors'); assert.match(call.o.headers['Content-Type'], /^text\/plain/);
});
test('published Sheet CSV is parsed', () => {
  const rows = parseCsv('received,kind,message\n2026-10-31,auto,"Bad, thing ""quoted"""\n2026-10-31,user,ok\n');
  assert.equal(rows.length, 2); assert.equal(rows[0].message, 'Bad, thing "quoted"'); assert.equal(rows[1].kind, 'user');
});
test('issue template carries the user-report label', async () => {
  const y = (await import('node:fs')).readFileSync(new URL('../.github/ISSUE_TEMPLATE/bug.yml', import.meta.url), 'utf8');
  assert.match(y, /labels: \["user-report"\]/);
});
