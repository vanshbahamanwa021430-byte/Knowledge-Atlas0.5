import { defineConfig } from 'vite';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Lists every file in public/ (icons, manifest, compat.js) for the offline cache.
// Big runtimes (Pyodide, OCR) are cached on first use instead of at install, so the website installs quickly.
const LAZY = /^(pyodide|ocr)\//;
function publicFiles(dir = 'public', root = dir) {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? publicFiles(p, root) : [relative(root, p).split('\\').join('/')]; });
}

// Writes sw.js: caches the built app so the website version works offline once installed
// ("Add to Home Screen" on iPhone/Android). The Android, iOS and Windows apps don't use it.
function offlineCache() {
  return {
    name: 'atlas-offline-cache', apply: 'build', enforce: 'post',
    generateBundle(_, bundle) {
      const files = ['./', './index.html', ...Object.keys(bundle).filter(f => !f.endsWith('.map') && f !== 'index.html').map(f => './' + f), ...publicFiles().filter(f => !LAZY.test(f)).map(f => './' + f)];
      const version = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 10);
      const source = `// Generated at build time. Offline cache for the installable web version of Knowledge Atlas.
const CACHE = 'atlas-${version}';
const FILES = ${JSON.stringify([...new Set(files)])};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('atlas-') && k !== CACHE && k !== 'atlas-lazy').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   // AI requests are never cached
  const lazy = /\/(pyodide|ocr)\//.test(new URL(req.url).pathname);
  e.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(hit => hit || fetch(req).then(res => {
    if (lazy && res.ok) { const copy = res.clone(); caches.open('atlas-lazy').then(c => c.put(req, copy)); }
    return res;
  }).catch(() => req.mode === 'navigate' ? caches.match('./index.html', { ignoreVary: true }) : Response.error())));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    }
  };
}

// One app. Owner-only content is not in the source tree; it ships as an encrypted owner pack (owner/, npm run owner-pack).
// stripEdition stays as a guard: any leftover //#if PERSONAL block would be dropped from the bundle.
export function stripEdition(code) {
  return code.replace(/(^[ \t]*\/\/#if PERSONAL\b[\s\S]*?^[ \t]*\/\/#endif[^\n]*$)|(\/\*#if PERSONAL\*\/[\s\S]*?\/\*#endif\*\/)/gm, '').replace(/^[ \t]*\/\/#(if PUBLIC|endif)[^\n]*$/gm, '');
}
function edition() {
  return { name: 'atlas-edition', enforce: 'pre', transform(code, id) { if (/\/src\/.*\.(js|css)$/.test(id.split('?')[0]) && /#if (PERSONAL|PUBLIC)/.test(code)) return { code: stripEdition(code), map: null }; } };
}

// Website pages that must exist as real URLs: /privacy and /terms (linked from the Google OAuth consent screen)
// and /about (landing page). They reuse the in-app text from src/legal.js. Relative links keep them base-path aware.
function staticPages() {
  return {
    name: 'atlas-static-pages', apply: 'build',
    async generateBundle() {
      const { privacyHTML, termsHTML } = await import('./src/legal.js');
      const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Knowledge Atlas</title><link rel="icon" href="../icons/icon-192.png"><meta name="color-scheme" content="light dark"><style>body{font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#111827;background:#f8fafc}main{max-width:760px;margin:0 auto;padding:32px 20px 64px}header{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}a{color:#1d4ed8}h1{font-size:2rem;margin:.4em 0}h2{font-size:1.2rem;margin-top:1.6em}.fine{color:#4b5563;font-size:.9rem}.btn{display:inline-block;padding:12px 20px;border-radius:999px;background:#111827;color:#fff;text-decoration:none;font-weight:600}.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));padding:0;list-style:none}.grid li{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px}@media(prefers-color-scheme:dark){body{background:#0b1020;color:#e5e7eb}a{color:#93c5fd}.fine{color:#9ca3af}.grid li{background:#111827;border-color:#1f2937}.btn{background:#e5e7eb;color:#111827}}</style></head><body><main><header><a href="../">Knowledge Atlas</a><nav><a href="../about/">About</a> · <a href="../privacy/">Privacy</a> · <a href="../terms/">Terms</a></nav></header>${body}</main></body></html>`;
      const v = pkg.version;
      this.emitFile({ type: 'asset', fileName: 'privacy/index.html', source: page('Privacy policy', `<h1>Privacy policy</h1>${privacyHTML({ version: v, updateCheck: false })}`) });
      this.emitFile({ type: 'asset', fileName: 'terms/index.html', source: page('Terms', `<h1>Terms and disclaimer</h1>${termsHTML()}`) });
      this.emitFile({ type: 'asset', fileName: 'about/index.html', source: page('About', `<h1>Study smarter with your own notes</h1><p>Knowledge Atlas turns your PDFs, notes and photos into a study map, practice tests in real exam styles, flashcards and a plan. Smarty, the built-in tutor, answers from your documents with citations, and Smarty Code teaches programming step by step.</p><p><a class="btn" href="../">Open the app</a></p>
<ul class="grid"><li><b>Private by default</b><br>Everything stays on your device. No account needed.</li><li><b>Bring your own AI</b><br>Free Gemini or Groq keys, or your own server.</li><li><b>Works offline</b><br>Install it from your browser; reading, OCR and running Python/JavaScript work without internet.</li><li><b>Optional sync</b><br>Sign in with Google to sync through a private folder in your own Drive.</li></ul>
<p class="fine">Version ${v}. Free and open-source components; see Licences inside the app.</p>`) });
    }
  };
}

export default defineConfig({
  // Relative asset URLs: required for Capacitor, the Electron app:// loader and hosting in a sub-folder.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __PUBLIC__: 'true', __EDITION__: JSON.stringify('app') },
  build: {
    outDir: process.env.ATLAS_OUT || 'dist',
    // 2019-era engines (Android WebView 73+, iOS 13+ Safari) so older phones and tablets still run the app.
    // pdf.js is loaded from its "legacy" build, which also supports these engines.
    target: ['es2019', 'chrome73', 'safari13', 'firefox68', 'edge79'],
    chunkSizeWarningLimit: 2000
  },
  plugins: [edition(), offlineCache(), staticPages()]
});
