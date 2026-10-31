// Test time limits (pure, unit-tested): presets, custom, "Auto" from the paper, per-question timers, warnings, pauses.
export const PRESETS = [0, 15, 30, 45, 60, 90, 120, 180];   // 0 = no limit
export const WARN_AT = [600, 300, 60];                     // seconds left: 10, 5 and 1 minute warnings
export const DEFAULT_TIMING = { mode: 'auto', minutes: 30, perQ: 0, practice: false };
export function normalizeTiming(t) {
  const x = { ...DEFAULT_TIMING, ...(t && typeof t === 'object' ? t : {}) };
  if (!['none', 'preset', 'custom', 'auto'].includes(x.mode)) x.mode = 'auto';
  x.minutes = Math.round(Math.min(600, Math.max(1, Number(x.minutes) || 30)));
  x.perQ = Math.round(Math.min(1800, Math.max(0, Number(x.perQ) || 0)));
  x.practice = !!x.practice; return x;
}
const round5 = m => Math.max(5, Math.round(m / 5) * 5);
// Suggested minutes. With the real paper's duration: scale it by marks (or question count). Otherwise estimate:
// 1.5 min per objective question, 1.8 min per mark of written work.
export function autoMinutes({ questions = [], paperMinutes = 0, paperMarks = 0, paperQuestions = 0 } = {}) {
  const marks = questions.reduce((a, q) => a + (Number(q.marks) || 1), 0), n = questions.length;
  if (paperMinutes > 0) {
    const ratio = paperMarks > 0 && marks > 0 ? marks / paperMarks : paperQuestions > 0 && n > 0 ? n / paperQuestions : 1;
    return round5(paperMinutes * Math.min(1, Math.max(0.05, ratio)));
  }
  const objective = q => ['mcq', 'multi', 'numerical', 'truefalse', 'tf'].includes(q.type);
  const est = questions.reduce((a, q) => a + (objective(q) ? 1.5 : 1.8 * (Number(q.marks) || 1)), 0);
  return round5(est || 30);
}
// Minutes for this test (0 = no limit).
export function resolveMinutes(t, info = {}) {
  const x = normalizeTiming(t);
  return x.mode === 'none' ? 0 : x.mode === 'auto' ? autoMinutes(info) : x.minutes;
}
export const canPause = t => { const x = normalizeTiming(t); return x.mode === 'none' || x.practice; };
export const describeTiming = (t, info) => { const m = resolveMinutes(t, info); return m ? `${m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`}${normalizeTiming(t).mode === 'auto' ? ' (auto)' : ''}` : 'No limit'; };
// Which warning (seconds) should fire now, given those already shown. Only the most recent threshold fires.
export function dueWarning(leftMs, fired = [], limitMin = 0) {
  if (!limitMin) return null;
  const s = leftMs / 1000, hits = WARN_AT.filter(w => s <= w && w < limitMin * 60 && !fired.includes(w));
  return hits.length ? Math.min(...hits) : null;
}
// Elapsed active time, excluding paused stretches. pauses: [{ from, to? }].
export function activeMs(startedAt, now, pauses = []) {
  return Math.max(0, now - startedAt - pauses.reduce((a, p) => a + Math.max(0, (p.to ?? now) - p.from), 0));
}
export const leftMs = (startedAt, minutes, now, pauses = []) => minutes ? minutes * 60000 - activeMs(startedAt, now, pauses) : Infinity;
// Per-question time: add the time since the last tick to the question on screen.
export function tickQuestion(times, qid, deltaMs) { if (!qid || !(deltaMs > 0)) return times; return { ...times, [qid]: (times[qid] || 0) + Math.min(deltaMs, 5000) }; }
export const questionExpired = (times, qid, perQ) => perQ > 0 && (times[qid] || 0) >= perQ * 1000;
export function fmtDuration(ms) { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60; return h ? `${h} h ${m} min` : m ? `${m} min ${r ? r + ' s' : ''}`.trim() : `${r} s`; }
