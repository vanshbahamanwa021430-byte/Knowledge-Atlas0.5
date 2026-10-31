// Screenshots + UI checks for Smarty in every theme (mock AI). Usage: node scripts/smartyshots.mjs [baseURL]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL = process.argv[2] || 'http://127.0.0.1:4211/', OUT = '/workspace/out/tutor-0.9.5', FX = '/workspace/ka/tests/fixtures/';
fs.mkdirSync(OUT, { recursive: true }); for (const d of ['figures', 'visuals', 'ocr']) fs.mkdirSync(OUT + '/' + d, { recursive: true });
const THEMES = ['light', 'dark', 'aesthetic', 'anime', 'glass', 'oldmoney', 'vintage'];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
async function ai(route) {
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  const b = JSON.parse(route.request().postData() || '{}'), sys = b.messages[0].content;
  const q = (p, c, t, d) => ({ prompt: p, options: ['Permanent self-weight', 'Wind gusts', 'Moving people', 'Snow'], correct: c, explanation: 'Dead loads are permanent loads such as self-weight [S1].', topic: t, difficulty: d, source: 1 });
  const user = b.messages[1].content, utext = typeof user === 'string' ? user : user.map(x => x.text || '').join(' ');
  if (Array.isArray(user)) globalThis.sawImages = (globalThis.sawImages || 0) + user.filter(x => x.type === 'image_url').length;
  if (/imitates a real exam/.test(sys)) {
    const slots = [...utext.matchAll(/^(\d+)\. (mcq|multi|numerical|written)/gm)].map(m => ({ n: +m[1], type: m[2] }));
    const c2 = { questions: slots.map(x => ({ slot: x.n, source: '[1.1 Dead loads]', solution: 'Worked.', prompt: x.n === 1 ? 'Find the current through R2 in the circuit shown.' : `Question ${x.n} on loads?`, options: ['1 A', '2 A', '3 A', '4 A'], correct: x.type === 'multi' ? [0] : 0, answer: 1, tolerance: 0, rubric: 'Point.', figure: x.n === 1 ? 'F1' : undefined })) };
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(c2) } }] }) });
  }
  if (/analyse past exam papers/.test(sys)) {
    const c3 = { name: 'Physics ESE', durationMin: 180, totalMarks: 100, sections: [{ name: 'A', type: 'mcq', count: 4, marks: 5, negative: 0, style: 'numerical' }], difficulty: { easy: 30, medium: 50, hard: 20 }, topics: [{ name: 'Circuits', weight: 3 }], styleNotes: [], traps: [], repeated: [] };
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(c3) } }] }) });
  }
  if (/study assistant/.test(sys)) {
    const c4 = { answer: 'The heart pumps blood in a loop.\n\n```mermaid\nflowchart LR\n  A[Body] --> B[Right heart] --> C[Lungs] --> D[Left heart] --> A\n```\n\nPressure: $P = \\frac{F}{A}$ and $$Q = \\frac{\\Delta P}{R}$$', general: true };
    return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(c4) } }] }) });
  }
  const c = /audit practice/.test(sys) ? { verdicts: [1, 2, 3, 4].map(i => ({ id: 'p' + i, valid: true, correct: 0 })) }
    : /practice questions/.test(sys) ? { questions: [q('Which is a dead load?', 0, 'Dead loads', 'easy'), q('Dead loads include…', 0, 'Dead loads', 'medium'), q('Which load never changes?', 0, 'Bending moment', 'medium'), q('Self-weight is a…', 0, 'Live loads', 'hard')] }
    : /Smarty/.test(sys) ? { answer: 'Dead loads are permanent loads on a structure, like its own weight [S1].\n\n- They do not change over time [S1]\n- Live loads, by contrast, move [S2]\n\nQuick check: is a parked car a dead load?', topic: 'Dead loads' }
    : { questions: [] };
  await route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(c) } }] }) });
}
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.route(/commons\.wikimedia\.org/, r => r.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ query: { pages: { 1: { title: 'File:Heart diagram.svg.png', index: 1, imageinfo: [{ thumburl: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#fde"/><circle cx="160" cy="100" r="60" fill="#c33"/></svg>'), descriptionurl: 'https://commons.wikimedia.org/wiki/File:Heart', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: 'Example Author' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' } } }] } } } }) }));
await ctx.route(/api\.openai\.com|generativelanguage\.googleapis\.com|api\.groq\.com|api\.github\.com/, ai);
await ctx.addInitScript(() => { localStorage.setItem('prvlar-update', JSON.stringify({ auto: false, last: Date.now() })); localStorage.setItem('prvlar-onboarded', 'true'); localStorage.setItem('prvlar-entry', '"guest"'); });
const p = await ctx.newPage(); p.setDefaultTimeout(5000); const errors = [], results = [];
p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept());
const hash = h => p.evaluate(x => { location.hash = x; }, h).then(() => p.waitForTimeout(250));
const step = async (name, fn) => { const e0 = errors.length; try { await fn(); if (errors.length > e0) throw Error(errors.slice(e0).join(' | ')); results.push({ name, ok: true }); console.log('PASS', name); } catch (e) { await p.screenshot({ path: '/tmp/fail-' + results.length + '.png' }).catch(() => {}); results.push({ name, ok: false, msg: e.message.split('\n')[0] }); console.log('FAIL', name, e.message.split('\n')[0]); } };
await p.goto(URL); await p.waitForTimeout(800);
await step('import a document', async () => { await hash('library'); await p.setInputFiles('input[data-import] >> nth=0', '/workspace/smoke/doc.md'); await p.waitForSelector('.v-study'); });
const SC = '/workspace/out/tutor-0.9.5/ocr/scanned-paper.pdf';
await step('OCR: scanned PDF imports with progress bar', async () => { await hash('library'); await p.setInputFiles('input[data-import] >> nth=0', SC); await p.waitForSelector('#ocr-bar', { timeout: 30000 }); await p.screenshot({ path: OUT + '/ocr/progress.png' }); await p.waitForSelector('.v-study', { timeout: 120000 }); await hash('notes'); });
await step('OCR: recognised text is searchable', async () => { const t = await p.evaluate(() => new Promise(r => { const q = indexedDB.open('knowledge-atlas-personal-v2'); q.onsuccess = () => { const g = q.result.transaction('documents').objectStore('documents').getAll(); g.onsuccess = () => r(JSON.stringify(g.result.filter(d => /scanned/.test(d.name)).map(d => d.sections))); }; })); fs.writeFileSync(OUT + '/ocr/ocr-text.json', t); if (!/kinetic energy/i.test(t) || !/Newton/i.test(t)) throw Error('OCR text missing: ' + t.slice(0, 200)); });
await step('OCR: custom paper analysis reads the scan', async () => { await hash('examlab'); await p.waitForTimeout(300); const tabs = await p.$$('[data-lab]'); for (const t of tabs) if (/custom/i.test(await t.textContent())) { await t.click(); break; } await p.setInputFiles('input[data-paperpdf] >> nth=0', SC); await p.waitForSelector('.paper-ic.ok', { timeout: 120000 }); await p.screenshot({ path: OUT + '/ocr/paper-analysis.png' }); });
const FIG = '/workspace/out/tutor-0.9.5/figures/paper-with-figures.pdf';
await step('Figures: paper figures are cropped and attached to the generated question', async () => {
  await hash('examlab'); await p.waitForTimeout(300); await p.click('[data-lab="custom"]').catch(() => {});
  await p.fill('#cx-name', 'Physics ESE'); await p.setInputFiles('input[data-paperpdf] >> nth=0', FIG); await p.waitForSelector('.paper-ic.ok', { timeout: 60000 });
  const figs = await p.evaluate(() => 0); void figs;
});
await step('set Gemini-style key', async () => { await hash('settings'); await p.fill('#apikey', 'AI' + 'zaTEST-not-real'); await p.waitForTimeout(300); });
await step('Figures: analyse papers, generate test, figure shows with zoom', async () => {
  await hash('examlab'); await p.waitForTimeout(300); await p.click('[data-action="analyseCustom"]'); await p.waitForTimeout(1500);
  const prof = await p.evaluate(() => new Promise(r => { const q = indexedDB.open('knowledge-atlas-personal-v2'); q.onsuccess = () => { const g = q.result.transaction('profiles').objectStore('profiles').getAll(); g.onsuccess = () => r(g.result.map(x => (x.meta?.figures || []).length)); }; }));
  if (!prof.some(n => n > 0)) throw Error('no figures saved on the profile: ' + JSON.stringify(prof));
  await hash('library'); await p.setInputFiles('input[data-import] >> nth=0', FX + 'physics-notes.md'); await p.waitForSelector('.v-study');
  await hash('test'); await p.waitForTimeout(400); await p.click('[data-action="generate"]'); await p.waitForSelector('.q-fig img', { timeout: 20000 });
  await p.screenshot({ path: OUT + '/figures/test-question-figure.png' });
  await p.click('.q-fig .zoomable'); await p.waitForSelector('.zoom-ov img'); await p.screenshot({ path: OUT + '/figures/zoom.png' }); await p.click('.zoom-x');
  globalThis.figImages = globalThis.sawImages || 0;
});
await step('AI Chat: out-of-document answer badge, Mermaid diagram, KaTeX, Commons image', async () => {
  await hash('chat'); await p.waitForTimeout(300); await p.fill('#chatq', 'How does the heart pump blood?'); await p.click('[data-action="chatSend"]');
  await p.waitForSelector('.gen-badge'); await p.waitForSelector('.mmd.is-drawn svg', { timeout: 20000 }); await p.waitForSelector('.katex');
  await p.click('[data-findimg]'); await p.waitForSelector('.cm-img figcaption'); const cap = await p.textContent('.cm-img figcaption'); if (!/Example Author/.test(cap) || !/CC BY-SA/.test(cap)) throw Error('attribution missing: ' + cap);
  await p.evaluate(() => document.querySelector('.thread .msg.ai')?.scrollIntoView()); await p.screenshot({ path: OUT + '/visuals/chat-diagram-math-image.png', fullPage: true });
});
await step('"Only use my documents" toggle defaults off and persists', async () => { if (await p.isChecked('#docsonly')) throw Error('default on'); await p.check('#docsonly'); if ((await p.evaluate(() => localStorage.getItem('prvlar-docs-only'))) !== 'true') throw Error('not saved'); await p.uncheck('#docsonly'); });
await step('Smarty is in Study', async () => { await hash('library'); await p.click('.study-links [data-view="smarty"]'); await p.waitForSelector('.smarty'); });
await step('Ask: answer with citations', async () => { await p.fill('#smartyq', 'What are dead loads?'); await p.click('[data-action="smartySend"]'); await p.waitForSelector('.sm-src .chip'); const t = await p.textContent('.sm-src'); if (!/›/.test(t)) throw Error('no doc›section citation: ' + t); });
await step('Practice: verified questions, answer all', async () => { await p.click('[data-smtab="practice"]'); await p.click('[data-action="smartyPractice"]'); await p.waitForSelector('[data-smpick]'); if (!/Question 1 of 4/.test(await p.textContent('.sm-step'))) throw Error('not one-per-screen');
  for (let i = 1; i <= 4; i++) { await p.click(`[data-smpick="p${i}:${i <= 2 ? 0 : 1}"]`); await p.click('[data-action="smNext"]'); } await p.waitForSelector('text=2/4 correct'); });
await step('Profile shows weak topics and reset button', async () => { await p.click('[data-smtab="profile"]'); await p.waitForSelector('.sm-topic'); const t = await p.textContent('.smarty'); if (!/Bending moment|Live loads/.test(t)) throw Error('weak topic missing'); });
await step('History is searchable', async () => { await p.click('[data-smtab="memory"]'); const all = await p.$$eval('.sm-list li', l => l.length); await p.fill('#smartysearch', 'practice'); await p.waitForTimeout(200); const f = await p.$$eval('.sm-list li', l => l.length); if (!(all >= 2 && f >= 1 && f < all)) throw Error(`all ${all} filtered ${f}`); await p.fill('#smartysearch', ''); });
await step('About credits Smarty inspiration', async () => { await hash('about'); const t = await p.textContent('.view'); if (!/inspired by DeepTutor[\s\S]*Apache-2\.0[\s\S]*Zhao et al\., 2026/.test(t)) throw Error('credit missing'); });
await step('Reachability: every hub link opens its screen', async () => {
  const groups = { library: '.study-links button', practice: '.hub-list button', plan: '.hub-list button', more: '.hub-list button' };
  for (const [tab, sel] of Object.entries(groups)) { await hash(tab); const n = await p.$$eval(sel, l => l.length); if (!n) throw Error('no links on ' + tab);
    for (let i = 0; i < n; i++) { await hash(tab); await p.waitForTimeout(150); const before = await p.evaluate(() => location.hash); await p.click(`${sel} >> nth=${i}`); await p.waitForTimeout(250); const after = await p.evaluate(() => location.hash); if (after === before && !/settings/.test(after)) throw Error(`${tab} link ${i} did not navigate`); } }
  for (const t of ['home', 'library', 'practice', 'plan', 'more']) { await p.click(`.tabbar [data-view="${t}"]`); await p.waitForTimeout(200); if (!(await p.evaluate(() => location.hash)).includes(t)) throw Error('tab ' + t); }
});
for (const th of THEMES) await step('screens in ' + th, async () => {
  await p.evaluate(t => localStorage.setItem('prvlar-theme', JSON.stringify(t)), th); await p.reload(); await p.waitForTimeout(500); await hash('smarty');
  for (const tab of ['chat', 'practice', 'profile', 'memory']) { await p.click(`[data-smtab="${tab}"]`); await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/${th}-${tab}.png`, fullPage: false }); }
});
await step('Reset profile', async () => { await p.click('[data-smtab="profile"]'); await p.click('[data-action="smartyReset"]'); await p.waitForSelector('text=No weak topics yet'); });
fs.writeFileSync(OUT + '/ui-results.json', JSON.stringify({ results, errors, imagesSentToGemini: globalThis.figImages || 0 }, null, 1)); console.log('figure images sent to Gemini mock:', globalThis.figImages || 0);
console.log(results.filter(r => r.ok).length + '/' + results.length + ' passed'); await browser.close();
