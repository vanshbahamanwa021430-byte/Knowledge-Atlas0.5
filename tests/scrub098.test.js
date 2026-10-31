import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrub } from '../src/report.js';
test('0.9.8 L5: report scrubber hides Google refresh tokens (1//…) and OAuth client secrets (GOCSPX-…)', () => {
  const rt = '1//' + '0gFAKEREFRESHTOKENabcdefghijkl', cs = 'GOCSPX' + '-FAKEsecretValue123';
  const out = scrub(`refresh ${rt} secret ${cs} end`);
  assert.ok(!out.includes(rt) && !out.includes(cs), out);
  assert.match(out, /refresh \[key\] secret \[key\] end/);
});
