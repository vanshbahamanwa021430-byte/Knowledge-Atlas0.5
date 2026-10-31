// Read aloud. Android/iOS app: the phone's own text-to-speech engine (@capacitor-community/text-to-speech),
// because Android WebView has no Web Speech voices. Browsers and Windows: the Web Speech API.
import { isNative } from './platform.js';

let token = 0;
const web = () => globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance;
export const speechSupported = () => isNative() || !!web();

// Speaks in sentence-sized pieces (long utterances get cut off on some engines). onEnd runs when done or stopped.
export function chunks(text, max = 220) {
  const parts = String(text || '').replace(/\s+/g, ' ').trim().match(/[^.!?;:]+[.!?;:]*\s*/g) || [];
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ''; }
    if (p.length > max) { for (let i = 0; i < p.length; i += max) out.push(p.slice(i, i + max).trim()); continue; }
    cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

export async function speak(text, { rate = 1, lang = '' } = {}, onEnd = () => {}) {
  await stopSpeaking();
  const my = ++token, list = chunks(text);
  const language = lang || (globalThis.navigator?.language || 'en-US');
  try {
    if (isNative()) {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      for (const t of list) { if (my !== token) break; await TextToSpeech.speak({ text: t, lang: language, rate, pitch: 1, volume: 1, category: 'playback' }); }
    } else if (web()) {
      for (const t of list) {
        if (my !== token) break;
        await new Promise(res => { const u = new SpeechSynthesisUtterance(t); u.rate = rate; u.lang = language; u.onend = u.onerror = () => res(); speechSynthesis.speak(u); });
      }
    } else throw Error('Read aloud is not available on this device.');
  } finally { if (my === token) onEnd(); }
}

export async function stopSpeaking() {
  token++;
  try {
    if (isNative()) { const { TextToSpeech } = await import('@capacitor-community/text-to-speech'); await TextToSpeech.stop(); }
    else if (web()) speechSynthesis.cancel();
  } catch { /* nothing to stop */ }
}
