// Smarty Code runners. JavaScript runs in a throw-away Web Worker with network APIs removed and a time limit.
// Python runs in Pyodide (bundled under ./pyodide/, works offline) inside its own worker. C, C++ and Java either use
// the user's own Judge0-compatible runner (URL + key in Settings) or an AI dry run that is clearly labelled "simulated".
import { pyHarness, findFn } from './code.js';

const JS_WORKER = `
for (const k of ['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','indexedDB','caches','BroadcastChannel']) { try { self[k] = undefined; } catch {} }
const out = []; const fmt = a => a.map(x => typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })()).join(' ');
console.log = console.info = console.warn = console.error = (...a) => { if (out.length < 200) out.push(fmt(a)); };
onmessage = e => { const { code, fn, cases } = e.data; let f;
  try { f = new Function(code + '\\n;return typeof ' + fn + ' === "function" ? ' + fn + ' : undefined;')(); }
  catch (err) { postMessage({ compile: String(err && err.message || err), out }); return; }
  if (typeof f !== 'function') { postMessage({ compile: 'Could not find a function named ' + fn + '.', out }); return; }
  const results = cases.map(args => { try { const v = f(...JSON.parse(JSON.stringify(args))); return { ok: true, value: v === undefined ? null : JSON.parse(JSON.stringify(v)) }; } catch (err) { return { ok: false, error: (err && err.name ? err.name + ': ' : '') + (err && err.message || err) }; } });
  postMessage({ results, out });
};`;

function inWorker(src, msg, ms) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), w = new Worker(url);
    const done = r => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); resolve(r); };
    const t = setTimeout(() => done({ timeout: true }), ms);
    w.onmessage = e => done(e.data); w.onerror = e => { e.preventDefault?.(); done({ compile: e.message || 'Worker error' }); };
    w.postMessage(msg);
  });
}
export async function runJS(code, fnName, tests, ms = 4000) {
  const fn = findFn(code, 'javascript', fnName);
  const r = await inWorker(JS_WORKER, { code, fn, cases: tests.map(t => t.args) }, ms);
  if (r.timeout) return { error: `Stopped after ${ms / 1000} s — is there an infinite loop?`, results: [], out: [] };
  if (r.compile) return { error: r.compile, results: [], out: r.out || [] };
  return { results: r.results, out: r.out };
}

// Pyodide worker. The runtime is loaded once per worker; we keep one warm worker and replace it after a timeout.
const PY_WORKER = base => `
importScripts('${base}pyodide.js');
let py = null; const out = [];
onmessage = async e => {
  try {
    if (!py) { py = await loadPyodide({ indexURL: '${base}', stdout: s => out.length < 200 && out.push(s), stderr: s => out.length < 200 && out.push(s) }); }
    out.length = 0;
    py.runPython('import sys\\nsys.modules["js"] = None\\nsys.modules["pyodide.http"] = None');
    const res = py.runPython(e.data.src);
    postMessage({ results: JSON.parse(res), out: out.slice() });
  } catch (err) { postMessage({ compile: String(err && err.message || err).split('\\n').filter(Boolean).slice(-3).join('\\n'), out: out.slice() }); }
};`;
let pyW = null;
const pyBase = () => new URL('./pyodide/', location.href).href;
export function runPy(code, fnName, tests, ms = 20000) {
  const fn = findFn(code, 'python', fnName), src = pyHarness(code, fn, tests);
  return new Promise(resolve => {
    if (!pyW) { const url = URL.createObjectURL(new Blob([PY_WORKER(pyBase())], { type: 'text/javascript' })); pyW = new Worker(url); }
    const w = pyW, t = setTimeout(() => { w.terminate(); pyW = null; resolve({ error: `Stopped after ${ms / 1000} s — is there an infinite loop?`, results: [], out: [] }); }, ms);
    w.onmessage = e => { clearTimeout(t); const d = e.data; resolve(d.compile ? { error: d.compile, results: [], out: d.out } : { results: d.results, out: d.out }); };
    w.onerror = e => { clearTimeout(t); e.preventDefault?.(); w.terminate(); pyW = null; resolve({ error: e.message || 'Python could not start.', results: [], out: [] }); };
    w.postMessage({ src });
  });
}

// Judge0-compatible runner the user configured (their own key). Runs the program once per case with stdin = JSON args.
export const JUDGE0_LANG = { c: 50, cpp: 54, java: 62, python: 71, javascript: 63 };
export async function runRemote(cfg, code, lang, tests, fetchImpl = globalThis.fetch) {
  if (!cfg?.url) return { error: 'No code runner is set up. Add one in Settings › AI, or use a simulated dry run.', results: [] };
  const base = cfg.url.replace(/\/+$/, ''), headers = { 'Content-Type': 'application/json', ...(cfg.key ? { 'X-Auth-Token': cfg.key, 'X-RapidAPI-Key': cfg.key } : {}) };
  const results = [];
  for (const t of tests) {
    let r; try { r = await fetchImpl(`${base}/submissions?base64_encoded=false&wait=true`, { method: 'POST', headers, body: JSON.stringify({ source_code: code, language_id: JUDGE0_LANG[lang], stdin: t.args.map(a => JSON.stringify(a)).join('\n') }) }); }
    catch { return { error: 'Could not reach your code runner. Check the URL and your connection (on the web, the runner must allow CORS).', results }; }
    if (r.status === 401 || r.status === 403) return { error: 'Your code runner rejected the key.', results };
    if (r.status === 429) return { error: 'Your code runner is rate-limiting requests. Try again in a minute.', results };
    if (!r.ok) return { error: `Code runner error ${r.status}.`, results };
    const j = await r.json();
    if (j.compile_output) return { error: String(j.compile_output).slice(0, 800), results };
    const stdout = String(j.stdout || '').trim();
    if (j.stderr || (j.status && j.status.id > 4)) results.push({ ok: false, error: String(j.stderr || j.status?.description || 'Runtime error').slice(0, 300) });
    else { let v = stdout; try { v = JSON.parse(stdout); } catch {} results.push({ ok: true, value: v }); }
  }
  return { results };
}
