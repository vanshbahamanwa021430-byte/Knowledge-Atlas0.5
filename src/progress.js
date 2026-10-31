// Study progress: days, streaks, XP and levels, badges, the error log, weak sections and "what to revise next".
// Pure functions (no DOM, no storage) so they can be unit-tested in Node.
import { topicPerformance } from './insights.js';

const pad = n => String(n).padStart(2, '0');
// Local calendar day as "YYYY-MM-DD".
export const dayKey = (ts = Date.now()) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const dayStart = key => { const [y, m, d] = String(key).split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
export const addDays = (key, n) => { const t = new Date(dayStart(key)); t.setDate(t.getDate() + n); return dayKey(t.getTime()); };
// The last n days, oldest first, ending today.
export const lastDays = (n, today = dayKey()) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));

// Current streak: consecutive active days ending today. If today has no activity yet, a streak that ran up to
// yesterday is still alive (you have until midnight). Also the longest streak ever.
export function streaks(activeDays, today = dayKey()) {
  const set = new Set([...activeDays].filter(Boolean));
  let current = 0, d = set.has(today) ? today : addDays(today, -1);
  while (set.has(d)) { current++; d = addDays(d, -1); }
  const sorted = [...set].sort();
  let longest = 0, run = 0, prev = null;
  for (const k of sorted) { run = prev && addDays(prev, 1) === k ? run + 1 : 1; longest = Math.max(longest, run); prev = k; }
  return { current, longest, today: set.has(today) };
}

// XP: 1 per study minute, 2 per flashcard review, 5 per section studied, and up to 20 per test (score / 5).
export function xpTotal({ minutes = 0, reviews = 0, sections = 0, tests = [] } = {}) {
  return Math.round(minutes) + reviews * 2 + sections * 5 + tests.reduce((s, p) => s + Math.round((Number(p) || 0) / 5), 0);
}
// Level n needs 50·n·(n+1) XP in total: 100 XP for level 2, 300 for level 3, 600 for level 4…
export function levelFor(xp) {
  let level = 1;
  while (50 * level * (level + 1) <= xp) level++;
  const floor = 50 * (level - 1) * level, next = 50 * level * (level + 1);
  return { level, xp, into: xp - floor, need: next - floor, next };
}

export const BADGES = [
  { id: 'first-test', label: 'First test', desc: 'Finish a practice test', icon: 'test', test: s => s.tests >= 1 },
  { id: 'ace', label: 'Top marks', desc: 'Score 90% or more in a test', icon: 'trophy', test: s => s.bestPercent >= 90 },
  { id: 'streak-3', label: 'On a roll', desc: 'Study 3 days in a row', icon: 'flame', test: s => s.longest >= 3 },
  { id: 'streak-7', label: 'Week warrior', desc: 'Study 7 days in a row', icon: 'flame', test: s => s.longest >= 7 },
  { id: 'cards-100', label: 'Card shark', desc: 'Review 100 flashcards', icon: 'cards', test: s => s.reviews >= 100 },
  { id: 'focus-10h', label: 'Deep focus', desc: 'Study for 10 hours in total', icon: 'timer', test: s => s.minutes >= 600 },
  { id: 'sections-50', label: 'Explorer', desc: 'Study 50 sections', icon: 'map', test: s => s.sections >= 50 },
  { id: 'fixer', label: 'Mistake fixer', desc: 'Get 10 past mistakes right on retry', icon: 'checkCircle', test: s => s.fixed >= 10 }
];
export const earnedBadges = stats => BADGES.filter(b => b.test(stats));

// Every question answered wrong (or only partly right) in every test, newest first.
// key is stable: "<attemptId>:<questionId>", so retry results can be stored beside it.
export function errorEntries(attempts) {
  const out = [];
  for (const a of attempts || []) {
    const grades = new Map((a.grades || []).map(g => [g.id, g]));
    for (const q of a.questions || []) {
      const g = grades.get(q.id);
      if (!g || g.method === 'self assessment pending') continue;     // not marked yet
      if ((g.awarded || 0) >= q.marks) continue;
      out.push({ key: `${a.id}:${q.id}`, attemptId: a.id, documentId: a.documentId, documentName: a.documentName || '', at: a.submittedAt || 0, question: q, answer: (a.answers || {})[q.id], awarded: g.awarded || 0 });
    }
  }
  return out.sort((x, y) => y.at - x.at);
}

