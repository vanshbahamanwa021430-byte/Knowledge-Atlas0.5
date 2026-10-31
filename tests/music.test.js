import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpotify, spotifyUri, embedUrl, CURATED, enqueue, nextIndex, prevIndex, removeAt, musicActionFor } from '../src/music.js';
import { makeGen, seamlessLoop, silenceStats, SOUNDS } from '../src/sound.js';

test('Spotify links, URIs and embed URLs', () => {
  const id = '37i9dQZF1DWZeKCadgRdKQ';
  assert.deepEqual(parseSpotify(`https://open.spotify.com/playlist/${id}?si=abc`), { type: 'playlist', id });
  assert.deepEqual(parseSpotify(`https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC`), { type: 'track', id: '4uLU6hMCjMI75M1A2tKUQC' });
  assert.deepEqual(parseSpotify(`spotify:episode:${id}`), { type: 'episode', id });
  assert.deepEqual(parseSpotify(`https://open.spotify.com/embed/show/${id}`), { type: 'show', id });
  for (const bad of ['', 'https://evil.example/playlist/' + id, 'https://open.spotify.com/user/x', 'spotify:playlist:short', 'javascript:alert(1)']) assert.equal(parseSpotify(bad), null, bad);
  assert.equal(spotifyUri({ type: 'album', id }), `spotify:album:${id}`);
  assert.equal(embedUrl({ type: 'album', id }), `https://open.spotify.com/embed/album/${id}?utm_source=generator`);
  for (const [, u] of CURATED) assert.ok(parseSpotify(u), u);
});
test('local queue: only audio files, next/prev wrap (repeat), remove keeps the right track', () => {
  let q = { items: [], at: -1 };
  const r = enqueue(q, [{ name: 'a.mp3', type: 'audio/mpeg' }, { name: 'notes.pdf', type: 'application/pdf' }, { name: 'b.flac', type: '' }, { name: 'c.ogg', type: 'audio/ogg' }]);
  q = { items: r.items, at: r.at };
  assert.deepEqual(q.items.map(t => t.name), ['a', 'b', 'c']); assert.equal(q.at, 0);
  assert.equal(nextIndex(q), 1); assert.equal(prevIndex(q), 2); assert.equal(nextIndex({ ...q, at: 2 }), 0); assert.equal(nextIndex({ ...q, at: 2 }, false), -1);
  assert.deepEqual(removeAt({ ...q, at: 2 }, 0), { items: q.items.slice(1), at: 1 });
  assert.equal(removeAt({ ...q, at: 1 }, 1).at, 1); assert.equal(removeAt({ items: [q.items[0]], at: 0 }, 0).at, -1);
});
test('music follows the timer only when asked', () => {
  assert.equal(musicActionFor('focus-start'), 'play'); assert.equal(musicActionFor('pause'), 'pause'); assert.equal(musicActionFor('break'), 'pause');
  assert.equal(musicActionFor('focus-start', { follow: false }), 'none');
});
test('every focus sound is endless noise with no silent stretch over 11 minutes (generator, 8 kHz)', () => {
  const sr = 8000, n = sr * 660;
  for (const [k] of SOUNDS.filter(s => s[0] !== 'off')) {
    const g = makeGen(k, sr, 99), d = new Float32Array(n); for (let i = 0; i < n; i++) d[i] = g();
    const st = silenceStats(d, sr, { win: 0.1, threshold: 0.001 });
    assert.equal(st.longestSilence, 0, `${k}: silent ${st.longestSilence}s`); assert.ok(Number.isFinite(st.minRms) && st.minRms > 0.001, k);
    assert.ok(d.every(Number.isFinite), k);
  }
});
test('seamless loop: equal-power crossfade removes the jump at the loop seam', () => {
  const sr = 8000, fade = 800, g = makeGen('brown', sr, 5), raw = new Float32Array(sr * 3 + fade); for (let i = 0; i < raw.length; i++) raw[i] = g();
  const naive = raw.subarray(0, sr * 3), loop = seamlessLoop(raw, fade);
  const step = a => Math.abs(a[0] - a[a.length - 1]);
  const typical = (() => { let s = 0; for (let i = 1; i < loop.length; i++) s += Math.abs(loop[i] - loop[i - 1]); return s / loop.length; })();
  assert.equal(loop.length, sr * 3);
  assert.ok(step(loop) < typical * 6, `seam ${step(loop)} vs typical ${typical}`);
  assert.ok(step(naive) > step(loop), 'crossfade should beat a hard cut');
  const twice = new Float32Array(loop.length * 2); twice.set(loop); twice.set(loop, loop.length);
  assert.equal(silenceStats(twice, sr, { win: 0.02, threshold: 0.001 }).longestSilence, 0);
});
