import test from 'node:test'; import assert from 'node:assert/strict';
import { record, reports, setCrashEnabled, redact } from '../src/crashlog.js';
const mem = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
test('nothing kept without permission', () => { const s = mem(); assert.equal(record(Error('x'), {}, s), false); assert.equal(reports(s).length, 0); });
test('kept with permission, secrets removed, cleared on opt-out', () => {
  const s = mem(); setCrashEnabled(true, s);
  record(Error('bad AIza' + 'x'.repeat(30) + ' a@b.com ?key=123'), { view: 'home' }, s);
  const r = reports(s); assert.equal(r.length, 1); assert.ok(!/AIza|a@b\.com|123/.test(r[0].msg), r[0].msg);
  setCrashEnabled(false, s); assert.equal(reports(s).length, 0);
});
test('redact tokens', () => assert.equal(redact('ya29.abc'), '[token]'));
