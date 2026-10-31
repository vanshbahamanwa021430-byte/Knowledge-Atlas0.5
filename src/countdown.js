// Exam countdown study plan (0.9.9). Pure functions: build a day-by-day plan up to the exam, then keep it honest as
// days pass — unfinished tasks from earlier days move to the days that are left. Dates are 'YYYY-MM-DD' strings.
const DAY = 864e5;
const toDate = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const ymd = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
export const addDay = (s, n) => ymd(new Date(toDate(s).getTime() + n * DAY + 3600000));   // +1h survives DST shifts
export const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
let seq = 0; const tid = p => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

// topics: [{ title, nodeId?, weight? }] in study order (weight 1 = normal; Smarty may raise important ones).
export function buildStudyPlan({ examId = '', examTitle = '', examDate, topics = [], today, minutesPerDay = 60 }) {
  const total = daysBetween(today, examDate);
  if (!(total >= 1)) throw Error('Pick an exam that is at least one day away.');
  const list = topics.filter(t => t && String(t.title || '').trim()).slice(0, 120).map(t => ({ title: String(t.title).trim().slice(0, 140), nodeId: t.nodeId || null, weight: Math.max(0.5, Math.min(3, Number(t.weight) || 1)) }));
  if (!list.length) throw Error('This exam needs a document with topics to plan from.');
  // Last days are for revision and a practice test (about a fifth, at least one when there are 3+ days).
  const revise = total >= 3 ? Math.max(1, Math.round(total * 0.2)) : 0, study = total - revise;
  const days = Array.from({ length: total }, (_, i) => ({ date: addDay(today, i), tasks: [] }));
  // Spread topics over the study days by weight (heavier topics get a day of their own sooner).
  const sum = list.reduce((s, t) => s + t.weight, 0); let acc = 0;
  list.forEach(t => {
    const d = Math.min(study - 1, Math.floor((acc / sum) * study)); acc += t.weight;
    days[d].tasks.push({ id: tid('l'), kind: 'learn', topic: t.title, nodeId: t.nodeId, done: false, minutes: Math.round(25 * t.weight) });
    const r = d + 2;   // a short spaced review two days later, if it still falls on a study day
    if (r < study) days[r].tasks.push({ id: tid('r'), kind: 'review', topic: t.title, nodeId: t.nodeId, done: false, minutes: 10 });
  });
  for (let i = study; i < total; i++) days[i].tasks.push(i === total - 1 && revise > 1 ? { id: tid('t'), kind: 'test', topic: 'Practice test (exam style)', done: false, minutes: 60 } : { id: tid('v'), kind: 'revise', topic: 'Revise flashcards and weak topics', done: false, minutes: 45 });
  if (!revise) days[total - 1].tasks.push({ id: tid('t'), kind: 'test', topic: 'Quick practice test', done: false, minutes: 30 });
  return { examId, examTitle, examDate, created: today, adjusted: today, minutesPerDay, moved: 0, days };
}

// Moves tasks left undone on days before `today` onto today and the following days (fewest tasks first).
export function adjustPlan(plan, today) {
  if (!plan || plan.adjusted === today && plan.days.every(d => d.date >= today || d.tasks.every(t => t.done))) return plan;
  const missed = [], days = plan.days.map(d => ({ ...d, tasks: d.tasks.map(t => ({ ...t })) }));
  for (const d of days) if (d.date < today) { missed.push(...d.tasks.filter(t => !t.done).map(t => ({ ...t, from: t.from || d.date }))); d.tasks = d.tasks.filter(t => t.done); }
  let open = days.filter(d => d.date >= today && d.date < plan.examDate);
  if (!open.length && plan.examDate >= today) { open = [{ date: today, tasks: [] }]; days.push(open[0]); }
  for (const t of missed) { if (!open.length) break; open.reduce((a, b) => b.tasks.filter(x => !x.done).length < a.tasks.filter(x => !x.done).length ? b : a).tasks.unshift(t); }
  return { ...plan, days: days.filter(d => d.tasks.length || d.date >= today), adjusted: today, moved: (plan.moved || 0) + missed.length };
}
export function toggleTask(plan, id) { return { ...plan, days: plan.days.map(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done, doneAt: t.done ? 0 : Date.now() } : t) })) }; }
export function planProgress(plan) { const all = plan.days.flatMap(d => d.tasks); return { done: all.filter(t => t.done).length, total: all.length }; }
export const todayTasks = (plan, today) => plan.days.find(d => d.date === today)?.tasks || [];
