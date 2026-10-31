import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { normalizeProfile, buildPlan, QTYPES } from '../src/examprofile.js';
import { blankPattern, patternErrors, patternTotals, profileFromPattern } from '../src/patternbuilder.js';

const dir = new URL('../src/exams/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
const raw = files.map(f => [f, JSON.parse(readFileSync(new URL(f, dir), 'utf8'))]);
const REQUIRED = ['jee-main', 'jee-advanced', 'neet-ug', 'cuet-ug', 'gate', 'gate-cse', 'gate-ece', 'gate-ee', 'gate-me', 'gate-ce', 'cat', 'upsc-prelims', 'upsc-csat', 'ssc-cgl', 'ssc-chsl', 'ibps-po', 'sbi-po', 'ibps-clerk', 'sbi-clerk', 'rrb-ntpc', 'nda-maths', 'nda-gat', 'clat-ug', 'bitsat', 'neet-pg', 'sat', 'gre', 'gmat', 'ielts'];
const GROUPS = ['Engineering', 'Medical', 'University entrance', 'School boards', 'Civil services', 'Government jobs', 'Banking', 'Defence', 'Law', 'Management', 'International'];

test('the registry covers every requested exam', () => {
  const ids = raw.map(([, p]) => p.id);
  for (const id of REQUIRED) assert.ok(ids.includes(id), `missing ${id}`);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
});
for (const [f, p] of raw) {
  test(`config ${f} is valid`, () => {
    assert.equal(f, p.id + '.json');
    assert.equal(p.schema, 'ka-exam-profile'); assert.equal(p.kind, 'builtin');
    assert.match(p.name, /-style$/, 'labelled -style');
    assert.ok(GROUPS.includes(p.group), `group ${p.group}`);
    const n = normalizeProfile(p);
    assert.equal(n.pattern.sections.length, p.pattern.sections.length);
    for (const s of p.pattern.sections) {
      assert.ok(QTYPES.includes(s.type)); assert.ok(s.count >= 1 && Number.isInteger(s.count)); assert.ok(s.marks > 0);
      assert.ok((s.negative || 0) >= 0 && (s.negative || 0) <= s.marks, `${s.name} negative`);
    }
    const total = p.pattern.sections.reduce((a, s) => a + s.count * s.marks, 0);
    assert.ok(Math.abs(total - p.pattern.totalMarks) < 0.5, `${p.id}: sections ${total} vs total ${p.pattern.totalMarks}`);
    assert.ok(p.pattern.durationMin >= 30 && p.pattern.durationMin <= 240);
    if (p.pattern.sectionalMin) assert.equal(p.pattern.sectionalMin.reduce((a, b) => a + b, 0), p.pattern.durationMin);
    assert.ok(p.topics?.length >= 3, 'syllabus topics');
    assert.ok(p.sources?.length && p.sources.every(s => /^https:\/\//.test(s.url)), 'official source link');
    const d = p.difficulty; if (d) assert.ok(Math.abs(d.easy + d.medium + d.hard - 100) <= 1);   // null = no reliable data, standard mix used
    const plan = buildPlan(n, 0, 20);
    assert.ok(plan.slots.length >= 1 && plan.minutes >= 1);
    assert.doesNotMatch(JSON.stringify(p), /logo|\.png|\.svg/i, 'no logos');
  });
}
test('known patterns are encoded exactly', () => {
  const by = Object.fromEntries(raw.map(([, p]) => [p.id, p.pattern]));
  const q = id => by[id].sections.reduce((a, s) => a + s.count, 0);
  assert.deepEqual([q('gate-cse'), by['gate-cse'].totalMarks, by['gate-cse'].durationMin], [65, 100, 180]);
  assert.deepEqual([q('ssc-cgl'), by['ssc-cgl'].totalMarks, by['ssc-cgl'].sections[0].negative], [100, 200, 0.5]);
  assert.deepEqual([q('neet-pg'), by['neet-pg'].totalMarks], [200, 800]);
  assert.deepEqual([q('bitsat'), by.bitsat.totalMarks], [130, 390]);
  assert.deepEqual([q('upsc-csat'), by['upsc-csat'].totalMarks], [80, 200]);
  assert.deepEqual([q('ibps-po'), by['ibps-po'].sectionalMin], [100, [20, 20, 20]]);
  assert.deepEqual([q('nda-gat'), by['nda-gat'].totalMarks], [150, 600]);
});
test('custom exam builder validates and produces a usable profile', () => {
  const b = blankPattern();
  assert.ok(patternErrors(b).some(e => /name/.test(e)));
  b.name = 'My mid-term'; b.durationMin = 90; b.topics = 'Optics, Waves\nHeat';
  b.sections = [{ name: 'MCQ', type: 'mcq', count: 20, marks: 2, negative: 0.5 }, { name: '', type: 'written', count: 3, marks: 10, negative: 0 }];
  assert.deepEqual(patternErrors(b), []); assert.deepEqual(patternTotals(b), { questions: 23, marks: 70 });
  const p = profileFromPattern(b);
  assert.equal(p.id, 'my-my-mid-term'); assert.equal(p.kind, 'custom'); assert.equal(p.pattern.totalMarks, 70); assert.equal(p.pattern.sections[1].name, 'Section 2');
  assert.deepEqual(p.topics.map(t => t.name), ['Optics', 'Waves', 'Heat']);
  assert.ok(buildPlan(p, 0, 10).slots.length > 0);
  assert.throws(() => profileFromPattern({ ...b, sections: [{ type: 'mcq', count: 5, marks: 1, negative: 3 }] }), /negative/);
  assert.ok(patternErrors({ ...b, durationMin: 0 }).length); assert.ok(patternErrors({ ...b, sections: [] }).length);
});
