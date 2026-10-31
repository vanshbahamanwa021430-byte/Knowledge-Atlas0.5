// Knowledge-graph validation (0.9.9 foundation, also used by Flowchart Repair and the Living Map).
// nodes: [{ id, title }]  edges: [{ from, to, kind: 'prereq'|'part'|'related' }]. Pure; returns findings, never edits.
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').trim();
export function validateGraph({ nodes = [], edges = [] }) {
  const issues = [], ids = new Map();
  for (const n of nodes) { if (!n?.id) { issues.push({ type: 'missing-id', node: n }); continue; } if (ids.has(n.id)) issues.push({ type: 'duplicate-id', id: n.id }); ids.set(n.id, n); }
  const byTitle = new Map();
  for (const n of ids.values()) { const k = norm(n.title); if (!k) { issues.push({ type: 'empty-title', id: n.id }); continue; } if (byTitle.has(k)) issues.push({ type: 'duplicate-concept', ids: [byTitle.get(k), n.id], title: n.title }); else byTitle.set(k, n.id); }
  const seen = new Set();
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) { issues.push({ type: 'dangling-edge', edge: e }); continue; }
    if (e.from === e.to) { issues.push({ type: 'self-loop', edge: e }); continue; }
    const k = `${e.from}>${e.to}>${e.kind || ''}`; if (seen.has(k)) issues.push({ type: 'duplicate-edge', edge: e }); seen.add(k);
  }
  // prerequisite cycles (A needs B needs A) are wrong relations
  const adj = new Map(); for (const e of edges) if ((e.kind || 'prereq') === 'prereq' && ids.has(e.from) && ids.has(e.to) && e.from !== e.to) (adj.get(e.from) || adj.set(e.from, []).get(e.from)).push(e.to);
  const state = new Map(), stack = [];
  const dfs = v => { state.set(v, 1); stack.push(v); for (const w of adj.get(v) || []) { if (state.get(w) === 1) issues.push({ type: 'prereq-cycle', path: [...stack.slice(stack.indexOf(w)), w] }); else if (!state.get(w)) dfs(w); } stack.pop(); state.set(v, 2); };
  for (const v of adj.keys()) if (!state.get(v)) dfs(v);
  const linked = new Set(edges.flatMap(e => [e.from, e.to]));
  if (ids.size > 1) for (const id of ids.keys()) if (!linked.has(id)) issues.push({ type: 'orphan', id });
  return { ok: !issues.some(i => i.type !== 'orphan'), issues };
}
export function topoOrder(nodes, edges) {   // prerequisites first; nodes in cycles are appended at the end
  const indeg = new Map(nodes.map(n => [n.id, 0])), out = new Map();
  for (const e of edges) if ((e.kind || 'prereq') === 'prereq' && indeg.has(e.from) && indeg.has(e.to)) { indeg.set(e.from, indeg.get(e.from) + 1); (out.get(e.to) || out.set(e.to, []).get(e.to)).push(e.from); }
  const q = nodes.filter(n => !indeg.get(n.id)).map(n => n.id), order = [];
  while (q.length) { const v = q.shift(); order.push(v); for (const w of out.get(v) || []) { indeg.set(w, indeg.get(w) - 1); if (!indeg.get(w)) q.push(w); } }
  return [...order, ...nodes.map(n => n.id).filter(id => !order.includes(id))];
}
