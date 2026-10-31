// Question figures in past papers: pure layout helpers (unit-tested). Coordinates are top-down page units.
export const Q_START = /^\s*(?:Q(?:uestion)?\s*\.?\s*(\d{1,2})|(\d{1,2})\s*[.)])\s*\S/i;
// Groups positioned text into lines (items whose baselines are within 3 units).
export function toLines(items) {
  const rows = [];
  for (const it of [...items].filter(x => String(x.text).trim()).sort((a, b) => a.y0 - b.y0 || (a.x || 0) - (b.x || 0))) {
    const r = rows.find(l => Math.abs(l.y0 - it.y0) < 3);
    if (r) { r.text += ' ' + it.text; r.y1 = Math.max(r.y1, it.y1); } else rows.push({ text: String(it.text), y0: it.y0, y1: it.y1 });
  }
  return rows.map(r => ({ ...r, text: r.text.replace(/\s+/g, ' ').trim() }));
}
// Splits a page into question regions and flags the ones with a figure-sized blank gap between text lines
// (diagrams, circuits and graphs are drawn there; their own labels are short, so they don't fill the gap).
export function questionRegions(lines, height, { minGap = 0.07, pageBottom = null } = {}) {
  const ls = [...lines].sort((a, b) => a.y0 - b.y0), starts = [];
  ls.forEach((l, i) => { const m = l.text.match(Q_START); if (m) starts.push({ i, q: Number(m[1] || m[2]) }); });
  const out = [];
  starts.forEach((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1].i : ls.length, part = ls.slice(s.i, end).filter(l => l.text.length > 3 || l === ls[s.i]);
    const last = k + 1 >= starts.length, y0 = ls[s.i].y0, textEnd = Math.max(...part.map(l => l.y1));
    const y1 = !last ? ls[starts[k + 1].i].y0 : pageBottom != null ? Math.max(textEnd + 8, pageBottom) : textEnd + 8;
    let gap = 0; for (let j = 1; j < part.length; j++) gap = Math.max(gap, part[j].y0 - part[j - 1].y1);
    gap = Math.max(gap, y1 - textEnd);
    out.push({ q: s.q, y0, y1, text: part.map(l => l.text).join(' ').slice(0, 240), figure: gap > height * minGap });
  });
  return out;
}
// Picks the figure for a generated question: explicit figure id first, else the paper question it most resembles.
const words = t => new Set(String(t || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);
export function matchFigure(q, figures) {
  if (!figures?.length) return null;
  if (q.figure) { const f = figures.find(x => x.id === String(q.figure).replace(/[[\]]/g, '')); if (f) return f; }
  const w = words(q.prompt); let best = null, score = 0;
  for (const f of figures) { const fw = words(f.text); let n = 0; for (const x of fw) if (w.has(x)) n++; const sc = n / Math.max(4, fw.size); if (sc > score) { score = sc; best = f; } }
  return score >= 0.5 ? best : null;
}
