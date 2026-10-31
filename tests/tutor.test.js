import test from 'node:test';
import assert from 'node:assert/strict';
import { tokens, chunkDocs, buildIndex, retrieve, resolveCitations, makeTrace, searchTraces, traceFromAttempt, emptyProfile, updateProfile, weakTopics, strongTopics, levelFor, difficultyFor, practiceTargets, validatePractice, traceFromPractice, profileHint } from '../src/tutor.js';
import { planPrompt } from '../src/examprofile.js';

const docs = [
  { id: 'd1', name: 'physics.pdf', sections: [{ ref: 'Page 3', text: 'Kinetic energy of a moving body equals half m v squared. '.repeat(3) }, { ref: 'Page 4', text: 'Potential energy depends on height and gravity: m g h.' }] },
  { id: 'd2', name: 'bio.md', sections: [{ ref: '2.1 Photosynthesis', text: 'Plants convert light into chemical energy in chloroplasts using chlorophyll.' }] }
];
test('tokens drop stop words and stem', () => { assert.deepEqual(tokens('The plants are converting'), ['plant', 'convert']); });
test('chunks keep doc, section and page', () => {
  const c = chunkDocs(docs); assert.equal(c.length, 3); assert.equal(c[0].page, 3); assert.equal(c[2].page, null); assert.equal(c[2].docName, 'bio.md');
  const long = chunkDocs([{ id: 'x', sections: [{ ref: 'A', text: Array(300).fill('word').join(' ') }] }]); assert.equal(long.length, 3);
});
test('hybrid retrieval finds the right chunk, incl. spelling variants', () => {
  const idx = buildIndex(chunkDocs(docs));
  assert.equal(retrieve(idx, 'what is kinetic energy?')[0].ref, 'Page 3');
  assert.equal(retrieve(idx, 'chloroplast light')[0].docId, 'd2');
  assert.equal(retrieve(idx, 'photosynthesys plants')[0].docId, 'd2');
  assert.deepEqual(retrieve(idx, 'the of and'), []);
  assert.deepEqual(retrieve(buildIndex([]), 'x'), []);
});
test('citations map to doc and page, unknown markers removed', () => {
  const ch = chunkDocs(docs); const r = resolveCitations('KE is ½mv² [S1]. Bogus [S9].', ch);
  assert.equal(r.text, 'KE is ½mv² [1]. Bogus .'); assert.equal(r.sources[0].cite, 'physics.pdf › Page 3, p. 3');
});
test('traces are searchable', () => {
  const t = [makeTrace({ kind: 'tutor', topic: 'Kinetic energy', summary: 'asked about KE', at: 1 }), makeTrace({ kind: 'test', topic: 'Bio', mistakes: [{ topic: 'Photosynthesis', prompt: 'Where?' }], at: 2 })];
  assert.equal(searchTraces(t, '').length, 2); assert.equal(searchTraces(t, 'photosynthesis')[0].kind, 'test'); assert.equal(searchTraces(t, 'zebra').length, 0);
});
const attempt = { documentId: 'd1', documentName: 'physics.pdf', percent: 50, earned: 1, total: 2, submittedAt: 5,
  questions: [{ id: 'q1', marks: 1, source: 'Page 3', prompt: 'KE?' }, { id: 'q2', marks: 1, source: 'Page 4', prompt: 'PE?' }],
  grades: [{ id: 'q1', awarded: 1 }, { id: 'q2', awarded: 0, feedback: 'wrong' }] };
test('attempt -> trace -> profile: weak and strong topics', () => {
  const tr = traceFromAttempt(attempt, [{ topic: 'Page 3', earned: 1, total: 1, percent: 100 }, { topic: 'Page 4', earned: 0, total: 1, percent: 0 }]);
  assert.equal(tr.mistakes.length, 1); assert.equal(tr.mistakes[0].topic, 'Page 4');
  let p = emptyProfile(); for (let i = 0; i < 3; i++) p = updateProfile(p, tr);
  assert.equal(weakTopics(p)[0].name, 'Page 4'); assert.equal(strongTopics(p)[0].name, 'Page 3');
  assert.equal(p.recent.length, 3); assert.equal(p.sessions, 3); assert.match(profileHint(p), /Weak topics: Page 4/);
  assert.equal(levelFor(p, 'Page 4'), 'beginner'); assert.equal(levelFor(p, 'Page 3'), 'advanced');
  assert.equal(practiceTargets(p, 2)[0].topic, 'Page 4'); assert.equal(practiceTargets(p, 2)[0].difficulty, 'easy');
});
test('difficulty calibration', () => { assert.equal(difficultyFor(0.2), 'easy'); assert.equal(difficultyFor(0.5), 'medium'); assert.equal(difficultyFor(0.9), 'hard'); });
test('practice validation and verifier pass', () => {
  const raw = [{ prompt: 'KE?', options: ['a', 'b', 'c', 'd'], correct: 1, topic: 'KE', difficulty: 'easy' }, { prompt: 'bad', options: ['a'], correct: 0 }, { prompt: 'PE?', options: ['a', 'b', 'c', 'd'], correct: 2 }];
  assert.equal(validatePractice(raw).length, 2);
  const v = validatePractice(raw, [{ id: 'p1', valid: true, correct: 3 }, { id: 'p2', valid: false }]);
  assert.equal(v.length, 1); assert.equal(v[0].correct, 3); assert.ok(v[0].verified);
});
test('practice results feed the profile', () => {
  const items = validatePractice([{ prompt: 'a?', options: ['1', '2', '3', '4'], correct: 0, topic: 'Optics' }, { prompt: 'b?', options: ['1', '2', '3', '4'], correct: 1, topic: 'Optics' }]);
  const tr = traceFromPractice(items, { p1: 0, p2: 3 }); assert.equal(tr.score, 50); assert.equal(tr.mistakes.length, 1);
  const p = updateProfile(emptyProfile(), tr); assert.equal(p.topics.optics.mastery, 0.5);
});
test('exam plan prompt lists priority weak topics', () => {
  const plan = { profileName: 'End Sem', slots: [], traps: [], focus: ['Optics', 'Thermo'] };
  assert.match(planPrompt(plan, 'ctx'), /PRIORITY TOPICS[^\n]*Optics; Thermo/);
  assert.doesNotMatch(planPrompt({ ...plan, focus: [] }, 'ctx'), /PRIORITY/);
});
