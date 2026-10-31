import test from 'node:test'; import assert from 'node:assert/strict';
import { conceptNodes, inferredEdges, acceptPrereqs, conceptResults, graphEdges } from '../src/livemap.js';
const ol = [{ id: 'root', depth: 0 }, { id: 's0', title: 'Statics', depth: 1, parent: 'root' }, { id: 's1', title: 'Equilibrium', depth: 2, parent: 's0' }, { id: 's2', title: 'Shear force', depth: 2, parent: 's0' }, { id: 's3', title: 'Detail', depth: 3, parent: 's2' }];
test('concepts and inferred document-order prerequisites', () => {
  const { nodes, conceptOf } = conceptNodes(ol);
  assert.deepEqual(nodes.map(n => n.id), ['s0', 's1', 's2']); assert.equal(conceptOf('s3'), 's2');
  const e = inferredEdges(nodes); assert.ok(e.some(x => x.from === 's2' && x.to === 's1' && x.inferred));
  assert.equal(graphEdges(nodes, []).length, e.length);
});
test('Smarty prerequisites are loop-checked', () => {
  const { nodes } = conceptNodes(ol);
  const e = acceptPrereqs(nodes, [{ concept: 2, needs: [1] }, { concept: 1, needs: [2, 9, 1] }]);
  assert.deepEqual(e.map(x => x.from + '>' + x.to), ['s2>s1']);
});
test('results mapped to concepts; pending self assessment skipped', () => {
  const r = conceptResults([{ documentId: 'd', questions: [{ id: 'q', source: 'x', marks: 4 }, { id: 'p', source: 'x', marks: 2 }], grades: [{ id: 'q', awarded: 1 }, { id: 'p', awarded: 0, method: 'self assessment pending' }] }], 'd', () => 's2');
  assert.deepEqual(r, [{ nodeId: 's2', awarded: 1, marks: 4 }]);
});
