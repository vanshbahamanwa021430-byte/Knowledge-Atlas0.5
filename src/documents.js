import mammoth from 'mammoth';
import JSZip from 'jszip';
import { splitSections, outline, sourceContext, contextInfo, verifySources } from './structure.js';
import { uuid } from './platform.js';
import { needsOcr, ocrPdf, ocrImage } from './ocr.js';
import { toLines, questionRegions } from './figures.js';

const OCR_FAIL = 'No readable text was found, even after scanning the pages for text (OCR). Try a clearer scan or photo.';

export { outline, sourceContext, contextInfo, verifySources };

let pdfjsPromise;
// pdf.js 4.x throws "No GlobalWorkerOptions.workerSrc specified" in browsers unless the worker URL is set.
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  ]).then(([pdfjs, worker]) => { pdfjs.GlobalWorkerOptions.workerSrc = worker.default; return pdfjs; });
  return pdfjsPromise;
}

const firstLine = t => (t.split('\n').find(l => l.trim()) || '').trim();

// Convert Word HTML to text that keeps real heading levels as "#" markers.
function htmlToMarkedText(html) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  return [...dom.body.children].map(el => {
    if (/^H[1-6]$/.test(el.tagName)) return '#'.repeat(Number(el.tagName[1])) + ' ' + el.textContent.trim();
    if (el.tagName === 'UL' || el.tagName === 'OL') return [...el.children].map(li => '• ' + li.textContent.trim()).join('\n');
    if (el.tagName === 'TABLE') return [...el.querySelectorAll('tr')].map(tr => [...tr.children].map(c => c.textContent.trim()).join(' | ')).join('\n');
    return el.textContent.trim();
  }).filter(Boolean).join('\n');
}

// Does the page draw a picture (embedded image) or a lot of vector paths (circuit, graph, table rules)?
async function pageHasFigure(pdfjs, page) {
  const { fnArray } = await page.getOperatorList(), O = pdfjs.OPS; let paths = 0;
  for (const f of fnArray) { if (f === O.paintImageXObject || f === O.paintInlineImageXObject || f === O.paintImageMaskXObject) return true; if (f === O.constructPath) paths++; }
  return paths > 8;
}
// Renders a horizontal band of a page (top-down units at scale 1) to a JPEG data URL.
export async function cropPage(page, y0, y1, scale = 2) {
  const vp = page.getViewport({ scale }), top = Math.max(0, (y0 - 6) * scale), h = Math.min(vp.height, (y1 + 4) * scale) - top;
  if (h < 20) return null;
  const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(h);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp, transform: [1, 0, 0, 1, 0, -top] }).promise;
  const url = c.toDataURL('image/jpeg', 0.78); c.width = c.height = 0; return url;
}
// Figures of past-paper questions: each question region with a drawing is cropped to an image.
async function paperFigures(pdfjs, pdf, ocrLines, maxPages = 12) {
  const figs = [];
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i), vp = page.getViewport({ scale: 1 });
    if (!ocrLines && !await pageHasFigure(pdfjs, page)) continue;
    const lines = ocrLines ? (ocrLines[i - 1] || []) : toLines((await page.getTextContent()).items.map(t => ({ text: t.str, x: t.transform[4], y0: vp.height - t.transform[5] - (t.height || 10), y1: vp.height - t.transform[5] })));
    for (const r of questionRegions(lines, vp.height)) if (r.figure && figs.length < 24) { const img = await cropPage(page, r.y0, r.y1); if (img) figs.push({ id: `F${figs.length + 1}`, page: i, q: r.q, text: r.text, img }); }
  }
  return figs;
}
// Pages of a document that contain a figure (for showing the page next to an answer).
export async function figurePages(bytes, maxPages = 80) {
  const pdfjs = await loadPdfjs(), pdf = await pdfjs.getDocument({ data: bytes.slice ? bytes.slice(0) : bytes, disableFontFace: true, isEvalSupported: false }).promise, out = [];
  try { for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) if (await pageHasFigure(pdfjs, await pdf.getPage(i))) out.push(i); } finally { await pdf.destroy(); }
  return out;
}
// Renders one page of a stored PDF as an image.
export async function renderPdfPage(bytes, n, scale = 1.6) {
  const pdfjs = await loadPdfjs(), pdf = await pdfjs.getDocument({ data: bytes.slice ? bytes.slice(0) : bytes, disableFontFace: true, isEvalSupported: false }).promise;
  try { const page = await pdf.getPage(n), vp = page.getViewport({ scale: 1 }); return await cropPage(page, 0, vp.height, scale); } finally { await pdf.destroy(); }
}

