// Headless smoke test of the PUBLIC web build (dist-web served at :4173): PWA, responsive layout (phone + desktop),
// every theme, onboarding, Smarty Code (real JS worker + real Pyodide, mocked AI review), Account card with the
// Google button, /privacy and /terms pages, and offline reload through the service worker.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const URL = process.argv[2] || 'http://localhost:4173/', OUT = '/workspace/out/web-0.9.5';
fs.mkdirSync(OUT, { recursive: true });
const THEMES = ['light', 'dark', 'aesthetic', 'anime', 'glass', 'oldmoney', 'vintage'];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
const REVIEW = { summary: 'Close! The recursion has no base case.', issues: [{ kind: 'bug', line: 2, msg: 'No base case: factorial(0) recurses forever (RecursionError).' }, { kind: 'style', line: null, msg: 'Name the parameter clearly.' }], complexity: 'O(n) time, O(n) stack', hints: { nudge: 'What should factorial(0) return?', hint: 'Return 1 when n is 0 or 1 before recursing.', pseudo: 'if n <= 1: return 1\nreturn n * factorial(n - 1)', solution: 'def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)' }, concepts: ['Recursion'] };
async function ai(route) {
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  const sys = JSON.parse(route.request().postData() || '{}').messages?.[0]?.content || '';
  const c = /Smarty Code/.test(sys) ? REVIEW : { answer: 'ok' };
  return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(c) } }] }) });
}
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const results = [], errors = [];
const step = async (name, fn, p) => { const e0 = errors.length; try { await fn(); if (errors.length > e0) throw Error(errors.slice(e0).join(' | ')); results.push({ name, ok: true }); console.log('PASS', name); } catch (e) { if (p) await p.screenshot({ path: `${OUT}/FAIL-${results.length}.png` }).catch(() => {}); results.push({ name, ok: false, msg: e.message.split('\n')[0] }); console.log('FAIL', name, e.message.split('\n')[0]); } };
async function ctxFor(kind) {
  const ctx = await browser.newContext(kind === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1366, height: 860 } });
  await ctx.route(/generativelanguage\.googleapis\.com|api\.groq\.com|api\.openai\.com/, ai);
  await ctx.route(/accounts\.google\.com\/gsi/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.google={accounts:{oauth2:{initTokenClient:()=>({requestAccessToken(){}})}}};' }));
  return ctx;
}
for (const kind of ['phone', 'desktop']) {
  const ctx = await ctxFor(kind), p = await ctx.newPage(); p.setDefaultTimeout(8000);
  p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept());
  const hash = h => p.evaluate(x => { location.hash = x; }, h).then(() => p.waitForTimeout(300));
  await p.goto(URL); await p.waitForTimeout(800);
  if (kind === 'phone') {
    await step('onboarding: 3 screens, name + stream, greeting uses the name', async () => {
      await p.waitForSelector('.onboard'); if (await p.$('.welcome-gate')) { await p.screenshot({ path: `${OUT}/phone-welcome.png` }); await p.click('[data-action=gateGuest]'); await p.waitForSelector('#ob-name'); } await p.screenshot({ path: `${OUT}/phone-onboarding-1.png` });
      await p.fill('#ob-name', 'Sam'); await p.dispatchEvent('#ob-name', 'change'); await p.selectOption('#ob-stream', 'cs');
      await p.click('[data-action="obNext"]'); await p.waitForSelector('.ui-size'); await p.screenshot({ path: `${OUT}/phone-onboarding-2.png` });
      await p.click('[data-action="obNext"]'); await p.screenshot({ path: `${OUT}/phone-onboarding-3.png` }); await p.click('[data-action="obDone"]');
      await hash('home'); const h = await p.textContent('.greet h1'); if (!/, Sam$/.test(h.trim())) throw Error('greeting: ' + h);
      if (!await p.$('.quick[data-view="code"]')) throw Error('no Smarty Code quick action for a CS student');
    }, p);
  } else await p.evaluate(() => { localStorage.setItem('prvlar-onboarded', 'true'); localStorage.setItem('prvlar-entry', '"guest"'); localStorage.setItem('prvlar-name', '"Sam"'); localStorage.setItem('prvlar-stream', '"cs"'); location.reload(); }), await p.waitForTimeout(800);
  await step(`${kind}: layout (${kind === 'phone' ? 'side drawer menu' : 'sidebar'})`, async () => {
    await hash('home'); const nav = await p.evaluate(() => { const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }; return { tabs: vis('.mbar'), side: vis('.sidebar, aside.side, nav.side') }; });
    if (kind === 'phone' ? !nav.tabs : !nav.side) throw Error(JSON.stringify(nav));
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); if (overflow) throw Error('horizontal overflow');
  }, p);
  for (const t of THEMES) await step(`${kind}: ${t} theme — Home, Study, Practice, Smarty Code, Settings`, async () => {
    await p.evaluate(th => { localStorage.setItem('prvlar-theme', JSON.stringify(th)); }, t); await p.reload(); await p.waitForTimeout(600);
    for (const v of ['home', 'library', 'practice', 'code', 'settings']) { await hash(v); await p.waitForTimeout(v === 'code' ? 900 : 250); await p.screenshot({ path: `${OUT}/${kind}-${t}-${v}.png` }); }
  }, p);
  await p.evaluate(() => localStorage.setItem('prvlar-theme', '"light"')); await p.reload(); await p.waitForTimeout(500);
  await step(`${kind}: Account card shows Sign in with Google (web client ID configured)`, async () => { await hash('settings'); await p.waitForSelector('[data-action="cloudSignIn"]'); }, p);
  if (kind === 'phone') {
    await step('Smarty Code: JavaScript runs in a sandboxed worker; fetch is blocked', async () => {
      await hash('code'); await p.click('[data-cprob="sum-even"]'); await p.click('[data-cstep="code"]'); await p.selectOption('#clang', 'javascript'); await p.waitForSelector('.cm-host.is-cm');
      await p.evaluate(() => { const v = document.querySelector('.cm-content').cmView?.view; }); 
      await p.click('.cm-content'); await p.keyboard.press('Control+A'); await p.keyboard.type('function sumEven(nums) {\nconsole.log(typeof fetch);\nreturn nums.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0);\n', { delay: 0 });
      await p.click('[data-action="codeRun"]'); await p.waitForSelector('text=3/3 tests pass'); await p.click('summary:has-text("Printed output")');
      if (!/undefined/.test(await p.textContent('.code-out'))) throw Error('fetch visible in worker'); await p.screenshot({ path: `${OUT}/code-js-pass.png` });
    }, p);
    await step('Smarty Code: Python runs offline in Pyodide; failing recursion → review hints → saved as weak concept', async () => {
      await p.click('[data-cprob="factorial"]'); await p.click('[data-cstep="code"]'); await p.selectOption('#clang', 'python'); await p.waitForSelector('.cm-host.is-cm');
      await p.click('.cm-content'); await p.keyboard.press('Control+A'); await p.keyboard.type('def factorial(n):\nreturn n * factorial(n - 1)\n');
      await p.click('[data-action="codeRun"]'); await p.waitForSelector('text=0/3 tests pass', { timeout: 60000 });
      if (!/RecursionError/.test(await p.textContent('.run-table'))) throw Error('no RecursionError'); await p.screenshot({ path: `${OUT}/code-python-fail.png` });
      await p.evaluate(() => { localStorage.setItem('prvlar-key', '"' + 'AI' + 'zaTEST-not-real' + '"'); }); await p.evaluate(() => { localStorage.setItem('prvlar-remember', 'true'); });
      await hash('settings'); await p.fill('#apikey', 'AI' + 'zaTEST-not-real'); await p.waitForTimeout(200); await hash('code');
      await p.click('[data-cstep="review"]'); await p.click('[data-action="codeReview"]'); await p.waitForSelector('.issue.bug');
      await p.click('[data-action="codeHint"]'); await p.waitForSelector('.hint-box'); await p.click('[data-action="codeHint"]'); await p.screenshot({ path: `${OUT}/code-review-hints.png` });
      if (await p.$('text=return 1 if n <= 1 else')) throw Error('solution shown before asked');
      await p.click('[data-cstep="remember"]'); await p.click('[data-action="codeRemember"]'); await p.waitForSelector('text=Saved to your Smarty profile');
      await hash('smarty'); await p.click('[data-smtab="profile"]'); await p.waitForSelector('.sm-topic'); if (!/Recursion/.test(await p.textContent('.smarty'))) throw Error('Recursion not weak');
      await p.screenshot({ path: `${OUT}/code-profile-recursion.png` });
    }, p);
    await step('Smarty Code: C without a runner is labelled Simulated', async () => {
      await hash('code'); await p.click('[data-cstep="code"]'); await p.selectOption('#clang', 'c'); await p.click('[data-action="codeRun"]'); await p.waitForSelector('text=Simulated');
      await p.screenshot({ path: `${OUT}/code-c-simulated.png` });
    }, p);
    await step('Smarty Code in dark and glass', async () => {
      for (const t of ['dark', 'glass']) { await p.evaluate(th => localStorage.setItem('prvlar-theme', JSON.stringify(th)), t); await p.reload(); await p.waitForTimeout(500); await hash('code'); await p.click('[data-cstep="code"]'); await p.waitForSelector('.cm-host.is-cm'); await p.screenshot({ path: `${OUT}/code-${t}.png` }); }
    }, p);
  }
  await step(`${kind}: /privacy and /terms pages`, async () => {
    for (const u of ['privacy/', 'terms/', 'about/']) { const r = await p.goto(URL + u); if (r.status() !== 200) throw Error(u + ' ' + r.status()); await p.screenshot({ path: `${OUT}/${kind}-page-${u.slice(0, -1)}.png` }); }
    if (!/drive\.appdata/.test(await (await p.goto(URL + 'privacy/')).text())) throw Error('privacy lacks Google data use');
  }, p);
  if (kind === 'desktop') await step('PWA: manifest, service worker, works offline after first load', async () => {
    await p.goto(URL); await p.waitForTimeout(500);
    const m = await p.evaluate(async () => { const l = document.querySelector('link[rel="manifest"]'); const j = await (await fetch(l.href)).json(); return { name: j.name, icons: (j.icons || []).length, display: j.display }; });
    if (!m.icons || !/standalone|fullscreen|minimal-ui/.test(m.display)) throw Error('manifest ' + JSON.stringify(m));
    await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(1500);
    await ctx.setOffline(true); await p.reload(); await p.waitForSelector('.greet, .hero', { timeout: 10000 }); await p.screenshot({ path: `${OUT}/desktop-offline.png` }); await ctx.setOffline(false);
  }, p);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + '/web-results.json', JSON.stringify(results, null, 2));
console.log(`${results.filter(r => r.ok).length}/${results.length} passed`);
