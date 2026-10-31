import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
// Android WebView < 88 / iOS < 14 drop a whole rule that contains :is(), so none may appear anywhere (0.9.8 review M6).
test('style.css has no :is() anywhere (old WebViews drop the whole rule)', () => {
  const hits = css.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.includes(':is('));
  assert.deepEqual(hits.map(([n]) => n), [], 'lines with :is(: ' + hits.map(([n]) => n).join(', '));
});
test('the AA contrast fixes for dark/aesthetic outline buttons are plain selector lists', () => {
  assert.match(css, /:root\[data-theme="dark"\] \.btn\.outline, :root\[data-theme="dark"\] \.link-btn/);
  assert.match(css, /:root\[data-theme="aesthetic"\] \.btn\.outline, :root\[data-theme="aesthetic"\] \.link-btn/);
});
