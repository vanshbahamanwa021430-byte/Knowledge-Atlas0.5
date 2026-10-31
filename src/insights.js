// Result analysis: per-topic performance and headline numbers for a submitted test. Pure functions (unit-tested).
import { outline } from './structure.js';

const strip = t => String(t || '').replace(/^\s*(\d+(\.\d+)*[.)]?|chapter\s+\d+[:.]?|unit\s+\d+[:.]?)\s+/i, '').trim() || String(t || '').trim();

// Topics are the document's chapters (or its top-level sections). Each question counts towards the chapter that
// contains the section named in its source; if the document is gone or the label doesn't match, the label is the topic.
export function topicPerformance(attempt, doc) {
  const grades = new Map((attempt.grades || []).map(g => [g.id, g]));
  let nodes = null, topIds = new Set(), byId = new Map();
  if (doc?.sections) {
    nodes = outline(doc); byId = new Map(nodes.map(n => [n.id, n]));
    const level1 = nodes.filter(n => n.parent === 'root');
    const tops = level1.length === 1 && nodes.some(n => n.parent === level1[0].id) ? nodes.filter(n => n.parent === level1[0].id) : level1;
    topIds = new Set(tops.map(n => n.id));
  }
  const findTopic = q => {
    const src = String(q.source || '').toLowerCase();
    if (nodes && src) {
      const hits = nodes.filter(n => n.id !== 'root' && n.source && src.includes(String(n.source).toLowerCase()));
      hits.sort((a, b) => String(b.source).length - String(a.source).length);
      for (let n = hits[0]; n; n = n.parent ? byId.get(n.parent) : null) if (topIds.has(n.id)) return { key: n.id, label: strip(n.title), order: nodes.indexOf(n) };
      if (hits[0]) return { key: hits[0].id, label: strip(hits[0].title), order: nodes.indexOf(hits[0]) };
    }
    const label = strip(q.source) || 'Other';
    return { key: 'src:' + label.toLowerCase(), label, order: 1e6 };
  };
  const topics = new Map();
  for (const q of attempt.questions || []) {
    const t = findTopic(q), g = grades.get(q.id);
    const row = topics.get(t.key) || { topic: t.label, order: t.order, earned: 0, total: 0, questions: 0 };
    row.earned += g?.awarded || 0; row.total += q.marks; row.questions += 1;
    topics.set(t.key, row);
  }
  return [...topics.values()].sort((a, b) => a.order - b.order || a.topic.localeCompare(b.topic))
    .map(({ order, ...r }) => ({ ...r, percent: r.total ? Math.round(100 * r.earned / r.total) : 0 }));
}

export function resultSummary(attempt) {
  const grades = new Map((attempt.grades || []).map(g => [g.id, g]));
  const correct = (attempt.questions || []).filter(q => (grades.get(q.id)?.awarded || 0) >= q.marks).length;
  return { questions: (attempt.questions || []).length, correct, ms: Math.max(0, (attempt.submittedAt || 0) - (attempt.startedAt || 0)) };
}
