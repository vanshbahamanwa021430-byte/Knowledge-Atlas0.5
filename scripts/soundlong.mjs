// Long-play test for focus sounds in headless Chrome. Plays in real time for MINUTES (default 10.5) and samples the
// output RMS every 100 ms through an AnalyserNode; any window under the threshold counts as a gap.
// Also renders 12 minutes in an OfflineAudioContext for both engines (AudioWorklet and crossfaded loop buffer).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const MIN = Number(process.env.MINUTES || 10.5), OUT = '/workspace/out/focus-music-0.9.5';
fs.mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync(new URL('../src/sound.js', import.meta.url), 'utf8');
const url = 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
async function live(kind, useWorklet) {
  const p = await browser.newPage(); await p.goto(process.env.PAGE || 'http://localhost:4173/privacy/');
  return p.evaluate(async ({ url, kind, useWorklet, ms }) => {
    window.__err = '';
    const m = await import(url);
    await m.playAmbient(kind, 0.6, { useWorklet });
    const mode = m.ambientMode(), tap = m.ambientTap(), ctx = tap.context, an = ctx.createAnalyser(); an.fftSize = 4096; tap.connect(an);
    const buf = new Float32Array(an.fftSize); let n = 0, gaps = 0, run = 0, longest = 0, minR = 1, sum = 0; const t0 = performance.now();
    await new Promise(r => setTimeout(r, 1500));   // fade-in
    await new Promise(res => { const id = setInterval(() => {
      an.getFloatTimeDomainData(buf); let e = 0; for (const x of buf) e += x * x; const rms = Math.sqrt(e / buf.length);
      n++; sum += rms; minR = Math.min(minR, rms); if (rms < 0.002) { gaps++; run += 0.1; longest = Math.max(longest, run); } else run = 0;
      if (performance.now() - t0 >= ms) { clearInterval(id); res(); } }, 100); });
    m.stopAmbient();
    return { kind, mode, ctxState: ctx.state, seconds: +((performance.now() - t0) / 1000).toFixed(1), samples: n, gaps, longestGapSec: +longest.toFixed(2), minRms: +minR.toFixed(4), meanRms: +(sum / n).toFixed(4) };
  }, { url, kind, useWorklet, ms: MIN * 60000 });
}
async function offline(kind, useWorklet) {
  const p = await browser.newPage(); await p.goto(process.env.PAGE || 'http://localhost:4173/privacy/');
  return p.evaluate(async ({ url, kind, useWorklet }) => {
    const m = await import(url), sr = 8000, secs = 720, c = new OfflineAudioContext(1, sr * secs, sr);
    const s = await m.buildSound(c, kind, { useWorklet }); s.output.connect(c.destination); s.start();
    const d = (await c.startRendering()).getChannelData(0), st = m.silenceStats(d, sr, { win: 0.05, threshold: 0.001 });
    let maxJump = 0, mean = 0; for (let i = 1; i < d.length; i++) { const j = Math.abs(d[i] - d[i - 1]); mean += j; if (j > maxJump) maxJump = j; }
    return { kind, mode: s.mode, seconds: secs, longestSilenceSec: st.longestSilence, minRms: +st.minRms.toFixed(4), maxJumpOverMeanStep: +(maxJump / (mean / d.length)).toFixed(1) };
  }, { url, kind, useWorklet });
}
const offlineRes = [];
for (const [k, w] of [['rain', true], ['brown', true], ['white', false], ['ocean', false], ['fire', true], ['pink', false]]) offlineRes.push(await offline(k, w));
console.log('offline', JSON.stringify(offlineRes));
const liveRes = await Promise.all([live('rain', true), live('brown', false)]);
await browser.close();
const ok = liveRes.every(r => r.gaps === 0 && r.ctxState === 'running' && r.seconds >= MIN * 60) && offlineRes.every(r => r.longestSilenceSec === 0);
fs.writeFileSync(OUT + '/sound-longplay.json', JSON.stringify({ minutes: MIN, ok, live: liveRes, offline: offlineRes }, null, 2));
console.log(JSON.stringify({ ok, live: liveRes }, null, 1));
process.exit(ok ? 0 : 1);
