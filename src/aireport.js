// "Report this AI answer" (0.9.9 compliance hotfix). Kept on this device: the answer text, a short context excerpt
// (never whole documents), category and note. The Developer panel's Reports tab reviews them with a status and an audit trail.
import { redact } from './crashlog.js';
const KEY = 'prvlar-ai-reports';
// Privacy scrub: keys, tokens, emails and phone numbers are removed from everything stored in a report.
export const scrub = t => redact(t).replace(/(?:\+?\d[\d\s().-]{8,}\d)/g, '[phone]');
export const CATEGORIES = [['inaccurate', 'Inaccurate'], ['harmful', 'Harmful'], ['inappropriate', 'Inappropriate'], ['privacy', 'Privacy concern']];
export const STATUSES = ['new', 'reviewing', 'resolved'];
const load = s => { try { const v = JSON.parse(s.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const save = (s, l) => s.setItem(KEY, JSON.stringify(l.slice(-200)));
const uid = () => (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
export function makeReport({ category, note = '', answer, context = '', kind = 'smarty', version = '' }) {
  if (!CATEGORIES.some(c => c[0] === category)) throw Error('Choose what is wrong with the answer.');
  const a = String(answer || '').trim(); if (!a) throw Error('There is no answer to report.');
  const now = new Date().toISOString();
  return { id: uid(), at: now, kind, category, note: scrub(String(note).slice(0, 1000)), answer: scrub(a.slice(0, 4000)), context: scrub(String(context).replace(/\s+/g, ' ').trim().slice(0, 300)), version, status: 'new', audit: [{ at: now, by: 'reporter', action: 'reported' }] };
}
export function addReport(r, store = localStorage) { const l = load(store); l.push(r); save(store, l); return r; }
export const listReports = (store = localStorage) => load(store);
export function setStatus(id, status, by, store = localStorage) {
  if (!STATUSES.includes(status)) throw Error('Unknown status');
  const l = load(store), r = l.find(x => x.id === id); if (!r) throw Error('Report not found');
  if (r.status === status) return r;
  r.audit.push({ at: new Date().toISOString(), by: String(by || 'unknown'), action: `status ${r.status} → ${status}` }); r.status = status; save(store, l); return r;
}
export const exportReports = (store = localStorage) => JSON.stringify({ format: 'prvlar-ai-reports-1', exported: new Date().toISOString(), reports: load(store) }, null, 1);
export function deleteAllReports(store = localStorage) { store.removeItem(KEY); }
