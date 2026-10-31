// Study map: the document's headings drawn as a flowchart (inline SVG).
// Pure functions (no DOM) so the layout can be unit-tested in Node.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const NODE_W = 216, NODE_H = 44, COL_GAP = 64, ROW_H = 56, PAD = 22;
const COL_W = NODE_W + COL_GAP;
const CHARS = 26;

export function childrenMap(nodes) {
  const kids = new Map(nodes.map(n => [n.id, []]));
  for (const n of nodes) if (n.parent && kids.has(n.parent)) kids.get(n.parent).push(n.id);
  return kids;
}

// Classic tidy tree: leaves take consecutive rows, a parent sits midway between its first and last child.
export function layoutTree(nodes, collapsed = new Set()) {
  const kids = childrenMap(nodes);
  const pos = new Map();
  let rows = 0, maxDepth = 0;
  const visit = (id, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const ch = collapsed.has(id) ? [] : kids.get(id) || [];
    if (!ch.length) { const y = rows++; pos.set(id, { depth, y }); return y; }
    const ys = ch.map(c => visit(c, depth + 1));
    const y = (ys[0] + ys[ys.length - 1]) / 2;
    pos.set(id, { depth, y });
    return y;
  };
  if (nodes.length) visit(nodes[0].id, 0);
  return { pos, kids, rows, maxDepth };
}

// Large documents open folded to their top level so the chart stays readable.
export function defaultCollapsed(nodes, limit = 45) {
  if (nodes.length <= limit) return new Set();
  const kids = childrenMap(nodes);
  return new Set(nodes.filter(n => n.depth >= 1 && kids.get(n.id).length).map(n => n.id));
}

export function countDescendants(id, kids) {
  let n = 0;
  for (const c of kids.get(id) || []) n += 1 + countDescendants(c, kids);
  return n;
}

