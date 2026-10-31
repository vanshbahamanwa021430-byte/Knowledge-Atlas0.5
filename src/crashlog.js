// Crash reports (0.9.9 foundation): only with permission. When the user turns it on, errors are kept on this
// device (last 20, secrets removed). Nothing is sent anywhere; the user can copy a report to share it themselves.
const KEY = 'prvlar-crashlog', ON = 'prvlar-crash-ok';
export const redact = s => String(s || '')
  .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[key]').replace(/gsk_[0-9A-Za-z]{20,}/g, '[key]').replace(/sk-[0-9A-Za-z_-]{16,}/g, '[key]')
  .replace(/ya29\.[0-9A-Za-z._-]+/g, '[token]').replace(/eyJ[0-9A-Za-z_-]+\.[0-9A-Za-z_-]+\.[0-9A-Za-z_-]+/g, '[token]')
  .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/([?&](key|token|access_token|id_token)=)[^&\s]+/gi, '$1[hidden]');
export function crashEnabled(store = localStorage) { return store.getItem(ON) === '1'; }
export function setCrashEnabled(v, store = localStorage) { store.setItem(ON, v ? '1' : '0'); if (!v) store.removeItem(KEY); }
export function record(err, ctx = {}, store = localStorage) {
  if (!crashEnabled(store)) return false;
  let list = []; try { list = JSON.parse(store.getItem(KEY) || '[]'); } catch { list = []; }
  list.push({ at: new Date().toISOString(), msg: redact(err?.message || err).slice(0, 300), stack: redact(err?.stack || '').split('\n').slice(0, 6).join('\n'), view: String(ctx.view || ''), version: String(ctx.version || '') });
  store.setItem(KEY, JSON.stringify(list.slice(-20))); return true;
}
export function reports(store = localStorage) { try { return JSON.parse(store.getItem(KEY) || '[]'); } catch { return []; } }
export const reportText = list => list.map(r => `${r.at} [${r.version} ${r.view}] ${r.msg}\n${r.stack}`).join('\n\n');
