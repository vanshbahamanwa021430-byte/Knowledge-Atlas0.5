import test from 'node:test'; import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const g = createRequire(import.meta.url)('../electron/net-guard.cjs'), { googleSignIn, pkcePair } = g, aiUrlAllowed = (u, l) => g.aiUrlAllowed(new URL(u), l);
import { buildStudyPlan, adjustPlan, planProgress, toggleTask } from '../src/countdown.js';
test('AI URL allowlist', () => {
  assert.ok(aiUrlAllowed('https://generativelanguage.googleapis.com/v1/x'));
  for (const u of ['http://example.com', 'https://192.168.1.4/x', 'https://10.0.0.1', 'https://intranet', 'https://a.local/x', 'https://u:p@example.com', 'file:///etc/passwd']) assert.ok(!aiUrlAllowed(u), u);
  assert.ok(aiUrlAllowed('http://127.0.0.1:11434/api', true)); assert.ok(!aiUrlAllowed('http://127.0.0.1:11434/api', false));
});
test('PKCE pair is S256', () => { const { verifier, challenge } = pkcePair(); assert.equal(challenge, crypto.createHash('sha256').update(verifier).digest('base64url')); });
test('desktop PKCE sign-in: code exchanged, no token in URL', async () => {
  let authUrl, tokenBody;
  const p = googleSignIn({ desktopClientId: 'cid' }, {
    openExternal: u => { authUrl = new URL(u); const back = new URL(authUrl.searchParams.get('redirect_uri')); back.searchParams.set('code', 'C1'); back.searchParams.set('state', authUrl.searchParams.get('state')); fetch(back).catch(() => {}); },
    fetch: async (u, o) => { tokenBody = new URLSearchParams(o.body); return { json: async () => ({ access_token: 'AT', id_token: 'IT', expires_in: 3600 }) }; },
  });
  const r = await p;
  assert.equal(authUrl.searchParams.get('code_challenge_method'), 'S256'); assert.equal(authUrl.searchParams.get('response_type'), 'code');
  assert.equal(tokenBody.get('code'), 'C1'); assert.ok(tokenBody.get('code_verifier')); assert.equal(r.id_token, 'IT');
});
test('study plan adjusts missed tasks', () => {
  const plan = buildStudyPlan({ examDate: '2026-11-10', today: '2026-10-31', topics: [{ title: 'A' }, { title: 'B' }, { title: 'C' }] });
  assert.equal(plan.days.length, 10); const first = plan.days[0].tasks[0];
  const later = adjustPlan(plan, '2026-11-02'); assert.ok(later.moved >= 1); assert.ok(later.days.every(d => d.date >= '2026-11-02'));
  assert.equal(planProgress(toggleTask(plan, first.id)).done, 1);
  assert.throws(() => buildStudyPlan({ examDate: '2026-10-31', today: '2026-10-31', topics: [{ title: 'A' }] }));
});
