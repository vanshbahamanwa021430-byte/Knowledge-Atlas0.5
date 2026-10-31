// Before/after screenshots of Home and each tab in light, dark and glass. Usage: node organiseshots.mjs <before|after> [url]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const PH = process.argv[2] || 'after', URL = process.argv[3] || 'http://127.0.0.1:4211/', OUT = `/workspace/out/organise-0.9.5/${PH}`;
fs.mkdirSync(OUT, { recursive: true });
const TABS = PH === 'before' ? ['home', 'library', 'study', 'test', 'more'] : ['home', 'library', 'practice', 'plan', 'more'];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { localStorage.setItem('prvlar-update', JSON.stringify({ auto: false, last: Date.now() })); localStorage.setItem('prvlar-onboarded', 'true'); localStorage.setItem('prvlar-entry', '"guest"'); });
const p = await ctx.newPage(); p.on('dialog', d => d.accept());
await p.goto(URL); await p.waitForTimeout(800);
await p.evaluate(() => { location.hash = 'library'; }); await p.waitForTimeout(300);
await p.setInputFiles('input[data-import] >> nth=0', '/workspace/smoke/doc.md'); await p.waitForSelector('.v-study');
for (const th of ['light', 'dark', 'glass']) {
  await p.evaluate(t => localStorage.setItem('prvlar-theme', JSON.stringify(t)), th); await p.reload(); await p.waitForTimeout(600);
  for (const v of TABS) { await p.evaluate(x => { location.hash = x; }, v); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/${th}-${v}.png` }); }
}
await b.close(); console.log('saved', OUT);
