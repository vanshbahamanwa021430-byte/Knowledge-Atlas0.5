import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const g = css.slice(css.indexOf('/* 0.9.8 Glass fix'));

test('0.9.8 glass: vivid fallback background when no photo, lighter tint, frosted cards with -webkit- prefix', () => {
  assert.match(g, /--glass-fallback: radial-gradient/);
  assert.match(g, /:root\[data-theme="glass"\]:not\(\[style\*="--glass-photo"\]\) body::before/);
  assert.match(g, /-webkit-backdrop-filter: blur\(20px\) saturate\(1\.4\); backdrop-filter: blur\(20px\) saturate\(1\.4\)/);
  assert.match(g, /inset 0 1px 0 rgba\(255, 255, 255/);
});
test('0.9.8 glass: solid-enough fallback where backdrop-filter is unsupported; no :is() in any glass section', () => {
  assert.match(g, /@supports not \(\(-webkit-backdrop-filter: blur\(1px\)\) or \(backdrop-filter: blur\(1px\)\)\)/);
  const s93 = css.slice(css.indexOf('/* 0.9.3 Glass everywhere'), css.indexOf('/* 0.9.4 Glass readability'));
  assert.ok(!s93.includes(':is(') && !g.includes(':is('));
});
