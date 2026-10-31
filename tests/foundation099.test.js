import test from 'node:test'; import assert from 'node:assert/strict';
import { validateGraph, topoOrder } from '../src/graphcheck.js';
import { conceptMastery, recommendNext, missionControl } from '../src/mastery.js';
const nodes = [{ id: 'eq', title: 'Equilibrium equations' }, { id: 'sf', title: 'Shear force' }, { id: 'bm', title: 'Bending moment' }];
const edges = [{ from: 'sf', to: 'eq', kind: 'prereq' }, { from: 'bm', to: 'sf', kind: 'prereq' }];
test('graph validation finds duplicates, dangling, cycles', () => {
  assert.equal(validateGraph({ nodes, edges }).ok, true);
  const r = validateGraph({ nodes: [...nodes, { id: 'x', title: 'shear  FORCE' }], edges: [...edges, { from: 'eq', to: 'bm', kind: 'prereq' }, { from: 'sf', to: 'zz' }] });
  const t = r.issues.map(i => i.type);
  for (const k of ['duplicate-concept', 'prereq-cycle', 'dangling-edge']) assert.ok(t.includes(k), k);
});
test('topological order puts prerequisites first', () => assert.deepEqual(topoOrder(nodes, edges), ['eq', 'sf', 'bm']));
test('mastery only from evidence; next concept respects prerequisites', () => {
  const m = conceptMastery({ nodes, results: [{ nodeId: 'eq', awarded: 2, marks: 10 }], cards: [], read: [] });
  assert.equal(m.get('eq').level, 'weak'); assert.equal(m.get('sf').mastery, null);
  assert.equal(recommendNext(nodes, edges, m).id, 'eq');
  const m2 = conceptMastery({ nodes, results: [{ nodeId: 'eq', awarded: 9, marks: 10 }] });
  assert.equal(recommendNext(nodes, edges, m2).id, 'sf');
});
test('mission control never invents numbers', () => {
  const m = conceptMastery({ nodes });
  const mc = missionControl({ nodes, edges, mastery: m });
  assert.equal(mc.mastery, null); assert.equal(mc.measured, 0); assert.equal(mc.mission.kind, 'learn');
  const mc2 = missionControl({ nodes, edges, mastery: conceptMastery({ nodes, results: [{ nodeId: 'eq', awarded: 3, marks: 10 }] }), dueCards: 4 });
  assert.equal(mc2.mastery, 30); assert.equal(mc2.sequence[0].kind, 'cards');
});
