// Smarty skills: named, reusable instructions written by the student (or drafted by Smarty). Pure; stored in 'ka-skills'.
export const SKILLS_KEY = 'ka-skills', MAX_SKILLS = 50;
export const slug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 32) || 'skill';
export function normalizeSkill(x = {}, now = Date.now()) {
  const steps = (Array.isArray(x.steps) ? x.steps : String(x.steps || '').split(/\n+/)).map(s => String(s).replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim()).filter(Boolean).slice(0, 12);
  const title = String(x.title || '').trim().slice(0, 60);
  if (!title) throw Error('Give the skill a name.');
  if (!steps.length) throw Error('Add at least one step.');
  return { id: x.id || 'sk-' + now.toString(36) + Math.random().toString(36).slice(2, 6), name: slug(x.name || title), title, when: String(x.when || '').trim().slice(0, 200), steps, format: String(x.format || '').trim().slice(0, 400), updated: now };
}
export function upsertSkill(list, skill) {
  const others = list.filter(s => s.id !== skill.id);
  let name = skill.name, n = 2; while (others.some(s => s.name === name)) name = `${skill.name}-${n++}`;
  if (others.length >= MAX_SKILLS && !list.some(s => s.id === skill.id)) throw Error(`You can keep up to ${MAX_SKILLS} skills.`);
  return [...others, { ...skill, name }].sort((a, b) => a.title.localeCompare(b.title));
}
export const removeSkill = (list, id) => list.filter(s => s.id !== id);
// "/skillname rest of question" → { skill, rest }.
export function parseSlash(q, list) {
  const m = String(q || '').match(/^\/([\w-]+)\s*([\s\S]*)$/); if (!m) return { skill: null, rest: q };
  const skill = list.find(s => s.name === m[1].toLowerCase()) || null; return skill ? { skill, rest: m[2].trim() } : { skill: null, rest: q };
}
const words = s => new Set(String(s || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);
const STOP = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'what', 'how', 'can', 'you', 'use', 'when', 'from', 'into', 'about', 'please', 'make', 'give', 'me']);
// Best skill for a question by word overlap with its title and "when to use" (null when nothing is clearly relevant).
export function suggestSkill(q, list, min = 2) {
  const qw = [...words(q)].filter(w => !STOP.has(w)); let best = null, score = 0;
  for (const s of list) { const sw = words(`${s.title} ${s.when} ${s.name.replace(/-/g, ' ')}`); const hit = qw.filter(w => sw.has(w) || [...sw].some(x => x.length > 4 && (x.startsWith(w) || w.startsWith(x)))).length; if (hit > score) { score = hit; best = s; } }
  return score >= min ? best : null;
}
export const skillPrompt = s => s ? `\nSKILL TO FOLLOW — "${s.title}"${s.when ? ` (use when: ${s.when})` : ''}:\n${s.steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}${s.format ? `\nOUTPUT FORMAT: ${s.format}` : ''}\n` : '';
export const SKILL_SYSTEM = 'You design a reusable study "skill" for a student from their request. Return JSON {"title": short name, "when": one sentence on when to use it, "steps": [3-8 short imperative steps Smarty should follow], "format": optional output format or ""}. Keep it practical and safe.';
