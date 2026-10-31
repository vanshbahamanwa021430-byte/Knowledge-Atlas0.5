// Custom exam pattern builder (pure, unit-tested): a student's own sections → a validated exam profile.
import { normalizeProfile, QTYPES } from './examprofile.js';

export const BLANK_SECTION = { name: '', type: 'mcq', count: 10, marks: 1, negative: 0 };
export const blankPattern = () => ({ name: '', durationMin: 60, sections: [{ ...BLANK_SECTION, name: 'Section A' }], topics: '' });
export const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'exam';

export function patternTotals(b) {
  const secs = b?.sections || [];
  return { questions: secs.reduce((a, s) => a + (Number(s.count) || 0), 0), marks: +secs.reduce((a, s) => a + (Number(s.count) || 0) * (Number(s.marks) || 0), 0).toFixed(2) };
}
// Problems shown next to the form; an empty list means the pattern can be saved.
export function patternErrors(b) {
  const e = [];
  if (!String(b?.name || '').trim()) e.push('Give the exam a name.');
  const d = Number(b?.durationMin); if (!(d >= 1 && d <= 600)) e.push('Duration must be 1–600 minutes.');
  if (!b?.sections?.length) e.push('Add at least one section.');
  (b?.sections || []).forEach((s, i) => {
    const n = `Section ${i + 1}`;
    if (!QTYPES.includes(s.type)) e.push(`${n}: pick a question type.`);
    if (!(Number(s.count) >= 1 && Number(s.count) <= 500)) e.push(`${n}: 1–500 questions.`);
    if (!(Number(s.marks) >= 0.25 && Number(s.marks) <= 100)) e.push(`${n}: marks 0.25–100 each.`);
    if (!(Number(s.negative) >= 0) || Number(s.negative) > Number(s.marks)) e.push(`${n}: negative marks must be between 0 and the marks.`);
  });
  return e;
}
export function profileFromPattern(b, id) {
  const errs = patternErrors(b); if (errs.length) throw Error(errs[0]);
  const { marks } = patternTotals(b);
  const topics = String(b.topics || '').split(/[,\n]/).map(t => t.trim()).filter(Boolean).slice(0, 60).map((name, i, a) => ({ subject: '', name, weight: Math.max(1, a.length - i) }));
  return normalizeProfile({
    id: id || 'my-' + slug(b.name), name: String(b.name).trim(), kind: 'custom', fullName: `${String(b.name).trim()} (your own pattern)`,
    pattern: { durationMin: Number(b.durationMin), totalMarks: marks, sections: b.sections.map((s, i) => ({ name: String(s.name || '').trim() || `Section ${i + 1}`, type: s.type, count: Math.round(Number(s.count)), marks: Number(s.marks), negative: Number(s.negative) || 0, ...(s.type === 'numerical' ? { answerFormat: 'decimal' } : {}) })) },
    topics: topics.length ? topics : null,
    sources: [{ kind: 'user', title: 'Pattern you defined' }],
    meta: { builder: { ...b, sections: b.sections.map(s => ({ ...s })) } }, created: Date.now()
  });
}
