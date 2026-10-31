// Prvlar free AI proxy — Cloudflare Worker (free tier).
// Holds the owner's Gemini key as a secret and forwards OpenAI-style chat requests to Gemini.
// Nothing is stored except per-day counters (no message text, no IPs).
//
// Secrets / vars (see proxy/README.md):
//   GEMINI_KEY      (secret)  the owner's Gemini API key
//   ALLOWED_ORIGINS (var)     comma list, e.g. https://vanshbahamanwa021430-byte.github.io,app://atlas,https://localhost,capacitor://localhost
//   DEVICE_LIMIT    (var)     messages per device per day (default 30)
//   GLOBAL_LIMIT    (var)     messages per day for everyone together (default 400; KV free tier allows 1,000 writes/day, 2 per message)
//   MODEL           (var)     default gemini-flash-latest
// KV binding: COUNTS
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MAX_BODY = 200_000, MAX_TOKENS = 4096, MAX_MESSAGES = 40;

const day = () => new Date().toISOString().slice(0, 10);
const json = (obj, status, origin) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
const cors = origin => origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {};
const err = (message, status, origin, code) => json({ error: { message: code ? `${code}: ${message}` : message, code: code || status } }, status, origin);

async function sha(text) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32); }

export default {
  async fetch(req, env) {
    const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = req.headers.get('Origin') || '';
    const ok = allowed.includes(origin);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: ok ? 204 : 403, headers: ok ? cors(origin) : {} });
    if (!ok) return err('This proxy only serves the Prvlar app.', 403);
    if (req.method === 'GET' && url.pathname === '/v1/models') return json({ data: [{ id: 'auto' }] }, 200, origin);
    if (req.method !== 'POST' || url.pathname !== '/v1/chat/completions') return err('Not found.', 404, origin);
    if (!env.GEMINI_KEY) return err('The free option is not set up yet.', 503, origin);

    const device = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!/^device-[0-9a-f-]{36}$/.test(device)) return err('Missing device id.', 400, origin);
    const len = Number(req.headers.get('Content-Length') || 0);
    if (len > MAX_BODY) return err('Request too large for the free option. Use your own key for big documents.', 413, origin);
    let body; try { const t = await req.text(); if (t.length > MAX_BODY) throw 0; body = JSON.parse(t); } catch { return err('Request too large or not JSON.', 413, origin); }
    if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > MAX_MESSAGES) return err('Bad request.', 400, origin);

    const d = day(), id = await sha(device);
    const gk = `g:${d}`, dk = `d:${d}:${id}`;
    const [g, n] = await Promise.all([env.COUNTS.get(gk), env.COUNTS.get(dk)]).then(v => v.map(x => Number(x) || 0));
    if (n >= (Number(env.DEVICE_LIMIT) || 30)) return err('You have used today’s free messages. Add your own free Gemini key in Settings › AI providers, or come back tomorrow.', 429, origin, 'PRVLAR_LIMIT');
    if (g >= (Number(env.GLOBAL_LIMIT) || 400)) return err('The free option is busy today. Add your own free Gemini key in Settings › AI providers.', 429, origin, 'PRVLAR_LIMIT');
    await Promise.all([env.COUNTS.put(gk, String(g + 1), { expirationTtl: 172800 }), env.COUNTS.put(dk, String(n + 1), { expirationTtl: 172800 })]);

    const out = { model: env.MODEL || 'gemini-flash-latest', messages: body.messages, max_tokens: Math.min(Number(body.max_tokens) || MAX_TOKENS, MAX_TOKENS) };
    if (body.response_format?.type === 'json_object') out.response_format = { type: 'json_object' };
    if (typeof body.temperature === 'number') out.temperature = Math.max(0, Math.min(1, body.temperature));
    const r = await fetch(GEMINI, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GEMINI_KEY}` }, body: JSON.stringify(out) });
    const text = await r.text();
    if (r.status === 429) return err('The free option is busy right now. Try again in a minute, or add your own free Gemini key.', 429, origin, 'PRVLAR_BUSY');
    return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
  }
};
