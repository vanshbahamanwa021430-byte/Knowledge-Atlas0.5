// Writes the public edition's source tree (personal blocks and university-only files removed) to a folder,
// so it can be scanned for personal data and its tests run on exactly the code the public app ships.
import { cpSync, existsSync, symlinkSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripEdition } from '../vite.config.js';
const out = process.argv[2] || '/tmp/ka-public', ONLY_PERSONAL = /(^|\/)owner(\/|$)/;
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const copy = (from, to) => readdirSync(from).forEach(f => {
  const a = join(from, f), b = join(to, f);
  if (ONLY_PERSONAL.test(a) || f === 'm') return;
  if (statSync(a).isDirectory()) { mkdirSync(b, { recursive: true }); return copy(a, b); }
  if (/\.(js|css)$/.test(f)) writeFileSync(b, stripEdition(readFileSync(a, 'utf8'), 'public')); else cpSync(a, b);
});
for (const d of ['src', 'tests']) { mkdirSync(join(out, d), { recursive: true }); copy(d, join(out, d)); }
cpSync('package.json', join(out, 'package.json'));
// Read-only assets some tests inspect (OCR data, manifest, Android resources) are linked, minus personal-only files.
for (const d of ['public', 'resources', 'android', 'index.html', 'THIRD_PARTY_NOTICES.md']) if (existsSync(d)) symlinkSync(join(process.cwd(), d), join(out, d));
console.log('Public source written to ' + out);
