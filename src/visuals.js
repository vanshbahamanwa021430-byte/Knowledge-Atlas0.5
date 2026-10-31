// Visuals in AI replies: Mermaid diagrams, inline SVG drawings and KaTeX maths (all bundled, offline), plus an
// optional Wikimedia Commons picture search (free-licence files only, with author and licence shown).
// Pure helpers first (unit-tested in Node); browser-only rendering is lazy-loaded.

// Splits a reply into text, ```mermaid and ```svg parts. Other fenced code stays in the text.
export function splitBlocks(text) {
  const out = [], re = /```(mermaid|svg)[ \t]*\n([\s\S]*?)```/gi; let last = 0, m;
  const s = String(text || '');
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ type: 'text', body: s.slice(last, m.index) });
    out.push({ type: m[1].toLowerCase(), body: m[2].trim() }); last = re.lastIndex;
  }
  if (last < s.length) out.push({ type: 'text', body: s.slice(last) });
  return out.filter(p => p.type !== 'text' || p.body.trim());
}
// Pulls $$…$$ and $…$ maths out of text, leaving \u0001N\u0001 placeholders. "$5 and $10" (money) is left alone.
export function extractMath(text) {
  const math = [];
  const put = (tex, display) => { math.push({ tex: tex.trim(), display }); return `\u0001${math.length - 1}\u0001`; };
  const t = String(text || '')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, x) => put(x, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, x) => put(x, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, x) => put(x, false))
    .replace(/\$(?!\s)([^$\n]{1,200}?)(?<!\s)\$(?!\d)/g, (m, x) => /[\\^_={}]|[a-z]\s*[+\-*/]\s*[a-z0-9]|^[a-zA-Z]$/.test(x) ? put(x, false) : m);
  return { text: t, math };
}
// Keeps only free-licence Commons files (CC0, CC BY, CC BY-SA, public domain) and returns display data.
const stripTags = h => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
export const FREE_LICENSE = /^(cc0|cc[ -]by(-sa)?([ -]\d(\.\d)?)?|public domain|pd\b|pd-)/i;
export function commonsResults(json) {
  const pages = Object.values(json?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  return pages.flatMap(p => {
    const ii = p.imageinfo?.[0], md = ii?.extmetadata || {}, lic = stripTags(md.LicenseShortName?.value);
    if (!ii || !FREE_LICENSE.test(lic) || /nc|nd/i.test(lic.replace(/^cc0/i, ''))) return [];
    return [{ title: p.title.replace(/^File:/, ''), thumb: ii.thumburl || ii.url, page: ii.descriptionurl, author: stripTags(md.Artist?.value) || 'Unknown author', license: lic, licenseUrl: md.LicenseUrl?.value || '' }];
  });
}
export const commonsUrl = q => 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: `filetype:bitmap ${q}`, gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '640' });

// ---------- browser-only ----------
let purify = null, katex = null, mermaidP = null;
const svgCache = new Map();
async function libs() {
  if (!purify) { const [d, k] = await Promise.all([import('dompurify'), import('katex'), import('katex/dist/katex.min.css')]); purify = d.default; katex = k.default; }
}
export const ready = () => !!purify;
export const preload = () => libs();
export function sanitizeSvg(svg) { return purify ? purify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['foreignObject', 'script', 'style'], FORBID_ATTR: ['href', 'xlink:href'] }) : ''; }
export function mathHTML(tex, display) { try { return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false }); } catch { return ''; } }
export const cachedDiagram = code => svgCache.get(code);
// Renders every pending [data-mmd] placeholder; results are cached so re-renders are instant.
export async function hydrateDiagrams(root = document) {
  const els = [...root.querySelectorAll('[data-mmd]:not([data-done])')]; if (!els.length) return;
  mermaidP ??= import('mermaid').then(m => { m.default.initialize({ startOnLoad: false, securityLevel: 'strict', theme: document.documentElement.matches('[data-theme="dark"],[data-theme="glass"]') ? 'dark' : 'default', fontFamily: 'inherit', htmlLabels: false, flowchart: { htmlLabels: false } }); return m.default; });
  const mermaid = await mermaidP; await libs();
  for (const el of els) {
    el.dataset.done = '1'; const code = decodeURIComponent(el.dataset.mmd);
    try {
      let svg = svgCache.get(code);
      if (!svg) { const r = await mermaid.render('mmd' + Math.random().toString(36).slice(2), code); svg = purify.sanitize(r.svg, { USE_PROFILES: { svg: true, svgFilters: true, html: true }, ADD_TAGS: ['foreignObject'] }); svgCache.set(code, svg); }
      el.innerHTML = svg; el.classList.add('is-drawn');
    } catch { el.innerHTML = `<pre class="mmd-src">${code.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`; }
  }
}
export async function findCommonsImages(query) {
  const res = await fetch(commonsUrl(query)); if (!res.ok) throw Error('Wikimedia Commons is not reachable right now.');
  return commonsResults(await res.json());
}
