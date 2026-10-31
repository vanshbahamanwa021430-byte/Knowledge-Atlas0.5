// Navigation reachability: every screen from 0.9.4 plus the new ones lives in exactly one group and can be reached
// from its tab (as the tab itself, a hub link, or a documented in-screen route).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GROUPS, TAB_OF, ALL_VIEWS } from '../src/nav.js';
const BEFORE = ['home', 'library', 'study', 'section', 'test', 'more', 'results', 'notes', 'chat', 'settings', 'about', 'cards', 'errors', 'planner', 'focus', 'progress', 'examlab'];
const NEW = ['smarty', 'licenses', 'privacy', 'terms', 'practice', 'plan'];
// Screens opened from inside another screen rather than a hub link.
const IN_SCREEN = { section: 'study (tap a section)' };
test('no screen from 0.9.4 is lost, new screens are registered', () => { for (const v of [...BEFORE, ...NEW]) assert.ok(ALL_VIEWS.includes(v), v); });
test('each screen belongs to exactly one group; at most 5 tabs', () => {
  assert.ok(GROUPS.length <= 5); assert.equal(new Set(ALL_VIEWS).size, ALL_VIEWS.length);
  for (const v of ALL_VIEWS) assert.ok(TAB_OF[v], v);
});
test('every screen is reachable from its tab', () => {
  for (const g of GROUPS) for (const v of g.views) {
    const linked = v === g.tab || (g.links || []).some(([to]) => to.split(':')[0] === v) || IN_SCREEN[v];
    assert.ok(linked, `${v} is not reachable from the ${g.label} tab`);
  }
});
test('main.js renders every registered screen', () => {
  const src = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  for (const v of ALL_VIEWS) assert.match(src, new RegExp(`case '${v}':`), v);
});
