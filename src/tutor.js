// Smarty (personal tutor): pure, DOM-free helpers (unit-tested in Node). Original code for Knowledge Atlas.
// Design inspired by the ideas in DeepTutor (HKUDS, Apache-2.0) and the paper by Zhao et al., 2026:
// learner memory traces, a learner profile, grounded retrieval with citations and verified personalised practice.
// No code, prompts or text were copied from that project.

const STOP = new Set('a an the and or of to in on for is are was were be been it its this that with as by at from which what who how why when where do does did can could should would will into than then there their they them these those your you we our not no but if so such also about over under more most less very each any all some may might must have has had'.split(' '));
export const tokens = t => String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').split(' ').filter(w => w.length > 1 && !STOP.has(w)).map(stem);
function stem(w) { return w.length > 4 ? w.replace(/(ings?|edly|ed|es|s|ly)$/, '') : w; }

// Splits each document section into overlapping ~120-word chunks that keep their section label and page.
export function chunkDocs(docs, { words = 120, overlap = 30 } = {}) {
  const out = [];
  for (const d of docs || []) for (const s of d.sections || []) {
    const ws = String(s.text || '').split(/\s+/).filter(Boolean);
    if (!ws.length) continue;
    const page = s.page ?? (String(s.ref).match(/\b(?:page|slide|p\.)\s*(\d+)/i) || [])[1] ?? null;
    for (let i = 0, n = 0; i < ws.length; i += words - overlap, n++) {
      out.push({ id: `${d.id}#${s.ref}#${n}`, docId: d.id, docName: d.name || 'Document', ref: s.ref, page: page == null ? null : Number(page), text: ws.slice(i, i + words).join(' ') });
      if (i + words >= ws.length) break;
    }
  }
  return out;
}

// Small "embedding": hashed bag of words + character trigrams, L2-normalised. Catches spelling variants BM25 misses.
const DIM = 256;
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function embed(text) {
  const v = new Float32Array(DIM);
  for (const w of tokens(text)) { v[hash(w) % DIM] += 1; const p = `#${w}#`; for (let i = 0; i + 3 <= p.length; i++) v[hash(p.slice(i, i + 3)) % DIM] += 0.3; }
  let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1;
  for (let i = 0; i < DIM; i++) v[i] /= n;
  return v;
}
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

// Builds an index once per document set.
export function buildIndex(chunks) {
  const toks = chunks.map(c => tokens(c.ref + ' ' + c.text)), df = new Map();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) || 0) + 1);
  const avg = toks.reduce((a, t) => a + t.length, 0) / Math.max(1, toks.length);
  return { chunks, toks, df, avg, vecs: chunks.map(c => embed(c.ref + ' ' + c.text)) };
}

function bm25(idx, q) {
  const N = idx.chunks.length, k1 = 1.4, b = 0.75;
  return idx.toks.map(t => {
    const tf = new Map(); for (const w of t) tf.set(w, (tf.get(w) || 0) + 1);
    let s = 0;
    for (const w of q) { const f = tf.get(w); if (!f) continue; const n = idx.df.get(w) || 0; s += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * f * (k1 + 1) / (f + k1 * (1 - b + b * t.length / (idx.avg || 1))); }
    return s;
  });
}

// Keyword (BM25) and vector rankings merged with reciprocal-rank fusion. Returns top-k chunks with a score.
export function retrieve(idx, query, k = 5) {
  if (!idx?.chunks.length) return [];
  const q = tokens(query); if (!q.length) return [];
  const kw = bm25(idx, q), qv = embed(query), vs = idx.vecs.map(v => dot(v, qv));
  const rank = arr => { const order = arr.map((s, i) => [s, i]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]); const r = new Map(); order.forEach(([, i], n) => r.set(i, n)); return r; };
  const rk = rank(kw), rv = rank(vs), fused = new Map();
  for (const [i, n] of rk) fused.set(i, (fused.get(i) || 0) + 1 / (60 + n));
  for (const [i, n] of rv) if (vs[i] > 0.12) fused.set(i, (fused.get(i) || 0) + 1 / (60 + n));
  return [...fused].sort((a, b) => b[1] - a[1]).slice(0, k).map(([i, s]) => ({ ...idx.chunks[i], score: s }));
}

