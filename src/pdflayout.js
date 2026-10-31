// PDF page layout (0.9.9 foundation). Turns positioned text items into reading-order text:
// multi-column pages are read column by column, tables become Markdown tables, equation lines are kept as-is.
// items: [{ str, x, y (top, px from page top), w, h }], pageWidth. Pure; unit-tested.
const MATH = /[=±×÷∑∫√∂≤≥≈≠∞πθλμσΔΩ^]|\b(sin|cos|tan|log|ln|lim)\b/;
export function toLines(items, tol = 3) {
  const rows = [];
  for (const it of [...items].filter(i => String(i.str).trim()).sort((a, b) => a.y - b.y || a.x - b.x)) {
    const r = rows.find(r => Math.abs(r.y - it.y) <= Math.max(tol, (it.h || 10) * 0.4));
    if (r) r.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  return rows.map(r => ({ y: r.y, items: r.items.sort((a, b) => a.x - b.x) }));
}
// A gutter is a vertical strip near the middle that no wide item crosses, on most lines.
export function findGutter(items, pageWidth) {
  if (!pageWidth || items.length < 20) return null;
  const lo = pageWidth * 0.3, hi = pageWidth * 0.7, step = pageWidth / 100;
  let best = null;
  for (let g = lo; g <= hi; g += step) {
    const cross = items.filter(i => i.x < g && i.x + (i.w || 0) > g).length;
    const left = items.filter(i => i.x + (i.w || 0) <= g).length, right = items.filter(i => i.x >= g).length;
    if (cross <= items.length * 0.05 && left > items.length * 0.2 && right > items.length * 0.2 && (!best || cross < best.cross)) best = { g, cross };
  }
  return best ? best.g : null;
}
const cells = line => { const out = []; let cur = null;
  for (const it of line.items) { if (cur && it.x - (cur.x + cur.w) < 12) { cur.str += (/\s$/.test(cur.str) ? '' : ' ') + it.str; cur.w = it.x + (it.w || 0) - cur.x; } else out.push(cur = { str: it.str, x: it.x, w: it.w || 0 }); }
  return out.map(c => ({ ...c, str: c.str.trim() })); };
function render(lines) {
  const out = []; let i = 0;
  while (i < lines.length) {
    // table: 2+ consecutive lines with the same number (≥3) of well-separated cells
    const c0 = cells(lines[i]); let j = i + 1;
    if (c0.length >= 3) while (j < lines.length && cells(lines[j]).length === c0.length) j++;
    if (c0.length >= 3 && j - i >= 2) {
      const rows = lines.slice(i, j).map(l => cells(l).map(c => c.str.replace(/\|/g, '\\|')));
      out.push('| ' + rows[0].join(' | ') + ' |', '|' + rows[0].map(() => ' --- ').join('|') + '|', ...rows.slice(1).map(r => '| ' + r.join(' | ') + ' |'));
      i = j; continue;
    }
    const text = c0.map(c => c.str).join(c0.length > 1 && MATH.test(lines[i].items.map(x => x.str).join('')) ? ' ' : ' ');
    out.push(MATH.test(text) && text.length < 120 && /=/.test(text) ? '$$ ' + text + ' $$' : text);
    i++;
  }
  return out.join('\n');
}
export function layoutText(items, pageWidth) {
  const g = findGutter(items, pageWidth);
  if (g === null) return render(toLines(items));
  // full-width lines (headings spanning both columns) stay in place above the columns
  const spans = items.filter(i => i.x < g && i.x + (i.w || 0) > g);
  const left = items.filter(i => i.x + (i.w || 0) <= g), right = items.filter(i => i.x >= g);
  const top = spans.length ? Math.min(...left.concat(right).map(i => i.y)) : 0;
  const head = spans.filter(i => i.y < top + 1);
  return [head.length && render(toLines(head)), render(toLines(left)), render(toLines(right)), render(toLines(spans.filter(i => !head.includes(i))))].filter(Boolean).join('\n\n');
}
