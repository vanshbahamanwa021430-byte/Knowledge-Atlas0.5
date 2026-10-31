import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { exactStatus } from '../src/notify.js';

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
// android/ is generated (gitignored); on a fresh checkout check the script that writes the permissions.
const MF = new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url);
const manifest = readFileSync(existsSync(MF) ? MF : new URL('../scripts/native-assets.mjs', import.meta.url), 'utf8');
const lum = h => { const c = h.match(/\w\w/g).map(x => parseInt(x, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('0.9.4 glass: photo keeps a dark tint layer and text tokens are bright', () => {
  assert.match(css, /data-theme="glass"\] body::before \{\s*background:\s*linear-gradient\(180deg,\s*rgba\(5,\s*20,\s*14,\s*\.6\)/);
  assert.match(css, /var\(--glass-photo, linear-gradient/);   // the photo itself now comes from the owner pack or the user
  assert.ok(!css.slice(css.indexOf('/* 0.9.4 Glass')).includes(':is('), 'no :is() for old WebViews');
  for (const ink of ['F4FAF6', 'EEF6F1', 'E3EFE8']) assert.ok(ratio(ink, '2E4639') >= 4.5, ink); // vs the photo's darkened mid-tone
  assert.ok(ratio('FFE8D6', '7C2D12') >= 4.5); assert.ok(ratio('D1FAE5', '064E3B') >= 4.5); assert.ok(ratio('0B1F17', 'E6F6EC') >= 4.5);
});

test('0.9.4 exact alarms: manifest permissions and status mapping', () => {
  assert.match(manifest, /SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32"/);
  assert.match(manifest, /android\.permission\.USE_EXACT_ALARM"/);
  assert.equal(exactStatus({ exact_alarm: 'granted' }), 'granted');
  assert.equal(exactStatus({ exact_alarm: 'denied' }), 'denied');
  assert.equal(exactStatus({ exact_alarm: 'prompt' }), 'denied');
  assert.equal(exactStatus(undefined), 'unsupported');
});
