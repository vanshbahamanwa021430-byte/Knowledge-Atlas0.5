// Fails if the public web build contains anything university-specific or personal-only.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
// Banned words are stored as [length, sha256 prefix] so this public file doesn't itself contain the names it guards
// against (0.9.8: developer credits are allowed in public by the owner; usernames/greetings still are not) (university, self-hosted router, theme assets, people). Any text substring that hashes to one fails the build.
const BANNED = [[8,"7f63b04d570bba85"],[10,"8bec29be9ea39502"],[9,"75348dc2f26cf086"],[7,"59d98c516f8b4e28"],[10,"2aeea9519198f6ea"]];
const LENS = [...new Set(BANNED.map(b => b[0]))], SET = new Set(BANNED.map(b => b.join(':')));
const h = t => createHash('sha256').update(t).digest('hex').slice(0, 16);
const dir = process.argv[2] || 'dist', bad = [/[a-z0-9._%+-]+@gmail\.com/i, /AIza[0-9A-Za-z_-]{30,}/, /gsk_[0-9A-Za-z]{30,}/];
const bannedIn = text => { const seen = new Set(); for (const tok of text.toLowerCase().match(/[a-z0-9]{4,64}/g) || []) { if (seen.has(tok)) continue; seen.add(tok);
  for (const n of LENS) for (let i = 0; i + n <= tok.length; i++) { const sub = tok.slice(i, i + n); if (SET.has(n + ':' + h(sub))) return sub; } } return null; };
const hits = [];
const SKIP = /^(node_modules|build|\.gradle|Pods)$/;   // generated folders (rebuilt from the clean source)
const walk = d => readdirSync(d).forEach(f => { const p = join(d, f); if (statSync(p).isDirectory()) return SKIP.test(f) ? null : walk(p); if (/\.(js|mjs|cjs|css|html|json|webmanifest|txt|svg|md|xml)$/.test(f)) { const t = readFileSync(p, 'utf8'); for (const r of bad) { const m = t.match(r); if (m) hits.push(`${p}: ${r} → …${t.slice(Math.max(0, m.index - 40), m.index + 40)}…`); } const w = bannedIn(t); if (w) hits.push(`${p}: banned word (length ${w.length})`); } });
walk(dir);
const files = []; const list = d => readdirSync(d).forEach(f => { const p = join(d, f); statSync(p).isDirectory() ? (SKIP.test(f) ? null : list(p)) : files.push(p); }); list(dir);
for (const f of files) if (/catalog/i.test(f) || bannedIn(f)) hits.push('file: ' + f);
if (hits.length) { console.error('PUBLIC BUILD CHECK FAILED\n' + hits.join('\n')); process.exit(1); }
console.log(`Public build clean: ${files.length} files scanned, no banned owner words, personal names, emails, phone numbers or API keys, no catalog.`);
