// SUPERSEDED in 0.9.0: app icons now come from the chosen artwork via scripts/icon-from-image.py (npm run assets).
// Kept for reference only; running it would overwrite those icons with the old drawn mark.
// Renders the app icon, splash screens and web-app icons from scripts/brand.mjs.
// Dev-only (needs Playwright). Output PNGs are committed in resources/ and public/icons/,
// so CI builds never need an image tool. Run: node scripts/make-assets.mjs
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';
import { markSVG, BRAND } from './brand.mjs';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const font = pathToFileURL(resolve(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).href;
const out = p => { const f = resolve(root, p); mkdirSync(dirname(f), { recursive: true }); return f; };

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage();
const tmp = out('scripts/.render.html');
async function shot(html, w, h, file, transparent = true) {
  writeFileSync(tmp, `<!doctype html><html><head><style>@font-face{font-family:Inter;font-weight:100 900;src:url(${font}) format('woff2')}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;${transparent ? 'background:transparent' : ''}}svg{display:block}</style></head><body>${html}</body></html>`);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out(file), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
}
const sized = (svg, n) => svg.replace(/width="\d+" height="\d+"/, `width="${n}" height="${n}"`);

// iOS app icon: opaque, full-bleed square (iOS rounds the corners itself).
await shot(sized(markSVG({ tile: 'square' }), 1024), 1024, 1024, 'resources/ios/AppIcon-1024.png', false);

// Android launcher icons: legacy square and round icons, and the white glyph for the adaptive icon
// (its blue gradient background is drawn by native-assets.mjs as an Android drawable).
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  await shot(sized(markSVG({ tile: 'rounded', inset: 1.08 }), 48 * k), 48 * k, 48 * k, `resources/android/mipmap-${d}/ic_launcher.png`);
  await shot(sized(markSVG({ tile: 'circle', inset: 0.9 }), 48 * k), 48 * k, 48 * k, `resources/android/mipmap-${d}/ic_launcher_round.png`);
  await shot(sized(markSVG({ tile: 'none', inset: 1 }), 108 * k), 108 * k, 108 * k, `resources/android/mipmap-${d}/ic_launcher_foreground.png`);
  // Launch screen logo for Android 6–11 (Android 12+ shows the launcher icon). Icon only, so it suits light and dark.
  await shot(`<div style="width:${144 * k}px;height:${144 * k}px;display:flex;align-items:center;justify-content:center">${sized(markSVG({ tile: 'rounded' }), 112 * k)}</div>`, 144 * k, 144 * k, `resources/android/drawable-${d}/splash_logo.png`);
}

// iOS launch screen: the icon with the name underneath, centred on the app background (cropped to any screen shape).
const lockup = tile => `<div style="display:flex;flex-direction:column;align-items:center;gap:${tile * 0.2}px">${sized(markSVG({ tile: 'rounded' }), tile)}
  <div style="font:800 ${tile * 0.27}px/1 Inter;color:${BRAND.ink};letter-spacing:-.02em;white-space:nowrap">Prvlar</div></div>`;
await shot(`<div style="width:2732px;height:2732px;background:${BRAND.bg};display:flex;align-items:center;justify-content:center">${lockup(300)}</div>`, 2732, 2732, 'resources/ios/splash-2732.png', false);

// Installable web app (PWA) icons.
await shot(sized(markSVG({ tile: 'rounded' }), 192), 192, 192, 'public/icons/icon-192.png');
await shot(sized(markSVG({ tile: 'rounded' }), 512), 512, 512, 'public/icons/icon-512.png');
await shot(sized(markSVG({ tile: 'square', inset: 0.78 }), 512), 512, 512, 'public/icons/maskable-512.png', false);
await shot(sized(markSVG({ tile: 'square' }), 180), 180, 180, 'public/icons/apple-touch-icon.png', false);
await shot(sized(markSVG({ tile: 'rounded', inset: 1.15 }), 32), 32, 32, 'public/icons/favicon-32.png');
writeFileSync(out('public/icons/favicon.svg'), markSVG({ tile: 'rounded', inset: 1.12 }));
// Windows app icon (electron-builder): a 1024 PNG, turned into a multi-size .ico below.
await shot(sized(markSVG({ tile: 'rounded' }), 1024), 1024, 1024, 'resources/electron/icon.png');

await browser.close();
unlinkSync(tmp);
// Recompress the PNGs losslessly (keeps the gradients smooth); needs Python with Pillow.
try {
  const files = execSync('find resources public/icons -name "*.png"', { cwd: root }).toString().trim().split('\n').map(f => resolve(root, f));
  execFileSync('python3', ['-W', 'ignore', resolve(root, 'scripts/optimize-png.py'), ...files], { stdio: 'inherit' });
} catch (e) { console.warn('PNG optimisation skipped:', e.message); }
try {
  execFileSync('python3', ['-c', "from PIL import Image; im=Image.open('resources/electron/icon.png'); im.save('resources/electron/icon.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])"], { cwd: root, stdio: 'inherit' });
} catch (e) { console.warn('ICO skipped:', e.message); }
console.log('assets written');
