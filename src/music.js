// Focus music, shown only inside the focus timer screen (no mini player anywhere else).
// 1) Spotify: the official Embed (open.spotify.com/embed) driven by Spotify's iFrame API — no login, no keys.
//    Spotify branding stays as Spotify renders it inside its own player.
// 2) Local files: an offline queue played with an <audio> element (Media Session for lock-screen controls).
// The players live in one persistent node that is moved into the focus screen, so re-renders don't stop playback.

// ---- pure helpers (unit-tested) ----
const TYPES = ['track', 'album', 'playlist', 'episode', 'show', 'artist'];
export function parseSpotify(input) {
  const s = String(input || '').trim();
  let m = s.match(/^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]{22})$/);
  if (m) return { type: m[1], id: m[2] };
  try {
    const u = new URL(s);
    if (!/^(open|play)\.spotify\.com$/.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean).filter(p => !/^intl-[a-z]{2}(-[a-z]{2})?$/i.test(p) && p !== 'embed');
    const i = parts.findIndex(p => TYPES.includes(p));
    if (i < 0 || !/^[A-Za-z0-9]{22}$/.test(parts[i + 1] || '')) return null;
    return { type: parts[i], id: parts[i + 1] };
  } catch { return null; }
}
export const spotifyUri = r => r ? `spotify:${r.type}:${r.id}` : '';
export const embedUrl = r => r ? `https://open.spotify.com/embed/${r.type}/${r.id}?utm_source=generator` : '';
// Spotify's own public editorial playlists (linked, not copied).
export const CURATED = [
  ['Deep Focus', 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ'],
  ['Lofi Beats', 'spotify:playlist:37i9dQZF1DWWQRwui0ExPn'],
  ['Peaceful Piano', 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO'],
  ['Brain Food', 'spotify:playlist:37i9dQZF1DWXLeA8Omikj7']
];
// Local queue: a list of { id, name } plus the playing index. Pure; the player keeps object URLs by id.
export const AUDIO_RE = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i;
export function enqueue(q, files) {
  const add = [...files].filter(f => (f.type || '').startsWith('audio/') || AUDIO_RE.test(f.name || '')).map((f, k) => ({ id: `${Date.now().toString(36)}-${k}-${Math.random().toString(36).slice(2, 6)}`, name: String(f.name || 'Track').replace(AUDIO_RE, '') }));
  return { items: [...q.items, ...add], at: q.at < 0 && add.length ? q.items.length : q.at, added: add };
}
export const nextIndex = (q, loop = true) => !q.items.length ? -1 : q.at + 1 < q.items.length ? q.at + 1 : loop ? 0 : -1;
export const prevIndex = q => !q.items.length ? -1 : q.at > 0 ? q.at - 1 : q.items.length - 1;
export function removeAt(q, i) {
  const items = q.items.filter((_, k) => k !== i);
  const at = !items.length ? -1 : i < q.at ? q.at - 1 : i === q.at ? Math.min(q.at, items.length - 1) : q.at;
  return { items, at };
}
// What the music should do when the timer changes state.
export const musicActionFor = (event, { follow = true } = {}) => !follow ? 'none' : event === 'focus-start' ? 'play' : event === 'pause' || event === 'break' || event === 'stop' ? 'pause' : 'none';

// ---- browser player ----
let host = null, spotifyCtl = null, apiP = null, audio = null;
const urls = new Map();
export const music = { source: 'spotify', q: { items: [], at: -1 }, spotify: null, playing: false, loop: true };
function ensureHost() {
  if (host || typeof document === 'undefined') return host;
  host = document.createElement('div'); host.className = 'music-host';
  host.innerHTML = '<div class="sp-frame" id="sp-frame"></div>';
  audio = document.createElement('audio'); audio.preload = 'auto'; audio.className = 'local-audio';
  audio.addEventListener('ended', () => { const n = nextIndex(music.q, music.loop); if (n >= 0) playLocal(n); else music.playing = false; changed(); });
  audio.addEventListener('play', () => { music.playing = true; globalThis.Capacitor?.Plugins?.AtlasMedia?.setBackgroundAudio({ on: true }).catch?.(() => {}); changed(); }); audio.addEventListener('pause', () => { music.playing = false; changed(); });
  host.append(audio);
  host.classList.add('is-parked'); document.body.append(host);
  return host;
}
let onChange = () => {};
export const onMusicChange = f => { onChange = f; };
const changed = () => onChange(music);
// Called after every render. The players never move in the DOM (moving an iframe reloads it and stops Spotify):
// they are laid over the focus screen's #music-slot, and kept off-screen (still playing) on other screens.
export function placeMusic() {
  ensureHost(); const slot = document.getElementById('music-slot'); host.dataset.source = music.source;
  if (!slot) { host.classList.add('is-parked'); return; }
  host.classList.remove('is-parked');
  const h = music.source === 'spotify' && music.spotify ? (music.spotify.type === 'track' || music.spotify.type === 'episode' ? 152 : 352) : 0;
  slot.style.height = h + 'px';
  const r = slot.getBoundingClientRect(), vis = r.bottom > 0 && r.top < innerHeight;
  Object.assign(host.style, { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: h + 'px', visibility: vis && h ? 'visible' : 'hidden' });
}
if (typeof window !== 'undefined') { addEventListener('scroll', () => host && placeMusic(), true); addEventListener('resize', () => host && placeMusic()); }
function loadApi() {
  return (apiP ??= new Promise((res, rej) => {
    window.onSpotifyIframeApiReady = api => res(api);
    const s = document.createElement('script'); s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
    s.onerror = () => { apiP = null; rej(Error('Could not load Spotify. Check your connection.')); }; document.head.append(s);
  }));
}
export async function loadSpotify(input) {
  const r = parseSpotify(input); if (!r) throw Error('That is not a Spotify track, album, playlist or podcast link.');
  music.spotify = r; music.source = 'spotify'; ensureHost(); placeMusic();
  if (spotifyCtl) { spotifyCtl.loadUri(spotifyUri(r)); changed(); return r; }
  const api = await loadApi();
  await new Promise(res => api.createController(host.querySelector('#sp-frame'), { uri: spotifyUri(r), width: '100%', height: r.type === 'track' || r.type === 'episode' ? 152 : 352 }, c => {
    spotifyCtl = c;
    c.addListener('playback_update', e => {
      const d = e.data || {}; music.playing = !d.isPaused;
      // End of the track/playlist context while a focus block runs: start it again (repeat), so music lasts the session.
      if (d.isPaused && d.duration > 0 && d.position >= d.duration - 800 && music.keepPlaying?.()) setTimeout(() => c.play(), 400);
    });
    res();
  }));
  changed(); return r;
}
export function addLocalFiles(files) {
  ensureHost(); const list = [...files]; const r = enqueue(music.q, list);
  r.added.forEach((t, k) => urls.set(t.id, URL.createObjectURL(list.filter(f => (f.type || '').startsWith('audio/') || AUDIO_RE.test(f.name || ''))[k])));
  music.q = { items: r.items, at: r.at }; music.source = 'local'; changed(); return r.added.length;
}
export function playLocal(i = music.q.at) {
  const t = music.q.items[i]; if (!t) return; music.q.at = i; music.source = 'local';
  if (audio.dataset.id !== t.id) { audio.src = urls.get(t.id); audio.dataset.id = t.id; }
  audio.play().catch(() => {});
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.name, artist: 'Prvlar · Focus' });
      navigator.mediaSession.setActionHandler('nexttrack', () => playLocal(nextIndex(music.q)));
      navigator.mediaSession.setActionHandler('previoustrack', () => playLocal(prevIndex(music.q)));
    } catch { /* older browsers */ }
  }
  changed();
}
export function removeLocal(i) { const t = music.q.items[i]; if (t) { if (audio.dataset.id === t.id) { audio.pause(); audio.removeAttribute('src'); audio.dataset.id = ''; } URL.revokeObjectURL(urls.get(t.id)); urls.delete(t.id); } music.q = removeAt(music.q, i); changed(); }
export function musicPlay() { if (music.source === 'spotify') spotifyCtl?.resume(); else if (music.q.items.length) playLocal(music.q.at < 0 ? 0 : music.q.at); }
export function musicPause() { if (music.source === 'spotify') spotifyCtl?.pause(); else audio?.pause(); }
export const localVolume = v => { if (audio) audio.volume = Math.max(0, Math.min(1, v)); };
// Timer hook.
export function musicTimer(event) { const a = musicActionFor(event, { follow: music.follow }); if (a === 'play') musicPlay(); else if (a === 'pause') musicPause(); }

