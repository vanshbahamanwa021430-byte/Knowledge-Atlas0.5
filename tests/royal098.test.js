import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const lum = h => { const c = h.match(/\w\w/g).map(x => parseInt(x, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const vars = t => { const m = css.match(new RegExp(`:root\\[data-theme="${t}"\\] \\{([\\s\\S]*?)\\n\\}`)); return Object.fromEntries([...m[1].matchAll(/--([\w-]+):\s*#([0-9A-Fa-f]{6})/g)].map(x => [x[1], x[2]])); };

test('0.9.8 Royal + Royal Ivory: 8 looks plus Device, all old ones kept', () => {
  for (const t of ['light', 'dark', 'aesthetic', 'anime', 'glass', 'oldmoney', 'vintage', 'royal', 'royal-ivory']) assert.ok(main.includes(`'${t}'`), t);
});
test('0.9.8 Royal is the default only for new installs; existing users keep theirs', () => {
  assert.match(main, /readJSON\('prvlar-theme', null\) \?\? \(isExistingInstall\(\) \? 'system' : 'royal'\)/);
});
test('0.9.8 Royal text meets WCAG AA on every surface', () => {
  for (const t of ['royal', 'royal-ivory']) {
    const v = vars(t);
    for (const bg of ['bg', 'surface', 'surface-2', 'surface-3']) for (const ink of ['ink', 'ink-1', 'ink-2', 'ink-3', 'gold']) assert.ok(ratio(v[ink], v[bg]) >= 4.5, `${t} ${ink} on ${bg}: ${ratio(v[ink], v[bg]).toFixed(2)}`);
  }
  assert.ok(ratio('3A0D12', 'E8C27A') >= 4.5 && ratio('3A0D12', 'C9A24D') >= 4.5, 'maroon text on gold buttons');
});
