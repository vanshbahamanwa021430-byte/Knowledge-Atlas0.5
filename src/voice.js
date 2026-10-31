// Voice input for Smarty (0.9.9): the device's speech recognition when it has one (Web Speech API), otherwise a short
// recording that Smarty's brain listens to (sent as a WAV audio attachment, like any other audio file).
export const recognitionSupported = () => !!(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);
export const recordingSupported = () => !!(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.MediaRecorder);

// onText(final, interim) while listening; resolves with the final text. stop() ends it early.
export function listen({ lang = globalThis.navigator?.language || 'en-US', onText = () => {} } = {}) {
  const R = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!R) throw Object.assign(Error('Speech recognition is not available here.'), { code: 'NO_STT' });
  const r = new R(); r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let final = '';
  const done = new Promise((res, rej) => {
    r.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) final += t; else interim += t; } onText(final.trim(), interim.trim()); };
    r.onerror = e => (e.error === 'no-speech' || e.error === 'aborted') ? res(final.trim()) : rej(Object.assign(Error(e.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Could not hear that. Try again.'), { code: e.error }));
    r.onend = () => res(final.trim());
  });
  r.start();
  return { done, stop: () => { try { r.stop(); } catch { /* already stopped */ } } };
}

// Records up to maxMs; resolves with a WAV data URL (16 kHz mono) small enough to attach.
export async function record({ maxMs = 30000 } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream), parts = [];
  rec.ondataavailable = e => e.data.size && parts.push(e.data);
  const stopped = new Promise(res => { rec.onstop = res; });
  rec.start(); const t = setTimeout(() => rec.state !== 'inactive' && rec.stop(), maxMs);
  return {
    stop: () => { if (rec.state !== 'inactive') rec.stop(); },
    done: stopped.then(async () => {
      clearTimeout(t); stream.getTracks().forEach(x => x.stop());
      const buf = await new Blob(parts).arrayBuffer();
      const Ctx = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
      const audio = await new (globalThis.AudioContext || globalThis.webkitAudioContext)().decodeAudioData(buf);
      const len = Math.ceil(audio.duration * 16000), off = new Ctx(1, len, 16000), src = off.createBufferSource();
      src.buffer = audio; src.connect(off.destination); src.start();
      return wavDataUrl((await off.startRendering()).getChannelData(0), 16000);
    })
  };
}
// PCM float samples → 16-bit mono WAV data URL. Pure (unit-tested).
export function encodeWav(samples, rate = 16000) {
  const n = samples.length, b = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); b.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, rate, true); b.setUint32(28, rate * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); str(36, 'data'); b.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, samples[i])); b.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Uint8Array(b.buffer);
}
export function wavDataUrl(samples, rate) { const u8 = encodeWav(samples, rate); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return 'data:audio/wav;base64,' + btoa(s); }
