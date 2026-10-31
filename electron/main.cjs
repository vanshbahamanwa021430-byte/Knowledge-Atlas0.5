// Windows desktop shell. Serves the built web app from a privileged app:// scheme (not file://) so that
// ES modules, web workers (pdf.js) and IndexedDB behave exactly as in a normal secure origin.
const { aiUrlAllowed, publicUrlAllowed, googleSignIn } = require('./net-guard.cjs');
const { app, BrowserWindow, session, protocol, net, ipcMain, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

// 0.9.8 rename: the app's data folder moved from %APPDATA%\Knowledge Atlas to %APPDATA%\Prvlar. Copy the old
// profile once (documents, settings, sign-in) before Chromium opens it; the old folder is left untouched.
try {
  const NEW = app.getPath('userData'), OLD = path.join(app.getPath('appData'), 'Knowledge Atlas');
  if (NEW !== OLD && fs.existsSync(OLD) && !fs.existsSync(path.join(NEW, '.migrated-from-knowledge-atlas')) && !fs.existsSync(path.join(NEW, 'IndexedDB'))) {
    fs.mkdirSync(NEW, { recursive: true });
    fs.cpSync(OLD, NEW, { recursive: true, force: false, errorOnExist: false, filter: src => !/(Singleton|lockfile|\.lock$)/i.test(path.basename(src)) });
    fs.writeFileSync(path.join(NEW, '.migrated-from-knowledge-atlas'), new Date().toISOString());
  }
} catch (e) { console.warn('profile migration skipped:', e.message); }

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
  "connect-src 'self' https://*.workers.dev https://api.openai.com https://generativelanguage.googleapis.com https://api.groq.com https://www.googleapis.com https://commons.wikimedia.org https://api.github.com https://script.google.com https://script.googleusercontent.com https://docs.google.com",
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

    // Google sign-in on desktop (0.9.9, review M3). Two flows, neither puts a token in a URL query string:
    //  - Desktop OAuth client configured (VITE_GOOGLE_DESKTOP_CLIENT_ID): authorization-code flow with PKCE (S256) on an
    //    ephemeral loopback port (http://127.0.0.1:<random>/oauth), code exchanged here in the main process.
    //  - Otherwise (web client, unchanged Google settings): implicit flow on the registered http://localhost:53682/oauth;
    //    the token fragment is POSTed to /done (body, not query), checked against state + nonce.
    ipcMain.handle('google:token', async (event, req) => {
      if (!event.senderFrame || !event.senderFrame.url.startsWith(ORIGIN)) return { error: 'forbidden' };
      return googleSignIn(req || {}, { openExternal: u => shell.openExternal(u), fetch: (u, o) => net.fetch(u, o) });
    });

    // AI requests from the page (see preload.cjs). 0.9.9 (review M4): https only, public hosts only; plain http just for
    // a local AI server on this computer (localhost / 127.0.0.1), which the user opts into in Settings.
    ipcMain.handle('ai:post', async (event, req) => {
      try {
        if (!String(event.senderFrame?.url || '').startsWith(ORIGIN)) return { error: 'forbidden' };
        const u = new URL(String(req?.url));
        if (!aiUrlAllowed(u, !!req?.local)) return { error: 'forbidden' };
        const headers = {};
        for (const [k, v] of Object.entries(req.headers || {})) if (/^(authorization|content-type)$/i.test(k)) headers[k] = String(v);
        const timeout = Math.min(Math.max(Number(req.timeout) || 120000, 5000), 600000);
        const res = await net.fetch(u.toString(), { method: 'POST', headers, body: String(req.body ?? ''), signal: AbortSignal.timeout(timeout), redirect: 'error' });
        return { status: res.status, text: await res.text() };
      } catch (e) {
        return { error: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'timeout' : 'network', detail: String(e?.cause?.code || e?.cause?.message || e?.message || '') };
      }
    });

    // Past-paper importer: GET only, public web pages (no local-network addresses).
    ipcMain.handle('net:get', async (event, req) => {
      try {
        if (!String(event.senderFrame?.url || '').startsWith(ORIGIN)) return { error: 'forbidden' };
        const u = new URL(String(req?.url));
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'forbidden' };
        if (!publicUrlAllowed(u)) return { error: 'forbidden' };   // public pages only (ECC M5)
        const timeout = Math.min(Math.max(Number(req.timeout) || 60000, 5000), 120000);
        let res, url = u, hops = 0;
        for (;;) {   // follow redirects by hand so every hop is re-checked
          res = await net.fetch(url.toString(), { signal: AbortSignal.timeout(timeout), redirect: 'manual' });
          if (res.status < 300 || res.status > 399 || !res.headers.get('location')) break;
          url = new URL(res.headers.get('location'), url); if (++hops > 5 || !publicUrlAllowed(url)) return { error: 'forbidden' };
        }
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
