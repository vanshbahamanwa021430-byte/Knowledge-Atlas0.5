// On-device OCR for scanned PDFs and photos (tesseract.js, Apache-2.0). Engine, worker and English data ship
// inside the app under /ocr/, so it works offline. One shared worker; progress goes to a listener; cancellable.
import { createWorker } from 'tesseract.js';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
const abs = p => new URL(BASE + p, location.href).href;
let workerP = null, listener = () => {}, cancelled = false;
export const onOcrProgress = fn => { listener = fn || (() => {}); };
export const cancelOcr = () => { cancelled = true; };
export const needsOcr = (text, pages = 1) => String(text || '').replace(/\s+/g, '').length < Math.max(60, 40 * pages);

function worker() {
  workerP ??= createWorker('eng', 1, {
    workerPath: abs('ocr/worker.min.js'), corePath: abs('ocr/'), langPath: abs('ocr/'), gzip: false, cacheMethod: 'none',
    workerBlobURL: false, logger: m => { if (m.status === 'recognizing text' && cur) listener({ ...cur, pagePct: m.progress }); }
  }).catch(e => { workerP = null; throw e; });
  return workerP;
}
let cur = null;
const check = () => { if (cancelled) { cancelled = false; cur = null; listener(null); throw Error('OCR cancelled.'); } };

// pdf: a pdf.js document. Returns array of page texts (pages over the cap are left empty).
export async function ocrPdf(pdf, { maxPages = 30, name = 'PDF' } = {}) {
  cancelled = false;
  const n = Math.min(pdf.numPages, maxPages), out = [];
  try {
    cur = { name, page: 0, pages: n, pagePct: 0, capped: pdf.numPages > maxPages }; listener(cur);
    const w = await worker();
    for (let i = 1; i <= n; i++) {
      check(); cur = { ...cur, page: i, pagePct: 0 }; listener(cur);
      const page = await pdf.getPage(i), vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      check();
      const { data } = await w.recognize(canvas);
      out.push(String(data.text || '').trim());
      out.lines = out.lines || []; out.lines[i - 1] = (data.lines || []).map(l => ({ text: l.text.trim(), y0: l.bbox.y0 / 2, y1: l.bbox.y1 / 2 }));
      canvas.width = canvas.height = 0;
    }
  } finally { cur = null; listener(null); }
  return out;
}
export async function ocrImage(blob, name = 'Image') {
  cancelled = false; cur = { name, page: 1, pages: 1, pagePct: 0 }; listener(cur);
  try { const w = await worker(); const { data } = await w.recognize(blob); return String(data.text || '').trim(); } finally { cur = null; listener(null); }
}
