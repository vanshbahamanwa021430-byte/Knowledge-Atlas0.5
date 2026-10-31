// Windows desktop shell. Serves the built web app from a privileged app:// scheme (not file://) so that
// ES modules, web workers (pdf.js) and IndexedDB behave exactly as in a normal secure origin.
const { app, BrowserWindow, session, protocol, net, ipcMain, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const DIST = path.join(__dirname, '..', 'dist');   // the public installer maps dist-web here
const ORIGIN = 'app://atlas/';
const CSP = [
  "default-src 'self'",
  "script-src 'self' blob: 'wasm-unsafe-eval' 'unsafe-eval' https://open.spotify.com https://accounts.google.com",   // blob: = the owner pack's decrypted module
  "frame-src https://open.spotify.com",
  "media-src 'self' blob: mediastream:",   // unsafe-eval: Smarty Code runs student JavaScript in a sandboxed worker
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://upload.wikimedia.org https://*.googleusercontent.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://www.googleapis.com https://commons.wikimedia.org https://api.github.com",
  "object-src 'none'", "base-uri 'none'", "form-action 'none'"
].join('; ');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });

  app.whenReady().then(() => {
    protocol.handle('app', async request => {
      let rel = decodeURIComponent(new URL(request.url).pathname);
      if (rel === '/' || rel === '') rel = '/index.html';
      const full = path.normalize(path.join(DIST, rel));
      if (full !== DIST && !full.startsWith(DIST + path.sep)) return new Response('Forbidden', { status: 403 });   // block ../ traversal
      const res = await net.fetch(pathToFileURL(full).toString());
      const headers = new Headers(res.headers);
      headers.set('Content-Security-Policy', CSP);
      return new Response(res.body, { status: res.status, headers });
    });

    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

    // AI requests from the page (see preload.cjs). Only our own app:// page may call this, only http(s) POSTs.
    // Google sign-in on desktop: the system browser + a loopback page on http://localhost:53682/oauth (OAuth implicit
    // token flow of the web client; that redirect URI must be listed on the web client). No secret is involved.
    ipcMain.handle('google:token', async (event, req) => {
      if (!event.senderFrame || !event.senderFrame.url.startsWith(ORIGIN)) return { error: 'forbidden' };
      const http = require('http'), crypto = require('crypto'), state = crypto.randomBytes(16).toString('hex'), PORT = 53682, redirect = `http://localhost:${PORT}/oauth`;
      return new Promise(resolve => {
        let done = false; const finish = r => { if (done) return; done = true; clearTimeout(timer); try { server.close(); } catch {} resolve(r); };
        const server = http.createServer((q, res) => {
          const u = new URL(q.url, redirect);
          if (u.pathname === '/oauth') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><meta charset="utf-8"><title>Knowledge Atlas</title><p style="font:16px system-ui;padding:24px">Finishing sign-in…</p><script>location.replace("/done?"+location.hash.slice(1))</script>'); return; }
          if (u.pathname === '/done') {
            res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<!doctype html><meta charset="utf-8"><p style="font:16px system-ui;padding:24px">You can close this tab and return to Knowledge Atlas.</p>');
            if (u.searchParams.get('state') !== state) return finish({ error: 'State mismatch' });
            if (u.searchParams.get('error')) return finish({ error: u.searchParams.get('error') });
            return finish({ access_token: u.searchParams.get('access_token'), expires_in: Number(u.searchParams.get('expires_in')) || 3600 });
          }
          res.writeHead(404); res.end();
        });
        const timer = setTimeout(() => finish({ error: 'timeout' }), 180000);
        server.on('error', () => finish({ error: 'Port 53682 is busy' }));
        server.listen(PORT, '127.0.0.1', () => {
          const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
          for (const [k, v] of Object.entries({ client_id: String(req.clientId || ''), redirect_uri: redirect, response_type: 'token', scope: String(req.scope || ''), state, include_granted_scopes: 'true', prompt: 'select_account' })) auth.searchParams.set(k, v);
          shell.openExternal(auth.toString());
        });
      });
    });

    ipcMain.handle('ai:post', async (event, req) => {
      try {
        if (!String(event.senderFrame?.url || '').startsWith(ORIGIN)) return { error: 'forbidden' };
        const u = new URL(String(req?.url));
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'forbidden' };
        const headers = {};
        for (const [k, v] of Object.entries(req.headers || {})) if (/^(authorization|content-type)$/i.test(k)) headers[k] = String(v);
        const timeout = Math.min(Math.max(Number(req.timeout) || 120000, 5000), 600000);
        const res = await net.fetch(u.toString(), { method: 'POST', headers, body: String(req.body ?? ''), signal: AbortSignal.timeout(timeout) });
        return { status: res.status, text: await res.text() };
      } catch (e) {
        return { error: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'timeout' : 'network' };
      }
    });

    // Past-paper importer: GET only, public web pages (no local-network addresses).
    ipcMain.handle('net:get', async (event, req) => {
      try {
        if (!String(event.senderFrame?.url || '').startsWith(ORIGIN)) return { error: 'forbidden' };
        const u = new URL(String(req?.url));
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'forbidden' };
        if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) return { error: 'forbidden' };   // public pages only
        const timeout = Math.min(Math.max(Number(req.timeout) || 60000, 5000), 120000);
        const res = await net.fetch(u.toString(), { signal: AbortSignal.timeout(timeout) });
        const data = req.as === 'bytes' ? Buffer.from(await res.arrayBuffer()).toString('base64') : await res.text();
        return { status: res.status, data };
      } catch (e) { return { error: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'timeout' : 'network' }; }
    });

    const win = new BrowserWindow({
      width: 1250, height: 830, minWidth: 420, minHeight: 560, show: false, backgroundColor: '#F4F7FC', icon: path.join(DIST, 'icons', 'icon-512.png'),
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, preload: path.join(__dirname, 'preload.cjs') }
    });
    win.once('ready-to-show', () => win.show());
    // Only the "Message on WhatsApp" link may leave the app; it opens in the default browser or WhatsApp.
    const external = url => /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(url);
    win.webContents.setWindowOpenHandler(({ url }) => {
      // Spotify login opens in an app window (same session/cookies as the Spotify embed), everything else in the browser.
      if (/^https:\/\/accounts\.spotify\.com\//.test(url)) return { action: 'allow', overrideBrowserWindowOptions: { width: 480, height: 720, autoHideMenuBar: true } };
      if (external(url)) shell.openExternal(url); return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(ORIGIN)) { e.preventDefault(); if (external(url)) shell.openExternal(url); } });
    win.loadURL(ORIGIN + 'index.html');
  });

  app.on('window-all-closed', () => app.quit());
}
