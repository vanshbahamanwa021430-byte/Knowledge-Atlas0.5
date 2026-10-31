import test from 'node:test'; import assert from 'node:assert/strict';
import { explainSelectionPrompt, explainSelection } from '../src/ai.js';
const FULL = Array.from({ length: 200 }, (_, i) => `Paragraph ${i}: filler about topic ${i}.`).join('\n');
test('regression: Smarty explains sends the selection (+small context), never the whole document', async () => {
  const selection = 'Newton’s third law: every action has an equal and opposite reaction.';
  const { system, user } = explainSelectionPrompt({ title: 'Physics', selection, before: 'Paragraph 9: filler about topic 9.', after: 'Paragraph 11: filler about topic 11.' });
  assert.match(system, /Explain ONLY the selected passage/);
  assert.ok(user.includes(selection)); assert.ok(user.includes('Physics'));
  assert.ok(!user.includes('Paragraph 150'), 'no far-away document text');
  assert.ok(user.length < 2000);
  let sent; globalThis.fetch = async (u, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify({ choices: [{ message: { content: '{"explanation":"Forces come in pairs."}' } }] })); };
  const out = await explainSelection({ title: 'Physics', selection, before: FULL, after: FULL }, 'AIzaTESTKEYTESTKEYTESTKEYTESTKEYTEST1');
  assert.equal(out, 'Forces come in pairs.');
  const u = sent.messages.find(m => m.role === 'user').content;
  assert.ok(u.includes(selection)); assert.ok(u.length < 1400 + selection.length + 400, 'context is clipped');
  assert.ok(!u.includes('Paragraph 0:') && !u.includes('Paragraph 199:') || u.split('Paragraph').length < 40);
});
