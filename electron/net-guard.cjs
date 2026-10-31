// Desktop network guards (0.9.9 review M3 + M4). Plain Node (no Electron imports) so tests can run it.
const http = require('http'), crypto = require('crypto');

// ---- M4: which URLs the page may POST AI requests to ----
const PRIVATE = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:|\[?fe80:)/i;
function aiUrlAllowed(u, local = false) {
  const host = u.hostname.toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
  if (u.username || u.password) return false;
  if (u.protocol === 'http:') return local && isLocal;              // a local AI server on this computer only, when opted in
  if (u.protocol !== 'https:') return false;
  if (isLocal) return local;
  if (PRIVATE.test(host) || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) return false;   // no LAN
  return true;
}

// ---- M3: Google sign-in in the system browser ----
const b64url = buf => Buffer.from(buf).toString('base64url');
function pkcePair() { const verifier = b64url(crypto.randomBytes(32)); return { verifier, challenge: b64url(crypto.createHash('sha256').update(verifier).digest()) }; }
const page = body => `<!doctype html><meta charset="utf-8"><title>Prvlar</title><p style="font:16px system-ui;padding:24px">${body}</p>`;
function decodeJwt(t) { try { return JSON.parse(Buffer.from(String(t).split('.')[1], 'base64url').toString()); } catch { return null; } }

function googleSignIn(req, deps) {
  const state = b64url(crypto.randomBytes(16)), nonce = b64url(crypto.randomBytes(16));
  const pkce = !!req.desktopClientId;
  const clientId = String(pkce ? req.desktopClientId : req.clientId || '');
  const { verifier, challenge } = pkcePair();
  return new Promise(resolve => {
    let done = false, redirect = '';
    const finish = r => { if (done) return; done = true; clearTimeout(timer); try { server.close(); } catch { /* closed */ } resolve(r); };
    const server = http.createServer((q, res) => {
      const u = new URL(q.url, 'http://127.0.0.1');
      if (pkce && u.pathname === '/oauth') {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }); res.end(page('You can close this tab and return to Prvlar.'));
        if (u.searchParams.get('state') !== state) return finish({ error: 'State mismatch' });
        if (u.searchParams.get('error')) return finish({ error: u.searchParams.get('error') });
        const body = new URLSearchParams({ code: u.searchParams.get('code') || '', client_id: clientId, code_verifier: verifier, redirect_uri: redirect, grant_type: 'authorization_code' });
        if (req.desktopSecret) body.set('client_secret', String(req.desktopSecret));   // Google's "installed app" secret is not confidential
        return deps.fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
          .then(r => r.json()).then(j => j.access_token ? finish({ access_token: j.access_token, expires_in: Number(j.expires_in) || 3600, scope: j.scope || '', id_token: j.id_token || '' }) : finish({ error: j.error || 'token exchange failed' }))
          .catch(() => finish({ error: 'token exchange failed' }));
      }
      if (!pkce && u.pathname === '/oauth' && q.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
        res.end(page('Finishing sign-in…') + '<script>fetch("/done",{method:"POST",headers:{"Content-Type":"text/plain"},body:location.hash.slice(1)}).then(function(){history.replaceState(null,"","/oauth");document.body.innerHTML="<p style=\\"font:16px system-ui;padding:24px\\">You can close this tab and return to Prvlar.</p>"})</script>');
        return;
      }
      if (!pkce && u.pathname === '/done' && q.method === 'POST') {
        let raw = ''; q.on('data', c => { raw += c; if (raw.length > 20000) q.destroy(); });
        q.on('end', () => {
          res.writeHead(204); res.end();
          const f = new URLSearchParams(raw);
          if (f.get('state') !== state) return finish({ error: 'State mismatch' });
          if (f.get('error')) return finish({ error: f.get('error') });
          const idt = f.get('id_token') || '';
          if (idt && decodeJwt(idt)?.nonce !== nonce) return finish({ error: 'Nonce mismatch' });
          finish({ access_token: f.get('access_token'), expires_in: Number(f.get('expires_in')) || 3600, scope: f.get('scope') || '', id_token: idt });
        });
        return;
      }
      res.writeHead(404); res.end();
    });
    const timer = setTimeout(() => finish({ error: 'timeout' }), req.timeoutMs || 180000);
    server.on('error', () => finish({ error: pkce ? 'Could not open a sign-in port' : 'Port 53682 is busy' }));
    server.listen(pkce ? 0 : (req.port || 53682), '127.0.0.1', () => {
      const port = server.address().port;
      redirect = pkce ? `http://127.0.0.1:${port}/oauth` : `http://localhost:${port}/oauth`;
      const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      const p = { client_id: clientId, redirect_uri: redirect, scope: String(req.scope || ''), state, include_granted_scopes: 'true', prompt: req.consent ? 'consent select_account' : 'select_account' };
      if (pkce) Object.assign(p, { response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256' });
      else Object.assign(p, { response_type: 'token id_token', nonce });
      for (const [k, v] of Object.entries(p)) auth.searchParams.set(k, v);
      deps.openExternal(auth.toString(), { port, redirect });
    });
  });
}
module.exports = { aiUrlAllowed, googleSignIn, pkcePair };
