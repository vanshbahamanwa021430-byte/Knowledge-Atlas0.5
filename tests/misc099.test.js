import test from 'node:test'; import assert from 'node:assert/strict';
import { safeBgUrl } from '../src/safeurl.js';
import { drawerHTML, edgeSwipe } from '../src/drawer.js';
import { GROUPS, ALL_VIEWS } from '../src/nav.js';
import { ACTIONS, actionPrompt, parseCards, parseTasks, parseNotes, screenContext } from '../src/everywhere.js';
import { addDay } from '../src/countdown.js';
import { encodeWav } from '../src/voice.js';
import { weeklyReport, nextWeeklyAt } from '../src/weekly.js';
const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`), icon = n => `<i data-i="${n}"></i>`;
test('L6 glass background URL validation', () => {
  assert.equal(safeBgUrl('javascript:alert(1)'), ''); assert.equal(safeBgUrl('http://x/a.png'), '');
  assert.equal(safeBgUrl('https://x/a b").png'), 'https://x/a%20b%22%29.png'); assert.ok(safeBgUrl('data:image/png;base64,AAA'));
});
test('drawer lists every linked view, chats, account and settings; search filters', () => {
  const h = drawerHTML({ groups: GROUPS, convs: [{ id: 'c1', title: 'Beams chat' }], current: 'home' }, { icon, esc });
  for (const v of ['home', 'library', 'livemap', 'gaps', 'mission', 'planner', 'progress', 'cards', 'settings']) assert.match(h, new RegExp(`data-view="${v}"`), v);
  assert.match(h, /data-drconv="c1"/); assert.match(h, /aria-modal="true"/); assert.match(h, /Sign in/); assert.ok(!/data-view="dev"/.test(h));
  const f = drawerHTML({ groups: GROUPS, convs: [], query: 'living' }, { icon, esc }); assert.match(f, /Living Map/); assert.ok(!/data-view="planner"/.test(f));
  assert.ok(ALL_VIEWS.includes('mission'));
});
test('edge swipe', () => { assert.ok(edgeSwipe({ startX: 5, startY: 100, x: 90, y: 110 })); assert.ok(!edgeSwipe({ startX: 80, startY: 100, x: 200, y: 100 })); assert.ok(!edgeSwipe({ startX: 5, startY: 100, x: 70, y: 200 })); });
test('Smarty everywhere: all actions have prompts with screen context', () => {
  const c = screenContext({ view: 'section', viewLabel: 'Section', title: 'Shear', text: 'Shear force is V = dM/dx. '.repeat(10) });
  for (const a of ACTIONS) { const p = actionPrompt(a.id, c, 'why?'); assert.ok(/Shear/.test(p.user), a.id); }
  assert.deepEqual(parseCards({ cards: [{ front: 'Q', back: 'A' }, { front: '', back: 'x' }] }).length, 1);
  const t = parseTasks({ tasks: [{ title: 'Revise', day: 0 }, { title: 'Test', day: 2 }] }, '2026-10-31', addDay); assert.equal(t.length, 2); assert.equal(t[1].date, '2026-11-02');
  const n = parseNotes({ title: 'Shear', markdown: '# Shear\n- V = dM/dx' }, 'x'); assert.match(n.markdown, /Shear/);
});
test('voice WAV header', () => { const b = encodeWav(new Float32Array(160), 16000); const v = new DataView(b.buffer || b); assert.equal(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)), 'RIFF'); });
test('weekly report and Sunday reminder', () => {
  const w = weeklyReport({ today: '2026-10-31', day: d => ({ minutes: d === '2026-10-30' ? 30 : 0, reviews: 2 }), tests: ['2026-10-29'] });
  assert.equal(w.minutes, 30); assert.equal(w.reviews, 14); assert.equal(w.tests, 1);
  const at = new Date(nextWeeklyAt(new Date(2026, 9, 31, 12).getTime())); assert.equal(at.getDay(), 0); assert.equal(at.getHours(), 18);
});
