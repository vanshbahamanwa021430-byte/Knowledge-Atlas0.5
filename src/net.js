// One POST-JSON helper for every AI call.
// - Android (Capacitor): native HTTP, so browser CORS rules and http:// blocking in the WebView do not apply.
//   This is what lets the app reach a self-hosted router server on localhost (Termux) or on your PC.
// - Windows (Electron): the request is made by the app's main process through the preload bridge, for the same reason.
// - Browser / tests: plain fetch.
import { recordRequest } from './devlog.js';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const NETWORK_ERROR = 'Could not reach the AI service. Check your internet connection, or that your AI server is running and the address is right.';
const TIMEOUT_ERROR = 'The AI request timed out. Try again.';

// Turn a failed request into the real cause (kept starting with "Could not reach" so the provider fallback still applies).
export function networkError(url, err, env = {}) {
  const raw = String(err?.message || err || '');
  if (/timed? ?out|timeout/i.test(raw) || err?.name === 'AbortError' || err?.name === 'TimeoutError') return TIMEOUT_ERROR;
  let u = null; try { u = new URL(url); } catch { /* bad URL */ }
  const host = u?.hostname || '', where = u ? `${u.protocol}//${u.host}` : String(url || '');
  const pageHttps = env.pageProtocol === 'https:', native = !!env.native;
  const base = `Could not reach ${where}.`;
  if (/^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$)/i.test(host) && (native || env.mobile))
    return `${base} “${host}” means this phone itself, so a server running on your PC or another machine is not reachable here. Use the server's LAN address (e.g. http://192.168.x.x:3001/v1) or a public HTTPS address.`;
  if (pageHttps && !native && u?.protocol === 'http:' && !/^(localhost|127\.)/.test(host))
    return `${base} This website is HTTPS, so the browser blocks plain http:// servers. Use an https:// address (or the Android/Windows app).`;
  if (/resolve host|ENOTFOUND|getaddrinfo|name not resolved|UnknownHost/i.test(raw)) return `${base} The address "${host}" could not be found (DNS). Check the spelling, or your internet connection.`;
  if (/refused|ECONNREFUSED|Failed to connect/i.test(raw)) return `${base} The connection was refused: nothing is listening there. Check that the server is running and the port is right.`;
  if (/cert|SSL|TLS|handshake/i.test(raw)) return `${base} The server's HTTPS certificate was rejected. Use a valid certificate.`;
  if (/cleartext/i.test(raw)) return `${base} Android blocked a plain http:// connection. Use https://.`;
  if (!native && /Failed to fetch|NetworkError|Load failed/i.test(raw)) return `${base} The browser blocked or could not complete the request: the server may be offline, or it does not allow requests from this website (CORS). Check the server is running and allows CORS.`;
  return raw && !/^Could not reach/.test(raw) ? `${base} ${raw}` : NETWORK_ERROR;
}
const envNow = () => ({ native: Capacitor.isNativePlatform(), pageProtocol: globalThis.location?.protocol || '', mobile: /Android|iPhone|iPad/i.test(globalThis.navigator?.userAgent || '') });

function wrap(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return typeof data === 'string' ? JSON.parse(data) : data; }
  };
}

// Every AI request passes here; the owner's request inspector records it with secrets masked.
export async function postJson(url, headers, body, timeout = 120000) {
  const t0 = Date.now();
  try { const r = await postJsonRaw(url, headers, body, timeout); recordRequest({ url, headers, body, status: r?.status, ms: Date.now() - t0, chars: typeof r?.text === 'string' ? r.text.length : 0 }); return r; }
  catch (e) { recordRequest({ url, headers, body, ms: Date.now() - t0, error: e?.message }); throw e; }
}
async function postJsonRaw(url, headers, body, timeout) {
  const bridge = globalThis.window?.atlasNative;
  if (Capacitor.isNativePlatform()) {
    let res;
    try {
      res = await CapacitorHttp.request({ url, method: 'POST', headers, data: body, connectTimeout: 15000, readTimeout: timeout, responseType: 'json' });
    } catch (e) {
      throw Error(networkError(url, e, envNow()));
    }
    return wrap(res.status, res.data);
  }
  if (bridge?.postJson) {
    const r = await bridge.postJson(url, headers, JSON.stringify(body), timeout);
    if (r.error) throw Error(r.error === 'timeout' ? TIMEOUT_ERROR : networkError(url, r.detail || r.error, envNow()));
    return wrap(r.status, r.text);
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    return await fetch(url, { method: 'POST', signal: ctl.signal, headers, body: JSON.stringify(body) });
  } catch (e) {
    throw Error(networkError(url, e, envNow()));
  } finally { clearTimeout(timer); }
}

// GET JSON with headers (an AI provider's /models list). Native HTTP on Android, fetch elsewhere.
export async function getJson(url, headers = {}, timeout = 20000) {
  if (Capacitor.isNativePlatform()) {
    let res; try { res = await CapacitorHttp.request({ url, method: 'GET', headers, connectTimeout: 15000, readTimeout: timeout, responseType: 'json' }); } catch (e) { throw Error(networkError(url, e, envNow())); }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data: typeof res.data === 'string' ? JSON.parse(res.data || 'null') : res.data };
  }
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeout);
  try { const r = await fetch(url, { headers, signal: ctl.signal }); return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) }; }
  catch (e) { throw Error(networkError(url, e, envNow())); } finally { clearTimeout(timer); }
}

// GET a public page or file (a question bank). On Android it goes through native HTTP and on Windows through
// the main process, so the browser's CORS rules don't block it. In a plain browser the site usually refuses (CORS).
const b64ToBytes = b64 => Uint8Array.from(atob(String(b64)), c => c.charCodeAt(0));
export async function getUrl(url, as = 'text', timeout = 60000) {
  const bridge = globalThis.window?.atlasNative;
  var FAIL = 'Could not download this file. Check the link and your internet connection.';
  if (Capacitor.isNativePlatform()) {
    let res;
    try { res = await CapacitorHttp.request({ url, method: 'GET', connectTimeout: 15000, readTimeout: timeout, responseType: as === 'bytes' ? 'arraybuffer' : 'text' }); }
    catch { throw Error(FAIL); }
    if (res.status < 200 || res.status >= 300) throw Error(`The site answered ${res.status}. ${FAIL}`);
    return as === 'bytes' ? (typeof res.data === 'string' ? b64ToBytes(res.data) : new Uint8Array(res.data)) : String(res.data);
  }
  if (bridge?.getUrl) {
    const r = await bridge.getUrl(url, as, timeout);
    if (r.error) throw Error(r.error === 'forbidden' ? 'This address is not allowed.' : FAIL);
    if (r.status < 200 || r.status >= 300) throw Error(`The site answered ${r.status}. ${FAIL}`);
    return as === 'bytes' ? b64ToBytes(r.data) : r.data;
  }
  let res;
  try { res = await fetch(url, { signal: AbortSignal.timeout(timeout) }); }
  catch { throw Error('Your browser blocked this download (the site does not allow other web pages to read it — CORS). Use the Android or Windows app, or download the PDFs and add them with "Add PDFs".'); }
  if (!res.ok) throw Error(`The site answered ${res.status}. ${FAIL}`);
  return as === 'bytes' ? new Uint8Array(await res.arrayBuffer()) : res.text();
}
