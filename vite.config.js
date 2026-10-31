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
      // The repo is read from the Pages address at runtime (<owner>.github.io/<repo>/download/), so no account name is baked in.
      const LATEST = '#latest', REL = '#rel';
      this.emitFile({ type: 'asset', fileName: 'download/index.html', source: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Download Knowledge Atlas</title><meta name="description" content="Download Knowledge Atlas for Android, Windows, iPhone/iPad (web app) or use it in your browser.">
<link rel="icon" href="../icons/icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="../icons/apple-touch-icon.png"><link rel="manifest" href="../manifest.webmanifest"><meta name="theme-color" content="#F4F7FC"><meta name="color-scheme" content="light dark">
<style>
:root{--bg:#F4F7FC;--card:#fff;--text:#0f172a;--muted:#475569;--line:#e2e8f0;--accent:#4f46e5;--accent2:#7c3aed;--ok:#047857}
@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#121a2e;--text:#e5e7eb;--muted:#9aa4b2;--line:#24304a;--accent:#818cf8;--accent2:#a78bfa;--ok:#34d399}}
*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text)}
main{max-width:920px;margin:0 auto;padding:max(24px,env(safe-area-inset-top)) 20px 64px}
.top{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap}.brand{display:flex;gap:12px;align-items:center;font-weight:700;font-size:1.1rem;color:inherit;text-decoration:none}.brand img{width:40px;height:40px;border-radius:10px}
.hero{text-align:center;padding:36px 0 18px}.hero h1{font-size:clamp(1.8rem,5vw,2.6rem);margin:.2em 0;letter-spacing:-.02em}.hero p{color:var(--muted);max-width:560px;margin:0 auto}
.ver{display:inline-block;margin-top:10px;padding:3px 12px;border-radius:999px;border:1px solid var(--line);color:var(--muted);font-size:.85rem}
.primary{margin:26px auto 8px;max-width:560px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,.06)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 22px;border-radius:999px;font-weight:650;text-decoration:none;border:1px solid var(--line);color:var(--text);background:transparent}
.btn.main{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:0;width:100%;font-size:1.05rem}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-top:28px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px}.card h2{margin:0 0 6px;font-size:1.15rem}.card .btn{width:100%;margin-top:8px}
.card.is-you{outline:2px solid var(--accent)}.you{font-size:.75rem;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
ol{padding-left:1.2em;margin:.6em 0}li{margin:.2em 0}.fine{color:var(--muted);font-size:.88rem}code{font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;word-break:break-all;background:rgba(127,127,127,.12);padding:2px 6px;border-radius:6px}
footer{margin-top:40px;text-align:center;color:var(--muted);font-size:.9rem}footer a{color:inherit;margin:0 8px}
</style></head><body><main>
<div class="top"><a class="brand" href="../"><img src="../icons/icon-192.png" alt="">Knowledge Atlas</a><a class="btn" href="../">Open the web app</a></div>
<section class="hero"><h1>Get Knowledge Atlas</h1><p>Turn your notes into a study map, practise with tests made for you, and ask Smarty when you’re stuck. Free, private, works offline.</p><span class="ver" id="ver">Version ${v}</span></section>
<section class="primary" id="primary" aria-live="polite"></section>
<div class="grid">
<article class="card" id="c-android"><h2>Android</h2><p class="fine">Phones and tablets, Android 6+. <span data-size="apk"></span></p>
<a class="btn main" id="apk" href="${LATEST}/KnowledgeAtlas-${v}.apk">Download APK</a>
<ol><li>Tap <b>Download APK</b> and open the file.</li><li>If asked, allow <b>Install unknown apps</b> for your browser.</li><li>Tap <b>Install</b>. Updates install over it and keep your data.</li></ol>
<p class="fine">SHA-256: <code id="sha">see the release page</code></p></article>
<article class="card" id="c-ios"><h2>iPhone and iPad</h2><p class="fine">Install the web app on your Home Screen. App Store version coming later.</p>
<a class="btn main" href="../">Open the web app</a>
<ol><li>Open it in <b>Safari</b>.</li><li>Tap <b>Share</b> (square with an arrow).</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol></article>
<article class="card" id="c-windows"><h2>Windows</h2><p class="fine">Windows 10 and 11, 64-bit.</p>
<a class="btn main" href="${LATEST}/KnowledgeAtlas-${v}-windows-setup.exe">Download installer <span data-size="exe"></span></a>
<a class="btn" href="${LATEST}/KnowledgeAtlas-${v}-windows-x64.zip">Portable zip <span data-size="zip"></span></a>
<p class="fine">If SmartScreen warns, choose <b>More info › Run anyway</b> (the app isn’t code-signed yet).</p></article>
<article class="card" id="c-web"><h2>Web</h2><p class="fine">Any modern browser on any device. Install it from the address bar for offline use.</p>
<a class="btn main" href="../">Open in browser</a><a class="btn" href="${LATEST}/KnowledgeAtlas-${v}-web.zip">Self-host (web zip) <span data-size="web"></span></a></article>
</div>
<p class="fine" style="text-align:center;margin-top:20px">All files: <a href="${REL}/latest">latest release on GitHub</a></p>
<footer><a href="../privacy/">Privacy policy</a>·<a href="../terms/">Terms</a>·<a href="../#licenses">Licences</a>·<a href="../about/">About</a></footer>
</main><script>
(function(){
var own=location.hostname.split('.')[0],seg=location.pathname.split('/').filter(Boolean),repo=/github\.io$/.test(location.hostname)&&seg.length>1?own+'/'+seg[0]:(document.documentElement.dataset.repo||'');
var REL='https://github.com/'+repo+'/releases';
document.querySelectorAll('a[href^="#latest/"]').forEach(function(a){a.href=REL+'/latest/download/'+a.getAttribute('href').slice(8)});
document.querySelectorAll('a[href="#rel/latest"]').forEach(function(a){a.href=REL+'/latest'});
var ua=navigator.userAgent||'',p=navigator.platform||'';
var os=/android/i.test(ua)?'android':(/iPad|iPhone|iPod/.test(ua)||(p==='MacIntel'&&navigator.maxTouchPoints>1))?'ios':/Windows/i.test(ua)?'windows':'web';
var names={android:'Android',ios:'iPhone / iPad',windows:'Windows',web:'the web'};
var card=document.getElementById('c-'+os);card.classList.add('is-you');card.insertAdjacentHTML('afterbegin','<span class="you">Your device</span>');
var main=card.querySelector('.btn.main').cloneNode(true);
document.getElementById('primary').innerHTML='<p class="fine" style="margin:0 0 10px;text-align:center">Recommended for '+names[os]+'</p>';document.getElementById('primary').appendChild(main);
var mb=function(n){return n?'('+(n/1048576).toFixed(1)+' MB)':''};
if(repo)fetch('https://api.github.com/repos/'+repo+'/releases/latest').then(function(r){return r.ok?r.json():null}).then(function(j){if(!j)return;
  document.getElementById('ver').textContent='Version '+String(j.tag_name||'').replace(/^v/,'')+(j.published_at?' · '+new Date(j.published_at).toLocaleDateString():'');
  (j.assets||[]).forEach(function(a){var k=/\.apk$/.test(a.name)?'apk':/setup\.exe$/.test(a.name)?'exe':/windows-x64\.zip$/.test(a.name)?'zip':/-web\.zip$/.test(a.name)?'web':'';if(!k)return;
    document.querySelectorAll('[data-size="'+k+'"]').forEach(function(e){e.textContent=mb(a.size)});
    document.querySelectorAll('a[href$="'+(k==='apk'?'.apk':k==='exe'?'setup.exe':k==='zip'?'windows-x64.zip':'-web.zip')+'"]').forEach(function(l){l.href=a.browser_download_url});
    if(k==='apk'&&a.digest)document.getElementById('sha').textContent=String(a.digest).replace(/^sha256:/,'');});
}).catch(function(){});
})();
</script></body></html>` });
      this.emitFile({ type: 'asset', fileName: 'about/index.html', source: page('About', `<h1>Study smarter with your own notes</h1><p>Knowledge Atlas turns your PDFs, notes and photos into a study map, practice tests in real exam styles, flashcards and a plan. Smarty, the built-in tutor, answers from your documents with citations, and Smarty Code teaches programming step by step.</p><p><a class="btn" href="../">Open the app</a> <a class="btn" href="../download/" style="background:transparent;color:inherit;border:1px solid currentColor">Download for Android, Windows, iPhone</a></p>
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
