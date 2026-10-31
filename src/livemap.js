// Living Knowledge Map data (0.9.9). Concepts = document topics (chapter or section level). Prerequisites are either
// inferred from document order (earlier section in the same chapter → later one, marked inferred) or confirmed by
// Smarty (stored on the document, loop-checked). Pure; unit-tested.
import { validateGraph } from './graphcheck.js';
export function conceptNodes(outlineNodes, maxDepth = 2) {
  const byId = new Map(outlineNodes.map(n => [n.id, n]));
  const up = n => { let x = n; while (x && x.depth > maxDepth) x = byId.get(x.parent); return x; };
  const nodes = outlineNodes.filter(n => n.id !== 'root' && n.depth >= 1 && n.depth <= maxDepth).map(n => ({ id: n.id, title: n.title, parent: n.depth > 1 ? n.parent : null, depth: n.depth }));
  return { nodes, conceptOf: id => { const n = byId.get(id); const c = n && up(n); return c && c.id !== 'root' ? c.id : null; } };
}
export function inferredEdges(nodes) {
  const edges = [], byParent = new Map();
  for (const n of nodes) { const k = n.parent || '#top'; (byParent.get(k) || byParent.set(k, []).get(k)).push(n); }
  for (const list of byParent.values()) for (let i = 1; i < list.length; i++) edges.push({ from: list[i].id, to: list[i - 1].id, kind: 'prereq', inferred: true });
  return edges;
}
// Smarty's suggestion: [{ concept: index, needs: [index] }] → edges, dropping bad indexes and anything that makes a loop.
export function acceptPrereqs(nodes, links) {
  const out = [];
  for (const l of Array.isArray(links) ? links : []) for (const j of Array.isArray(l?.needs) ? l.needs : []) {
    const a = nodes[l.concept], b = nodes[j]; if (!a || !b || a === b) continue;
    const e = { from: a.id, to: b.id, kind: 'prereq', by: 'smarty' };
    if (out.some(x => x.from === e.from && x.to === e.to)) continue;
    if (validateGraph({ nodes, edges: [...out, e] }).issues.some(i => i.type === 'prereq-cycle')) continue;
    out.push(e);
  }
  return out;
}
export const graphEdges = (nodes, stored) => (Array.isArray(stored) && stored.length ? stored : inferredEdges(nodes));
// Graded test questions → per-concept results.
export function conceptResults(attempts, docId, conceptOfSource) {
  const out = [];
  for (const a of attempts || []) {
    if (a.documentId !== docId) continue;
    const g = new Map((a.grades || []).map(x => [x.id, x]));
    for (const q of a.questions || []) { const gr = g.get(q.id); if (!gr || gr.method === 'self assessment pending') continue; const nodeId = conceptOfSource(q.source); if (nodeId) out.push({ nodeId, awarded: +gr.awarded || 0, marks: +q.marks || 0 }); }
  }
  return out;
}
export const PREREQ_PROMPT = titles => `These are the topics of a study document, numbered:\n${titles.map((t, i) => `${i}. ${t}`).join('\n')}\n\nFor each topic, list which earlier or other topics a student must understand first (direct prerequisites only, at most 3). Reply as JSON: {"links":[{"concept":number,"needs":[numbers]}]}`;