// Weak topics across all tests of a document: earned / possible marks per chapter, lowest first.
export function weakTopics(attempts, doc, { minQuestions = 2, below = 70 } = {}) {
  const rows = new Map();
  for (const a of attempts) {
    if (doc && a.documentId !== doc.id) continue;
    for (const t of topicPerformance(a, doc)) {
      const r = rows.get(t.topic) || { topic: t.topic, earned: 0, total: 0, questions: 0 };
      r.earned += t.earned; r.total += t.total; r.questions += t.questions; rows.set(t.topic, r);
    }
  }
  return [...rows.values()].filter(r => r.questions >= minQuestions)
    .map(r => ({ ...r, percent: r.total ? Math.round(100 * r.earned / r.total) : 0 }))
    .filter(r => r.percent < below).sort((a, b) => a.percent - b.percent || b.questions - a.questions);
}

// Days until an exam (0 = today, negative = past), counted in calendar days.
export const daysUntil = (dateKey, today = dayKey()) => Math.round((dayStart(dateKey) - dayStart(today)) / 864e5);

// "What to revise next": a short, ordered list of suggestions from what is due and where marks were lost.
// input: { dueByDoc: {docId: n}, weak: [{docId, topic, percent}], unstudied: [{docId, left}], exams: [{title, date, documentId}],
//          openErrors: n, docTitle: id => string, today }
export function recommend({ dueByDoc = {}, weak = [], unstudied = [], exams = [], openErrors = 0, docTitle = id => id, today = dayKey() } = {}) {
  const out = [];
  const soon = exams.map(e => ({ ...e, days: daysUntil(e.date, today) })).filter(e => e.days >= 0).sort((a, b) => a.days - b.days)[0];
  const totalDue = Object.values(dueByDoc).reduce((s, n) => s + n, 0);
  if (totalDue) {
    const [docId, n] = Object.entries(dueByDoc).sort((a, b) => b[1] - a[1])[0];
    out.push({ kind: 'cards', documentId: docId, score: 100 + totalDue, title: `Review ${totalDue} due flashcard${totalDue === 1 ? '' : 's'}`, why: `${n} from ${docTitle(docId)}. Reviewing on time keeps them in memory with the least effort.` });
  }
  if (soon) {
    const w = weak.find(x => !soon.documentId || x.docId === soon.documentId);
    const left = unstudied.find(x => !soon.documentId || x.docId === soon.documentId);
    const when = soon.days === 0 ? 'today' : soon.days === 1 ? 'tomorrow' : `in ${soon.days} days`;
    if (w) out.push({ kind: 'weak', documentId: w.docId, topic: w.topic, score: 95 - soon.days, title: `Revise “${w.topic}” for ${soon.title}`, why: `Your exam is ${when} and you scored ${w.percent}% on this topic.` });
    else if (left) out.push({ kind: 'study', documentId: left.docId, score: 90 - soon.days, title: `Finish ${docTitle(left.docId)} before ${soon.title}`, why: `Your exam is ${when} and ${left.left} section${left.left === 1 ? ' is' : 's are'} not studied yet.` });
    else out.push({ kind: 'test', documentId: soon.documentId, score: 80 - soon.days, title: `Take a practice test for ${soon.title}`, why: `Your exam is ${when}. A timed test shows what still needs work.` });
  }
  for (const w of weak.slice(0, 2)) if (!out.some(o => o.kind === 'weak' && o.topic === w.topic)) out.push({ kind: 'weak', documentId: w.docId, topic: w.topic, score: 60 - w.percent / 2, title: `Revise “${w.topic}”`, why: `You scored ${w.percent}% on it in your tests.` });
  if (openErrors) out.push({ kind: 'errors', score: 40 + Math.min(openErrors, 20), title: `Retry ${openErrors} past mistake${openErrors === 1 ? '' : 's'}`, why: 'Questions you got wrong are the fastest way to find gaps.' });
  const left = unstudied.filter(u => u.left > 0).sort((a, b) => a.left - b.left)[0];
  if (left && !out.some(o => o.kind === 'study')) out.push({ kind: 'study', documentId: left.docId, score: 30, title: `Carry on with ${docTitle(left.docId)}`, why: `${left.left} section${left.left === 1 ? '' : 's'} left to study.` });
  return out.sort((a, b) => b.score - a.score).slice(0, 4);
}

// Focus timer phases: after every `longEvery` focus blocks comes a long break.
export function nextPhase(phase, cycle, { longEvery = 4 } = {}) {
  if (phase === 'focus') { const c = cycle + 1; return { phase: c % longEvery === 0 ? 'long' : 'short', cycle: c }; }
  return { phase: 'focus', cycle };
}