export const citeOf = c => `${c.docName} › ${c.ref}${c.page ? `, p. ${c.page}` : ''}`;
export function contextBlock(chunks) { return chunks.map((c, i) => `[S${i + 1}] (${citeOf(c)})\n${c.text}`).join('\n\n'); }
// Turns [S1] markers in an answer into readable citations; keeps only sources that exist.
export function resolveCitations(answer, chunks) {
  const used = new Set();
  const text = String(answer || '').replace(/\[S(\d+)\]/g, (m, n) => { const c = chunks[n - 1]; if (!c) return ''; used.add(n - 1); return `[${n}]`; });
  return { text, sources: [...used].sort((a, b) => a - b).map(i => ({ n: i + 1, cite: citeOf(chunks[i]), docId: chunks[i].docId, ref: chunks[i].ref })) };
}

// ---------- learner memory (traces) ----------
export function makeTrace({ kind, topic = '', summary = '', steps = [], mistakes = [], score = null, docId = null, at = Date.now() }) {
  return { id: `${kind}-${at}-${Math.random().toString(36).slice(2, 7)}`, kind, topic: String(topic).slice(0, 120), summary: String(summary).slice(0, 400), steps: steps.slice(0, 20).map(s => String(s).slice(0, 200)), mistakes: mistakes.slice(0, 20).map(m => ({ topic: String(m.topic || topic).slice(0, 120), prompt: String(m.prompt || '').slice(0, 300), note: String(m.note || '').slice(0, 200) })), score, docId, at };
}
export function searchTraces(traces, query) {
  const q = tokens(query); const list = [...(traces || [])].sort((a, b) => b.at - a.at);
  if (!q.length) return list;
  return list.map(t => { const bag = new Set(tokens([t.topic, t.summary, t.kind, ...t.steps, ...t.mistakes.map(m => m.topic + ' ' + m.prompt)].join(' '))); return [q.filter(w => bag.has(w)).length, t]; }).filter(x => x[0]).sort((a, b) => b[0] - a[0] || b[1].at - a[1].at).map(x => x[1]);
}

// Trace from a graded test: one mistake per wrong question, topic stats from topicPerformance rows.
export function traceFromAttempt(attempt, topicRows = [], kind = 'test') {
  const grades = new Map((attempt.grades || []).map(g => [g.id, g]));
  const mistakes = (attempt.questions || []).filter(q => { const g = grades.get(q.id); return g && g.method !== 'self assessment pending' && g.awarded < q.marks / 2 + (q.marks <= 1 ? 0.5 : 0); })
    .map(q => ({ topic: topicRows.find(r => String(q.source || '').toLowerCase().includes(r.topic.toLowerCase()))?.topic || String(q.source || 'General').replace(/^\[|\]$/g, ''), prompt: q.prompt, note: grades.get(q.id)?.feedback || '' }));
  return { ...makeTrace({ kind, topic: attempt.documentName || 'Test', summary: `Scored ${attempt.percent}% (${attempt.earned}/${attempt.total}).`, steps: topicRows.map(r => `${r.topic}: ${r.percent}%`), mistakes, score: attempt.percent, docId: attempt.documentId, at: attempt.submittedAt || Date.now() }), topics: topicRows.map(r => ({ topic: r.topic, right: r.earned, total: r.total })) };
}

