// "Report a problem" + automatic error reports. No server of ours: reports POST to the owner's Google Apps Script
// (responses land in the owner's Google Sheet); copy/share and GitHub/email links are fallbacks. Pure helpers are tested.
const KEYISH = /\b(AIza[\w-]{20,}|gsk_[\w-]{20,}|sk-[\w-]{20,}|ya29\.[\w.-]+|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g, LONGNUM = /\b\d{9,}\b/g;
export const scrub = s => String(s ?? '').replace(KEYISH, '[key]').replace(EMAIL, '[email]').replace(LONGNUM, '[number]').replace(/(token|key|password|secret)=([^&\s]+)/gi, '$1=[hidden]');
export function buildReport({ text = '', kind = 'user', error = null, diag = null, contact = '' } = {}) {
  const r = { v: 1, kind, at: new Date().toISOString(), text: scrub(text).slice(0, 4000) };
  if (error) r.error = { message: scrub(error.message || error).slice(0, 500), stack: scrub(error.stack || '').split('\n').slice(0, 8).join('\n').slice(0, 1500) };
  if (diag) r.diag = { version: diag.version, platform: diag.platform, ua: scrub(diag.userAgent || '').slice(0, 200), screen: diag.screen, theme: diag.theme, online: diag.online, log: (diag.log || []).slice(-15).map(x => scrub(typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 300)) };
  if (contact) r.contact = String(contact).slice(0, 120);   // only when the user typed it
  return r;
}
// Per-device limits: user reports 5/hour; automatic reports 3/hour and 10/day, one per distinct error per day.
export function allowReport(store, report, now = Date.now()) {
  let log = []; try { log = JSON.parse(store.getItem('prvlar-report-log') || '[]'); } catch { /* reset */ }
  log = log.filter(x => now - x.t < 86400000);
  const hour = log.filter(x => now - x.t < 3600000 && x.k === report.kind).length, day = log.filter(x => x.k === report.kind).length;
  const sig = report.error ? report.error.message.slice(0, 80) : '';
  const ok = report.kind === 'auto' ? hour < 3 && day < 10 && !log.some(x => x.k === 'auto' && x.s === sig) : hour < 5;
  if (ok) { log.push({ t: now, k: report.kind, s: sig }); store.setItem('prvlar-report-log', JSON.stringify(log)); }
  return ok;
}
export const reportText = r => `${r.text || ''}${r.error ? `\n\nError: ${r.error.message}\n${r.error.stack}` : ''}${r.diag ? `\n\nApp ${r.diag.version} · ${r.diag.platform} · ${r.diag.screen} · theme ${r.diag.theme}\n${r.diag.log.join('\n')}` : ''}`.trim();
export function issueUrl(repo, r) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) return '';
  const title = (r.text || r.error?.message || 'Problem report').split('\n')[0].slice(0, 80);
  return `https://github.com/${repo}/issues/new?template=bug.yml&labels=user-report&title=${encodeURIComponent(title)}&body=${encodeURIComponent(reportText(r).slice(0, 6000))}`;
}
export const mailtoUrl = (email, r) => email ? `mailto:${email}?subject=${encodeURIComponent('Prvlar problem report')}&body=${encodeURIComponent(reportText(r).slice(0, 1800))}` : '';
// Apps Script web apps accept a simple no-cors POST (text/plain avoids a CORS preflight). The response is opaque.
export async function postReport(url, r, fetchImpl = globalThis.fetch) {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url || '')) return false;
  try { await fetchImpl(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(r) }); return true; } catch { return false; }
}
// Developer panel: rows from the Sheet's published CSV (File › Share › Publish to web › CSV).
export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head = [], ...body] = rows.filter(r => r.some(x => x !== ''));
  return body.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ''])));
}
