// Regression tests from the 0.9.2 QA pass: theme text colours must stay readable (WCAG AA, 4.5:1).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
function themeVars(theme) {
  const vars = {};
  const blocks = [...css.matchAll(/(^|\n)\s*(:root(?:\[data-theme="([a-z]+)"\])?)\s*\{([^}]*)\}/g)];
  // plain :root first, then the theme's own blocks (higher specificity wins, as in the browser)
  for (const m of [...blocks.filter(b => !b[3]), ...blocks.filter(b => b[3] === theme)]) {
    for (const d of m[4].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) vars[d[1]] = d[2].trim();
  }
  return vars;
}
const lum = hex => { const h = hex.replace('#', ''); const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const t of ['light', 'dark', 'aesthetic', 'anime', 'oldmoney', 'vintage']) {
  test(`${t}: secondary text (--ink-3) is readable on surface and background`, () => {
    const v = themeVars(t);
    for (const bg of ['--surface', '--bg']) if (/^#[0-9a-f]{6}$/i.test(v[bg] || '')) assert.ok(ratio(v['--ink-3'], v[bg]) >= 4.5, `${t} ink-3 ${v['--ink-3']} on ${bg} ${v[bg]}: ${ratio(v['--ink-3'], v[bg]).toFixed(2)}`);
  });
}
test('planner chips use the theme surface, not a hard-coded white fallback', () => {
  const rules = [...css.matchAll(/(^|\})\s*\.chip-btn\s*\{([^}]*)\}/g)].map(m => m[2]);
  assert.match(rules.at(-1), /background:\s*var\(--surface\)/);
});
test('WhatsApp button keeps white text readable', () => {
  const bg = [...css.matchAll(/\.wa-btn[^{]*\{[^}]*background:\s*(#[0-9a-f]{6})/gi)].at(-1)[1];
  assert.ok(ratio('#ffffff', bg) >= 4.5);
});
test('paper rows cannot overflow the card', () => { assert.match(css, /\.paper-list li\s*\{\s*min-width:\s*0/); });
test('desktop sidebar selected item uses --blue-ink in dark, aesthetic and vintage', () => { assert.match(css, /\[data-theme="dark"\], \[data-theme="aesthetic"\], \[data-theme="vintage"\]\) \.side-link\.is-on \{ color: var\(--blue-ink\)/); });
test('University subject list rows keep their height inside the scrolling list', () => { assert.match(css, /\.sub-list \{ grid-auto-rows: max-content/); });
test('glass: body stays transparent so the fixed background layer shows on every screen; no opaque violet leftovers', () => {
  assert.match(css, /:root\[data-theme="glass"\] body \{ background: transparent; \}/);
  assert.match(css, /:root\[data-theme="glass"\] :is\(\.sidebar, \.topbar, \.tabbar\)/);
  const fallback = [...css.matchAll(/@supports not[^{]*\{\s*:root\[data-theme="glass"\] \{([^}]*)\}/g)].at(-1)[1];
  for (const a of fallback.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)) assert.ok(+a[1] < 0.9, 'fallback surface is opaque: ' + a[0]);
});
