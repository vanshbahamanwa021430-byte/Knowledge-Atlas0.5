// Flashcards with spaced repetition (SM-2, the algorithm behind Anki and SuperMemo 2). Pure functions (unit-tested).
import { correctText } from './examprofile.js';
// A card: { id, documentId, nodeId, front, back, source, created, due, interval, ease, reps, lapses, last, origin }
//   interval: days until the next review; ease: growth factor (≥ 1.3); reps: successful reviews in a row; due: timestamp.
import { uuid } from './platform.js';

export const DAY = 864e5;
export const MIN_EASE = 1.3;
export const START_EASE = 2.5;
// Buttons shown after the answer: SM-2 quality 0–5.
export const GRADES = [
  { q: 1, key: 'again', label: 'Again' },
  { q: 3, key: 'hard', label: 'Hard' },
  { q: 4, key: 'good', label: 'Good' },
  { q: 5, key: 'easy', label: 'Easy' }
];
const LEARN_AGAIN_MS = 10 * 60000;   // a forgotten card comes back in the same session, 10 minutes later

const clean = (s, max) => String(s ?? '').replace(/\r/g, '').trim().slice(0, max);

export function newCard({ documentId = null, nodeId = null, front, back, source = '', origin = 'manual', id } = {}, now = Date.now()) {
  const f = clean(front, 1200), b = clean(back, 3000);
  if (!f || !b) throw Error('A flashcard needs a front and a back.');
  return { id: id || uuid(), documentId, nodeId, front: f, back: b, source: clean(source, 120), origin, created: now, due: now, interval: 0, ease: START_EASE, reps: 0, lapses: 0, last: 0 };
}

// Start of the local day for a timestamp, so "due tomorrow" means tomorrow morning, not in exactly 24 hours.
export const startOfDay = ts => { const d = new Date(ts); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

// Applies one review. quality 0–5 (below 3 = forgotten). Returns a new card; the input is not changed.
export function review(card, quality, now = Date.now()) {
  const q = Math.max(0, Math.min(5, Math.round(Number(quality))));
  if (!Number.isFinite(q)) throw Error('Invalid grade');
  let { interval = 0, ease = START_EASE, reps = 0, lapses = 0 } = card;
  // SM-2 ease update, applied on every review.
  ease = Math.max(MIN_EASE, Math.round((ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))) * 100) / 100);
  let due;
  if (q < 3) {
    reps = 0; interval = 0; lapses += (card.reps > 0 || card.interval > 0) ? 1 : 0;
    due = now + LEARN_AGAIN_MS;
  } else {
    reps += 1;
    if (reps === 1) interval = q === 5 ? 4 : q === 3 ? 1 : 1;
    else if (reps === 2) interval = q === 3 ? 3 : q === 5 ? 8 : 6;
    else interval = Math.max(interval + 1, Math.round(interval * ease * (q === 3 ? 0.8 : q === 5 ? 1.3 : 1)));
    interval = Math.min(interval, 3650);
    due = startOfDay(now) + interval * DAY + 4 * 3600000;    // 4 a.m. on the due day
  }
  return { ...card, interval, ease, reps, lapses, last: now, due };
}

// When each answer button would bring the card back, for labels like "Good · 6d".
export function preview(card, now = Date.now()) {
  return GRADES.map(g => { const c = review(card, g.q, now); return { ...g, label2: whenLabel(c.due - now) }; });
}
export function whenLabel(ms) {
  if (ms < 3600000) return Math.max(1, Math.round(ms / 60000)) + 'm';
  if (ms < DAY) return Math.round(ms / 3600000) + 'h';
  const d = Math.round(ms / DAY);
  return d < 31 ? d + 'd' : d < 365 ? Math.round(d / 30) + 'mo' : (d / 365).toFixed(1).replace(/\.0$/, '') + 'y';
}

export const isDue = (card, now = Date.now()) => (card.due || 0) <= now;
export const isNew = card => !card.last;

// Due cards first (most overdue first), new cards after them (oldest first), up to `limit`; optionally for one document.
export function dueQueue(cards, { documentId = null, now = Date.now(), limit = 50, newLimit = 20 } = {}) {
  const mine = cards.filter(c => !documentId || c.documentId === documentId);
  const due = mine.filter(c => !isNew(c) && isDue(c, now)).sort((a, b) => a.due - b.due);
  const fresh = mine.filter(isNew).sort((a, b) => a.created - b.created).slice(0, newLimit);
  return [...due, ...fresh].slice(0, limit);
}

export function deckStats(cards, now = Date.now()) {
  const s = { total: cards.length, due: 0, fresh: 0, learning: 0, mature: 0, lapses: 0 };
  for (const c of cards) {
    if (isNew(c)) s.fresh++;
    else { if (isDue(c, now)) s.due++; if (c.interval >= 21) s.mature++; else s.learning++; }
    s.lapses += c.lapses || 0;
  }
  return s;
}

// Checks cards returned by the AI: [{front, back}], drops empty or duplicate ones.
export function validateCards(items, max = 20) {
  if (!Array.isArray(items)) throw Error('The AI returned no flashcards.');
  const seen = new Set(), out = [];
  for (const it of items) {
    const front = clean(it?.front ?? it?.question ?? it?.q, 400), back = clean(it?.back ?? it?.answer ?? it?.a, 1200);
    if (front.length < 3 || !back) continue;
    const k = front.toLowerCase().replace(/\W+/g, ' ').trim();
    if (seen.has(k)) continue;
    seen.add(k); out.push({ front, back });
    if (out.length >= max) break;
  }
  if (!out.length) throw Error('The AI returned no usable flashcards. Try again.');
  return out;
}

// A flashcard from a question answered wrong in a test (front: the question, back: the right answer and model answer).
export function cardFromQuestion(q, attempt, nodeId = null) {
  const opts = (q.type === 'mcq' || q.type === 'multi') && Array.isArray(q.options);
  const options = opts ? '\n\n' + q.options.map((o, i) => `${'ABCD'[i]}. ${o}`).join('\n') : '';
  const right = opts || q.type === 'numerical' ? `${correctText(q)}\n\n` : '';
  return newCard({ id: `err:${attempt.id}:${q.id}`, documentId: attempt.documentId, nodeId, front: q.prompt + options, back: right + (q.solution || ''), source: q.source, origin: 'mistake' }, attempt.submittedAt || Date.now());
}
