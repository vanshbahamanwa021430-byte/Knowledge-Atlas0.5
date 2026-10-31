// Living Knowledge Map + Mission Control core (0.9.9). Mastery comes only from real evidence: test marks,
// flashcard reviews and sections read. A concept with no evidence has mastery null ("not started"), never a made-up number.
import { topoOrder } from './graphcheck.js';
export function conceptMastery({ nodes = [], results = [], cards = [], read = [] }) {
  const m = new Map(nodes.map(n => [n.id, { id: n.id, title: n.title, got: 0, max: 0, cards: 0, cardScore: 0, read: false }]));
  for (const r of results) { const x = m.get(r.nodeId); if (x) { x.got += +r.awarded || 0; x.max += +r.marks || 0; } }
  for (const c of cards) { const x = m.get(c.nodeId); if (x && c.reps) { x.cards++; x.cardScore += Math.min(1, (c.interval || 0) / 21); } }
  for (const id of read) { const x = m.get(id); if (x) x.read = true; }
  return new Map([...m].map(([id, x]) => {
    const parts = []; if (x.max) parts.push([x.got / x.max, 0.7]); if (x.cards) parts.push([x.cardScore / x.cards, 0.3]);
    const w = parts.reduce((s, p) => s + p[1], 0);
    const mastery = w ? Math.round(parts.reduce((s, p) => s + p[0] * p[1], 0) / w * 100) : (x.read ? 10 : null);
    return [id, { ...x, mastery, level: mastery === null ? 'new' : mastery < 50 ? 'weak' : mastery < 80 ? 'learning' : 'strong' }];
  }));
}
// Next concept: the earliest (prerequisites first) concept that is not strong and whose prerequisites are not weak.
export function recommendNext(nodes, edges, mastery) {
  const pre = id => edges.filter(e => (e.kind || 'prereq') === 'prereq' && e.from === id).map(e => e.to);
  for (const id of topoOrder(nodes, edges)) {
    const x = mastery.get(id); if (!x || x.level === 'strong') continue;
    const blocked = pre(id).find(p => ['weak', 'new'].includes(mastery.get(p)?.level));
    if (!blocked) return { id, title: x.title, reason: x.level === 'weak' ? 'weak' : x.level === 'new' ? 'not started' : 'still learning', prereqs: pre(id) };
  }
  return null;
}
// Mission Control: only fields backed by data; missing data is reported as null with a reason, never invented.
export function missionControl({ nodes, edges = [], mastery, dueCards = 0, minutesToday = 0, goalMinutes = 0, exam = null }) {
  const vals = [...mastery.values()].filter(x => x.mastery !== null);
  const next = recommendNext(nodes, edges, mastery);
  const weak = [...mastery.values()].filter(x => x.level === 'weak').sort((a, b) => a.mastery - b.mastery).slice(0, 5);
  const seq = [];
  if (dueCards) seq.push({ kind: 'cards', label: `Review ${dueCards} due flashcard${dueCards === 1 ? '' : 's'}`, minutes: Math.max(5, Math.round(dueCards * 0.5)) });
  if (next) seq.push({ kind: 'learn', label: `Study ${next.title}`, nodeId: next.id, minutes: 25 });
  if (weak[0] && weak[0].id !== next?.id) seq.push({ kind: 'practice', label: `Practice questions on ${weak[0].title}`, nodeId: weak[0].id, minutes: 15 });
  return {
    mission: seq[0] || null, sequence: seq, minutes: seq.reduce((s, x) => s + x.minutes, 0),
    mastery: vals.length ? Math.round(vals.reduce((s, x) => s + x.mastery, 0) / vals.length) : null, measured: vals.length, total: nodes.length,
    weak, dueCards, minutesToday, goalLeft: Math.max(0, goalMinutes - minutesToday), exam,
  };
}