// Greedy word wrap into at most `lines` lines; adds "…" when the title does not fit.
export function wrapLabel(title, max = CHARS, lines = 2) {
  const words = String(title ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out = [];
  let cur = '', used = 0;
  for (const raw of words) {
    const w = raw.length > max ? raw.slice(0, max - 1) + '…' : raw;
    const next = cur ? cur + ' ' + w : w;
    if (next.length <= max) { cur = next; used++; continue; }
    if (out.length + 1 === lines) break;
    out.push(cur); cur = w; used++;
  }
  if (cur) out.push(cur);
  if (used < words.length) {
    const l = out[out.length - 1].replace(/…$/, '');
    out[out.length - 1] = (l.length >= max ? l.slice(0, max - 1) : l) + '…';
  }
  return out.length ? out : [''];
}

// When a document has one top heading (its title), start the chart there instead of repeating the file name.
export function chartNodes(nodes) {
  const top = nodes.filter(n => n.parent === nodes[0]?.id);
  if (top.length !== 1) return nodes;
  return nodes.slice(1).map(n => ({ ...n, parent: n.id === top[0].id ? null : n.parent, depth: n.depth - 1 }));
}

// Vertical (phone) layout: one box per row in reading order, children indented under their parent.
export const V_NODE_W = 236, V_NODE_H = 44, V_ROW = 54, V_INDENT = 24, V_PAD = 4, V_TRUNK = 26, V_WIDTH = 330;
export function layoutVertical(nodes, collapsed = new Set()) {
  const kids = childrenMap(nodes), order = [];
  let maxDepth = 0;
  const visit = (id, depth) => {
    order.push({ id, depth }); maxDepth = Math.max(maxDepth, depth);
    if (!collapsed.has(id)) for (const c of kids.get(id) || []) visit(c, depth + 1);
  };
  if (nodes.length) visit(nodes[0].id, 0);
  return { order, kids, maxDepth };
}

const dot = (x, y, cls, r = 4) => `<circle class="fc-dot ${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
const chevron = (cx, cy, open) => open
  ? `<path class="fc-chev" d="M${cx - 4.5} ${cy - 2} l4.5 4.5 l4.5 -4.5"/>`
  : `<path class="fc-chev" d="M${cx - 2} ${cy - 4.5} l4.5 4.5 l-4.5 4.5"/>`;

// The map in the app's style: chapters blue, sections green, subsections amber, deeper levels violet.
// Phones (vertical): the title lives in the page header, chapters hang off a trunk line, fold buttons sit beside chapters.
// Wide screens (horizontal): a deep-blue title node with curved connectors. Studied sections get a filled check.
export function flowchartSVG(nodes, { selected = 'root', collapsed = new Set(), scale = 1, direction = 'horizontal', animate = false, visited = new Set(), vWidth = V_WIDTH } = {}) {
  const vertical = direction === 'vertical';
  const kids = childrenMap(nodes), root = nodes[0]?.id;
  const at = new Map();
  let width, height;
  const edges = [], boxes = [], extras = [];
  const lvlOf = n => Math.min(n.depth, 4);
  const marker = (n, x, cy) => {
    if (n.depth < 2) return '';
    return visited.has(n.id)
      ? `<g class="fc-mark is-done"><circle cx="${x}" cy="${cy}" r="7"/><path d="M${x - 3.2} ${cy} l2.2 2.3 l4.2 -4.6"/></g>`
      : `<circle class="fc-mark" cx="${x}" cy="${cy}" r="5.5"/>`;
  };
  if (vertical) {
    const { order } = layoutVertical(nodes, collapsed);
    const rows = order.filter(o => o.id !== root);
    let y = V_PAD;
    rows.forEach((o, i) => {
      if (i > 0 && o.depth === 1) y += 8;            // a little air before each chapter
      const n = nodes.find(m => m.id === o.id), hasKids = (kids.get(o.id) || []).length > 0;
      const x = V_PAD + V_TRUNK + (o.depth - 1) * V_INDENT;
      const right = vWidth - V_PAD - (hasKids ? 40 : 0);
      at.set(o.id, { x, y, w: right - x, h: V_NODE_H, n, hasKids });
      y += V_ROW;
    });
    width = vWidth; height = Math.max(y - (V_ROW - V_NODE_H) + V_PAD, 60);
    // Trunk: the line every chapter hangs from.
    const chapters = rows.filter(o => o.depth === 1).map(o => at.get(o.id));
    const tx = V_PAD + 9;
    if (chapters.length) {
      const y1 = chapters[0].y + V_NODE_H / 2, y2 = chapters[chapters.length - 1].y + V_NODE_H / 2;
      edges.push(`<path class="fc-edge fc-e1 fc-trunk" pathLength="1" style="--d:0" d="M${tx} ${y1 - 14} V${y2}"/>`);
      extras.push(dot(tx, y1 - 14, 'fc-dl1', 4.5));
    }
  } else {
    const { pos, rows, maxDepth } = layoutTree(nodes, collapsed);
    for (const [id, p] of pos) {
      const n = nodes.find(m => m.id === id);
      const isRoot = id === root;
      at.set(id, { x: PAD + p.depth * COL_W, y: PAD + p.y * ROW_H - (isRoot ? 9 : 0), w: NODE_W, h: isRoot ? NODE_H + 18 : NODE_H, n, hasKids: (kids.get(id) || []).length > 0 });
    }
    width = PAD * 2 + maxDepth * COL_W + NODE_W + 34;
    height = PAD * 2 + Math.max(rows, 1) * ROW_H - (ROW_H - NODE_H) + 10;
  }

  for (const n of nodes) {
    const b = at.get(n.id);
    if (!b) continue;
    const { x, y, w, h } = b, lvl = lvlOf(n), sel = n.id === selected, isRoot = n.id === root;
    const ch = kids.get(n.id) || [], folded = collapsed.has(n.id), cy = y + h / 2;
    // connectors to children
    if (!folded) for (const c of ch) {
      const k = at.get(c);
      if (!k) continue;
      const cl = Math.min(n.depth + 1, 4), kcy = k.y + k.h / 2, st = `style="--d:${n.depth + 1}"`;
      if (vertical) {
        if (isRoot) {   // chapter off the trunk
          const tx = V_PAD + 9;
          edges.push(`<path class="fc-edge fc-e1" pathLength="1" ${st} d="M${tx} ${kcy - 12} Q${tx} ${kcy} ${tx + 12} ${kcy} H${k.x}"/>`);
          extras.push(dot(k.x, kcy, 'fc-dl1'));
        } else {
          const sx = x + 14;
          edges.push(`<path class="fc-edge fc-e${cl}" pathLength="1" ${st} d="M${sx} ${y + h} V${kcy - 7} Q${sx} ${kcy} ${sx + 7} ${kcy} H${k.x}"/>`);
          extras.push(dot(k.x, kcy, 'fc-dl' + cl, 3.5));
        }
      } else {
        const x1 = x + w + (isRoot ? 0 : 9), x2 = k.x, mx = (x1 + x2) / 2;
        edges.push(`<path class="fc-edge fc-e${cl}" pathLength="1" ${st} d="M${x1} ${cy} C${mx} ${cy} ${mx} ${kcy} ${x2} ${kcy}"/>`);
        extras.push(dot(x2, kcy, 'fc-dl' + cl));
      }
    }
    if (vertical && isRoot) continue;                 // the title is the page header on phones
    const canFold = ch.length && !isRoot;
    const indent = n.depth >= 2 ? 30 : 16;
    const max = isRoot ? 22 : Math.max(12, Math.floor((w - indent - 12) / (isRoot ? 8.6 : 7.4)));
    const label = wrapLabel(n.title, max);
    const ty = cy - (label.length - 1) * 8 + 5;
    const text = label.map((l, i) => `<tspan x="${x + indent}" y="${ty + i * 16}">${esc(l)}</tspan>`).join('');
    const hidden = folded ? countDescendants(n.id, kids) : 0;
    let toggle = '';
    if (canFold) {
      const tcx = vertical ? x + w + 22 : x + w + 9, r = vertical ? 15 : 9;
      const inside = vertical
        ? (folded ? `<text x="${tcx}" y="${cy + 4.5}" text-anchor="middle"${hidden > 9 ? ' class="fc-small"' : ''}>+${hidden}</text>` : chevron(tcx, cy, true))
        : `<text x="${tcx}" y="${cy + 4.5}" text-anchor="middle">${folded ? '+' : '−'}</text>`;
      toggle = `<g class="fc-toggle" data-toggle="${esc(n.id)}" role="button" tabindex="0" style="--d:${n.depth}" aria-label="${folded ? 'Expand' : 'Collapse'} ${esc(n.title)}"><title>${folded ? `Show ${hidden} hidden section${hidden === 1 ? '' : 's'}` : 'Fold this branch'}</title><circle cx="${tcx}" cy="${cy}" r="${r}"/>${inside}</g>${folded && !vertical ? `<text class="fc-hidden" x="${x + w + 24}" y="${cy + 4}">${hidden}</text>` : ''}`;
    }
    boxes.push(`<g class="fc-node fc-l${isRoot ? 0 : lvl}${visited.has(n.id) ? ' fc-seen' : ''}${sel ? ' fc-sel' : ''}" data-node="${esc(n.id)}" role="button" tabindex="0" style="--d:${n.depth}" aria-label="Open ${esc(n.title)}"${sel ? ' aria-current="true"' : ''}><title>${esc(n.title)}${n.source && n.source !== n.title ? ' (' + esc(n.source) + ')' : ''}</title><rect class="fc-plate" x="${x}" y="${y}" width="${w}" height="${h}" rx="${isRoot ? 16 : 12}"/>${marker(n, x + 16, cy)}<text class="fc-label">${text}</text></g>${toggle}`);
  }
  const svg = `<svg class="flowchart${vertical ? ' is-v' : ' is-h'}${animate ? ' fc-anim' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${Math.round(width * scale)}" height="${Math.round(height * scale)}" role="group" aria-label="Study map">${edges.join('')}${extras.join('')}${boxes.join('')}</svg>`;
  return { svg, width, height };
}

// Name of each level for the map key; PDFs and slide decks are split by page or slide.
export function levelNames(doc) {
  const refs = (doc?.sections || []).map(s => s.ref || '');
  const unit = refs.length && refs.every(r => /^Page \d+/.test(r)) ? 'Page' : refs.length && refs.every(r => /^Slide \d+/.test(r)) ? 'Slide' : 'Chapter';
  return ['Document', unit, 'Section', 'Subsection', 'Detail'];
}