// Spotify login so the embed plays full tracks (it only plays 30 s previews when logged out).
// Android: Spotify's login page in an in-app WebView that shares cookies with the embed. Web/desktop: a pop-up in the
// same browser profile (browsers that block third-party cookies may still show previews; use "Open in Spotify app").
export function spotifyLogin() {
  const media = globalThis.Capacitor?.Plugins?.AtlasMedia;
  const reload = () => { if (music.spotify && spotifyCtl) spotifyCtl.loadUri(spotifyUri(music.spotify)); };
  if (globalThis.Capacitor?.getPlatform?.() === 'android' && media?.spotifyLogin) return media.spotifyLogin().then(reload);
  const w = window.open('https://accounts.spotify.com/login?continue=' + encodeURIComponent('https://open.spotify.com/'), 'spotify-login', 'width=480,height=720');
  const t = setInterval(() => { if (!w || w.closed) { clearInterval(t); reload(); } }, 1000);
}
// Hands playback to the real Spotify app (keeps playing in the background); falls back to the web player.
export function openSpotifyApp(uri) {
  const r = parseSpotify(uri), web = r ? `https://open.spotify.com/${r.type}/${r.id}` : 'https://open.spotify.com/';
  if (globalThis.Capacitor?.isNativePlatform?.()) { window.open(uri, '_system'); return; }
  const before = Date.now(); location.href = uri;
  setTimeout(() => { if (document.visibilityState === 'visible' && Date.now() - before < 2500) window.open(web, '_blank', 'noopener'); }, 1500);
}