// ---------- learner profile ----------
export const emptyProfile = () => ({ topics: {}, recent: [], updated: 0, sessions: 0 });
// Each topic keeps an exponentially-weighted mastery (0..1). New evidence counts ~35%, so recent work matters most.
export function updateProfile(profile, trace) {
  const p = { ...emptyProfile(), ...(profile || {}), topics: { ...(profile?.topics || {}) } };
  const bump = (name, ok, weight = 1) => {
    const key = String(name || '').trim().toLowerCase(); if (!key) return;
    const t = p.topics[key] || { name: String(name).trim(), mastery: 0.5, seen: 0, wrong: 0 };
    const a = 0.35 * weight; t.mastery = Math.round(((1 - a) * t.mastery + a * ok) * 1000) / 1000;
    t.seen += 1; if (ok < 0.5) t.wrong += 1; t.last = trace.at; p.topics[key] = t;
  };
  for (const r of trace.topics || []) if (r.total > 0) bump(r.topic, Math.max(0, r.right) / r.total);
  const touched = new Set((trace.topics || []).map(r => r.topic.toLowerCase()));
  for (const m of trace.mistakes || []) if (!touched.has(String(m.topic).toLowerCase())) bump(m.topic, 0, 0.6);
  if (trace.kind === 'tutor' && trace.topic && !(trace.mistakes || []).length) bump(trace.topic, 0.6, 0.3);
  p.recent = [...(trace.mistakes || []).map(m => ({ ...m, at: trace.at })), ...p.recent].slice(0, 15);
  p.sessions += 1; p.updated = trace.at;
  return p;
}
const list = p => Object.values(p?.topics || {});
export const weakTopics = (p, n = 5) => list(p).filter(t => t.mastery < 0.6).sort((a, b) => a.mastery - b.mastery || b.wrong - a.wrong).slice(0, n);
export const strongTopics = (p, n = 5) => list(p).filter(t => t.mastery >= 0.75 && t.seen >= 2).sort((a, b) => b.mastery - a.mastery).slice(0, n);
export function levelFor(p, topic) {
  const all = list(p), q = String(topic || '').toLowerCase().trim(), qt = tokens(q);
  const score = x => x.name.toLowerCase() === q ? 1e3 : q.includes(x.name.toLowerCase()) ? 500 : tokens(x.name).filter(w => qt.includes(w)).length;
  const t = q ? all.map(x => [score(x), x]).filter(a => a[0] > 0).sort((a, b) => b[0] - a[0])[0]?.[1] : null;
  const m = t ? t.mastery : all.length ? all.reduce((a, x) => a + x.mastery, 0) / all.length : 0.5;
  return m < 0.45 ? 'beginner' : m < 0.75 ? 'intermediate' : 'advanced';
}
// Practice difficulty from mastery: stay slightly above the learner's level.
export const difficultyFor = mastery => mastery < 0.35 ? 'easy' : mastery < 0.7 ? 'medium' : 'hard';
export function profileHint(p) {
  const w = weakTopics(p).map(t => t.name), s = strongTopics(p).map(t => t.name);
  return `${w.length ? `Weak topics: ${w.join('; ')}. ` : ''}${s.length ? `Strong topics: ${s.join('; ')}. ` : ''}${p?.recent?.length ? `Recent mistakes: ${p.recent.slice(0, 3).map(m => m.prompt.slice(0, 80)).join(' | ')}.` : ''}`.trim();
}
// Practice targets: weakest topics first; fills with least-seen topics. Each target carries its difficulty.
export function practiceTargets(p, n = 3) {
  const w = weakTopics(p, n); const rest = list(p).filter(t => !w.includes(t)).sort((a, b) => a.seen - b.seen).slice(0, n - w.length);
  return [...w, ...rest].map(t => ({ topic: t.name, difficulty: difficultyFor(t.mastery) }));
}

// Checks AI practice items: shape, and the verifier's verdicts. Items the verifier rejects are dropped.
export function validatePractice(items, verdicts = null) {
  const ok = (Array.isArray(items) ? items : []).filter(q => q && typeof q.prompt === 'string' && q.prompt.trim() && Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string' && o.trim()) && Number.isInteger(Number(q.correct)) && Number(q.correct) >= 0 && Number(q.correct) <= 3)
    .map((q, i) => ({ id: 'p' + (i + 1), prompt: q.prompt.trim(), options: q.options.map(o => o.trim()), correct: Number(q.correct), explanation: String(q.explanation || '').trim(), topic: String(q.topic || '').trim(), difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium', source: Number(q.source) || null }));
  if (!verdicts) return ok;
  const v = new Map((Array.isArray(verdicts) ? verdicts : []).map(x => [String(x.id), x]));
  return ok.flatMap(q => { const x = v.get(q.id); if (!x || x.valid === false) return []; const c = Number(x.correct); return [{ ...q, correct: Number.isInteger(c) && c >= 0 && c <= 3 ? c : q.correct, verified: true }]; });
}
// A finished practice round becomes a trace with per-topic results.
export function traceFromPractice(items, answers, at = Date.now()) {
  const by = new Map();
  for (const q of items) { const r = by.get(q.topic) || { topic: q.topic || 'General', right: 0, total: 0 }; r.total++; if (answers[q.id] === q.correct) r.right++; by.set(q.topic, r); }
  const right = items.filter(q => answers[q.id] === q.correct).length;
  return { ...makeTrace({ kind: 'practice', topic: [...by.keys()].join(', '), summary: `Practice: ${right}/${items.length} correct.`, steps: [...by.values()].map(r => `${r.topic}: ${r.right}/${r.total}`), mistakes: items.filter(q => answers[q.id] !== q.correct).map(q => ({ topic: q.topic, prompt: q.prompt, note: q.explanation })), score: items.length ? Math.round(100 * right / items.length) : 0, at }), topics: [...by.values()] };
}