// Text of a PDF (for past-paper analysis). Returns { text, pages, ocr, figures? }.
export async function pdfText(bytes, opts = {}) {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), disableFontFace: true, useSystemFonts: true, isEvalSupported: false }).promise;
  const out = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const c = await (await pdf.getPage(i)).getTextContent();
    out.push(c.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+\n/g, '\n').trim());
  }
  const pages = pdf.numPages; let ocr = false;
  // Scanned paper (no text layer): read the page images on the device instead.
  let ocrLinesOf = null;
  if (needsOcr(out.join(''), pages)) { try { const t = await ocrPdf(pdf, { maxPages: 12, name: opts.name || 'Paper' }); if (!needsOcr(t.join(''), 1)) { out.splice(0, out.length, ...t); ocr = true; ocrLinesOf = t.lines || []; } } catch (e) { if (/cancel/i.test(e.message)) { await pdf.destroy(); throw e; } } }
  let figures;
  if (opts.figures) try { figures = await paperFigures(pdfjs, pdf, ocr ? ocrLinesOf : null); } catch { figures = []; }
  await pdf.destroy();
  return { text: out.join('\n\n'), pages, ocr, figures };
}

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  let sections = [], pdfBytes = null; const figPages = [];
  if (ext === 'txt' || ext === 'md') {
    sections = splitSections(await file.text());
  } else if (ext === 'docx') {
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    sections = splitSections(htmlToMarkedText(value));
  } else if (ext === 'pdf') {
    const pdfjs = await loadPdfjs();
    pdfBytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: pdfBytes.slice(), disableFontFace: true, useSystemFonts: true, isEvalSupported: false }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i), c = await pg.getTextContent();
      if (i <= 80) try { if (await pageHasFigure(pdfjs, pg)) figPages.push(i); } catch { /* ignore */ }
      const text = c.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+\n/g, '\n').trim();
      sections.push({ ref: 'Page ' + i, title: firstLine(text).slice(0, 75) || 'Page ' + i, level: 1, text });
    }
    if (needsOcr(sections.map(s => s.text).join(''), pdf.numPages)) {
      try {
        const texts = await ocrPdf(pdf, { maxPages: 40, name: file.name });
        sections = texts.map((text, j) => ({ ref: 'Page ' + (j + 1), title: firstLine(text).slice(0, 75) || 'Page ' + (j + 1), level: 1, text, ocr: true }));
      } catch (e) { await pdf.destroy(); throw Error(/cancel/i.test(e.message) ? 'Scanning stopped. The document was not imported.' : OCR_FAIL); }
    }
    await pdf.destroy();
  } else if (ext === 'pptx') {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const num = p => Number(p.match(/slide(\d+)\.xml$/)[1]);
    const files = Object.keys(zip.files).filter(x => /^ppt\/slides\/slide\d+\.xml$/.test(x)).sort((a, b) => num(a) - num(b));
    for (const path of files) {
      const xml = await zip.file(path).async('string');
      const texts = [...new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('a:t')].map(e => e.textContent);
      const n = num(path);
      sections.push({ ref: 'Slide ' + n, title: (texts[0] || 'Slide ' + n).slice(0, 75), level: 1, text: texts.join('\n') });
    }
  } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    let text = '';
    try { text = await ocrImage(file, file.name); } catch (e) { throw Error(/cancel/i.test(e.message) ? 'Scanning stopped. The image was not imported.' : OCR_FAIL); }
    sections = splitSections(text).map(s => ({ ...s, ocr: true }));
  } else throw Error('Unsupported format. Use PDF, DOCX, PPTX, TXT, MD or a photo (JPG, PNG).');
  sections = sections.map(s => ({ ...s, text: s.text.trim() }));
  if (!sections.some(s => s.text)) throw Error(OCR_FAIL);
  if (ext === 'pdf' || ext === 'pptx') sections = sections.filter(s => s.text);
  const doc = { id: uuid(), name: file.name, created: Date.now(), sections };
  if (pdfBytes) { doc.figPages = figPages; Object.defineProperty(doc, 'bytes', { value: pdfBytes, enumerable: false }); }
  return doc;
}
