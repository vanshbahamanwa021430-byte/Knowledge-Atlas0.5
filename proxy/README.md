# Prvlar free AI proxy

Lets people use Prvlar's AI without their own key, using the owner's Gemini key kept **only** in the proxy.

- `apps-script/` — Google Apps Script web app (used). Deploy steps: `apps-script/DEPLOY.md`.
- `worker.js` + `wrangler.toml` — Cloudflare Worker alternative (origin allow-list, KV counters): `npx wrangler kv namespace create COUNTS`, put the id in wrangler.toml, `npx wrangler secret put GEMINI_KEY`, `npx wrangler deploy`.

The app reads the proxy URL and public token from `config.json` (web) or `VITE_PRVLAR_PROXY` / `VITE_PRVLAR_PROXY_TOKEN` (builds). If neither is set, the "Prvlar free (limited)" option is hidden and nothing changes.
Daily limits per device and overall; when reached, the app suggests a free personal Gemini key (Settings › AI providers).
