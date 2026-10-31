// Knowledge Gap Detector (0.9.9, Smarty). Finds the root concept behind mistakes: topics with weak scores are
// traced back along prerequisite links; a weak prerequisite shared by several weak topics is the likely root cause.
// Pure and deterministic; Smarty only phrases the explanation on top of this.
// results: [{ topic, awarded, marks }]   prereq: { topic: [prerequisite topics] }
export function topicScores(results) {
  const m = new Map();
  for (const r of results || []) { if (!r?.topic) continue; const x = m.get(r.topic) || { topic: r.topic, got: 0, max: 0, n: 0 }; x.got += +r.awarded || 0; x.max += +r.marks || 0; x.n++; m.set(r.topic, x); }
  return [...m.values()].map(x => ({ ...x, score: x.max ? x.got / x.max : 0 }));
}
export function findGaps(results, prereq = {}, { weak = 0.6 } = {}) {
  const scores = topicScores(results), byT = new Map(scores.map(s => [s.topic, s]));
  const weakT = scores.filter(s => s.score < weak && s.n);
  const ancestors = (t, seen = new Set()) => { for (const p of prereq[t] || []) if (!seen.has(p)) { seen.add(p); ancestors(p, seen); } return seen; };
  const roots = new Map();
  for (const w of weakT) for (const a of ancestors(w.topic)) {
    const s = byT.get(a); if (s && s.score >= weak) continue;   // a prerequisite the student shows they know is not the root
    const r = roots.get(a) || { concept: a, explains: [], score: s ? s.score : null, tested: !!s };
    r.explains.push(w.topic); roots.set(a, r);
  }
  const list = [...roots.values()].map(r => ({ ...r, weight: r.explains.length + (r.tested ? 1 - r.score : 0.3) })).sort((a, b) => b.weight - a.weight);
  // drop roots that are themselves explained by a stronger root
  const top = list.filter(r => !list.some(o => o !== r && o.weight >= r.weight && ancestors(r.concept).has(o.concept) === false && o.explains.includes(r.concept)));
  return { weak: weakT.sort((a, b) => a.score - b.score), roots: top.slice(0, 5) };
}
export const gapSentence = r => `You struggle with ${r.explains.slice(0, 2).join(' and ')} because your understanding of ${r.concept} is incomplete.`;
