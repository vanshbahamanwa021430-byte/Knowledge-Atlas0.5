// Weekly progress report (0.9.9). Pure: give it per-day numbers and test dates, get the week's summary.
// day(d) → { minutes, reviews } for 'YYYY-MM-DD'; tests: list of 'YYYY-MM-DD' (one per test taken).
import { addDay } from './countdown.js';
export function weeklyReport({ today, day, tests = [], streak = 0 }) {
  const days = Array.from({ length: 7 }, (_, i) => addDay(today, i - 6)), prev = days.map(d => addDay(d, -7));
  const rows = days.map(d => ({ date: d, minutes: Math.round(day(d)?.minutes || 0), reviews: day(d)?.reviews || 0, tests: tests.filter(t => t === d).length }));
  const sum = k => rows.reduce((s, r) => s + r[k], 0), prevMin = prev.reduce((s, d) => s + Math.round(day(d)?.minutes || 0), 0);
  const best = rows.reduce((a, b) => b.minutes > a.minutes ? b : a, rows[0]);
  return { from: days[0], to: today, rows, minutes: sum('minutes'), reviews: sum('reviews'), tests: sum('tests'), activeDays: rows.filter(r => r.minutes || r.reviews || r.tests).length, best: best.minutes ? best.date : '', change: prevMin ? Math.round((sum('minutes') - prevMin) / prevMin * 100) : null, streak };
}
// Next weekly-report reminder: Sunday at `hour` (local), strictly in the future.
export function nextWeeklyAt(now = Date.now(), hour = 18) {
  const d = new Date(now); d.setHours(hour, 0, 0, 0); d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  if (d.getTime() <= now) d.setDate(d.getDate() + 7);
  return d.getTime();
}
