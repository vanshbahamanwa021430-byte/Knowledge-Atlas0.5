import './migrate.js';   // must run first: moves old Knowledge Atlas settings to Prvlar keys
import NOTICES from '../THIRD_PARTY_NOTICES.md?raw';
import { GROUPS, TAB_OF as NAV_TAB, ALL_VIEWS } from './nav.js';
import './fonts.css';
import './style.css';
import { parseFile, outline, contextInfo, pdfText, renderPdfPage } from './documents.js';
import { matchFigure } from './figures.js';
import { splitBlocks, extractMath, sanitizeSvg, mathHTML, cachedDiagram, hydrateDiagrams, ready as visualsReady, preload as preloadVisuals, findCommonsImages } from './visuals.js';
import { onOcrProgress, cancelOcr, ocrImage } from './ocr.js';
// Scanning (OCR) progress: a small fixed bar outside the app's re-rendered markup, with Stop.
onOcrProgress(p => {
  let el = document.getElementById('ocr-bar');
  if (!p) { el?.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'ocr-bar'; el.className = 'ocr-bar'; el.setAttribute('role', 'status'); el.innerHTML = '<div class="ocr-txt"></div><div class="ocr-track"><i></i></div><button class="btn outline sm" type="button">Stop</button>'; el.querySelector('button').onclick = () => cancelOcr(); document.body.appendChild(el); }
  const pct = p.page ? Math.round(100 * ((p.page - 1) + (p.pagePct || 0)) / p.pages) : 0;
  el.querySelector('.ocr-txt').textContent = p.page ? `Reading scanned pages (OCR) · page ${p.page} of ${p.pages}${p.capped ? ' (first ' + p.pages + ' only)' : ''} · ${String(p.name).slice(0, 40)}` : 'Preparing the text scanner (works offline)…';
  el.querySelector('i').style.width = pct + '%';
});
import { EXTRA_KINDS, normalizeProfile, buildPlan, scoreQuestion, answerText, correctText, profileFromAnalysis, mostRepeated, estimateDifficulty, examDocWarning } from './examprofile.js';
import { getUrl } from './net.js';
import { BACKUP_PREFS, db, saveDocument, getDocuments, saveAttempt, getAttempts, getSetting, setSetting, requestPersistence, exportAll, importAll, getCards, saveCards, deleteCard, getSessions, saveSession, getPlans, savePlan, deletePlan, getDays, bumpDay, getProfiles, saveProfile, deleteProfile, getTraces, saveTrace, clearTraces, saveBlob, getBlob, deleteBlob } from './storage.js';
import { chunkDocs, buildIndex, retrieve, searchTraces, traceFromAttempt, traceFromPractice, makeTrace, updateProfile, emptyProfile, weakTopics as tutorWeak, strongTopics, levelFor as tutorLevel, profileHint, practiceTargets } from './tutor.js';
import { codePlan, codeTests, codeReview, codeExplain, codeLesson, codeSimulate, interviewProblem, generateExam, gradeWritten, explainSection, explainSelection, askSection, chatDocument, testConnection, describeAI, providerFor, isFreeLimit, setFreeProxy, organiseMap, organiseSize, makeFlashcards, SERVER_PRESETS, fetchModels, generatePlanExam, analysePapers, smartyAnswer, smartyPractice } from './ai.js';
import { matchSections, flatMap } from './aimap.js';
import { flowchartSVG, defaultCollapsed, childrenMap, chartNodes, levelNames } from './flowchart.js';
import { gradeMCQ, makeAttempt, isDue, EXAM_MINUTES, QUESTION_COUNT } from './engine.js';
import { topicPerformance, resultSummary } from './insights.js';
import { heroArt } from './brand.js';
import { icon } from './icons.js';
import { isNative, isElectron, platform, saveTextFile, shareText, storageEstimate, setStatusBar, uuid, openExternal, downloadAndInstallApk } from './platform.js';
import { STEPS, MODES, LANGS, HINT_LADDER, HINT_LABEL, nextHint, CONCEPTS, PROBLEMS, TOPICS, problemsBy, starter, snake, parseTests, formatTests, problemTests, grade, normalizeReview, codeTrace, suggestProblem } from './code.js';
import { runJS, runPy, runRemote } from './coderun.js';
import { mountEditor } from './editor.js';
import { privacyHTML, termsHTML } from './legal.js';
import { blankPattern, BLANK_SECTION, patternTotals, patternErrors, profileFromPattern } from './patternbuilder.js';
import { PRESETS, normalizeTiming, resolveMinutes, autoMinutes, canPause, describeTiming, dueWarning, activeMs, leftMs, tickQuestion, questionExpired, fmtDuration } from './timing.js';
import { ROLES, roleList, addRole, removeRole, roleOf, can, CODEV_TABS, BETA_FLAGS } from './devlog.js';
import { OWNER_HASHES, isOwnerEmail, addedOwners, addOwner, removeOwner, maskSecrets, logs, requests, perf, recordRender, crashes, clearCrashes, FLAGS, flags, setFlag, installLogCapture } from './devlog.js';
installLogCapture();
import { platform as gatePlatform } from './platform.js';
import { needsWelcome, afterSignIn, afterGuest, afterSignOut } from './gate.js';
import { cloudAvailable, account, syncStatus, syncPrefs, setSyncPrefs, setPassphrase, hasPassphrase, signIn, signOut, grantDrive, syncNow, deleteCloudData, startAutoSync, onSyncStatus, driveClient } from './cloud.js';
import { registerPlugin } from '@capacitor/core';
import { checkForUpdate, AUTO_INTERVAL, RELEASES_PAGE, UPDATE_REPO, setUpdateRepo } from './update.js';
import { ownerPackController, webSecureStore, nativeSecureStore, memoryStore, isPackEnvelope, OWNER_PACK_NAME, LEGACY_OWNER_PACK_NAME } from './ownerpack.js';
import { newCard, review, preview, whenLabel, isNew, dueQueue, deckStats, cardFromQuestion } from './srs.js';
import { dayKey, dayStart, addDays, lastDays, streaks, xpTotal, levelFor, BADGES, earnedBadges, errorEntries, weakTopics, daysUntil, recommend, nextPhase } from './progress.js';
import { permission, askPermission, exactAlarm, askExactAlarm, scheduleReminders, scheduleFocusEnd, cancelFocusEnd, notifyNow } from './notify.js';
import { SOUNDS, soundSupported, playAmbient, setAmbientVolume, stopAmbient, chime } from './sound.js';
import { music, CURATED, parseSpotify, spotifyUri, loadSpotify, addLocalFiles, playLocal, removeLocal, musicPlay, musicPause, musicTimer, placeMusic, onMusicChange, nextIndex, prevIndex, spotifyLogin, openSpotifyApp } from './music.js';
Object.defineProperty(music, 'follow', { get: () => state.focusPrefs?.musicFollow !== false, set() {} });
music.keepPlaying = () => state.focusRun.running && state.focusRun.phase === 'focus';
onMusicChange(() => { if (state.view === 'focus') render(); });
import { speak, stopSpeaking, speechSupported } from './speech.js';
import { readAttachment, attachmentBlock, MAX_FILES } from './attach.js';
import { SKILLS_KEY, normalizeSkill, upsertSkill, removeSkill, parseSlash, suggestSkill, skillPrompt } from './skills.js';
import { draftSkill, webSearchAnswer } from './ai.js';
import JSZip from 'jszip';
import { buildReport, allowReport, issueUrl, mailtoUrl, postReport, reportText, parseCsv } from './report.js';

// Reaching this line means the device's browser engine could run the app (see public/compat.js).
window.__atlasBooted = true;

/* global __APP_VERSION__ */
const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
const app = document.querySelector('#app');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ACCEPT_BY = {
  pdf: '.pdf,application/pdf',
  docx: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: '.txt,.md,text/plain,text/markdown',
  img: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
};
const ACCEPT = Object.values(ACCEPT_BY).join(',');
const VIEWS = ALL_VIEWS;
const TABS = GROUPS.map(g => ({ v: g.tab, label: g.label, icon: g.icon }));
// Sidebar mirrors the five groups: each group's main screen, then its screens.
const SIDE = GROUPS.flatMap(g => [{ v: g.tab, label: g.label, icon: g.icon, head: true }, ...(g.links || []).filter(([v]) => !v.includes(':') && v !== g.tab).map(([v, ic, label]) => ({ v, label, icon: ic }))]);
const TAB_OF = NAV_TAB;
const SIDE_OF = new Proxy({}, { get: (_, v) => SIDE.some(x => x.v === v && !x.head) ? v : ({ section: 'study', smarty: 'smarty' })[v] || NAV_TAB[v] });
const BACK = { study: 'library', section: 'study', results: 'more', notes: 'more', chat: 'more', settings: 'more', about: 'more', cards: 'more', errors: 'more', planner: 'more', focus: 'more', progress: 'more', examlab: 'test' };
// Each copy of the logo gets its own gradient ids: a copy inside a hidden sidebar would otherwise blank the others.
const logo = () => '<img class="brand-mark" src="./icons/icon-192.png" alt="" aria-hidden="true" width="64" height="64" decoding="async">';

// Default AI: Gemini or Groq key. An owner pack can set its own default provider order.
let PACK_KEYS = new Set();   // owner-pack keys: never persisted
const packMark = v => v && PACK_KEYS.has(v) ? ' <span class="pill pack-pill">from owner pack</span>' : '';
let DEFAULT_AI = { mode: 'cloud', url: '', model: '' }, DEFAULT_FB_ON = false;   // the owner pack may change these
const state = {
  update: { busy: '', error: '', release: null, status: '', dialog: false, progress: 0 },
  docs: [], doc: null, selected: 'root', view: 'home', key: '', remember: true, busy: '', error: '', notice: '',
  notes: {}, explain: {}, visited: {}, attempts: [], asks: {}, chats: {}, consent: {},
  questions: null, answers: {}, flags: new Set(), startedAt: 0, aiConsent: false, autoFailed: false, qIndex: 0, showGrid: false,
  result: null, review: null, showReview: false,
  examMeta: null, profiles: [], labTab: 'custom', lab: { name: '', pasted: '', papers: [], repeated: [] }, labStatus: '',
  ai: { ...DEFAULT_AI }, showKey: false, conn: null,
  zoom: 1, layout: 'auto', collapsed: new Set(), collapsedFor: null, animatedFor: null, lastDir: null,
  theme: 'system', studyTab: 'map', sectionTab: 'content', search: '', menu: false, dragging: false, storage: null,
  cards: [], sessions: [], plans: [], days: [], errLog: {}, fc: null, cardsOpen: null, errFilter: 'open', retry: null, planTab: 'exams',
  notifPerm: 'prompt', exactPerm: 'unsupported', speaking: null,
  goals: { dailyMinutes: 30, weeklyMinutes: 180, dailyCards: 20 },
  remind: { daily: false, time: '19:00', exams: true, todos: true },
  focusPrefs: { focus: 25, short: 5, long: 15, longEvery: 4, sound: 'off', volume: 0.5, autoNext: true },
  focusRun: { phase: 'idle', cycle: 0, running: false, endsAt: 0, left: null },
  reading: { size: 1, rate: 1 }
};
const THEME_NAMES = { system: 'Device', light: 'Light', dark: 'Dark', aesthetic: 'Aesthetic', anime: 'Anime', glass: 'Glass' };
const THEMES = ['system', 'light', 'dark', 'aesthetic', 'anime', 'glass', 'oldmoney', 'vintage', 'royal', 'royal-ivory'];
// Status bar and browser toolbar colour of each theme (dark = light status-bar icons).
const THEME_BAR = { light: ['#F4F4F6', false], dark: ['#0B0B10', true], aesthetic: ['#FFFBF7', false], anime: ['#E2F1FF', false], glass: ['#4F5FD8', true], royal: ['#3A0D12', true], 'royal-ivory': ['#F6EEDC', false] };

/* ---------- saved preferences ---------- */
const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
{
  const v = readJSON('prvlar-ai', {});
  if (SERVER_PRESETS[v.mode] || v.mode === 'cloud') state.ai = { mode: v.mode, url: String(v.url || ''), model: String(v.model || ''), vision: !!v.vision };
  // New users (nothing chosen, no key) start on the free limited option when the proxy is configured.
  else if (SERVER_PRESETS.prvlar && !readJSON('prvlar-key', '')) state.ai = { mode: 'prvlar', url: '', model: '', vision: true };
  const fb = readJSON('prvlar-fallback', {}) || {};
  state.fb = { on: fb.on === undefined ? DEFAULT_FB_ON : fb.on === true, order: Array.isArray(fb.order) && fb.order.length === 3 ? fb.order : ['gemini', 'groq', 'custom'], gemini: String(fb.gemini || ''), groq: String(fb.groq || ''), url: String(fb.url || ''), key: String(fb.key || ''), model: String(fb.model || '') || 'auto' };
  const w = readJSON('prvlar-view', {});
  if (Number(w.zoom) >= 0.3 && Number(w.zoom) <= 2) state.zoom = Number(w.zoom);
  if (w.layout === 'vertical' || w.layout === 'horizontal') state.layout = w.layout;
  loadPrefs();
  state.remember = readJSON('prvlar-remember', true) !== false;
  if (state.remember) state.key = String(readJSON('prvlar-key', '') || '');
  state.notes = readJSON('prvlar-notes', {});
  state.visited = readJSON('prvlar-visited', {});
  state.lastStudied = readJSON('prvlar-last', {});
  state.nudgeHidden = readJSON('prvlar-nudge', {});
}
// Preferences that a backup can restore (see BACKUP_PREFS in storage.js); numbers are kept within sensible ranges.
function isExistingInstall() {
  try { return ['prvlar-entry', 'prvlar-onboarded', 'prvlar-visited', 'prvlar-name', 'prvlar-goals', 'prvlar-remember'].some(k => localStorage.getItem(k) != null); } catch { return false; }
}
function loadPrefs() {
  // 0.9.8: Royal is the default look for NEW installs; anyone who already used the app keeps theirs (or Device).
  const t = readJSON('prvlar-theme', null) ?? (isExistingInstall() ? 'system' : 'royal');
  state.theme = THEMES.includes(t) ? t : 'system';
  const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const g = readJSON('prvlar-goals', {}) || {};
  state.goals = { dailyMinutes: num(g.dailyMinutes, 30, 5, 720), weeklyMinutes: num(g.weeklyMinutes, 180, 10, 5000), dailyCards: num(g.dailyCards, 20, 1, 500) };
  const r = readJSON('prvlar-remind', {}) || {};
  state.remind = { daily: !!r.daily, time: /^\d\d:\d\d$/.test(r.time || '') ? r.time : '19:00', exams: r.exams !== false, todos: r.todos !== false };
  const f = readJSON('prvlar-focus', {}) || {};
  state.focusPrefs = { focus: num(f.focus, 25, 1, 180), short: num(f.short, 5, 1, 60), long: num(f.long, 15, 1, 90), longEvery: num(f.longEvery, 4, 2, 12), sound: SOUNDS.some(x => x[0] === f.sound) ? f.sound : 'off', volume: num(f.volume, 0.5, 0, 1), autoNext: f.autoNext !== false, stopAtEnd: f.stopAtEnd !== false, sleep: num(f.sleep, 0, 0, 240), musicFollow: f.musicFollow !== false };
  const rd = readJSON('prvlar-reading', {}) || {};
  state.reading = { size: num(rd.size, 1, 0.8, 1.6), rate: num(rd.rate, 1, 0.5, 2) };
  const run = readJSON('prvlar-focus-run', null);
  if (run && ['idle', 'focus', 'short', 'long'].includes(run.phase)) state.focusRun = { ...state.focusRun, ...run };
}
const saveAi = () => writeJSON('prvlar-ai', state.ai);
const SELF_HOSTED = ['omniroute'];
// Profile: display name (greeting) and app text size for every age group. The public edition never ships a name.
const UI_SIZES = [['s', 'Small', 0.9], ['m', 'Default', 1], ['l', 'Large', 1.15], ['xl', 'Extra large', 1.3]];
const userName = () => String(readJSON('prvlar-name', ED.defaultName) || '').trim().slice(0, 40);
function applyUiSize() { const z = (UI_SIZES.find(x => x[0] === readJSON('prvlar-uisize', 'm')) || UI_SIZES[1])[2]; document.documentElement.style.setProperty('--ui-zoom', String(z)); }
const uiSizeSeg = () => `<div class="seg ui-size" role="radiogroup" aria-label="Text size">${UI_SIZES.map(([v, l]) => `<button role="radio" class="seg-btn${readJSON('prvlar-uisize', 'm') === v ? ' is-on' : ''}" data-uisize="${v}" aria-checked="${readJSON('prvlar-uisize', 'm') === v}">${l}</button>`).join('')}</div>`;
// First run: three short screens (name, comfort, AI). Shown once; everything is changeable in Settings.
function welcomeHTML() {
  const busy = state.busy === 'sync';
  return `<div class="onboard welcome-gate" role="dialog" aria-modal="true" aria-label="Welcome"><div class="ob-card card"><span class="ob-art">${logo()}</span><h1>Welcome to Prvlar</h1><p>Sign in to back up and sync your study across devices, in your own Google Drive. Or keep everything on this device.</p>${cloudAvailable() ? `<button class="btn primary big block g-btn" data-action="gateSignIn"${state.busy ? ' disabled' : ''}>${busy ? '<span class="spin"></span>' : icon('login', 20)}Sign in with Google</button>` : `<button class="btn primary big block g-btn" disabled aria-disabled="true">${icon('login', 20)}Sign in with Google</button><p class="fine gate-soon">Google sign-in is coming soon on iPhone and iPad. For now, continue without an account; everything works on this device.</p>`}<button class="btn ghost block" data-action="gateGuest">Continue without account</button><p class="fine">Works fully offline. You can sign in later in Settings.</p></div></div>`;
}
function onboardingHTML() {
  if (needsWelcome({ available: cloudAvailable(), soon: gatePlatform() === 'ios', signedIn: !!account(), entry: readJSON('prvlar-entry', '') })) return welcomeHTML();
  if (readJSON('prvlar-onboarded', false)) return '';
  const step = state.onStep || 0;
  const body = step === 0 ? `<span class="ob-art">${logo()}</span><h1>Welcome to Prvlar</h1><p>Turn your notes into a study map, practise with tests made for you, and ask Smarty when you’re stuck.</p><label class="field"><span>What should we call you?</span><input class="input" id="ob-name" value="${esc(userName())}" placeholder="Your name (optional)" autocomplete="nickname" maxlength="40"></label><label class="field"><span>What do you study?</span><select class="input select" id="ob-stream"><option value="">Choose (optional)</option>${STREAMS.map(([v, l]) => `<option value="${v}"${userStream() === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`
    : step === 1 ? `<span class="ob-art">${icon('type', 44)}</span><h1>Make it comfortable</h1><p>Choose a text size. You can change this and the theme any time in Settings.</p>${uiSizeSeg()}`
    : `<span class="ob-art">${icon('lock', 44)}</span><h1>Your study stays with you</h1><p>Documents and progress are saved only on this device. AI features use your own free Gemini or Groq key (or your own server); you can add it now or later.</p>${ED.obAi()}`;
  return `<div class="onboard" role="dialog" aria-modal="true" aria-label="Welcome"><div class="ob-card card">${body}<div class="ob-dots" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i === step ? 'is-on' : ''}"></i>`).join('')}</div><div class="ob-acts">${step ? '<button class="btn outline" data-action="obBack">Back</button>' : '<button class="btn outline" data-action="obDone">Skip</button>'}${step < 2 ? '<button class="btn primary" data-action="obNext">Next</button>' : '<button class="btn outline" data-action="obKey">Add AI key</button><button class="btn primary" data-action="obDone">Start</button>'}</div></div></div>`;
}
const saveView = () => writeJSON('prvlar-view', { zoom: state.zoom, layout: state.layout });
const persistNotes = () => writeJSON('prvlar-notes', state.notes);
const saveKey = () => { if (PACK_KEYS.has(state.key.trim())) return; if (state.remember && state.key.trim()) writeJSON('prvlar-key', state.key.trim()); else { try { localStorage.removeItem('prvlar-key'); } catch { /* ignore */ } } };

/* ---------- AI configuration ---------- */
const usingServer = () => state.ai.mode !== 'cloud';
const preset = () => SERVER_PRESETS[state.ai.mode] || SERVER_PRESETS.custom;
const aiAvailable = () => usingServer() ? !!(state.ai.url.trim() || preset().url) : !!state.key.trim();
const deviceId = () => { let d = readJSON('prvlar-device', ''); if (!/^[0-9a-f-]{36}$/.test(d)) { d = crypto.randomUUID(); writeJSON('prvlar-device', d); } return d; };
const primaryConfig = () => state.ai.mode === 'prvlar' && SERVER_PRESETS.prvlar
  ? { key: 'device-' + deviceId(), server: { url: SERVER_PRESETS.prvlar.url, model: 'auto', free: true } }
  : usingServer()
  ? { key: state.key.trim(), server: { url: state.ai.url.trim() || preset().url, model: state.ai.model.trim() || preset().model, vision: !!state.ai.vision } }
  : state.key.trim();
// With fallback on: the main service first, then Gemini, Groq and the custom endpoint in the chosen order (skipping empty ones).
function fallbackChain() {
  const f = state.fb, k = state.key.trim(), out = [primaryConfig()];
  for (const id of f.order) {
    const c = id === 'gemini' ? (f.gemini.trim() || (k.startsWith('AIza') ? k : '')) : id === 'groq' ? (f.groq.trim() || (k.startsWith('gsk_') ? k : ''))
      : f.url.trim() ? { key: f.key.trim(), server: { url: f.url.trim(), model: f.model.trim() || 'auto' } } : '';
    if (c && !out.some(x => JSON.stringify(x) === JSON.stringify(c))) out.push(c);
  }
  return out.filter(x => typeof x === 'string' ? x : x.server.url);
}
const aiConfig = () => state.fb?.on ? { chain: fallbackChain() } : primaryConfig();
const saveFb = () => { const f = { ...state.fb }; for (const k of ['gemini', 'groq', 'url', 'key']) if (PACK_KEYS.has(f[k])) f[k] = ''; writeJSON('prvlar-fallback', state.remember ? f : { ...f, gemini: '', groq: '', key: '' }); };
function requireAi(what) {
  if (usingServer()) { if (!aiAvailable()) throw Error('Enter your AI server address in Settings.'); return aiConfig(); }
  if (!state.key.trim()) throw Error(`Add an AI key in Settings to ${what}. Free keys from Google Gemini or Groq work.`);
  if (!navigator.onLine) throw Error('You are offline. This needs an internet connection.');
  return aiConfig();
}
const aiName = () => aiAvailable() ? describeAI(aiConfig()) : '';
// Chat and "Ask AI" send document text, so ask once per document per session.
function consentFor(doc) {
  if (state.consent[doc.id]) return true;
  const ok = confirm(`Send text from “${docTitle(doc)}” to ${aiName() || 'Smarty'} to answer your questions? You’ll be asked again next time you open the app.`);
  if (ok) state.consent[doc.id] = true;
  return ok;
}

/* ---------- small helpers ---------- */
const current = () => state.docs.find(d => d.id === state.doc) || null;
const noteKey = (id, docId = state.doc) => `${docId}::${id}`;
const explainKey = (docId, nodeId) => `explain::${docId}::${nodeId}`;
const askKey = (docId, nodeId) => `ask::${docId}::${nodeId}`;
const shown = () => state.review || state.result;
const examLive = () => !!(state.questions && !state.result);
const timeLeft = () => examMinutes() ? leftMs(state.startedAt, examMinutes(), Date.now(), state.pauses || []) : activeMs(state.startedAt, Date.now(), state.pauses || []);
state.timing = normalizeTiming(readJSON('prvlar-timing', null));
const isPaused = () => (state.pauses || []).some(p => p.to == null);
const fmtTime = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = ts => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmtBytes = n => n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? Math.round(n / 1e6) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const extOf = name => (String(name).split('.').pop() || '').toLowerCase();
const typeOf = name => ({ pdf: 'pdf', docx: 'docx', pptx: 'pptx' })[extOf(name)] || 'txt';
const fileTitle = d => String(d?.name || '').replace(/\.(pdf|docx|pptx|txt|md)$/i, '');
// A document with one top heading (its title) is shown by that title; otherwise by its file name.
const docTitle = d => { if (!Array.isArray(d?.sections)) return fileTitle(d); const top = outline(d).filter(n => n.parent === 'root'); return top.length === 1 && top[0].title ? top[0].title : fileTitle(d); };
const unitOf = d => d.mapBy === 'ai' ? 'topic' : ({ pdf: 'page', pptx: 'slide' })[extOf(d.name)] || 'section';
const answered = q => state.answers[q.id] !== undefined && String(state.answers[q.id]).trim() !== '';
const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const isWide = () => window.innerWidth >= 960;
// PDF pages and AI topics often begin with their own heading line; the section title already shows it.
const withoutTitle = (text, title) => {
  const lines = String(text).split('\n'), first = (lines[0] || '').replace(/\s+/g, ' ').trim().toLowerCase(), t = String(title || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return lines.length > 1 && t && first === t ? lines.slice(1).join('\n').trim() : text;
};
// PDF text keeps the page's line breaks; join a line to the next when the sentence clearly carries on.
const reflow = t => String(t).replace(/([^\n.:;!?])\n(?=[a-z(])/g, '$1 ');
const paras = t => esc(t).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const docAttempts = id => state.attempts.filter(a => a.documentId === id);
const attemptTitle = a => { const d = state.docs.find(x => x.id === a.documentId); return d ? docTitle(d) : fileTitle({ name: a.documentName || 'Document' }); };
const studyable = d => outline(d).filter(n => n.id !== 'root' && n.text);
const studied = d => { const seen = new Set(state.visited[d.id] || []); return studyable(d).filter(n => seen.has(n.id)).length; };
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
function markVisited(docId, id) {
  const list = state.visited[docId] || (state.visited[docId] = []);
  if (!list.includes(id)) { list.push(id); writeJSON('prvlar-visited', state.visited); bumpDay(dayKey(), { sections: 1 }).then(async () => { state.days = await getDays(); }).catch(() => {}); }
  const now = Date.now();
  if (now - (state.lastStudied[docId] || 0) > 60000) { state.lastStudied[docId] = now; writeJSON('prvlar-last', state.lastStudied); }
}
const fmtDay = ts => {
  const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(new Date(ts))) / 864e5);
  return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : fmtDate(ts);
};
const typeLabel = d => ({ pdf: 'PDF', docx: 'Word', pptx: 'PowerPoint' })[typeOf(d.name)] || (extOf(d.name) === 'md' ? 'Markdown' : 'Text');
const btnIcon = (action, label, name, cls = 'icon-btn') => `<button class="${cls}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}">${icon(name, 20)}</button>`;

// AI answers: escaped text with paragraphs, "- " lists, **bold**, and [section] citations that open the section.
function fmtAnswer(text, doc) {
  return splitBlocks(text).map(p => p.type === 'mermaid'
    ? (cachedDiagram(p.body) ? `<div class="mmd is-drawn" data-mmd="${encodeURIComponent(p.body)}" data-done="1">${cachedDiagram(p.body)}</div>` : `<div class="mmd" data-mmd="${encodeURIComponent(p.body)}"><span class="spin"></span> Drawing diagram…</div>`)
    : p.type === 'svg' ? (visualsReady() ? `<div class="ai-svg">${sanitizeSvg(p.body)}</div>` : '<div class="ai-svg"><span class="spin"></span></div>')
    : fmtText(p.body, doc)).join('');
}
function fmtText(raw, doc) {
  const { text, math } = extractMath(raw);
  return fmtPlain(text, doc).replace(/\u0001(\d+)\u0001/g, (_, i) => { const m = math[i]; return visualsReady() ? mathHTML(m.tex, m.display) || `<code>${esc(m.tex)}</code>` : `<code>${esc(m.tex)}</code>`; });
}
function fmtPlain(text, doc) {
  const nodes = doc ? outline(doc) : [];
  const cite = s => { const n = nodes.find(x => x.id !== 'root' && (x.title.toLowerCase() === s.toLowerCase() || String(x.source).toLowerCase() === s.toLowerCase())); return n ? `<button class="cite" data-node="${esc(n.id)}">${s}</button>` : `<span class="cite">${s}</span>`; };
  return esc(text).split(/\n{2,}/).map(block => {
    const lines = block.split('\n');
    const html = lines.every(l => /^\s*([-•*]|\d+\.)\s+/.test(l))
      ? `<ul>${lines.map(l => `<li>${l.replace(/^\s*([-•*]|\d+\.)\s+/, '')}</li>`).join('')}</ul>`
      : `<p>${lines.join('<br>')}</p>`;
    return html.replace(/\*\*([^*]{1,200})\*\*/g, '<strong>$1</strong>').replace(/\[([^\]\n]{1,80})\]/g, (_, s) => cite(s));
  }).join('');
}

/* ---------- theme ---------- */
function isDark() {
  if (THEME_BAR[state.theme]) return THEME_BAR[state.theme][1];
  try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
}
// Glass background: the bundled photo by default, the student's own picture, or no photo.
let PACK_GLASS = '';   // the owner pack's background photo, if any
function applyGlassBg() {
  const v = state.glassBg, root = document.documentElement;
  if (v === 'none') root.style.setProperty('--glass-photo', 'linear-gradient(160deg, #6f8f7b, #2f4a3c)');
  else if (v) root.style.setProperty('--glass-photo', `url("${v}")`); else if (PACK_GLASS) root.style.setProperty('--glass-photo', `url("${PACK_GLASS}")`); else root.style.removeProperty('--glass-photo');
}
async function pickGlassBg(file) {
  if (!file || !/^image\//.test(file.type)) throw Error('Choose a picture (JPG, PNG or WebP).');
  const img = await createImageBitmap(file), k = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  state.glassBg = c.toDataURL('image/jpeg', 0.82); await setSetting('glass-bg', state.glassBg); applyGlassBg(); render();
}
function applyTheme() {
  const root = document.documentElement, t = state.theme;
  // Device mode uses the Light or Dark look that matches the phone's setting.
  root.setAttribute('data-theme', t !== 'system' && THEMES.includes(t) ? t : isDark() ? 'dark' : 'light');
  const dark = isDark(), bar = THEME_BAR[t] ? THEME_BAR[t][0] : THEME_BAR[dark ? 'dark' : 'light'][0];
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bar));
  setStatusBar(dark, bar);
}

/* ---------- exam draft (survives a reload within the session) ---------- */
const draftKey = id => 'prvlar-exam-' + id;
function saveDraft() {
  if (!state.doc || !state.questions) return;
  try { sessionStorage.setItem(draftKey(state.doc), JSON.stringify({ pauses: state.pauses || [], qTimes: state.qTimes || {}, warned: state.warned || [], questions: state.questions, answers: state.answers, startedAt: state.startedAt, flags: [...state.flags], qIndex: state.qIndex, examMeta: state.examMeta })); } catch { /* ignore */ }
}
function restoreDraft() {
  if (!state.doc) return false;
  try {
    const d = JSON.parse(sessionStorage.getItem(draftKey(state.doc)) || 'null');
    if (!d || !Array.isArray(d.questions) || !d.questions.length) return false;
    Object.assign(state, { pauses: d.pauses || [], qTimes: d.qTimes || {}, warned: d.warned || [], questions: d.questions, answers: d.answers || {}, startedAt: d.startedAt, flags: new Set(d.flags || []), qIndex: Math.min(d.qIndex || 0, d.questions.length - 1), examMeta: d.examMeta || null, result: null, aiConsent: false, autoFailed: false });
    return true;
  } catch { return false; }
}

/* =================================================================== rendering */
let noticeTimer = null, noticeShown = '';
// Inner scrolling areas keep their place when the screen is redrawn; conversations stay scrolled to the newest message.
const SCROLLERS = ['#chartwrap', '.thread', '.section-side .ask'];
function render() {
  const t0 = performance.now();
  const before = SCROLLERS.map(sel => { const el = document.querySelector(sel); return el ? { top: el.scrollTop, left: el.scrollLeft, end: el.scrollHeight - el.scrollTop - el.clientHeight < 40 } : null; });
  app.innerHTML = shellHTML() + onboardingHTML() + timeUpHTML();
  if (app.querySelector('[data-mmd]:not([data-done])')) hydrateDiagrams(app).catch(() => {});
  if (state.view === 'code') mountCodeEditor();
  placeMusic();
  recordRender(performance.now() - t0);
  SCROLLERS.forEach((sel, i) => {
    const el = document.querySelector(sel), was = before[i];
    if (!el) return;
    if (sel === '#chartwrap') { if (was) { el.scrollLeft = was.left; el.scrollTop = was.top; } }
    else el.scrollTop = !was || was.end ? el.scrollHeight : was.top;
  });
  // The draw-in animation runs once; afterwards trails get their normal style.
  const anim = document.querySelector('.flowchart.fc-anim');
  if (anim) setTimeout(() => anim.classList.remove('fc-anim'), 2200);
  // Good-news messages fade away by themselves; errors stay until dismissed.
  if (state.notice && state.notice !== noticeShown) {
    noticeShown = state.notice; clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { if (state.notice === noticeShown) { state.notice = ''; noticeShown = ''; document.querySelector('.toast.ok')?.remove(); } }, 5000);
  }
  updateTimer();
}

function shellHTML() {
  const body = viewHTML();   // first: a section that no longer exists falls back to the map, which changes the view
  return `<div class="shell${state.dragging ? ' is-dragging' : ''}">
${sidebarHTML()}
<div class="stage">${topbarHTML()}<main class="main v-${state.view}${examLive() && state.view === 'test' && !shown() ? ' is-exam' : ''}" id="main" tabindex="-1">${body}</main></div>
<nav class="tabbar" aria-label="Main">${TABS.map(t => tabBtn(t)).join('')}</nav>
${focusPill()}${toastsHTML()}${selExplainHTML()}
${state.showGrid && state.questions ? gridSheetHTML() : ''}${state.update.dialog && state.update.release ? updateDialogHTML() : ''}
</div>`;
}

const timerBadge = () => examLive() ? `<span class="nav-badge" data-timer-badge>${fmtTime(timeLeft())}</span>` : '';
function tabBtn(t) {
  const on = TAB_OF[state.view] === t.v;
  return `<button class="tab${on ? ' is-on' : ''}" data-view="${t.v}"${on ? ' aria-current="page"' : ''}>${icon(t.icon, 23, '', on ? 2.2 : 1.9)}<span>${t.label}</span>${t.v === 'test' ? timerBadge() : ''}</button>`;
}

function sidebarHTML() {
  return `<nav class="sidebar" aria-label="Main">
<button class="brand" data-view="home" aria-label="Prvlar home">${logo()}<span class="wordmark">Prvlar</span></button>
<ul class="side-nav">${SIDE.filter(t => t.v !== 'dev' || canDo('dev')).map(t => { const on = SIDE_OF[state.view] === t.v; return `<li${t.head ? ' class="side-head"' : ''}><button class="side-link${on ? ' is-on' : ''}${t.head ? ' is-head' : ''}" data-view="${t.v}"${on ? ' aria-current="page"' : ''}>${icon(t.icon, 21)}<span>${t.label}</span>${t.v === 'test' ? timerBadge() : ''}</button></li>`; }).join('')}</ul>
${storageCardHTML()}
</nav>`;
}
function storageCardHTML() {
  const s = state.storage;
  return `<div class="storage-card"><div class="storage-row"><span>Storage</span><span>${s ? `${fmtBytes(s.used)} of ${fmtBytes(s.quota)}` : 'On this device'}</span></div><div class="meter"><span style="width:${s ? Math.max(2, Math.min(100, pct(s.used, s.quota))) : 2}%"></span></div></div>`;
}
function updateStorage() {
  storageEstimate().then(s => { if (!s) return; state.storage = s; const el = document.querySelector('.storage-card'); if (el) el.outerHTML = storageCardHTML(); });
}

function topbarHTML() {
  return `<header class="topbar"><label class="search"><span class="sr-only">Search</span>${icon('search', 19)}<input type="search" id="gsearch" placeholder="Search documents, topics or notes…" value="${esc(state.search)}" autocomplete="off"></label>
<button class="icon-btn" data-action="toggleTheme" aria-label="${isDark() ? 'Use light theme' : 'Use dark theme'}" title="Theme">${icon(isDark() ? 'sun' : 'moon', 20)}</button></header>`;
}

function toastsHTML() {
  if (!state.error && !state.notice) return '';
  return `<div class="toasts">${state.error ? `<div class="toast err" role="alert">${icon('alert', 20)}<p>${esc(state.error)}</p><button class="btn outline sm" data-action="reportFromToast">Report</button><button class="icon-btn sm" data-action="dismiss" aria-label="Dismiss">${icon('x', 18)}</button></div>` : ''}${state.notice ? `<div class="toast ok" role="status">${icon('checkCircle', 20)}<p>${esc(state.notice)}</p><button class="icon-btn sm" data-action="dismiss" aria-label="Dismiss">${icon('x', 18)}</button></div>` : ''}</div>`;
}
// Choose which document a test or chat is about (only shown with two or more documents).
const docPicker = () => state.docs.length > 1 ? `<label class="doc-pick"><span class="sr-only">Document</span>${icon('file', 18)}<select class="input select" id="docpick">${state.docs.map(d => `<option value="${esc(d.id)}"${d.id === state.doc ? ' selected' : ''}>${esc(docTitle(d))}</option>`).join('')}</select></label>` : '';

// Phone headers. Brand header on top-level screens; back header on screens inside a flow.
const STK = {   // plain shapes; an owner pack may swap in its own sticker art
  star: '<svg viewBox="0 0 60 60" class="stk stk-star" aria-hidden="true"><circle cx="30" cy="30" r="22" fill="#E3B04B"/></svg>',
  seal: '<svg viewBox="0 0 64 64" class="stk stk-seal" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#8E2F36"/></svg>',
  stamp: '<svg viewBox="0 0 60 70" class="stk stk-stamp" aria-hidden="true"><rect x="6" y="6" width="48" height="58" rx="4" fill="#F6EBD3" stroke="#7E94A0" stroke-width="3"/></svg>',
  tape: '<svg viewBox="0 0 90 26" class="stk stk-tape" aria-hidden="true"><rect x="2" y="3" width="86" height="20" fill="#E6B7B0" opacity=".85"/></svg>',
  heart: '<svg viewBox="0 0 60 56" class="stk stk-heart" aria-hidden="true"><rect x="12" y="10" width="36" height="36" rx="10" fill="#C8644A"/></svg>'
};
const QUOTES = [['The roots of education are bitter, but the fruit is sweet.', 'Aristotle'], ['An investment in knowledge pays the best interest.', 'Benjamin Franklin'], ['Live as if you were to die tomorrow. Learn as if you were to live forever.', 'Mahatma Gandhi']];
const vtExtras = () => {
  const q = QUOTES[new Date().getDate() % QUOTES.length];
  const ex = state.plans.filter(p => p.kind === 'exam' && p.date && daysUntil(p.date) >= 0).sort((a, b) => a.date - b.date)[0];
  const dt = ex ? new Date(dayStart(ex.date)) : null;
  const tile = `<button class="cl-cal" data-view="planner"><span class="cl-cal-m">${dt ? dt.toLocaleString('en', { month: 'short' }).toUpperCase() + ' ' + dt.getDate() : 'PLANNER'}</span><b>${ex ? daysUntil(ex.date) : '+'}</b><span class="cl-cal-d">${ex ? 'days to go' : 'add exam'}</span>${ex ? `<span class="cl-cal-t">${esc(ex.title)}</span>` : ''}<span class="cl-postmark">KNOWLEDGE ✦ ATLAS</span></button>`;
  return `<div class="vt-only cl-row"><figure class="cl-quote">${STK.tape}<blockquote>“${esc(q[0])}”</blockquote><figcaption>— ${esc(q[1])}</figcaption>${STK.heart}</figure>${tile}</div><div class="vt-only cl-stickers" aria-hidden="true">${STK.star}${STK.stamp}<span class="cl-label-stk">study hard,<br>dream big</span>${STK.seal}${STK.star}</div>`;
};
const omExtras = () => {
  const q = QUOTES[new Date().getDate() % QUOTES.length];
  const ex = state.plans.filter(p => p.kind === 'exam' && p.date && daysUntil(p.date) >= 0).sort((a, b) => a.date - b.date)[0];
  const tile = ex ? (() => { const dt = new Date(dayStart(ex.date)); return `<button class="om-cal" data-view="planner"><span class="om-cal-m">${dt.toLocaleString('en', { month: 'short' }).toUpperCase()}</span><b>${dt.getDate()}</b><span class="om-cal-d">${daysUntil(ex.date)} days</span><span class="om-cal-t">${esc(ex.title)}</span></button>`; })() : `<button class="om-cal" data-view="planner"><span class="om-cal-m">PLAN</span><b>+</b><span class="om-cal-d">Add exam</span></button>`;
  return `<div class="om-only om-row"><figure class="om-quote"><span class="om-orn">◆</span><blockquote>“${esc(q[0])}”</blockquote><figcaption>— ${esc(q[1])}</figcaption></figure>${tile}</div><div class="om-only om-div"><i></i><span>◆</span><i></i></div>`;
};
const brandHead = (title = 'Prvlar') => `<header class="ph ph-brand"><span class="brand">${logo()}<span class="wordmark">${esc(title)}</span></span><button class="icon-btn round" data-view="settings" aria-label="Settings">${icon('settings', 21)}</button></header>`;
const backHead = (title, actions = '', center = false) => `<header class="ph ph-back${center ? ' is-center' : ''}"><button class="icon-btn" data-action="back" aria-label="Back">${icon('back', 22)}</button><h1 class="ph-title">${esc(title)}</h1><div class="ph-actions">${actions}</div></header>`;

function viewHTML() {
  const doc = current();
  switch (state.view) {
    case 'home': return viewHome();
    case 'library': return viewLibrary();
    case 'study': return doc ? viewStudy(doc) : noDoc('study');
    case 'section': return doc ? viewSection(doc) : noDoc('study');
    case 'test': return shown() ? viewResult(shown()) : !doc ? noDoc('test') : state.questions ? viewExam() : viewTestSetup(doc);
    case 'more': return viewMore();
    case 'results': return viewResults();
    case 'notes': return viewNotes();
    case 'chat': return doc ? viewChat(doc) : noDoc('chat');
    case 'settings': return viewSettings();
    case 'about': return viewAbout();
    case 'report': return reportHTML();
    case 'beta': return viewBeta();
    case 'smarty': return viewSmarty();
    case 'code': return viewCode();
    case 'dev': return viewDev();
    case 'practice': return viewHub('practice');
    case 'plan': return viewHub('plan');
    case 'licenses': return `${backHead('Open-source licences')}<div class="view narrow"><section class="card"><pre class="licenses">${esc(NOTICES)}</pre><p class="fine"><a href="./third-party-licenses.txt" target="_blank" rel="noopener">Full licence texts of every bundled package</a></p></section></div>`;
    case 'privacy': return viewPrivacy();
    case 'terms': return viewTerms();
    case 'examlab': return viewExamLab();
    case 'cards': return viewCards();
    case 'errors': return viewErrors();
    case 'planner': return viewPlanner();
    case 'focus': return viewFocus();
    case 'progress': return viewProgress();
    default: return viewHome();
  }
}

const fileGlyph = t => ({
  pdf: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M6 2.5h8.5L19.5 7.5V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z" fill="#fff" stroke="#E5484D" stroke-width="1.6"/><path d="M14.5 2.5V7.5h5" fill="none" stroke="#E5484D" stroke-width="1.6"/><rect x="7" y="11" width="10" height="7" rx="1.5" fill="#E5484D"/><path d="M8.6 16.4v-3.8h1.2a1.1 1.1 0 0 1 0 2.2H8.6" fill="none" stroke="#fff" stroke-width="1"/></svg>',
  docx: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="#2F6BFF"/><path d="M7 8.5l1.6 7 2-5.6h.8l2 5.6 1.6-7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  pptx: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="#F05A28"/><path d="M9.5 16.5v-9h3a2.6 2.6 0 0 1 0 5.2h-3" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  txt: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M6 2.5h8.5L19.5 7.5V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z" fill="#EEF2FB" stroke="#6E7FA8" stroke-width="1.6"/><path d="M8 11h8M8 14h8M8 17h5" stroke="#6E7FA8" stroke-width="1.6" stroke-linecap="round"/></svg>'
})[t] || '';
const importBtn = (cls, label, accept = ACCEPT) => `<label class="${cls} file-btn">${icon('plus', 20)}<span>${label}</span><input type="file" data-import multiple accept="${accept}" aria-label="${label}"></label>`;
const fileTile = (t, label) => `<label class="ftile file-btn"><span class="ftile-icon">${fileGlyph(t)}</span><span>${label}</span><input type="file" data-import multiple accept="${ACCEPT_BY[t]}" aria-label="Import ${label}"></label>`;
const fileTiles = () => `<div class="ftiles">${fileTile('pdf', 'PDF')}${fileTile('docx', 'Word')}${fileTile('pptx', 'PowerPoint')}${fileTile('txt', 'Text')}</div>`;

function noDoc(view) {
  const why = { study: 'Import a document to see its study map.', test: 'Tests are written from one of your documents.', chat: 'Import a document, then ask the AI anything about it.' }[view] || 'Import a document to start.';
  return `${brandHead()}<section class="view narrow"><div class="empty card">${icon('file', 34)}<h2>No document yet</h2><p>${why}</p>${importBtn('btn primary', 'Import a document')}</div></section>`;
}

/* ---------- home ---------- */
function viewHome() {
  const hero = (compact) => `<section class="hero${compact ? ' is-compact' : ''}">${compact ? '' : `<div class="hero-art-wrap">${heroArt()}</div>`}
<h1 class="hero-title">${compact ? 'Add another document' : '<span>Turn any document</span> <span>into a study map</span>'}</h1>
${compact ? '' : '<p class="hero-sub">Import your notes, textbooks or research papers and get a structured map, simple explanations and tests.</p>'}
${importBtn('btn btn-hero', 'Import a document')}${fileTiles()}</section>`;
  if (!state.docs.length) {
    const h = new Date().getHours(), hi = h < 5 ? 'Studying late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return `${brandHead()}<div class="view narrow"><header class="greet is-empty"><h1>${hi}${userName() ? ', ' + esc(userName()) : ''}</h1>${ownerBadge()}</header>${hero(false)}${userStream() === 'cs' ? `<section class="quick3" aria-label="Quick actions"><button class="quick" data-view="code">${icon('code', 22)}<span>Smarty Code</span></button><button class="quick" data-view="smarty">${icon('brain', 22)}<span>Ask Smarty</span></button></section>` : ''}</div>`;
  }
  const doc = current() || state.docs[0];
  const total = studyable(doc).length, done = studied(doc), atts = state.attempts;
  const avg = atts.length ? Math.round(atts.reduce((s, a) => s + a.percent, 0) / atts.length) : null;
  const studiedAll = state.docs.reduce((s, d) => s + studied(d), 0);
  const hour = new Date().getHours(), hello = hour < 5 ? 'Studying late' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const quick = `<section class="quick3" aria-label="Quick actions">${userStream() === 'cs' ? `<button class="quick" data-view="code">${icon('code', 22)}<span>Smarty Code</span></button>` : ''}<button class="quick" data-view="smarty">${icon('brain', 22)}<span>Ask Smarty</span></button><button class="quick" data-view="test">${icon('test', 22)}<span>Start practice</span></button><label class="quick file-btn">${icon('plus', 22)}<span>Add document</span><input type="file" data-import multiple accept="${ACCEPT}" aria-label="Add document"></label></section>`;
  return `${brandHead()}<div class="view home-dash">
<header class="greet"><h1>${hello}${userName() ? ', ' + esc(userName()) : ''}</h1>${ownerBadge()}<p>Here’s your study day.</p></header>
${omExtras()}${vtExtras()}${themeHero(doc, done, total)}
${quick}
<section class="card continue">
  <div class="continue-top"><span class="ftile-icon big">${fileGlyph(typeOf(doc.name))}</span><div class="continue-text"><span class="eyebrow-free">Continue where you left off</span><h2>${esc(docTitle(doc))}</h2><div class="progress-row"><span class="meter"><span style="width:${pct(done, total)}%"></span></span><span>${done} of ${total} studied</span></div></div></div>
  <div class="continue-actions"><button class="btn primary" data-open="${esc(doc.id)}">${icon('map', 19)}Open study map</button></div>
</section>
${todayCard()}
${weakCard()}
${avg != null ? `<p class="fine center">${plural(atts.length, 'test')} taken · average ${avg}% · ${plural(studiedAll, 'section')} studied</p>` : ''}
</div>`;
}

/* ---------- library and search ---------- */
function docCard(d) {
  const atts = docAttempts(d.id), best = atts.length ? Math.max(...atts.map(a => a.percent)) : null;
  const total = studyable(d).length, done = studied(d);
  return `<li class="doc-card${d.id === state.doc ? ' is-current' : ''}">
<button class="doc-main" data-open="${esc(d.id)}" aria-label="Open ${esc(docTitle(d))}">
<span class="ftile-icon">${fileGlyph(typeOf(d.name))}</span>
<span class="doc-text"><span class="doc-name">${esc(docTitle(d))}</span><span class="doc-file">${esc(d.name)}</span>
<span class="chips"><span class="chip">${plural(d.sections.length, unitOf(d))}</span>${total ? `<span class="chip">${done} of ${total} studied</span>` : ''}${best !== null ? `<span class="chip good">Best ${best}%</span>` : ''}</span>
${total ? `<span class="meter"><span style="width:${pct(done, total)}%"></span></span>` : ''}</span></button>
<button class="icon-btn" data-del="${esc(d.id)}" aria-label="Delete ${esc(docTitle(d))}" title="Delete">${icon('trash', 19)}</button></li>`;
}

function searchResults(q) {
  const term = q.trim().toLowerCase();
  const hit = s => String(s || '').toLowerCase().includes(term);
  const snippet = t => { const s = String(t || ''), i = s.toLowerCase().indexOf(term); if (i < 0) return esc(s.slice(0, 110)); const a = Math.max(0, i - 40); return (a ? '…' : '') + esc(s.slice(a, i)) + '<mark>' + esc(s.slice(i, i + term.length)) + '</mark>' + esc(s.slice(i + term.length, i + term.length + 70)) + '…'; };
  const docs = state.docs.filter(d => hit(docTitle(d)) || hit(d.name));
  const secs = [], notes = [];
  for (const d of state.docs) {
    for (const n of outline(d)) {
      if (n.id === 'root') continue;
      if (hit(n.title) || hit(n.text)) secs.push({ d, n });
      const note = state.notes[noteKey(n.id, d.id)];
      if (note && hit(note)) notes.push({ d, n, note });
    }
    const rootNote = state.notes[noteKey('root', d.id)];
    if (rootNote && hit(rootNote)) notes.push({ d, n: { id: 'root', title: 'Notes about the whole document' }, note: rootNote });
  }
  const row = (d, n, text, tab) => `<li><button class="result-row" data-docnode="${esc(d.id)}:${esc(n.id)}"${tab ? ` data-tab="${tab}"` : ''}><span class="result-title">${esc(n.title)}</span><span class="result-sub">${esc(docTitle(d))}</span><span class="result-snip">${text}</span></button></li>`;
  if (!docs.length && !secs.length && !notes.length) return `<div class="empty card">${icon('search', 30)}<h2>Nothing found</h2><p>No document, section or note contains “${esc(q.trim())}”.</p></div>`;
  return `${docs.length ? `<h2 class="section-h">Documents</h2><ul class="doc-list">${docs.map(docCard).join('')}</ul>` : ''}
${secs.length ? `<h2 class="section-h">Sections <span class="count">${secs.length}</span></h2><ul class="results-list">${secs.slice(0, 25).map(({ d, n }) => row(d, n, snippet(hit(n.text) ? n.text : n.title))).join('')}</ul>` : ''}
${notes.length ? `<h2 class="section-h">Notes <span class="count">${notes.length}</span></h2><ul class="results-list">${notes.slice(0, 25).map(({ d, n, note }) => row(d, n, snippet(note), 'notes')).join('')}</ul>` : ''}`;
}

function viewLibrary() {
  const searching = state.search.trim().length >= 2;
  return `${brandHead()}<div class="view">
<header class="page-head"><div><h1 class="title">Study</h1><p class="muted">${plural(state.docs.length, 'document')} on this device</p></div>${importBtn('btn primary', 'Import')}</header>
<nav class="study-links" aria-label="Study tools">${GROUPS[1].links.filter(([v]) => v !== 'library').map(([v, ic, label]) => `<button class="study-link" ${navAttr(v)}>${icon(ic, 20)}<span>${esc(label)}</span>${v === 'cards' && dueCount() ? `<b class="nav-badge">${dueCount()}</b>` : ''}</button>`).join('')}</nav>
<label class="search search-inline"><span class="sr-only">Search</span>${icon('search', 19)}<input type="search" id="lsearch" placeholder="Search documents, topics or notes…" value="${esc(state.search)}" autocomplete="off"></label>
${searching ? searchResults(state.search) : state.docs.length ? `<ul class="doc-list">${state.docs.map(docCard).join('')}</ul><p class="drop-hint">${icon('upload', 18)}You can also drop PDF, Word, PowerPoint, text or Markdown files anywhere on this window.</p>`
    : `<div class="empty card">${icon('library', 34)}<h2>Your library is empty</h2><p>Import a PDF, Word, PowerPoint, text or Markdown file.</p>${fileTiles()}</div>`}
</div>`;
}

/* ---------- study: map, outline, notes ---------- */
const direction = () => state.layout !== 'auto' ? state.layout : (window.innerWidth < 760 ? 'vertical' : 'horizontal');
const seg = (name, current, items) => `<div class="seg" role="tablist">${items.map(([v, label, ic]) => `<button role="tab" class="seg-btn${current === v ? ' is-on' : ''}" data-${name}="${v}" aria-selected="${current === v}">${ic ? icon(ic, 17) : ''}${label}</button>`).join('')}</div>`;

function docMenu(doc) {
  return `<div class="menu-wrap"><button class="icon-btn soft" data-action="toggleMenu" aria-label="More options" aria-haspopup="true" aria-expanded="${state.menu}">${icon('dots', 21)}</button>${state.menu ? `<div class="menu" role="menu"><button role="menuitem" data-action="remapAI"${state.busy ? ' disabled' : ''}>${icon('sparkles', 18)}${doc.mapBy === 'ai' ? 'Organise the map again with AI' : 'Organise the map with AI'}</button>${doc.originalSections ? `<button role="menuitem" data-action="restoreMap"${state.busy ? ' disabled' : ''}>${icon('restore', 18)}Use the original headings</button>` : ''}<button role="menuitem" data-view="test">${icon('test', 18)}Practice test</button><button role="menuitem" data-review="${esc(doc.id)}">${icon('cards', 18)}Study flashcards</button><button role="menuitem" data-action="exportOutline">${icon('download', 18)}Export mind map (Markdown)</button><button role="menuitem" data-view="chat">${icon('chat', 18)}Ask AI about this document</button><button role="menuitem" class="danger" data-del="${esc(doc.id)}">${icon('trash', 18)}Delete document</button></div>` : ''}</div>`;
}
function studyHeader(doc) {
  const total = studyable(doc).length, done = studied(doc), last = state.lastStudied[doc.id];
  return `${backHead(docTitle(doc), docMenu(doc))}
<header class="doc-head"><span class="ftile-icon">${fileGlyph(typeOf(doc.name))}</span><div class="doc-head-text"><h1 class="title">${esc(docTitle(doc))}</h1>
<div class="chips"><span class="chip wide-only">${typeLabel(doc)}</span><span class="chip">${plural(chartNodes(outline(doc)).length - 1, unitOf(doc))}</span>${total ? `<span class="chip">${done} of ${total} studied</span>` : ''}${last ? `<span class="chip wide-only">Last studied: ${fmtDay(last)}</span>` : ''}${doc.mapBy === 'ai' ? `<span class="chip ai">${icon('sparkles', 13)}Organised by AI</span>` : ''}</div></div><div class="doc-head-menu">${docMenu(doc)}</div></header>`;
}

function viewStudy(doc) {
  const tab = state.studyTab;
  const body = state.busy === 'remap' && tab !== 'notes' ? remapWorking() : tab === 'map' ? mapPanel(doc) : tab === 'outline' ? outlinePanel(doc) : notesPanel(doc);
  return `<div class="view wide">${studyHeader(doc)}<div class="study-bar">${seg('stab', tab, [['map', 'Map', 'map'], ['outline', 'Outline', 'outline'], ['notes', 'Notes', 'sticky']])}${tab === 'map' && state.busy !== 'remap' ? mapTools(doc) : ''}</div>${tab !== 'notes' && state.busy !== 'remap' ? remapNudge(doc) : ''}${body}</div>`;
}

// Maps built from PDF pages, slides or text without headings have only one level: offer to organise them by topic.
function remapNudge(doc) {
  if (doc.originalSections || !flatMap(doc) || state.nudgeHidden[doc.id]) return '';
  const unit = levelNames(doc)[1];
  const what = unit === 'Page' ? 'This map follows the PDF’s pages, not its topics.' : unit === 'Slide' ? 'This map follows the slides, not their topics.' : 'This map has only one level of headings.';
  return `<section class="ai-nudge" aria-label="Organise the map with AI"><span class="ask-icon">${icon('sparkles', 20)}</span><div class="nudge-text"><b>${what}</b><span>AI can organise it into topics and sections. Your text stays exactly the same, and you can switch back.</span></div>
<div class="nudge-actions"><button class="btn primary sm" data-action="remapAI">${icon('sparkles', 17)}Organise with AI</button><button class="icon-btn sm" data-action="hideNudge" aria-label="Hide this suggestion" title="Hide">${icon('x', 18)}</button></div></section>`;
}
const remapWorking = () => `<div class="working remap-working" role="status"><span class="spin"></span><div><b>Smarty is organising your map…</b><p class="fine">The AI reads the start of each paragraph and groups them into topics. This usually takes under a minute; an offline AI on a PC can take several minutes.</p></div></div>`;

// Phones draw the map as wide as the screen; wide screens use the side-by-side layout.
const mapOpts = () => ({ collapsed: state.collapsed, direction: direction(), vWidth: Math.max(280, Math.min(560, (document.querySelector('.main')?.clientWidth || window.innerWidth) - 32)) });
function mapTools(doc) {
  const nodes = chartNodes(outline(doc)), kids = childrenMap(nodes), dir = direction();
  const foldable = nodes.some(n => n.depth > 0 && kids.get(n.id).length);
  return `<div class="map-tools">
<div class="tool-group">${btnIcon('zoomOut', 'Zoom out', 'zoomOut')}<button class="zoom-read" data-action="zoomReset" title="Reset zoom" aria-label="Zoom ${Math.round(state.zoom * 100)} percent, reset">${Math.round(state.zoom * 100)}%</button>${btnIcon('zoomIn', 'Zoom in', 'zoomIn')}</div>
<div class="tool-group">${btnIcon('zoomFit', 'Fit to screen', 'fit')}${btnIcon('flipLayout', dir === 'vertical' ? 'Lay out side by side' : 'Lay out top to bottom', 'flow')}${foldable ? btnIcon(state.collapsed.size ? 'expandAll' : 'foldAll', state.collapsed.size ? 'Open all branches' : 'Fold all branches', state.collapsed.size ? 'chevD' : 'outline') : ''}</div>
<button class="btn primary sm add-note" data-action="addNote">${icon('note', 18)}<span>Add note</span></button></div>`;
}
function mapPanel(doc) {
  const nodes = chartNodes(outline(doc));
  if (state.collapsedFor !== doc.id) { state.collapsed = defaultCollapsed(nodes); state.collapsedFor = doc.id; }
  const opts = mapOpts(), dir = opts.direction; state.lastDir = dir;
  const animate = state.animatedFor !== doc.id && !reducedMotion();
  state.animatedFor = doc.id;
  const selected = nodes.some(n => n.id === state.selected) ? state.selected : nodes[0].id;
  const { svg } = flowchartSVG(nodes, { ...opts, selected, scale: state.zoom, animate, visited: new Set(state.visited[doc.id] || []) });
  const names = levelNames(doc), maxDepth = Math.min(4, Math.max(...nodes.map(n => n.depth)));
  return `<div class="atlas ${dir === 'vertical' ? 'is-v' : 'is-h'}"><div class="chartwrap ${dir === 'vertical' ? 'is-v' : 'is-h'}" id="chartwrap">${svg}</div>
<ul class="legend" aria-label="Map key">${names.slice(1, maxDepth + 1).map((nm, i) => `<li><span class="swatch fc-l${i + 1}"></span>${nm}</li>`).join('')}<li><span class="key-ring"></span>Not studied</li><li><span class="key-done">${icon('check', 11, '', 3)}</span>Studied</li></ul></div>`;
}

function outlinePanel(doc) {
  const nodes = outline(doc).filter(n => n.id !== 'root'), seen = new Set(state.visited[doc.id] || []);
  return `<ol class="outline-list card">${nodes.map(n => `<li><button class="ol-row d${Math.min(n.depth, 4)}" data-node="${esc(n.id)}"><span class="ol-mark${seen.has(n.id) ? ' is-done' : ''}">${seen.has(n.id) ? icon('check', 13, '', 3) : ''}</span><span class="ol-title">${esc(n.title)}</span>${state.notes[noteKey(n.id)] ? `<span class="ol-note" title="Has notes">${icon('sticky', 15)}</span>` : ''}${icon('chevR', 18, 'ol-chev')}</button></li>`).join('')}</ol>`;
}

function notesPanel(doc) {
  const nodes = outline(doc).filter(n => n.id !== 'root' && (state.notes[noteKey(n.id)] || '').trim());
  return `<section class="card notes-card"><h2 class="h2">${icon('note', 20)}Notes about the whole document</h2>
<textarea class="input notes-area" data-note="root" placeholder="Write anything about this document…">${esc(state.notes[noteKey('root')] || '')}</textarea><p class="fine" data-note-status="root">Saved on this device as you type.</p></section>
${nodes.length ? `<h2 class="section-h">Section notes <span class="count">${nodes.length}</span></h2><ul class="results-list">${nodes.map(n => `<li><button class="result-row" data-node="${esc(n.id)}" data-tab="notes"><span class="result-title">${esc(n.title)}</span><span class="result-snip">${esc(String(state.notes[noteKey(n.id)]).slice(0, 220))}</span></button></li>`).join('')}</ul>`
    : '<p class="muted empty-line">Notes you write in a section appear here.</p>'}`;
}

/* ---------- section ---------- */
function askPanel(doc, node) {
  const k = askKey(doc.id, node.id), thread = state.asks[k] || [];
  if (!(k in state.asks)) { state.asks[k] = []; getSetting(k).then(v => { if (Array.isArray(v) && v.length) { state.asks[k] = v; if (state.view === 'section' && state.selected === node.id) render(); } }).catch(() => {}); }
  const prompts = [['Explain this in simpler words', 'bulb'], ['Give real examples', 'target'], ['What are common mistakes?', 'alert'], ['Summarize key points', 'outline']];
  return `<section class="card ask" aria-labelledby="ask-h"><div class="ask-head"><span class="ask-icon">${icon('brain', 22)}</span><h2 id="ask-h">Ask AI about this section</h2></div>
${thread.length ? `<div class="thread">${thread.map((m, i) => `<div class="msg ${m.role}">${m.role === 'user' ? esc(m.text) : fmtAnswer(m.text, doc)}${msgExtras(m, 'chat', i)}</div>`).join('')}${state.busy === 'ask' ? '<div class="msg ai typing"><span></span><span></span><span></span></div>' : ''}</div>` : ''}
${!aiAvailable() ? `<p class="muted">Set up an AI service to ask questions about this section.</p><button class="btn outline" data-view="settings">${icon('settings', 18)}Open AI settings</button>` : `
<div class="prompts">${prompts.map(([p, ic]) => `<button class="prompt" data-prompt="${esc(p)}" data-scope="section"${state.busy ? ' disabled' : ''}>${icon(ic, 18)}<span>${p}</span></button>`).join('')}</div>
<div class="composer"><textarea class="input" id="askq" rows="2" placeholder="Type your question…" aria-label="Your question about this section">${esc(state.askDraft || '')}</textarea><button class="send" data-action="askSend" aria-label="Send"${state.busy ? ' disabled' : ''}>${state.busy === 'ask' ? '<span class="spin"></span>' : icon('send', 19)}</button></div>
<p class="fine">Uses ${esc(aiName())}. Text from this section is sent.</p>`}
${thread.length ? `<button class="link-btn" data-action="clearAsk">Clear this conversation</button>` : ''}
</section>`;
}

function viewSection(doc) {
  const nodes = outline(doc), byId = new Map(nodes.map(n => [n.id, n]));
  const node = byId.get(state.selected);
  if (!node || node.id === 'root') { state.view = 'study'; return viewStudy(doc); }
  const i = nodes.indexOf(node), prev = nodes[i - 1] && nodes[i - 1].id !== 'root' ? nodes[i - 1] : null, next = nodes[i + 1];
  if (node.text) markVisited(doc.id, node.id);
  const children = nodes.filter(n => n.parent === node.id);
  const k = explainKey(doc.id, node.id);
  if (node.text && !(k in state.explain)) {
    state.explain[k] = '';
    getSetting(k).then(v => { if (v) { state.explain[k] = v; if (state.view === 'section' && state.doc === doc.id && state.selected === node.id) render(); } }).catch(() => {});
  }
  const exp = state.explain[k], tab = state.sectionTab, wide = isWide();
  const content = `<article class="content">${node.text ? `<div class="reading">${paras(reflow(withoutTitle(node.text, node.title)))}</div>` : '<p class="muted">This heading has no text of its own. Open one of its parts:</p>'}
${children.length ? `<ul class="results-list sub-list">${children.map(c => `<li><button class="result-row" data-node="${esc(c.id)}"><span class="result-title">${esc(c.title)}</span>${icon('chevR', 18)}</button></li>`).join('')}</ul>` : ''}
${node.text ? (exp ? `<aside class="simple">${'<span class="simple-icon">' + icon('bulb', 17) + '</span>'}<div><h3>In simple words</h3>${paras(exp)}</div></aside>`
      : `<aside class="simple is-empty"><span class="simple-icon">${icon('bulb', 17)}</span><div><h3>In simple words</h3><p>Get a plain-language explanation of this section.</p><button class="link-btn" data-stab="explain">Explain it for me</button></div></aside>`) : ''}
<p class="ref">${icon('file', 15)}From ${esc(doc.name)}: ${esc(node.source)}</p></article>`;
  const explain = `<section class="explain-panel">${node.text ? `<div class="card explain-card"><div class="ask-head"><span class="ask-icon amber">${icon('bulb', 20)}</span><h2>In simple words</h2></div>
${exp ? `<div class="explain-text">${paras(exp)}</div><p class="fine">Written by AI from this section only. Check it against your document.</p>` : '<p>Get a plain-language explanation of this section. Only this section’s text is sent, after you confirm.</p>'}
${!aiAvailable() ? `<button class="btn outline" data-view="settings">${icon('settings', 18)}Set up AI in Settings</button>` : `<button class="btn${exp ? ' outline' : ' primary'}" data-action="explain"${state.busy ? ' disabled' : ''}>${state.busy === 'explain' ? '<span class="spin"></span>Smarty is explaining…' : exp ? icon('restore', 18) + 'Explain again' : icon('sparkles', 18) + 'Explain in simple words'}</button>`}</div>`
    : '<p class="muted empty-line">This heading has no text of its own, so there is nothing to explain. Open one of its parts from the Content tab.</p>'}
${wide || !node.text ? '' : askPanel(doc, node)}</section>`;
  const notes = `<section class="card notes-card"><h2 class="h2">${icon('note', 20)}Your notes</h2><textarea class="input notes-area" data-note="${esc(node.id)}" placeholder="Write what you want to remember…">${esc(state.notes[noteKey(node.id)] || '')}</textarea><p class="fine" data-note-status="${esc(node.id)}">Saved on this device as you type.</p></section>`;
  const body = tab === 'explain' ? explain : tab === 'notes' ? notes : tab === 'cards' ? sectionCards(doc, node) : content;
  const pager = `<div class="pager">${prev ? `<button class="btn outline" data-node="${esc(prev.id)}" aria-label="Previous: ${esc(prev.title)}">${icon('chevL', 18)}<span>Previous</span></button>` : '<span></span>'}${next ? `<button class="btn outline" data-node="${esc(next.id)}" aria-label="Next: ${esc(next.title)}"><span>Next</span>${icon('chevR', 18)}</button>` : ''}</div>`;
  const listenBtn = node.text && speechSupported() ? `<button class="icon-btn soft${state.speaking === node.id ? ' is-on' : ''}" data-speak="${esc(node.id)}" aria-label="${state.speaking === node.id ? 'Stop reading aloud' : 'Read aloud'}" title="${state.speaking === node.id ? 'Stop reading' : 'Read aloud'}">${icon(state.speaking === node.id ? 'stop' : 'volume', 20)}</button>` : '';
  const crumbs = `<div class="crumbs-row"><nav class="crumbs" aria-label="Where you are"><span class="crumb-icon">${fileGlyph(typeOf(doc.name))}</span><button data-action="showOnMap">${esc(docTitle(doc))}</button><span class="crumb-sep" aria-hidden="true">/</span><span class="crumb-here">${esc(node.title)}</span></nav>
 <div class="crumb-actions">${listenBtn}<button class="icon-btn soft" data-action="showOnMap" aria-label="Show on the map" title="Show on the map">${icon('map', 20)}</button></div></div>`;
  return `<div class="view wide">${backHead(docTitle(doc), `${listenBtn}<button class="icon-btn soft" data-action="showOnMap" aria-label="Show on the map" title="Show on the map">${icon('map', 20)}</button><button class="icon-btn soft" data-stab="explain" aria-label="Smarty explains" title="Smarty explains">${icon('smarty', 20)}</button>`)}
${crumbs}<h2 class="section-title">${esc(node.title)}</h2>
<div class="section-grid${wide && node.text ? ' has-side' : ''}"><div class="section-main">${seg('stab2', tab, [['content', 'Content', 'read'], ['explain', 'Smarty explains', 'smarty'], ['notes', 'Notes', 'sticky'], ['cards', 'Cards', 'cards']])}${body}${pager}</div>
${wide && node.text ? `<aside class="section-side">${askPanel(doc, node)}</aside>` : ''}</div></div>`;
}


/* ---------- Exam mode: profiles, picker, custom exams and End Sem ---------- */
// Edition switches: the personal build adds its university catalog; the public build has no university-specific content.
// Owner-pack hooks. The app ships with these empty; an owner's encrypted pack (see ownerpack.js) fills them at runtime.
var EXTRA_EXAMS = [];
const ED_EMPTY = { group: () => '', labBtn: () => '', aboutTest: '', who: '', serverNote: '', defaultName: '', defaultStream: '', obAi: () => '', labTabs: [], labView: () => '', onClick: () => false, onChange: () => false, onBoot: () => {} };
const ED = { ...ED_EMPTY };
const EXAM_ORDER = ['jee-main', 'jee-advanced', 'bitsat', 'gate', 'gate-cse', 'gate-ece', 'gate-ee', 'gate-me', 'gate-ce', 'gate-da', 'neet-ug', 'neet-pg', 'cuet-ug', 'cbse-12', 'upsc-prelims', 'upsc-csat', 'ssc-cgl', 'ssc-chsl', 'rrb-ntpc', 'ibps-po', 'sbi-po', 'ibps-clerk', 'sbi-clerk', 'nda-maths', 'nda-gat', 'clat-ug', 'cat', 'sat', 'gre', 'gmat', 'ielts', EXTRA_EXAMS[0]?.id];
const EXAM_GROUPS = ['Engineering', 'Medical', 'University entrance', 'School boards', 'Civil services', 'Government jobs', 'Banking', 'Defence', 'Law', 'Management', 'International'];
let BUILTIN = [...Object.values(import.meta.glob('./exams/*.json', { eager: true, import: 'default' })), ...EXTRA_EXAMS].map(normalizeProfile)
  .sort((a, b) => EXAM_ORDER.indexOf(a.id) - EXAM_ORDER.indexOf(b.id));
const allProfiles = () => [...BUILTIN, ...(state.profiles || [])];
const pick = () => ({ id: 'standard', level: 0, size: 20, ...(readJSON('prvlar-exam-pick', {}) || {}) });
const pickedProfile = () => { const id = pick().id; return id === 'standard' ? null : allProfiles().find(p => p.id === id) || null; };
const examMinutes = () => state.examMeta && 'minutes' in state.examMeta ? Number(state.examMeta.minutes) || 0 : EXAM_MINUTES;
const SIZES = [10, 15, 20, 30];
const TYPE_LABEL = { mcq: 'Single correct', multi: 'One or more correct', numerical: 'Numerical answer', written: 'Written answer' };
const neg = n => n ? `−${+n.toFixed(2)}` : 'no negative';

function profileSummaryHTML(p, level) {
  const plan = buildPlan(p, level, pick().size), mix = plan.mix, pt = p.pattern;
  const types = {}; plan.slots.forEach(s => { types[s.type] = (types[s.type] || 0) + 1; });
  return `<div class="exam-sum">
<div class="spec"><div><b>${plan.slots.length}</b><span>Questions</span></div><div><b>${plan.totalMarks}</b><span>Marks</span></div><div><b>${plan.minutes}:00</b><span>Minutes</span></div><div><b>${mix.easy}/${mix.medium}/${mix.hard}</b><span>Easy/Med/Hard %</span></div></div>
<p class="fine">${esc(p.fullName || p.name)}${pt.durationMin ? ` · real paper: ${pt.totalQuestions} questions, ${pt.totalMarks || '?'} marks, ${pt.durationMin} min` : ''}. Practice keeps the exam's question types, marks, negative marking and time per question.</p>
<ul class="exam-secs">${pt.sections.map((s, i) => `<li><b>${esc(s.name)}</b><span>${esc(TYPE_LABEL[s.type])} · ${s.count} × ${s.marks} marks · ${neg(s.negative)}${pt.sectionalMin ? ` · ${pt.sectionalMin[i]} min` : ''}${s.type === 'multi' && s.partial === 'jee-advanced' ? ' · partial marks' : ''}</span></li>`).join('')}</ul>
<p class="fine">${p.difficulty ? `Difficulty from past papers: ${esc(p.difficulty.basis || '')}` : 'No reliable difficulty data for this exam, so a standard 30/50/20 mix is used.'}</p>
<p class="fine exam-disclaimer">Practice in the style of this exam only. Not affiliated with or endorsed by the exam’s conducting body (such as NTA). No official papers are included.</p>
${p.assumptions?.length ? `<div class="status warn">${icon('alert', 18)}<p><b>Assumed, not official:</b> ${p.assumptions.map(esc).join(' ')}</p></div>` : ''}
<details class="exam-src"><summary>Where this comes from</summary><p class="fine">${esc(p.coverage?.note || '')}</p>
${p.topics?.length ? `<p class="fine"><b>Most asked:</b> ${p.topics.slice(0, 8).map(t => esc(t.name) + (t.weight != null ? ` (${t.weight})` : '')).join(', ')}${p.topicsBasis ? ` — ${esc(p.topicsBasis)}` : ''}</p>` : ''}
${p.meta?.repeated?.length ? `<p class="fine"><b>Most repeated questions:</b></p><ol class="fine rep-list">${p.meta.repeated.slice(0, 5).map(r => `<li>${esc(r.question)} <span class="chip">×${r.times}</span></li>`).join('')}</ol>` : ''}
<ul class="fine src-list">${p.sources.map(s => `<li>${esc(s.kind === 'official' ? 'Official' : s.kind === 'user' ? 'Your paper' : 'Analysis')}: ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>` : esc(s.title)}${s.years ? ` (${esc(s.years)})` : ''}</li>`).join('')}</ul></details></div>`;
}

function examPickerHTML() {
  const pk = pick(), p = pickedProfile(), mine = state.profiles || [];
  const opt = x => `<option value="${esc(x.id)}"${pk.id === x.id ? ' selected' : ''}>${esc(x.name)}</option>`;
  return `<section class="card exam-pick" aria-labelledby="ep-h"><h2 class="h2 with-icon" id="ep-h">${icon('trophy', 19)}Exam style</h2>
<label class="field"><span>Make the test like</span><select class="input select" id="exam-pick"><option value="standard"${pk.id === 'standard' ? ' selected' : ''}>Standard practice (10 MCQ + 10 written)</option>
${EXAM_GROUPS.map(g => { const l = BUILTIN.filter(x => x.kind === 'builtin' && (x.group || 'Engineering') === g); return l.length ? `<optgroup label="${g}">${l.map(opt).join('')}</optgroup>` : ''; }).join('')}
${ED.group(mine, opt)}${mine.some(x => x.kind === 'papers') ? `<optgroup label="Your university">${mine.filter(x => x.kind === 'papers').map(opt).join('')}</optgroup>` : ''}
${mine.some(x => x.kind === 'custom') ? `<optgroup label="Your exams">${mine.filter(x => x.kind === 'custom').map(opt).join('')}</optgroup>` : ''}</select></label>
${p ? `<div class="level-row"><span class="fine">Level</span><div class="seg" role="tablist">${[[-1, 'Easier'], [0, 'Exam normal'], [1, 'Harder']].map(([v, l]) => `<button role="tab" class="seg-btn${pk.level === v ? ' is-on' : ''}" data-level="${v}" aria-selected="${pk.level === v}">${l}</button>`).join('')}</div>
<label class="size-pick"><span class="fine">Questions</span><select class="input select" id="exam-size">${SIZES.map(n => `<option${pk.size === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
${profileSummaryHTML(p, pk.level)}${(() => { const doc = current(); const w = doc && examDocWarning(p, outline(doc).map(n => n.title + ' ' + (n.text || '')).join(' ')); return w ? `<div class="status warn exam-mismatch" role="status">${icon('alert', 18)}<p>${esc(w)}</p></div>` : ''; })()}` : ''}
<p class="fine">All exams are “-style”: practice questions are AI-written in the exam’s pattern (plus anything you import). No official papers or logos.</p>
<div class="row"><button class="btn outline sm" data-lab="pattern">${icon('plus', 17)}Custom exam (your pattern)</button><button class="btn outline sm" data-lab="custom">${icon('file', 17)}Custom exam from past papers</button>${ED.labBtn()}<button class="btn outline sm" data-lab="papers">${icon('grad', 17)}Past papers (End Sem)</button></div></section>`;
}

/* exam lab: custom builder + university importer */
const papersHTML = list => list.length ? `<ul class="paper-list">${list.map((x, i) => `<li><span class="paper-ic${x.error ? ' bad' : x.scanned ? ' warn' : x.text ? ' ok' : ''}">${icon(x.error ? 'xCircle' : x.scanned ? 'alert' : x.text ? 'checkCircle' : 'file', 17)}</span><span class="paper-t"><b>${esc(x.title)}</b><span class="fine">${x.status ? esc(x.status) : x.error ? esc(x.error) : x.scanned ? 'Scanned (no text layer) – skipped' : x.text ? `${x.pages ? plural(x.pages, 'page') + ' · ' : ''}${x.text.length.toLocaleString()} characters` : 'Waiting'}</span></span><button class="icon-btn" data-delpaper="${i}" aria-label="Remove">${icon('x', 16)}</button></li>`).join('')}</ul>` : '';


function viewExamLab() {
  const tab = state.labTab || 'custom', lab = state.lab, mine = state.profiles || [];
  const working = state.busy === 'analyse' ? `<div class="working" role="status"><span class="spin"></span><div><b>${esc(state.labStatus || 'Working…')}</b></div></div>` : '';
  const yours = mine.length ? `<h2 class="section-h">Your exam profiles</h2><ul class="list card">${mine.map(p => `<li class="list-row prof-row"><span class="feature-icon ${p.kind !== 'custom' ? 'f-green' : 'f-violet'}">${icon(p.kind !== 'custom' ? 'grad' : 'trophy', 20)}</span><span class="lr-text"><b>${esc(p.name)}</b><span>${plural(p.pattern.totalQuestions, 'question')} · ${esc(p.coverage?.note?.match(/\d+ papers?/)?.[0] || '')}${p.meta?.repeated?.length ? ` · ${p.meta.repeated.length} repeated` : ''}</span></span><button class="btn outline sm" data-useprof="${esc(p.id)}">Use</button><button class="icon-btn" data-delprof="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">${icon('trash', 18)}</button></li>`).join('')}</ul>` : '';
  const custom = `<section class="card"><h2 class="h2">Custom exam</h2><p class="muted">Paste past papers or add their PDFs. The AI reads them and writes an exam profile: pattern, marks, negative marking, difficulty, topics and repeated questions. Tests then follow that profile.</p>
<label class="field"><span>Exam name</span><input class="input" id="cx-name" value="${esc(lab.name)}" placeholder="e.g. Thermodynamics mid-term" autocomplete="off"></label>
<label class="field"><span>Paste question papers (optional)</span><textarea class="input" id="cx-text" rows="6" placeholder="Paste one or more papers here…">${esc(lab.pasted)}</textarea></label>
<label class="btn outline file-btn">${icon('upload', 18)}<span>Add PDFs</span><input type="file" data-paperpdf accept=".pdf,application/pdf" multiple></label>
${papersHTML(lab.papers)}${working}
<button class="btn primary big block" data-action="analyseCustom"${state.busy || !aiAvailable() ? ' disabled' : ''}>${icon('sparkles', 19)}Analyse and save profile</button>
${aiAvailable() ? '' : `<p class="fine">Add an AI key or server in Settings first.</p>`}</section>`;
  return `${backHead('Exam profiles')}<div class="view narrow exam-lab">${seg('lab', tab, [['custom', 'Custom exam', 'trophy'], ...ED.labTabs, ['papers', 'Past papers', 'grad']])}
${ED.labTabs.some(x => x[0] === tab) ? ED.labView(tab, { lab, working }) : tab === 'papers' ? viewPastPapers() : tab === 'pattern' ? patternBuilderHTML() : custom}${yours}</div>`;
}

const looksScanned = text => String(text || '').replace(/\s+/g, '').length < 300;
const paperFromText = (title, text, pages = 0) => ({ title, text, pages, scanned: looksScanned(text) });
async function addPaperFiles(files) {
  for (const f of files) {
    const entry = { title: f.name, status: 'Reading…' }; state.lab.papers.push(entry); render();
    try {
      const { text, pages, figures: figs = [] } = /\.(png|jpe?g|webp)$/i.test(f.name) ? { text: await ocrImage(f, f.name), pages: 1 } : await pdfText(new Uint8Array(await f.arrayBuffer()), { name: f.name, figures: true });
      Object.assign(entry, paperFromText(f.name, text, pages), { status: '', figures: figs });
    } catch (e) { Object.assign(entry, { status: '', error: /cancel/i.test(e.message) ? 'Scanning stopped.' : 'Could not read this file.' }); }
    render();
  }
}
// Past-paper figures travel with the profile so practice questions can show the original drawing.
const labFigures = () => state.lab.papers.flatMap(x => x.figures || []).slice(0, 24).map((f, i) => ({ ...f, id: 'F' + (i + 1) }));
// Custom exam builder: the student types the pattern; no AI needed.
function patternBuilderHTML() {
  const b = state.pb || (state.pb = blankPattern());
  const sec = (s, i) => `<fieldset class="pb-sec card" data-pbsec="${i}"><legend>Section ${i + 1}</legend>
<label class="field"><span>Name</span><input class="input" data-pbf="name" value="${esc(s.name)}" placeholder="e.g. Physics MCQ"></label>
<div class="field-row"><label class="field"><span>Type</span><select class="input select" data-pbf="type">${Object.entries(TYPE_LABEL).map(([k, l]) => `<option value="${k}"${s.type === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
<label class="field"><span>Questions</span><input class="input" type="number" min="1" max="500" data-pbf="count" value="${s.count}"></label></div>
<div class="field-row"><label class="field"><span>Marks each</span><input class="input" type="number" step="0.25" min="0.25" data-pbf="marks" value="${s.marks}"></label>
<label class="field"><span>Negative (wrong)</span><input class="input" type="number" step="0.01" min="0" data-pbf="negative" value="${s.negative}"></label></div>
${b.sections.length > 1 ? `<button class="btn ghost sm" data-action="pbDel" data-i="${i}">${icon('trash', 16)}Remove section</button>` : ''}</fieldset>`;
  return `<section class="card" aria-labelledby="pb-h"><h2 class="h2" id="pb-h">Custom exam — your own pattern</h2><p class="muted">Set sections, question types, marks, negative marking and duration. Smarty writes practice tests in this pattern from your documents.</p>
<label class="field"><span>Exam name</span><input class="input" id="pb-name" value="${esc(b.name)}" placeholder="e.g. College physics mid-term"></label>
<label class="field"><span>Duration (minutes)</span><input class="input" type="number" min="1" max="600" id="pb-dur" value="${b.durationMin}"></label>
${b.sections.map(sec).join('')}<button class="btn outline sm" data-action="pbAdd">${icon('plus', 16)}Add section</button>
<label class="field"><span>Syllabus topics (optional, comma separated)</span><textarea class="input" id="pb-topics" rows="2" placeholder="e.g. Kinematics, Optics, Thermodynamics">${esc(b.topics)}</textarea></label>
<div id="pb-sum" aria-live="polite">${pbSummary(b)}</div></section>`;
}
function pbSummary(b) {
  const tot = patternTotals(b), errs = patternErrors(b);
  return `<div class="spec"><div><b>${tot.questions}</b><span>Questions</span></div><div><b>${tot.marks}</b><span>Marks</span></div><div><b>${esc(b.durationMin)}</b><span>Minutes</span></div></div>
${errs.length ? `<div class="status warn" role="status">${icon('alert', 18)}<p>${errs.map(esc).join(' ')}</p></div>` : ''}
<button class="btn primary big block" data-action="pbSave"${errs.length ? ' disabled' : ''}>${icon('checkCircle', 19)}Save and use this exam</button>`;
}
async function saveProfileAndUse(p) {
  await saveProfile(p); state.profiles = await getProfiles();
  writeJSON('prvlar-exam-pick', { ...pick(), id: p.id, level: 0 });
}
function labPapersForAI() {
  const list = state.lab.papers.filter(x => x.text && !x.scanned).map(x => ({ title: x.title, text: x.text }));
  if (state.lab.pasted.trim().length > 200) list.unshift({ title: 'Pasted text', text: state.lab.pasted });
  return list;
}
/* ---------- Past papers (both editions): the student's own university, their own papers ---------- */
const myUni = () => readJSON('prvlar-uni-me', {}) || {};
function viewPastPapers() {
  const me = myUni(), lab = state.lab;
  const working = state.busy === 'analyse' ? `<div class="working" role="status"><span class="spin"></span><div><b>${esc(state.labStatus || 'Working…')}</b></div></div>` : '';
  return `<section class="card" aria-labelledby="uni-h"><h2 class="h2 with-icon" id="uni-h">${icon('grad', 19)}My university</h2><p class="muted">Optional. Helps the AI understand your papers. Nothing is downloaded from any university site.</p>
<label class="field"><span>University or college</span><input class="input" id="uni-name" value="${esc(me.name || '')}" placeholder="Type your university" autocomplete="off"></label>
<div class="row"><label class="field"><span>Program</span><input class="input" id="uni-prog" value="${esc(me.program || '')}" placeholder="e.g. B.Tech CSE" autocomplete="off"></label><label class="field"><span>Semester</span><input class="input" id="uni-sem" inputmode="numeric" value="${esc(me.semester || '')}" placeholder="e.g. 3" autocomplete="off"></label></div></section>
<section class="card"><h2 class="h2">End Sem past papers</h2><p class="muted">Add papers of one subject: PDFs, scanned PDFs or photos (read on this device with OCR), or a link you have access to. The AI reads them and builds an exam profile with the most repeated questions.</p>
<label class="field"><span>Subject</span><input class="input" id="pp-subject" value="${esc(lab.ppSubject || '')}" placeholder="e.g. Engineering Physics" autocomplete="off"></label>
<label class="btn outline file-btn">${icon('upload', 18)}<span>Add PDFs or photos</span><input type="file" data-paperpdf accept=".pdf,application/pdf,.jpg,.jpeg,.png,.webp,image/*" multiple></label>
<div class="composer"><input class="input" id="pp-url" type="url" placeholder="Or paste a link to a PDF" value="${esc(state.ppUrl || '')}" autocomplete="off"><button class="btn outline sm" data-action="ppAddUrl"${state.busy ? ' disabled' : ''}>${icon('download', 17)}Add</button></div>
${papersHTML(lab.papers)}${working}
${lab.papers.some(x => x.text && !x.scanned) ? `<button class="btn primary big block" data-action="ppAnalyse"${state.busy || !aiAvailable() ? ' disabled' : ''}>${icon('sparkles', 19)}Analyse and save End Sem profile</button>` : ''}
${aiAvailable() ? '' : `<p class="fine">Add an AI key or server in Settings first.</p>`}
${lab.repeated?.length ? `<h3 class="h3">Most repeated questions</h3><ol class="rep-list">${lab.repeated.map(r => `<li>${esc(r.question)} <span class="chip">×${r.times}</span></li>`).join('')}</ol>` : ''}
<p class="fine">Only add papers you are allowed to use.</p></section>`;
}
const papersActions = {
  async ppAddUrl() {
    const url = (document.getElementById('pp-url')?.value || '').trim();
    if (!/^https?:\/\/\S+$/i.test(url)) throw Error('Paste a full link starting with https://');
    const entry = { title: decodeURIComponent(url.split('/').pop().split('?')[0] || 'Paper').slice(0, 80), status: 'Downloading…', url };
    state.lab.papers.push(entry); state.ppUrl = ''; render();
    try { const { text, pages, figures = [] } = await pdfText(await getUrl(url, 'bytes', 90000), { name: entry.title, figures: true }); Object.assign(entry, paperFromText(entry.title, text, pages), { status: '', figures }); }
    catch (e) { Object.assign(entry, { status: '', error: /cancel/i.test(e.message) ? 'Scanning stopped.' : 'Could not download or read this link.' }); }
    render();
  },
  async ppAnalyse() {
    const papers = labPapersForAI(); if (!papers.length) return;
    const me = myUni(), subject = (state.lab.ppSubject || '').trim() || 'My subject', ai = requireAi('analyse the End Sem papers');
    if (!confirm(`Send the text of ${plural(papers.length, 'paper')} to ${aiName()} for analysis?`)) return;
    state.busy = 'analyse'; state.labStatus = 'Analysing End Sem papers…'; render();
    try {
      const ctx = [me.name, me.program, me.semester ? 'semester ' + me.semester : ''].filter(Boolean).join(', ');
      const obj = await analysePapers(papers, ai, `These are End Semester examination papers of one subject (${subject})${ctx ? ' from ' + ctx : ''}. Detect sections and marks from the papers.`);
      const p = profileFromAnalysis(obj, { id: 'papers-' + uuid().slice(0, 8), name: `End Sem · ${subject}`, kind: 'papers', papers: papers.length, sourceTitles: papers.map(x => x.title), measured: estimateDifficulty(papers.map(x => x.text)) });
      p.sources = state.lab.papers.filter(x => x.text && !x.scanned).map(x => ({ kind: 'user', title: x.title, url: x.url || null }));
      p.meta.repeated = mergeRepeated(mostRepeated(papers.map(x => x.text)), p.meta.repeated);
      { const f = labFigures(); if (f.length) p.meta.figures = f; }
      await saveProfileAndUse(p); state.lab.repeated = p.meta.repeated;
      state.notice = `“${p.name}” saved and chosen for your next practice test.`;
    } finally { state.busy = ''; }
    render();
  }
};
const examActions = {
  async analyseCustom() {
    const papers = labPapersForAI(); if (!papers.length) throw Error('Paste a question paper or add a PDF with text first.');
    const name = state.lab.name.trim() || 'My exam', ai = requireAi('analyse your papers');
    if (!confirm(`Send the text of ${plural(papers.length, 'paper')} to ${aiName()} for analysis?`)) return;
    state.busy = 'analyse'; state.labStatus = 'Smarty is analysing your papers…'; render();
    try {
      const obj = await analysePapers(papers, ai);
      const local = mostRepeated(papers.map(p => p.text));
      const p = profileFromAnalysis(obj, { id: 'custom-' + uuid().slice(0, 8), name, papers: papers.length, sourceTitles: papers.map(x => x.title), measured: estimateDifficulty(papers.map(x => x.text)) });
      p.meta.repeated = mergeRepeated(local, p.meta.repeated);
      { const f = labFigures(); if (f.length) p.meta.figures = f; }
      await saveProfileAndUse(p);
      state.lab = { name: '', pasted: '', papers: [], repeated: p.meta.repeated };
      state.notice = `“${p.name}” saved. Practice tests now follow it.`;
    } finally { state.busy = ''; }
    render();
  },
};
// Repeated questions found by text matching (exact counts) first, then the AI's extra finds.
function mergeRepeated(local = [], ai = []) {
  const out = [...local];
  for (const r of ai) if (!out.some(x => x.question.toLowerCase().slice(0, 40) === r.question.toLowerCase().slice(0, 40))) out.push(r);
  return out.sort((a, b) => b.times - a.times).slice(0, 15);
}

/* ---------- test ---------- */
function attemptRow(a) {
  return `<li><button class="attempt" data-attempt="${esc(a.id)}">${ringSVG(a.percent, 52, 6, 'small')}<span class="attempt-main"><span class="attempt-doc">${esc(attemptTitle(a))}</span><span class="attempt-date">${esc(fmtDateTime(a.submittedAt))}${a.provisional ? ' <span class="chip warn">Check marks</span>' : ''}</span></span><span class="attempt-marks">${a.earned}/${a.total}</span>${icon('chevR', 20)}</button></li>`;
}

function viewTestSetup(doc) {
  const info = contextInfo(doc), ready = aiAvailable();
  const warn = [info.total < 2000 ? 'This document looks short for 20 different questions. If no test can be made, import more material.' : '', info.truncated ? 'This is a long document, so a sample of text from every section is sent.' : ''].filter(Boolean);
  const mine = docAttempts(doc.id);
  return `${backHead('Practice Test', '', true)}<div class="view narrow">
<section class="test-intro"><span class="ask-icon big">${icon('test', 30)}</span><h2>Test yourself on</h2>${state.docs.length > 1 ? docPicker() : `<p class="test-doc">${esc(docTitle(doc))}</p>`}</section>
${examPickerHTML()}
<section class="card test-spec">${pickedProfile() ? '' : `<div class="spec"><div><b>${QUESTION_COUNT}</b><span>Questions</span></div><div><b>10</b><span>Multiple choice</span></div><div><b>10</b><span>Written</span></div><div><b>${esc(describeTiming(state.timing, setupTimingInfo()))}</b><span>Time</span></div></div>`}
<p class="muted">${pickedProfile() ? 'Objective answers are marked by the answer key with the exam’s negative and partial marking.' : 'Multiple-choice answers are marked by the answer key.'} Written answers get a first mark from the AI, and you can change any mark afterwards.</p>
${timingCardHTML()}
${ready ? `<div class="status ok">${icon('checkCircle', 20)}<p>Questions will be written by ${esc(aiName())}. Your document’s text is sent only after you confirm.</p></div>`
    : `<div class="status warn">${icon('info', 20)}<div><p>Add an AI key, or choose your own AI server, to write the questions.</p><button class="btn outline sm" data-view="settings">${icon('settings', 17)}Open AI settings</button></div></div>`}
${warn.map(w => `<div class="status warn">${icon('alert', 20)}<p>${w}</p></div>`).join('')}
${state.busy === 'generate' ? '<div class="working" role="status"><span class="spin"></span><div><b>Smarty is making your test…</b><p class="fine">This usually takes under a minute. An offline AI on a PC can take several minutes.</p></div></div>'
    : `<button class="btn primary big block" data-action="generate"${ready ? '' : ' disabled'}>${icon('sparkles', 20)}Generate test</button>`}
<p class="fine center">If your document can’t support the questions, no test is made rather than inventing content. Questions always come from your document; the exam only sets their style.</p></section>
${mine.length ? `<h2 class="section-h">Your tests on this document</h2><ul class="attempts">${mine.slice(0, 5).map(attemptRow).join('')}</ul>` : ''}
</div>`;
}

// Time limit chosen before a test starts (remembered for next time).
function setupTimingInfo() { const prof = pickedProfile(); if (prof) { try { const pk = pick(); return { paperMinutes: buildPlan(prof, pk.level, pk.size).minutes || 0 }; } catch { /* fall through */ } } return { paperMinutes: EXAM_MINUTES }; }
function timingCardHTML() {
  const t = state.timing, auto = autoMinutes({ paperMinutes: setupTimingInfo().paperMinutes });
  const opt = (mode, minutes, label) => { const on = t.mode === mode && (mode !== 'preset' || t.minutes === minutes); return `<button class="seg-btn${on ? ' is-on' : ''}" data-tmode="${mode}" data-tmin="${minutes}" aria-pressed="${on}">${label}</button>`; };
  return `<section class="card timing-card" aria-labelledby="tm-h"><h2 class="h2" id="tm-h">${icon('clock', 20)}Time limit</h2>
<div class="seg wrap" role="group" aria-label="Time limit">${opt('auto', 0, `Auto · ${auto} min`)}${opt('none', 0, 'No limit')}${PRESETS.filter(Boolean).map(m => opt('preset', m, m >= 60 ? `${m / 60} h` : `${m} min`)).join('')}${opt('custom', t.minutes, 'Custom')}</div>
${t.mode === 'custom' ? `<div class="field-row"><label class="field"><span>Hours</span><input class="input" type="number" min="0" max="10" id="tm-h-in" value="${Math.floor(t.minutes / 60)}"></label><label class="field"><span>Minutes</span><input class="input" type="number" min="0" max="59" id="tm-m-in" value="${t.minutes % 60}"></label></div>` : ''}
<p class="fine">${t.mode === 'auto' ? 'Auto uses the real paper’s duration, scaled to the number of questions and marks.' : t.mode === 'none' ? 'Untimed: the clock counts up and you can pause.' : 'Warnings at 10, 5 and 1 minute left. When time ends, the test is submitted.'}</p>
<label class="field"><span>Time per question (optional)</span><select class="input select" id="tm-perq">${[[0, 'Off'], [30, '30 s'], [60, '1 min'], [90, '1.5 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']].map(([v, l]) => `<option value="${v}"${t.perQ === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
<label class="toggle-row compact"><span><b>Practice mode</b><span>Lets you pause a timed test.</span></span><input type="checkbox" class="switch" id="tm-practice"${t.practice ? ' checked' : ''}></label></section>`;
}
const toast = (msg, kind = 'ok') => {
  if (isFreeLimit(msg)) { state.freeLimit = true; msg = 'You’ve used today’s free Prvlar AI messages. Add your own free Gemini key (takes a minute) to keep going, or come back tomorrow.'; kind = 'warn'; } if (kind === 'error') state.error = msg; else state.notice = msg; render(); };
const saveTiming = () => { state.timing = normalizeTiming(state.timing); writeJSON('prvlar-timing', state.timing); };
function timerRing() {
  const left = Math.max(0, timeLeft()), frac = examMinutes() ? Math.max(0, Math.min(1, left / (examMinutes() * 60000))) : 1;
  const r = 54, c = 2 * Math.PI * r;
  return `<div class="timer-ring" role="timer" aria-label="Time left"><svg viewBox="0 0 128 128" width="128" height="128" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B8CFF"/><stop offset="1" stop-color="#9C8CFF"/></linearGradient></defs>
<circle class="tr-track" cx="64" cy="64" r="${r}"/><circle class="tr-val" id="timer-arc" stroke="url(#tg)" cx="64" cy="64" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - frac)).toFixed(2)}"/></svg>
<div class="tr-text"><b id="timer-text">${fmtTime(examMinutes() ? left : timeLeft())}</b><span>${isPaused() ? 'Paused' : examMinutes() ? 'Time left' : 'Elapsed'}</span></div></div>`;
}

function viewExam() {
  const qs = state.questions, i = Math.min(state.qIndex, qs.length - 1), q = qs[i];
  const done = qs.filter(answered).length, flagged = state.flags.has(q.id), last = i === qs.length - 1;
  const a = state.answers[q.id];
  const body = q.type === 'mcq'
    ? `<div class="options" role="radiogroup" aria-label="Answer options">${q.options.map((o, j) => { const on = String(a) === String(j); return `<label class="option${on ? ' is-on' : ''}"><input type="radio" name="${esc(q.id)}" data-answer="${esc(q.id)}" value="${j}"${on ? ' checked' : ''}><span class="opt-letter" aria-hidden="true">${'ABCD'[j]}</span><span class="opt-text">${esc(o)}</span></label>`; }).join('')}</div>`
    : q.type === 'multi'
    ? `<p class="fine">Choose all correct options.</p><div class="options" role="group" aria-label="Answer options">${q.options.map((o, j) => { const on = Array.isArray(a) && a.includes(j); return `<label class="option multi${on ? ' is-on' : ''}"><input type="checkbox" data-multi="${esc(q.id)}" value="${j}"${on ? ' checked' : ''}><span class="opt-letter" aria-hidden="true">${'ABCD'[j]}</span><span class="opt-text">${esc(o)}</span></label>`; }).join('')}</div>`
    : q.type === 'numerical'
    ? `<label class="field num-answer"><span>Your answer${q.answerFormat === 'integer' ? ' (a whole number)' : ''}</span><input class="input" type="text" inputmode="decimal" autocomplete="off" data-answer="${esc(q.id)}" value="${esc(a ?? '')}" placeholder="${q.answerFormat === 'integer' ? 'e.g. 12' : 'e.g. 3.14'}"></label>`
    : `<textarea class="input written" rows="7" data-answer="${esc(q.id)}" aria-label="Your answer to question ${i + 1}" placeholder="Write your answer…">${esc(a || '')}</textarea><span class="fine wc" data-wc="${esc(q.id)}">${wordCount(a)}</span>`;
  const meta = `<span class="chip">${TYPE_LABEL[q.type] || 'Question'}</span><span class="chip">${plural(q.marks, 'mark')}</span>${q.negative ? `<span class="chip warn">${neg(q.negative)} if wrong</span>` : ''}${q.type === 'multi' && q.partial === 'jee-advanced' ? '<span class="chip">Partial marks</span>' : ''}${q.difficulty ? `<span class="chip diff-${q.difficulty}">${q.difficulty}</span>` : ''}`;
  return `${backHead('Practice Test', `<button class="icon-btn" data-action="openGrid" aria-label="All questions" title="All questions">${icon('more', 21)}</button>`, true)}<div class="view narrow exam">
<div class="exam-top">${timerRing()}${canPause(state.examMeta?.timing) ? `<button class="btn outline sm" data-action="testPause">${icon(isPaused() ? 'play' : 'pause', 16)}${isPaused() ? 'Resume' : 'Pause'}</button>` : ''}<button class="qcount" data-action="openGrid" aria-label="Question ${i + 1} of ${qs.length}. Show all questions"><b>Q ${i + 1}</b>/${qs.length}</button></div>
<div class="qbar" aria-hidden="true"><span id="qbar-fill" style="width:${pct(done, qs.length)}%"></span></div>
<p class="fine center" id="answered-count">${done} of ${qs.length} answered</p>
${state.examMeta?.profileId ? `<p class="exam-badge">${icon('trophy', 15)}${esc(state.examMeta.profileName)} · ${esc(state.examMeta.levelName || '')}${q.section ? ` · ${esc(q.section)}` : ''}</p>` : ''}<article class="question" id="question"><div class="q-meta">${meta}</div>
<h2 class="q-text">${esc(q.prompt)}</h2>${figureHTML(q)}${body}</article>
<div class="exam-actions"><button class="icon-btn square" data-action="prevQ" aria-label="Previous question"${i === 0 ? ' disabled' : ''}>${icon('chevL', 22)}</button>
<button class="icon-btn square flag${flagged ? ' is-on' : ''}" data-flag="${esc(q.id)}" aria-pressed="${flagged}" aria-label="Flag for review">${icon('bookmark', 21)}</button>
<button class="btn primary big grow" data-action="${last ? 'openGrid' : 'nextQ'}"${state.busy ? ' disabled' : ''}>${state.busy === 'submit' ? '<span class="spin"></span>Smarty is marking…' : last ? `Review and submit${icon('next', 19)}` : `Next Question${icon('next', 19)}`}</button></div>
</div>`;
}
const wordCount = t => { const n = String(t || '').trim().split(/\s+/).filter(Boolean).length; return plural(n, 'word'); };

function gridSheetHTML() {
  const qs = state.questions, done = qs.filter(answered).length;
  return `<div class="sheet-backdrop" data-action="closeGrid"></div><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="grid-h">
<div class="sheet-head"><h2 id="grid-h">Questions</h2><button class="icon-btn" data-action="closeGrid" aria-label="Close">${icon('x', 20)}</button></div>
<p class="muted">${done} of ${qs.length} answered${state.flags.size ? `, ${state.flags.size} flagged` : ''}. Tap a number to go there.</p>
<div class="qgrid">${qs.map((q, i) => `<button class="qdot${answered(q) ? ' is-done' : ''}${state.flags.has(q.id) ? ' is-flag' : ''}${i === state.qIndex ? ' is-here' : ''}" data-q="${i}" aria-label="Question ${i + 1}${answered(q) ? ', answered' : ''}${state.flags.has(q.id) ? ', flagged' : ''}">${i + 1}</button>`).join('')}</div>
<ul class="qlegend"><li><span class="qdot is-done"></span>Answered</li><li><span class="qdot is-flag"></span>Flagged</li><li><span class="qdot"></span>Not answered</li></ul>
<button class="btn primary big block" data-action="submit"${state.busy ? ' disabled' : ''}>${state.busy === 'submit' ? '<span class="spin"></span>Smarty is marking…' : `${icon('check', 20)}Submit test`}</button>
<p class="fine center">Unanswered questions score zero.</p></section>`;
}

function ringSVG(p, size = 168, stroke = 14, extra = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, band = p >= 70 ? 'good' : p >= 40 ? 'mid' : 'low';
  return `<svg class="ring ${band} ${extra}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p} percent"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/><circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(2)}"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">${p}%</text></svg>`;
}
const METHOD = { 'answer key': 'Answer key', 'AI provisional': 'AI, first opinion', 'manual review': 'You', 'self assessment pending': 'Needs your mark' };

function viewResult(a) {
  const doc = state.docs.find(d => d.id === a.documentId) || null;
  const topics = topicPerformance(a, doc), sum = resultSummary(a);
  const verdict = a.percent >= 70 ? ['Great work!', 'good', 'checkCircle'] : a.percent >= 40 ? ['Good effort', 'mid', 'target'] : ['Keep practising', 'low', 'bulb'];
  const grades = new Map(a.grades.map(g => [g.id, g]));
  const review = state.showReview ? `<h2 class="section-h" id="review">Answers and solutions</h2><ol class="review-list">${a.questions.map((q, i) => {
    const g = grades.get(q.id), got = g?.awarded ?? 0, cls = got >= q.marks ? 'is-right' : got > 0 ? 'is-part' : 'is-wrong';
    const ans = a.answers[q.id], has = ans !== undefined && String(ans).trim() !== '';
    const yours = answerText(q, ans);
    return `<li class="rq ${cls}"><div class="rq-head"><h3>${i + 1}. ${esc(q.prompt)}</h3><span class="marks">${got < 0 ? '−' + Math.abs(got) : got}/${q.marks}</span></div>${a.timing?.qTimes?.[q.id] ? `<p class="fine q-time">${icon('clock', 13)} ${fmtDuration(a.timing.qTimes[q.id])} on this question</p>` : ''}${figureHTML(q)}
<dl><dt>Your answer</dt><dd>${esc(yours)}</dd>${q.type !== 'written' ? `<dt>Correct</dt><dd>${esc(correctText(q))}</dd>` : ''}<dt>Marked by</dt><dd>${esc(METHOD[g?.method] || g?.method || '')}</dd>${g?.feedback ? `<dt>Feedback</dt><dd>${esc(g.feedback)}</dd>` : ''}</dl>
<details><summary>${icon('smarty', 15)} Smarty explains: answer and source</summary><div class="solution"><p>${esc(q.solution)}</p><p><b>From:</b> ${esc(q.source)}${q.sourceVerified === false ? ' (this label wasn’t found in your document, so check it)' : ''}</p>${q.type === 'written' ? `<p><b>Marking points:</b> ${esc(q.rubric)}</p>` : ''}</div></details>
${q.type === 'written' ? `<label class="adjust">Your mark out of ${q.marks}<input class="input" type="number" inputmode="numeric" min="0" max="${q.marks}" step="1" data-adjust="${esc(q.id)}" value="${got}"></label>` : ''}</li>`;
  }).join('')}</ol>${a.questions.some(q => q.type === 'written') ? `<button class="btn primary block" data-action="adjust">${icon('check', 18)}Save marks</button>` : ''}` : '';
  return `${backHead(state.review ? 'Past result' : 'Test Complete', `<button class="icon-btn" data-action="shareResult" aria-label="Share result" title="Share">${icon('share', 20)}</button>`, true)}<div class="view narrow result">
<section class="score">${ringSVG(a.percent)}<span class="verdict ${verdict[1]}">${icon(verdict[2], 18)}${verdict[0]}</span>
<p class="muted center">${esc(attemptTitle(a))}<br>${esc(fmtDateTime(a.submittedAt))}</p></section>
<section class="stats3"><div class="stat"><b>${sum.questions}</b><span>Questions</span></div><div class="stat good"><b>${sum.correct}</b><span>Correct</span></div><div class="stat"><b>${a.timing ? fmtDuration(a.timing.activeMs) : fmtTime(sum.ms)}</b><span>Time taken${a.timing?.limitMin ? ` of ${a.timing.limitMin} min` : a.timing ? ' (no limit)' : ''}</span></div></section>
${a.exam ? `<div class="status ok">${icon('trophy', 20)}<p>${esc(a.exam.profileName)} style · ${esc(a.exam.levelName || '')}. Marks ${a.earned}/${a.total}${a.grades.some(g => g.awarded < 0) ? `, including ${a.grades.filter(g => g.awarded < 0).reduce((x, g) => x + g.awarded, 0).toFixed(2).replace(/\.?0+$/, '')} for wrong answers` : ''}.</p></div>` : ''}
${a.provisional ? `<div class="status warn">${icon('info', 20)}<p>Written answers have an AI first opinion. Check them under Review answers and change any mark.</p></div>` : ''}
<section class="card topics"><h2>Topic performance</h2><ul>${topics.map(t => `<li><div class="topic-row"><span>${esc(t.topic)}</span><b>${t.percent}%</b></div><span class="tbar ${t.percent >= 70 ? 'good' : t.percent >= 50 ? 'mid' : 'low'}"><span style="width:${Math.max(t.percent, 2)}%"></span></span></li>`).join('')}</ul></section>
<div class="result-actions"><button class="btn outline big" data-action="toggleReview">${state.showReview ? 'Hide answers' : 'Review answers'}</button><button class="btn primary big" data-action="newTest"${doc ? '' : ' disabled'}>Generate new test</button></div>
${review}</div>`;
}

/* ---------- more, results, notes, chat, settings ---------- */
// Group hubs (Practice, Plan, More): one list of everything in the group, with live counts.
const hubSub = v => ({ errors: `${plural(openErrors().length, 'question')} to retry`, results: `${plural(state.attempts.length, 'test')} so far`, cards: `${plural(dueCount(), 'card')} to review`,
  focus: state.focusRun.phase !== 'idle' ? `${PHASES[state.focusRun.phase]} · ${state.focusRun.running ? 'running' : 'paused'}` : null, progress: `Level ${progressStats().lvl.level} · ${plural(progressStats().current, 'day')} streak`,
  settings: aiAvailable() ? `AI: ${aiName()}` : 'Set up the AI helper' })[v];
const navAttr = v => v.includes(':') ? `data-go="${esc(v)}"` : `data-view="${esc(v)}"`;
const hubList = links => `<ul class="list card hub-list">${links.filter(([v]) => (v !== 'dev' || canDo('dev')) && (v !== 'beta' || canDo('beta'))).map(([v, ic, label, sub]) => `<li><button class="list-row" ${navAttr(v)}><span class="feature-icon f-blue">${icon(ic, 21)}</span><span class="lr-text"><b>${esc(label)}</b><span>${esc(hubSub(v) || sub)}</span></span>${icon('chevR', 20)}</button></li>`).join('')}</ul>`;
function viewHub(tab) {
  const g = GROUPS.find(x => x.tab === tab), primary = tab === 'practice' ? `<button class="btn primary big block" data-view="test">${icon('test', 19)}Start a practice test</button>` : tab === 'plan' ? `<button class="btn primary big block" data-view="planner">${icon('plus', 19)}Add an exam or to-do</button>` : '';
  const weak = tab === 'practice' ? weakCard() : tab === 'plan' ? todayCard() : '';
  return `${brandHead()}<div class="view narrow hub"><h1 class="title page-title">${esc(g.label)}</h1>${primary}${weak}${hubList(g.links)}</div>`;
}
// Smarty's weak topics, shown on Home and Practice (hidden until there is data).
function weakCard() {
  const w = tutorWeak(state.learner || emptyProfile(), 3);
  if (!w.length) return '';
  return `<section class="card weak-card"><div class="card-head"><h2 class="h2">${icon('target', 18)} Weak topics</h2><button class="link-btn" data-go="smarty:profile">See all</button></div><ul class="sm-topics">${w.map(masteryBar).join('')}</ul><button class="btn outline sm" data-go="smarty:practice">${icon('sparkles', 16)}Practise these</button></section>`;
}
function viewMore() {
  const g = GROUPS.find(x => x.tab === 'more');
  return `${brandHead()}<div class="view narrow hub"><h1 class="title page-title">More</h1>${hubList(g.links)}<p class="fine center">Prvlar ${esc(VERSION)} · Made by Vansh Bahamanwa and Anirudh Behre (B.Tech CSE, UPES)</p></div>`;
}

function viewResults() {
  const list = state.attempts;
  const avg = list.length ? Math.round(list.reduce((s, a) => s + a.percent, 0) / list.length) : 0, best = list.length ? Math.max(...list.map(a => a.percent)) : 0;
  return `${backHead('Results')}<div class="view narrow">${list.length ? `<section class="stats3"><div class="stat"><b>${list.length}</b><span>${list.length === 1 ? 'Test' : 'Tests'}</span></div><div class="stat"><b>${avg}%</b><span>Average</span></div><div class="stat good"><b>${best}%</b><span>Best</span></div></section>` : ''}
${list.length ? `<ul class="attempts">${list.map(attemptRow).join('')}</ul>` : `<div class="empty card">${icon('trophy', 34)}<h2>No tests yet</h2><p>Your scores and the model answers are kept here, even if you later delete the document.</p><button class="btn primary" data-view="test">${icon('test', 18)}Take a test</button></div>`}</div>`;
}

function viewNotes() {
  const groups = state.docs.map(d => ({ d, items: [{ id: 'root', title: 'Notes about the whole document' }, ...outline(d).filter(n => n.id !== 'root')].filter(n => (state.notes[noteKey(n.id, d.id)] || '').trim()) })).filter(g => g.items.length);
  return `${backHead('Notes')}<div class="view narrow"><p class="muted page-sub">Everything you’ve written, grouped by document.</p>
${groups.length ? groups.map(g => `<h2 class="section-h">${esc(docTitle(g.d))}</h2><ul class="results-list">${g.items.map(n => `<li><button class="result-row" data-docnode="${esc(g.d.id)}:${esc(n.id)}" data-tab="notes"><span class="result-title">${esc(n.title)}</span><span class="result-snip">${esc(String(state.notes[noteKey(n.id, g.d.id)]).slice(0, 240))}</span></button></li>`).join('')}</ul>`).join('')
    : `<div class="empty card">${icon('sticky', 34)}<h2>No notes yet</h2><p>Open a section and write in its Notes tab. Your notes save as you type.</p>${current() ? `<button class="btn primary" data-view="study">${icon('map', 18)}Open the study map</button>` : ''}</div>`}</div>`;
}

function viewChat(doc) {
  const thread = state.chats[doc.id] || [];
  if (!(doc.id in state.chats)) { state.chats[doc.id] = []; getSetting('chat::' + doc.id).then(v => { if (Array.isArray(v) && v.length) { state.chats[doc.id] = v; if (state.view === 'chat') render(); } }).catch(() => {}); }
  const prompts = [['Summarize this document', 'outline'], ['Make a revision checklist', 'checkCircle'], ['Which topics matter most?', 'target'], ['Quiz me with 3 questions', 'test']];
  return `${backHead('AI Chat', thread.length ? `<button class="icon-btn" data-action="clearChat" aria-label="Clear conversation" title="Clear conversation">${icon('trash', 19)}</button>` : '')}<div class="view narrow chat">
${state.docs.length > 1 ? docPicker() : `<p class="muted page-sub">About ${esc(docTitle(doc))}</p>`}
<section class="card chat-card">${thread.length ? `<div class="thread">${thread.map((m, i) => `<div class="msg ${m.role}">${m.role === 'user' ? esc(m.text) : fmtAnswer(m.text, doc)}${msgExtras(m, 'chat', i)}</div>`).join('')}${state.busy === 'chat' ? '<div class="msg ai typing"><span></span><span></span><span></span></div>' : ''}</div>`
    : `<div class="chat-empty"><span class="ask-icon big">${icon('brain', 30)}</span><h2>Ask anything about this document</h2><p class="muted">Answers come from your document first, with the section they used. Diagrams and formulas are drawn for you.</p></div>`}
${!aiAvailable() ? keyHelpHTML() : `
${thread.length ? '' : `<div class="prompts">${prompts.map(([p, ic]) => `<button class="prompt" data-prompt="${esc(p)}" data-scope="chat"${state.busy ? ' disabled' : ''}>${icon(ic, 18)}<span>${p}</span></button>`).join('')}</div>`}
<div class="composer"><textarea class="input" id="chatq" rows="2" placeholder="Type your question…" aria-label="Your question">${esc(state.chatDraft || '')}</textarea><button class="send" data-action="chatSend" aria-label="Send"${state.busy ? ' disabled' : ''}>${state.busy === 'chat' ? '<span class="spin"></span>' : icon('send', 19)}</button></div>
${docsOnlyToggle()}<p class="fine">Uses ${esc(aiName())}. Text from this document is sent.</p>`}</section></div>`;
}

const FB_NAME = { gemini: 'Google Gemini', groq: 'Groq', custom: 'Custom endpoint' };
function fallbackHTML() {
  const f = state.fb;
  return `<details class="fb-box"${f.on ? ' open' : ''}><summary><b>Backup services (fallback)</b></summary>
<label class="toggle-row"><span><b>If a service fails, try the next one</b><span>Used when a service can’t be reached, rejects the key or hits its limit.</span></span><input type="checkbox" id="fb-on"${f.on ? ' checked' : ''}><span class="switch${f.on ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>
<ol class="fb-order">${f.order.map((id, i) => `<li><span>${i + 1}. ${FB_NAME[id]}</span>${i ? `<button class="icon-btn soft" data-fbup="${i}" aria-label="Move ${FB_NAME[id]} up">↑</button>` : ''}</li>`).join('')}</ol>
<label class="field"><span>Gemini key (backup)${packMark(f.gemini)}</span><input class="input" id="fb-gemini" type="password" value="${esc(f.gemini)}" placeholder="AIza…" autocomplete="off"></label>
<label class="field"><span>Groq key (backup)${packMark(f.groq)}</span><input class="input" id="fb-groq" type="password" value="${esc(f.groq)}" placeholder="gsk_…" autocomplete="off"></label>
<label class="field"><span>Custom endpoint (OpenAI-compatible)${packMark(f.url)}</span><input class="input" id="fb-url" ${PACK_KEYS.has(f.url) ? 'type="password" ' : ''}value="${esc(f.url)}" placeholder="http://192.168.1.20:3001/v1" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
<div class="row"><label class="field"><span>Endpoint key (optional)</span><input class="input" id="fb-key" type="password" value="${esc(f.key)}" autocomplete="off"></label><label class="field"><span>Model</span><input class="input" id="fb-model" value="${esc(f.model)}" placeholder="auto" autocomplete="off" autocapitalize="off"></label></div>
<p class="fine">Plain http:// works only for this device and your local network; use https:// for internet addresses.${ED.serverNote}</p></details>`;
}
const SERVER_HELP = {
  litertlm: 'Runs Google’s Gemma model on your own PC, offline and free, so no key is needed. On the PC run <code>litert-lm serve --host 0.0.0.0</code> (see the README). Use <code>gpu</code> instead of <code>cpu</code> in the model if your PC has a supported graphics card.',
  omniroute: 'Start OmniRoute and connect your free provider keys in its dashboard. Paste the server’s own API key below. Avoid routing paid subscriptions through it.',
  custom: 'Any server that speaks the OpenAI chat-completions format (/v1/chat/completions) works, on your PC or your network. Add its key if it needs one, then tap Fetch models or keep “auto”.'
};
function viewSettings() {
  const server = usingServer(), p = preset();
  const opts = [['cloud', 'Gemini or Groq key (free), or OpenAI'], ...Object.entries(SERVER_PRESETS).map(([k, v]) => [k, v.label + (SELF_HOSTED.includes(k) ? ' (self-hosted)' : '')])];
  const port = (p.url.match(/:(\d+)\//) || [, '3001'])[1];
  const sub = server ? `Connect to your ${SERVER_PRESETS[state.ai.mode]?.brand ? SERVER_PRESETS[state.ai.mode].brand : state.ai.mode === 'omniroute' ? 'OmniRoute' : state.ai.mode === 'litertlm' ? 'LiteRT-LM (Gemma)' : 'AI'} service` : 'Connect a free Gemini or Groq key, or OpenAI';
  const conn = state.conn ? `<div class="conn-box ${state.conn.ok ? 'ok' : 'err'}" role="status">${icon(state.conn.ok ? 'checkCircle' : 'alert', 22)}<div><b>${state.conn.ok ? 'Connected' : 'Not connected'}</b><span>${esc(state.conn.text)}</span></div></div>` : '';
  const theme = [['system', 'Device', 'Follows your phone'], ['light', 'Light', 'Bright and clear'], ['dark', 'Dark', 'Navy, easy at night'], ['aesthetic', 'Aesthetic', 'Soft pastels'], ['anime', 'Anime', 'Pink, purple and cyan'], ['glass', 'Glass', 'Frosted glass'], ['oldmoney', 'Old Money', 'Navy, ivory and gold'], ['vintage', 'Vintage', 'Stickers and paper'], ['royal', 'Royal', 'Maroon and gold'], ['royal-ivory', 'Royal Ivory', 'Ivory and gold, for daytime']];
  const rd = state.reading;
  const where = isNative() ? (platform() === 'ios' ? 'iPhone or iPad' : 'Android phone or tablet') : isElectron() ? 'Windows PC' : 'browser';
  return `${backHead('Settings')}<div class="view narrow settings">
${themeProfile()}
<nav class="set-jump" aria-label="Settings sections">${[['acct-h', 'Account'], ['prof-h', 'Profile'], ['look-h', 'Appearance'], ['ai-h', 'Smarty’s brain'], ['studyset-h', 'Study'], ['notif-h', 'Notifications'], ['data-h', 'Data'], ['legal-h', 'About']].map(([id, l]) => `<a href="#settings" data-go="settings:${id}">${l}</a>`).join('')}</nav>
${accountHTML()}
<section class="card" aria-labelledby="prof-h"><h2 class="h2" id="prof-h">Profile</h2><label class="field"><span>Your name (for the greeting)</span><input class="input" id="set-name" value="${esc(userName())}" placeholder="Optional" maxlength="40" autocomplete="nickname"></label><label class="field"><span>What you study</span><select class="input select" id="set-stream"><option value="">Not set</option>${STREAMS.map(([v, l]) => `<option value="${v}"${userStream() === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label><h3 class="h3">App text size</h3>${uiSizeSeg()}</section>
<section class="card" aria-labelledby="look-h"><h2 class="h2" id="look-h">Appearance</h2><div class="theme-grid" role="radiogroup" aria-labelledby="look-h">${theme.map(([v, l, sub]) => `<button class="theme-opt${state.theme === v ? ' is-on' : ''}" role="radio" aria-checked="${state.theme === v}" data-theme-set="${v}"><span class="theme-swatch sw-${v}" aria-hidden="true"><i></i><i></i><i></i></span><b>${l}</b><span>${sub}</span></button>`).join('')}</div>
${state.theme === 'glass' ? `<h3 class="h3">Glass background</h3><div class="row"><button class="btn outline sm${!state.glassBg ? ' is-on' : ''}" data-action="glassDefault">Default photo</button><label class="btn outline sm file-btn${state.glassBg && state.glassBg !== 'none' ? ' is-on' : ''}">${icon('upload', 16)}<span>Choose your own</span><input type="file" data-glassbg accept="image/*"></label><button class="btn outline sm${state.glassBg === 'none' ? ' is-on' : ''}" data-action="glassNone">No photo</button></div><p class="fine">Your picture stays on this device.</p>` : ''}
<h3 class="h3" id="fs-h">Reading text size</h3><div class="size-row"><button class="icon-btn soft" data-font="-1" aria-label="Smaller text"${rd.size <= 0.8 ? ' disabled' : ''}>${icon('type', 16)}</button><input type="range" min="0.8" max="1.6" step="0.1" id="font-size" value="${rd.size}" aria-labelledby="fs-h"><button class="icon-btn soft" data-font="1" aria-label="Larger text"${rd.size >= 1.6 ? ' disabled' : ''}>${icon('type', 22)}</button><b class="size-val">${Math.round(rd.size * 100)}%</b></div>
<p class="reading size-preview">Sections, flashcards and test questions use this size.</p>
${speechSupported() ? `<label class="field"><span>Read-aloud speed</span><select class="input select" id="tts-rate">${[[0.75, 'Slow'], [1, 'Normal'], [1.25, 'Fast'], [1.5, 'Faster']].map(([v, l]) => `<option value="${v}"${rd.rate === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}</section>
${keyHelpHTML()}<section class="card ai-card" aria-labelledby="ai-h"><div class="ai-card-head"><span class="ai-tile">${icon('settings', 24)}</span><div><h1 id="ai-h">AI Settings</h1><p>${sub}</p></div></div>
<label class="field"><span>Service</span><select class="input select" id="aimode">${opts.map(([v, l]) => `<option value="${v}"${state.ai.mode === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
${server ? `<label class="field"><span>API endpoint</span><input class="input" id="aiurl" value="${esc(state.ai.url)}" placeholder="${esc(p.url || 'https://your-server.com/v1')}" autocomplete="off" autocapitalize="off" inputmode="url" spellcheck="false"></label>` : ''}
<label class="field"><span>API key${state.ai.mode === 'litertlm' ? ' (leave empty)' : server ? ' (if your server needs one)' : ''}${packMark(state.key)}</span><div class="input-wrap"><input class="input" id="apikey" type="${state.showKey && !PACK_KEYS.has(state.key) ? 'text' : 'password'}" value="${esc(state.key)}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${server ? 'Optional' : 'Paste your key'}"><button class="eye" data-action="toggleKey" aria-label="${state.showKey ? 'Hide key' : 'Show key'}">${icon(state.showKey ? 'eyeOff' : 'eye', 20)}</button></div></label>
${!server ? `<p class="detected" id="detected"${state.key.trim() ? '' : ' hidden'}>${state.key.trim() ? `${icon('checkCircle', 16)}Detected: ${esc(providerFor(state.key).name)}` : ''}</p>` : ''}
${server ? `<label class="field"><span>Model</span><div class="composer"><input class="input" id="aimodel" list="aimodels" value="${esc(state.ai.model)}" placeholder="${esc(p.model || 'auto')}" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn outline sm" data-action="fetchModels"${state.busy ? ' disabled' : ''}>${state.busy === 'models' ? '<span class="spin"></span>' : icon('download', 16)}Fetch models</button></div><datalist id="aimodels"><option value="auto">${(state.models || []).map(m => `<option value="${esc(m)}">`).join('')}</datalist></label>${state.models ? `<p class="fine">${plural(state.models.length, 'model')} found. Pick one or keep “auto”.</p>` : ''}
<label class="toggle-row"><span><b>Model can see images</b><span>Sends question figures as pictures (vision models only).</span></span><input type="checkbox" id="aivision"${state.ai.vision ? ' checked' : ''}><span class="switch${state.ai.vision ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>` : ''}
<label class="toggle-row"><span><b>Remember the key on this device</b><span>Saved only in this app’s storage on this device.</span></span><input type="checkbox" id="remember"${state.remember ? ' checked' : ''}><span class="switch${state.remember ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>
<div class="conn-row"><span class="conn-label">${icon('plug', 20)}Test connection</span><button class="btn primary sm" data-action="testConn"${state.busy ? ' disabled' : ''}>${state.busy === 'conn' ? '<span class="spin"></span>Testing' : 'Test'}</button></div>
${conn}
<div class="help">${server ? `<p>${SERVER_HELP[state.ai.mode] || SERVER_HELP.custom}</p><p>Server on this device: keep <code>localhost</code>. On another computer: use its Wi-Fi address, for example <code>http://192.168.1.20:${port}/v1</code>.</p>`
    : '<p>Free keys: <b>Google Gemini</b> from aistudio.google.com/apikey (starts with AIza) or <b>Groq</b> from console.groq.com/keys (starts with gsk_). Paid: <b>OpenAI</b> (starts with sk-).</p><p>Free tiers may use what you send to improve their models, so avoid confidential documents on a free key.</p>'}</div>
${fallbackHTML()}
<p class="fine with-icon">${icon('lock', 15)}${state.remember ? 'Your key stays on this device and is sent only to the AI service you chose.' : 'Your key is forgotten when you close the app.'}</p></section>
<section class="card" aria-labelledby="runner-h"><h2 class="h2" id="runner-h">Code runner (optional)</h2><p class="fine">Smarty Code runs JavaScript and Python on this device. For C, C++ and Java you can add your own Judge0-compatible runner; your code is sent to it. Without one, Smarty does a clearly labelled simulated dry run.</p><label class="field"><span>Runner URL</span><input class="input" id="runner-url" type="url" inputmode="url" placeholder="https://your-runner.example.com" value="${esc(runnerCfg().url)}"></label><label class="field"><span>Key (optional)</span><input class="input" id="runner-key" type="password" autocomplete="off" value="${esc(runnerCfg().key)}"></label></section>
<section class="card" aria-labelledby="studyset-h"><h2 class="h2" id="studyset-h">Study</h2>
<label class="toggle-row"><span><b>Make flashcards from wrong answers</b><span>After each test, questions you got wrong become flashcards.</span></span><input type="checkbox" id="autocards"${autoCards() ? ' checked' : ''}><span class="switch${autoCards() ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label></section>
<section class="card" aria-labelledby="notif-h"><h2 class="h2" id="notif-h">Notifications</h2><p class="muted">${state.notifPerm === 'granted' ? 'Notifications are on.' : 'Allow notifications to get reminders and focus-timer alerts.'}</p><div class="row"><button class="btn outline" data-view="planner">${icon('bell', 18)}Reminders and goals</button><button class="btn outline" data-view="focus">${icon('timer', 18)}Focus timer alerts</button></div></section>
<section class="card" aria-labelledby="data-h"><h2 class="h2" id="data-h">Data and backup</h2><p class="muted">Documents, notes, flashcards, planner, study time, progress and results are stored only on this device${state.storage ? ` (${fmtBytes(state.storage.used)} used)` : ''}. Uninstalling the app or clearing its data deletes them, so back up now and then.</p>
<div class="row"><button class="btn outline" data-action="exportBackup">${icon('download', 18)}Back up</button><label class="btn outline file-btn">${icon('upload', 18)}<span>Restore</span><input type="file" data-restore accept=".json,application/json" aria-label="Restore a backup"></label></div></section>
<section class="card about"><span class="about-logo">${logo()}</span><div><b>Prvlar ${esc(VERSION)}</b><p class="fine">Running on this ${where}. Works on Android 6 or later, iPhone and iPad with iOS 14 or later, Windows, and current browsers.</p><button class="link-btn" data-view="about">${icon('info', 16)}About us and suggestions</button></div></section>
<section class="card" aria-labelledby="legal-h"><h2 class="h2" id="legal-h">About and legal</h2><div class="row"><button class="btn outline sm" data-view="about">About us</button><button class="btn outline sm" data-view="privacy">Privacy policy</button><button class="btn outline sm" data-view="terms">Terms</button><button class="btn outline sm" data-view="licenses">Licences</button></div></section>
</div>`;
}

// Privacy policy and terms, written for the publishable edition (true for both).
function viewPrivacy() {
  return `${backHead('Privacy policy')}<div class="view narrow legal"><section class="card">${privacyHTML({ version: VERSION, updateCheck: !!UPDATE_REPO })}</section></div>`;
}
function viewTerms() {
  return `${backHead('Terms and disclaimer')}<div class="view narrow legal"><section class="card">${termsHTML()}</section></div>`;
}
// About us: the team, what the app does, privacy, version/updates, credits and how to send a suggestion.
// Contact details are only shown for people who chose to share them.
let TEAM = [{ name: 'Prvlar team', role: 'Developers', course: 'Made for students of every age', tone: 'a' }];
const PUBLIC_TEAM = TEAM;
const FEATURES = [
  ['map', 'Study map', 'Import notes, textbooks or papers and get a map of every topic and section.'],
  ['bulb', 'AI tutor, your own key', 'Simple explanations and answers from the AI provider you pick, using your key.'],
  ['cards', 'Flashcards that space themselves', 'Spaced repetition brings each card back just before you forget it.'],
  ['test', 'Exam-pattern tests', 'Practice in the style of JEE, NEET, GATE, UPSC, CAT and CBSE, plus End Sem prep from your own past papers' + ED.aboutTest + '.'],
  ['timer', 'Planner and focus timer', 'Goals, reminders and Pomodoro sessions.'],
  ['trend', 'Progress and streaks', 'See what you have mastered and keep your study streak going.'],
  ['sun', 'Seven themes', 'Light, Dark, Aesthetic, Glass, Anime, Old Money and Vintage, or follow your device.'],
  ['refresh', 'Update checker', 'Finds new versions and installs them over the app, keeping your data.']
];
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
function teamCardHTML(m) {
  return `<li class="team-card"><span class="dev-avatar tone-${m.tone}" aria-hidden="true">${esc(initials(m.name))}</span><div class="team-text"><b class="team-name">${esc(m.name)}</b><span class="team-role">${esc(m.role)}</span>
<span class="team-facts">${[m.course, m.batch].filter(Boolean).map(f => `<span>${esc(f)}</span>`).join('')}</span></div></li>`;
}
function viewAbout() {
  const d = TEAM[0], msg = encodeURIComponent(`Hi ${d.name}, I have a suggestion for Prvlar: `);
  return `${backHead('About us')}<div class="view narrow about-view">
<section class="card about-hero"><span class="about-logo">${logo()}</span><div><h1 class="dev-name">Prvlar</h1><p class="dev-role">Version ${esc(VERSION)}</p><p class="dev-credit">Made by Vansh Bahamanwa and Anirudh Behre (B.Tech CSE, UPES)</p><p class="dev-credit beta">Beta testers: Ashish Arora</p></div></section>
<section class="card" aria-labelledby="ab-what"><h2 class="h2" id="ab-what">About Prvlar</h2>
<p class="dev-note name-note">Prvlar is named after five siblings of the Bahamanwa family.</p>
<p class="dev-note">Prvlar turns your own documents into a study map. Learn one section at a time with simple explanations, then test yourself until it sticks. It is built by students${ED.who}, for students.</p></section>
<section class="card" aria-labelledby="ab-team"><h2 class="h2" id="ab-team">The team</h2><ul class="team-list">${TEAM.map(teamCardHTML).join('')}</ul></section>
<section class="card" aria-labelledby="ab-feat"><h2 class="h2" id="ab-feat">What you can do</h2><ul class="feat-list">${FEATURES.map(([ic, t, s]) => `<li><span class="feat-ic">${icon(ic, 19)}</span><span><b>${esc(t)}</b><span>${esc(s)}</span></span></li>`).join('')}</ul></section>
<section class="card" aria-labelledby="ab-priv"><h2 class="h2 with-icon" id="ab-priv">${icon('lock', 19)}Privacy</h2>
<ul class="priv-list"><li>Your documents, notes, flashcards, plans and results are stored only on this device.</li>
<li>AI requests go only to the AI provider or server you choose, using your own key.</li>
<li>No accounts, no ads, no analytics or tracking.</li>
<li>The only other connection is the update check to GitHub, which you can turn off below.</li></ul></section>
${updateCardHTML()}
<section class="card" aria-labelledby="ab-say"><h2 class="h2" id="ab-say">Suggestions</h2>
${d.whatsapp ? `<p class="dev-note">Have an idea or found a bug? Leave ${esc(d.name)} a WhatsApp message at <b>${esc(d.shown)}</b>.</p>
<a class="btn big block wa-btn" href="https://wa.me/${d.whatsapp}?text=${msg}" target="_blank" rel="noopener">${icon('chat', 20)}Message on WhatsApp</a>` : '<p class="dev-note">Have an idea or found a bug? Send feedback through the store page where you got the app.</p>'}</section>
<section class="card" aria-labelledby="ab-cred"><h2 class="h2" id="ab-cred">Credits</h2><p class="fine">Icons by Lucide (ISC) and the Inter and Urbanist typefaces (SIL Open Font License), plus other open-source libraries. Smarty’s design is inspired by <a href="https://github.com/HKUDS/DeepTutor" target="_blank" rel="noopener">DeepTutor</a> (HKUDS, Apache-2.0) and the paper by Zhao et al., 2026 (<a href="https://arxiv.org/abs/2604.26962" target="_blank" rel="noopener">arXiv:2604.26962</a>); Smarty is original code.</p>
<button class="link-btn" data-action="toggleNotices" aria-expanded="${state.notices ? 'true' : 'false'}">${icon('info', 16)}${state.notices ? 'Hide' : 'Show'} open-source notices</button>
${state.notices ? `<pre class="notices">${esc(NOTICES)}</pre>` : ''}</section>
<section class="card"><h2 class="h2">Legal</h2><div class="row"><button class="btn outline sm" data-view="privacy">Privacy policy</button><button class="btn outline sm" data-view="terms">Terms and disclaimer</button><button class="btn outline sm" data-view="licenses">Open-source licences</button></div></section>
<p class="fine center with-icon made-with">${icon('heart', 15)}Made by students, for students.</p>
</div>`;
}


/* ---------- in-app updates (GitHub Releases) ---------- */
const updPrefs = () => ({ auto: true, last: 0, ...(readJSON('prvlar-update', {}) || {}) });
const updateNote = () => isNative() && platform() === 'android'
  ? 'Updates install over this app and keep your documents, cards and progress (same signing key, newer version).'
  : 'Opens the download page for the newest version.';
const COMING_NEXT = 'Next update: Smarty everywhere. Your AI study assistant on every screen, aware of what you’re viewing, and able to make tests, plans, notes and flashcards for you.';
const comingNextHTML = () => `<p class="fine coming-next">${icon('sparkles', 14)} <b>Coming next:</b> ${esc(COMING_NEXT.replace(/^Next update: /, ''))}</p>`;
function updateCardHTML() {
  if (!UPDATE_REPO || platform() !== 'android') return `<section class="card"><h2 class="h2">Updates</h2><p class="muted">Prvlar ${esc(VERSION)}. ${isNative() && platform() === 'android' ? 'Updates arrive through the store where you installed the app.' : isNative() ? 'Updates arrive through the App Store.' : 'The website updates itself: reload to get the newest version.'}</p>${comingNextHTML()}</section>`;
  const u = state.update, p = updPrefs(), r = u.release;
  const status = u.busy === 'check' ? '<span class="spin"></span>Checking…' : u.busy === 'download' ? `<span class="spin"></span>Downloading ${u.progress ? u.progress + '%' : '…'}`
    : u.error ? `${icon('alert', 16)}${esc(u.error)}` : u.status === 'current' ? `${icon('checkCircle', 16)}You have the latest version${r ? ` (${esc(r.version)})` : ''}.`
    : u.status === 'newer' ? `${icon('sparkles', 16)}Version ${esc(r.version)} is available.` : p.last ? `Last checked ${esc(new Date(p.last).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))}.` : '';
  return `<section class="card update-card" aria-labelledby="upd-h"><h2 class="h2" id="upd-h">${icon('download', 20)}App updates</h2>
<p class="fine">You have Prvlar <b>${esc(VERSION)}</b>. ${updateNote()}</p>
<div class="row"><button class="btn primary" data-action="checkUpdate"${u.busy ? ' disabled' : ''}>${icon('refresh', 18)}Check for updates</button>${u.status === 'newer' ? `<button class="btn outline" data-action="showUpdate">See what's new</button>` : ''}</div>
<p class="upd-status${u.error ? ' is-err' : ''}" role="status">${status}</p>
<label class="toggle-row"><span><b>Check automatically</b><span>At most once a day, when the app opens.</span></span><input type="checkbox" id="autoupdate"${p.auto ? ' checked' : ''}><span class="switch${p.auto ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>${comingNextHTML()}</section>`;
}
// Release notes (Markdown) as plain, safe text: headings bold, list items as bullets.
const notesHTML = md => md.split(/\r?\n/).map(l => { const h = l.match(/^#{1,6}\s+(.*)/); if (h) return `<b>${esc(h[1])}</b>`; return esc(l.replace(/^\s*[-*]\s+/, '• ').replace(/\*\*(.+?)\*\*/g, '$1')); }).join('<br>');
function updateDialogHTML() {
  const r = state.update.release, u = state.update, android = isNative() && platform() === 'android';
  return `<div class="sheet-backdrop" data-action="closeUpdate"></div><section class="sheet update-sheet" role="dialog" aria-modal="true" aria-labelledby="updd-h">
<div class="sheet-head"><h2 id="updd-h">Update available</h2><button class="icon-btn" data-action="closeUpdate" aria-label="Close">${icon('x', 20)}</button></div>
<p class="muted">Prvlar <b>${esc(r.version)}</b> is out. You have ${esc(VERSION)}.${r.apk && android ? ` Download ${r.apk.size ? (r.apk.size / 1048576).toFixed(1) + ' MB' : ''}.` : ''}</p>
${r.notes ? `<div class="upd-notes">${notesHTML(r.notes)}</div>` : ''}
<p class="fine with-icon">${icon('lock', 15)}${android ? 'Your data stays: the update installs over this app. If Android asks, allow installs from Prvlar.' : 'Download the new version from the release page.'}</p>
${u.error ? `<p class="upd-status is-err">${icon('alert', 16)}${esc(u.error)}</p>` : ''}
<div class="row"><button class="btn primary big" data-action="doUpdate"${u.busy ? ' disabled' : ''}>${u.busy === 'download' ? `<span class="spin"></span>Downloading ${u.progress ? u.progress + '%' : ''}` : `${icon('download', 19)}Update`}</button><button class="btn outline big" data-action="closeUpdate">Later</button></div></section>`;
}
async function runUpdateCheck(manual) {
  const u = state.update; if (u.busy) return;
  u.busy = 'check'; u.error = ''; if (manual) render();
  try {
    const { status, release } = await checkForUpdate(VERSION);
    u.status = status; u.release = release; writeJSON('prvlar-update', { ...updPrefs(), last: Date.now() });
    if (status === 'newer') u.dialog = true;
  } catch (e) { if (manual) u.error = e.message || 'Could not check for updates.'; }
  finally { u.busy = ''; }
  if (manual || u.dialog) render();
}
function autoCheckUpdate() {
  if (!UPDATE_REPO || platform() !== 'android') return;
  const p = updPrefs(); if (!p.auto || VERSION === 'dev' || Date.now() - (p.last || 0) < AUTO_INTERVAL) return;
  setTimeout(() => runUpdateCheck(false), 4000);
}

/* =================================================================== study tools (0.7) */
// Flashcards, error log, planner, focus timer, progress dashboard, read aloud and text size.
const today = () => dayKey();
const docById = id => state.docs.find(d => d.id === id) || null;
const titleOf = id => { const d = docById(id); return d ? docTitle(d) : 'Cards without a document'; };
const fmtMin = m => { m = Math.round(m || 0); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}`; };
const docOptions = (sel, none = 'No document') => `<option value="">${esc(none)}</option>${state.docs.map(d => `<option value="${esc(d.id)}"${d.id === sel ? ' selected' : ''}>${esc(docTitle(d))}</option>`).join('')}`;
const minutesOn = day => state.sessions.filter(s => s.day === day).reduce((t, s) => t + (s.minutes || 0), 0);
const dayRow = day => state.days.find(d => d.day === day) || {};
const totalMinutes = () => state.sessions.reduce((t, s) => t + (s.minutes || 0), 0);
const totalReviews = () => state.days.reduce((t, d) => t + (d.reviews || 0), 0);
const sectionsStudied = () => Object.values(state.visited).reduce((t, l) => t + (Array.isArray(l) ? l.length : 0), 0);
const fixedCount = () => Object.values(state.errLog).filter(e => e && e.fixed).length;
function activeDays() {
  const set = new Set();
  for (const s of state.sessions) if (s.minutes > 0) set.add(s.day);
  for (const d of state.days) if (d.reviews || d.sections || d.fixed) set.add(d.day);
  for (const a of state.attempts) set.add(dayKey(a.submittedAt));
  return set;
}
function progressStats() {
  const st = streaks(activeDays(), today()), minutes = totalMinutes(), reviews = totalReviews(), sections = sectionsStudied();
  const xp = xpTotal({ minutes, reviews, sections, tests: state.attempts.map(a => a.percent) });
  return { ...st, minutes, reviews, sections, xp, lvl: levelFor(xp), tests: state.attempts.length, bestPercent: Math.max(0, ...state.attempts.map(a => a.percent)), fixed: fixedCount() };
}
const dueCount = (docId = null) => dueQueue(state.cards, { documentId: docId, limit: 1e6, newLimit: state.goals.dailyCards || 20 }).length;
function dueByDoc() { const m = {}; for (const c of dueQueue(state.cards, { limit: 1e6, newLimit: 1e6 })) { const k = c.documentId || ''; m[k] = (m[k] || 0) + 1; } return m; }
const openErrors = () => errorEntries(state.attempts).filter(e => !state.errLog[e.key]?.fixed);
function weakAll() { return state.docs.flatMap(d => weakTopics(state.attempts, d).map(w => ({ ...w, docId: d.id }))).sort((a, b) => a.percent - b.percent); }
function recommendations() {
  return recommend({
    dueByDoc: dueByDoc(), weak: weakAll(), openErrors: openErrors().length, today: today(), docTitle: titleOf,
    unstudied: state.docs.map(d => ({ docId: d.id, left: studyable(d).length - studied(d) })),
    exams: state.plans.filter(p => p.kind === 'exam')
  });
}
async function reloadStudyData() {
  [state.cards, state.sessions, state.plans, state.days] = await Promise.all([getCards(), getSessions(), getPlans(), getDays()]);
  state.errLog = (await getSetting('errorlog')) || {};
  state.profiles = await getProfiles().catch(() => []);
  state.traces = await getTraces().catch(() => []);
  state.glassBg = (await getSetting('glass-bg').catch(() => '')) || ''; applyGlassBg();
  state.learner = (await getSetting('learner-profile')) || emptyProfile();
}
// Finds the section a question's source label points to (longest matching label wins).
function nodeForSource(doc, source) {
  if (!doc || !source) return null;
  const src = String(source).toLowerCase();
  const hits = outline(doc).filter(n => n.id !== 'root' && n.source && src.includes(String(n.source).toLowerCase())).sort((a, b) => String(b.source).length - String(a.source).length);
  return hits[0] || null;
}
function nodeForTopic(doc, topic) {
  const t = String(topic || '').toLowerCase();
  return outline(doc).find(n => n.id !== 'root' && n.title.toLowerCase().includes(t)) || null;
}

/* ---------- reading time (counted while a section is open and you are active) ---------- */
let lastInput = Date.now(), readMs = 0;
['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(ev => window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
function tickReading() {
  if (state.view !== 'section' || !state.doc || document.hidden) return;
  if (Date.now() - lastInput > 180000 && !state.speaking) return;      // away for 3 minutes: stop counting
  if (state.focusRun.running && state.focusRun.phase === 'focus') return;   // the focus timer already counts this time
  readMs += 1000;
  if (readMs >= 60000) { readMs = 0; addMinutes(state.doc, 1, 'reading').catch(() => {}); }
}
async function addMinutes(documentId, minutes, kind) {
  const day = today();
  let s;
  if (kind === 'reading') {
    const id = `read:${documentId || 'none'}:${day}`;
    s = state.sessions.find(x => x.id === id) || { id, documentId: documentId || null, day, kind, minutes: 0, start: Date.now() };
    s.minutes += minutes;
  } else s = { id: uuid(), documentId: documentId || null, day, kind, minutes, start: Date.now() - minutes * 60000 };
  state.sessions = [...state.sessions.filter(x => x.id !== s.id), s];
  await saveSession(s);
}

/* ---------- flashcards ---------- */
const autoCards = () => readJSON('prvlar-autocards', true) !== false;
async function addCards(list) {
  const have = new Set(state.cards.map(c => c.id)), fresh = list.filter(c => !have.has(c.id));
  if (!fresh.length) return 0;
  await saveCards(fresh);
  state.cards = [...state.cards, ...fresh];
  return fresh.length;
}
// Wrong test answers become flashcards (once per question; deleting the card keeps it deleted).
async function mistakeCards(attempt) {
  if (!autoCards()) return 0;
  const grades = new Map((attempt.grades || []).map(g => [g.id, g])), made = new Set(attempt.cardsMade || []), doc = docById(attempt.documentId);
  const wrong = (attempt.questions || []).filter(q => { const g = grades.get(q.id); return g && g.method !== 'self assessment pending' && g.awarded < q.marks && (q.type === 'mcq' || g.awarded <= q.marks / 2) && !made.has(q.id); });
  if (!wrong.length) return 0;
  const n = await addCards(wrong.map(q => cardFromQuestion(q, attempt, nodeForSource(doc, q.source)?.id || null)));
  attempt.cardsMade = [...made, ...wrong.map(q => q.id)];
  await saveAttempt(attempt);
  return n;
}
function startReview(documentId = null, nodeId = null) {
  let queue = dueQueue(state.cards, { documentId, limit: 100, newLimit: state.goals.dailyCards || 20 });
  if (nodeId) queue = state.cards.filter(c => c.documentId === documentId && c.nodeId === nodeId);
  if (!queue.length) { state.notice = 'Nothing to review right now. New cards and due cards appear here.'; return go(state.view, { keep: true, push: false }); }
  state.fc = { queue: queue.map(c => c.id), i: 0, flipped: false, done: 0, right: 0, docId: documentId };
  go('cards', { keep: true });
}
async function gradeCard(q) {
  const fc = state.fc; if (!fc) return;
  const card = state.cards.find(c => c.id === fc.queue[fc.i]); if (!card) return;
  const next = review(card, q);
  state.cards = state.cards.map(c => c.id === card.id ? next : c);
  await saveCards([next]);
  bumpDay(today(), { reviews: 1, correct: q >= 3 ? 1 : 0 }).then(async () => { state.days = await getDays(); }).catch(() => {});
  fc.done++; if (q >= 3) fc.right++;
  if (q < 3) fc.queue.push(card.id);              // forgotten: see it again at the end of this session
  fc.i++; fc.flipped = false;
  render();
}
const cardText = t => esc(t).replace(/\n/g, '<br>');
function viewCards() {
  const fc = state.fc;
  if (fc) {
    if (fc.i >= fc.queue.length) {
      return `${backHead('Flashcards')}<div class="view narrow"><section class="card empty">${icon('checkCircle', 34)}<h2>Session complete</h2><p>You reviewed ${plural(fc.done, 'card')}, ${pct(fc.right, fc.done)}% remembered. Cards come back when they are due.</p>
<div class="row center-row"><button class="btn primary" data-action="fcEnd">${icon('cards', 18)}Back to decks</button>${dueCount(fc.docId) ? `<button class="btn outline" data-review="${esc(fc.docId || '')}">Keep going (${dueCount(fc.docId)})</button>` : ''}</div></section></div>`;
    }
    const card = state.cards.find(c => c.id === fc.queue[fc.i]);
    if (!card) { fc.i++; return viewCards(); }
    const p = preview(card);
    return `${backHead('Flashcards', `<button class="icon-btn" data-action="fcEnd" aria-label="End session" title="End session">${icon('x', 20)}</button>`, true)}<div class="view narrow fc-view"><div class="th-only th-fc-art" aria-hidden="true"></div>
<div class="fc-top"><span class="chip">${esc(titleOf(card.documentId))}</span><span class="fine">${fc.i + 1} of ${fc.queue.length}</span></div>
<div class="qbar" aria-hidden="true"><span style="width:${pct(fc.i, fc.queue.length)}%"></span></div>
<button class="fc-card${fc.flipped ? ' is-flipped' : ''}" data-action="fcFlip" aria-label="${fc.flipped ? 'Answer shown' : 'Show the answer'}">
<span class="fc-face"><span class="fc-label">${card.origin === 'mistake' ? 'From a test mistake' : isNew(card) ? 'New card' : 'Question'}</span><span class="fc-text">${cardText(card.front)}</span></span>
${fc.flipped ? `<span class="fc-face fc-back"><span class="fc-label">Answer</span><span class="fc-text">${cardText(card.back)}</span>${card.source ? `<span class="fine">${icon('file', 14)} ${esc(card.source)}</span>` : ''}</span>` : `<span class="fc-hint">${icon('eye', 18)}Tap to show the answer</span>`}
</button>
${fc.flipped ? `<div class="fc-grades">${p.map(g => `<button class="fc-grade g-${g.key}" data-grade="${g.q}"><b>${g.label}</b><span>${g.label2}</span></button>`).join('')}</div><p class="fine center">How well did you remember it? Harder cards come back sooner.</p>`
      : `<button class="btn primary big block" data-action="fcFlip">${icon('eye', 19)}Show answer</button>`}
${speechSupported() ? `<button class="link-btn center-btn" data-speak-card="${fc.flipped ? 'back' : 'front'}">${icon('volume', 16)}Read aloud</button>` : ''}
</div>`;
  }
  const decks = [...new Set([...state.docs.map(d => d.id), ...state.cards.map(c => c.documentId || '')])].map(id => ({ id, cards: state.cards.filter(c => (c.documentId || '') === (id || '')) })).filter(d => d.id || d.cards.length);
  const all = deckStats(state.cards), due = dueCount();
  return `${backHead('Flashcards')}<div class="view narrow">
<section class="stats3"><div class="stat${due ? ' good' : ''}"><b>${due}</b><span>To review now</span></div><div class="stat"><b>${all.fresh}</b><span>New</span></div><div class="stat"><b>${all.total}</b><span>${all.total === 1 ? 'Card' : 'Cards'}</span></div></section>
<button class="btn primary big block" data-review=""${due ? '' : ' disabled'}>${icon('cards', 20)}${due ? `Study ${plural(due, 'card')}` : 'No cards due'}</button>
<p class="fine center">Spaced repetition: cards you find hard come back sooner, easy ones later. Open a section’s <b>Cards</b> tab to make cards with AI.</p>
<h2 class="section-h">Decks</h2>
${decks.length ? `<ul class="deck-list">${decks.map(d => { const s = deckStats(d.cards), n = dueCount(d.id || null); const open = state.cardsOpen === (d.id || '-');
  return `<li class="card deck"><div class="deck-head"><span class="feature-icon f-amber">${icon('cards', 20)}</span><div class="deck-text"><b>${esc(titleOf(d.id))}</b><span class="fine">${plural(s.total, 'card')} · ${s.fresh} new · ${s.mature} learned${s.lapses ? ` · ${plural(s.lapses, 'lapse')}` : ''}</span></div>
<button class="btn ${n ? 'primary' : 'outline'} sm" data-review="${esc(d.id || '')}"${n ? '' : ' disabled'}>${n ? `Study ${n}` : 'Done'}</button></div>
<button class="link-btn" data-deck="${esc(d.id || '-')}">${open ? 'Hide cards' : `Show cards${s.total ? '' : ' and add one'}`}</button>${open ? deckCards(d) : ''}</li>`; }).join('')}</ul>`
    : `<div class="empty card">${icon('cards', 34)}<h2>No flashcards yet</h2><p>Import a document, then make cards from any section, or add your own below. Questions you get wrong in tests become cards automatically.</p></div>`}
<section class="card"><h2 class="h2">${icon('plus', 20)}Add a card</h2>
<label class="field"><span>Deck</span><select class="input select" id="fc-doc">${docOptions(state.cardsOpen && state.cardsOpen !== '-' ? state.cardsOpen : state.doc || '', 'No document')}</select></label>
<label class="field"><span>Front (question)</span><textarea class="input" id="fc-front" rows="2" placeholder="What is…?"></textarea></label>
<label class="field"><span>Back (answer)</span><textarea class="input" id="fc-back" rows="3" placeholder="The answer"></textarea></label>
<button class="btn primary" data-action="fcAdd">${icon('plus', 18)}Add card</button></section></div>`;
}
function deckCards(d) {
  if (!d.cards.length) return '<p class="muted">No cards in this deck yet.</p>';
  const now = Date.now();
  return `<ul class="card-rows">${d.cards.sort((a, b) => a.due - b.due).map(c => `<li><div class="cr-text"><span>${esc(c.front.split('\n')[0].slice(0, 140))}</span><span class="fine">${isNew(c) ? 'New' : c.due <= now ? 'Due now' : 'Due in ' + whenLabel(c.due - now)}${c.origin === 'mistake' ? ' · from a mistake' : c.origin === 'ai' ? ' · made by Smarty' : ''}</span></div><button class="icon-btn sm" data-delcard="${esc(c.id)}" aria-label="Delete card" title="Delete card">${icon('trash', 17)}</button></li>`).join('')}</ul>`;
}
// The Cards tab of a section: AI cards from this section, your own cards, and a quick study session.
function sectionCards(doc, node) {
  const mine = state.cards.filter(c => c.documentId === doc.id && c.nodeId === node.id);
  return `<section class="card"><div class="ask-head"><span class="ask-icon amber">${icon('cards', 20)}</span><h2>Flashcards for this section</h2></div>
${node.text ? (!aiAvailable() ? `<p class="muted">Set up an AI service to write cards for you, or add your own below.</p>` : `<button class="btn primary" data-action="fcAI"${state.busy ? ' disabled' : ''}>${state.busy === 'cards' ? '<span class="spin"></span>Smarty is making cards…' : icon('sparkles', 18) + 'Make flashcards with AI'}</button><p class="fine">Uses ${esc(aiName())}. Only this section’s text is sent, after you confirm.</p>`) : ''}
${mine.length ? `<div class="row"><button class="btn outline" data-review-node="${esc(node.id)}">${icon('cards', 18)}Study these ${mine.length}</button></div>${deckCards({ cards: mine })}` : '<p class="muted">No cards for this section yet.</p>'}
<h3 class="h3">Add your own</h3>
<label class="field"><span>Front</span><textarea class="input" id="fc-front" rows="2" placeholder="Question"></textarea></label>
<label class="field"><span>Back</span><textarea class="input" id="fc-back" rows="3" placeholder="Answer"></textarea></label>
<button class="btn outline" data-action="fcAddHere">${icon('plus', 18)}Add card</button></section>`;
}

/* ---------- error log ---------- */
const saveErrLog = () => setSetting('errorlog', state.errLog).catch(() => {});
function viewErrors() {
  const all = errorEntries(state.attempts), f = state.errFilter;
  const list = all.filter(e => f === 'all' || e.key === state.retry?.key ? true : f === 'fixed' ? state.errLog[e.key]?.fixed : !state.errLog[e.key]?.fixed);
  return `${backHead('Mistakes')}<div class="view narrow"><p class="muted page-sub">Every question you got wrong in a test. Retry them until you get them right.</p>
${seg('errf', f, [['open', `To retry (${all.filter(e => !state.errLog[e.key]?.fixed).length})`], ['fixed', `Fixed (${all.filter(e => state.errLog[e.key]?.fixed).length})`], ['all', 'All']])}
${list.length ? `<ol class="err-list">${list.slice(0, 80).map(errorRow).join('')}</ol>` : `<div class="empty card">${icon('checkCircle', 34)}<h2>${all.length ? 'Nothing here' : 'No mistakes yet'}</h2><p>${all.length ? 'Try the other tab.' : 'After a test, questions you got wrong appear here to retry.'}</p></div>`}</div>`;
}
function errorRow(e) {
  const q = e.question, log = state.errLog[e.key] || {}, open = state.retry?.key === e.key, r = state.retry;
  const yours = answerText(q, e.answer);
  let body = '';
  if (open) {
    if (q.type === 'mcq') {
      body = `<div class="options">${q.options.map((o, j) => { const picked = r.choice === j, show = r.choice !== undefined; const cls = show ? (j === q.correct ? ' is-right' : picked ? ' is-wrong' : '') : ''; return `<button class="option${cls}" data-retry-pick="${j}"${show ? ' disabled' : ''}><span class="opt-letter">${'ABCD'[j]}</span><span class="opt-text">${esc(o)}</span></button>`; }).join('')}</div>
${r.choice !== undefined ? `<div class="status ${r.choice === q.correct ? 'ok' : 'warn'}">${icon(r.choice === q.correct ? 'checkCircle' : 'alert', 20)}<p>${r.choice === q.correct ? 'Correct! Marked as fixed.' : `Not quite. The answer is ${'ABCD'[q.correct]}.`} ${esc(q.solution)}</p></div>` : ''}`;
    } else {
      body = `<textarea class="input" rows="4" id="retry-text" placeholder="Write your answer again…">${esc(r.text || '')}</textarea>
${r.shown ? `<div class="solution"><p class="smarty-tag">${icon('smarty', 15)} <b>Smarty explains</b></p><p>${esc(q.solution)}</p>${q.rubric ? `<p><b>Marking points:</b> ${esc(q.rubric)}</p>` : ''}</div><div class="row"><button class="btn primary sm" data-retry-self="1">${icon('check', 17)}I got it right</button><button class="btn outline sm" data-retry-self="0">Not yet</button></div>` : `<button class="btn primary sm" data-action="retryShow">Check against the model answer</button>`}`;
    }
  }
  const doc = docById(e.documentId), node = nodeForSource(doc, q.source);
  return `<li class="card err${log.fixed ? ' is-fixed' : ''}"><div class="err-head"><span class="chip${log.fixed ? ' good' : ' warn'}">${log.fixed ? 'Fixed' : q.type === 'mcq' ? 'Multiple choice' : 'Written'}</span><span class="fine">${esc(doc ? docTitle(doc) : e.documentName || 'Deleted document')} · ${esc(fmtDate(e.at))}${log.tries ? ` · ${plural(log.tries, 'retry')}`.replace('retrys', 'retries') : ''}</span></div>
<h3 class="err-q">${esc(q.prompt)}</h3>${figureHTML(q)}
${open ? body : `<p class="fine">Your answer: ${esc(yours.slice(0, 200))}</p>`}
<div class="row">${open ? `<button class="btn outline sm" data-action="retryClose">Close</button>` : `<button class="btn primary sm" data-retry="${esc(e.key)}">${icon('restore', 17)}Retry</button>`}
${state.cards.some(c => c.id === `err:${e.key}`) ? '' : `<button class="btn outline sm" data-errcard="${esc(e.key)}">${icon('cards', 17)}Make a card</button>`}
${node ? `<button class="btn outline sm" data-docnode="${esc(doc.id)}:${esc(node.id)}">${icon('read', 17)}Open section</button>` : ''}</div></li>`;
}
async function retryResult(key, right) {
  const log = state.errLog[key] || (state.errLog[key] = { tries: 0 });
  log.tries = (log.tries || 0) + 1; log.last = Date.now();
  if (right && !log.fixed) { log.fixed = true; bumpDay(today(), { fixed: 1 }).then(async () => { state.days = await getDays(); }).catch(() => {}); }
  await saveErrLog();
}

/* ---------- planner and reminders ---------- */
const sortPlans = (a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '').localeCompare(b.time || '');
const countdownText = d => d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d > 1 ? `${d} days` : `${-d} day${d === -1 ? '' : 's'} ago`;
const atTime = (date, time) => { const [h, m] = String(time || '09:00').split(':').map(Number); const t = new Date(dayStart(date)); t.setHours(h || 0, m || 0, 0, 0); return t.getTime(); };
async function rescheduleReminders() {
  const r = state.remind, list = [];
  for (const p of state.plans) {
    if (p.kind === 'exam' && r.exams && p.date) {
      for (const [days, label] of [[7, 'in a week'], [1, 'tomorrow']]) list.push({ id: `${p.id}:${days}`, title: `Exam ${label}: ${p.title}`, body: p.documentId ? `Revise ${titleOf(p.documentId)} in Prvlar.` : 'Open Prvlar to revise.', at: atTime(addDays(p.date, -days), '09:00') });
      list.push({ id: `${p.id}:0`, title: `Exam today: ${p.title}`, body: 'Good luck! A quick flashcard review can help.', at: atTime(p.date, '07:30') });
    }
    if (p.kind === 'todo' && r.todos && p.date && !p.done) list.push({ id: `${p.id}:due`, title: `Due ${p.time ? 'now' : 'today'}: ${p.title}`, body: 'From your Prvlar planner.', at: atTime(p.date, p.time || '09:00') });
  }
  const [h, m] = String(r.time || '19:00').split(':').map(Number);
  const daily = r.daily ? { hour: h || 19, minute: m || 0, title: 'Time to study', body: `Keep your streak going: your goal is ${fmtMin(state.goals.dailyMinutes)} today.` } : null;
  return scheduleReminders(list, daily);
}
function viewPlanner() {
  const tab = state.planTab, t = today();
  const exams = state.plans.filter(p => p.kind === 'exam').sort(sortPlans), todos = state.plans.filter(p => p.kind === 'todo').sort(sortPlans);
  let body = '';
  if (tab === 'exams') {
    const up = exams.filter(e => daysUntil(e.date, t) >= 0), past = exams.filter(e => daysUntil(e.date, t) < 0);
    body = `${up.length ? `<ul class="exam-list">${up.map(e => examRow(e, t)).join('')}</ul>` : `<div class="empty card">${icon('calendar', 34)}<h2>No exams planned</h2><p>Add your exam dates to see a countdown and get reminders a week and a day before.</p></div>`}
<section class="card"><h2 class="h2">${icon('plus', 20)}Add an exam</h2>
<label class="field"><span>Exam</span><input class="input" id="pl-title" placeholder="e.g. Fire Safety semester exam" maxlength="120"></label>
<div class="field-row"><label class="field"><span>Date</span><input class="input" type="date" id="pl-date" min="${t}"></label><label class="field"><span>Document (optional)</span><select class="input select" id="pl-doc">${docOptions(state.doc || '')}</select></label></div>
<button class="btn primary" data-action="planAdd" data-kind="exam">${icon('plus', 18)}Add exam</button></section>
${past.length ? `<h2 class="section-h">Past exams</h2><ul class="exam-list">${past.map(e => examRow(e, t)).join('')}</ul>` : ''}`;
  } else if (tab === 'todo') {
    const open = todos.filter(x => !x.done), done = todos.filter(x => x.done);
    body = `<section class="card"><h2 class="h2">${icon('plus', 20)}Add a task or assignment</h2>
<label class="field"><span>Task</span><input class="input" id="pl-title" placeholder="e.g. Submit lab report" maxlength="160"></label>
<div class="field-row"><label class="field"><span>Due date</span><input class="input" type="date" id="pl-date"></label><label class="field"><span>Time (optional)</span><input class="input" type="time" id="pl-time"></label></div>
<button class="btn primary" data-action="planAdd" data-kind="todo">${icon('plus', 18)}Add task</button></section>
${open.length ? `<ul class="todo-list card">${open.map(x => todoRow(x, t)).join('')}</ul>` : '<p class="muted empty-line">No open tasks. Nice!</p>'}
${done.length ? `<h2 class="section-h">Done <span class="count">${done.length}</span></h2><ul class="todo-list card">${done.slice(0, 30).map(x => todoRow(x, t)).join('')}</ul>` : ''}`;
  } else {
    const g = state.goals, r = state.remind, perm = state.notifPerm;
    const week = lastDays(7, t).reduce((s, d) => s + minutesOn(d), 0);
    body = `<section class="card"><h2 class="h2">${icon('target', 20)}Goals</h2>
<div class="goal"><div class="topic-row"><span>Today: ${fmtMin(minutesOn(t))} of ${fmtMin(g.dailyMinutes)}</span><b>${pct(minutesOn(t), g.dailyMinutes)}%</b></div><span class="tbar good"><span style="width:${Math.min(100, Math.max(2, pct(minutesOn(t), g.dailyMinutes)))}%"></span></span></div>
<div class="goal"><div class="topic-row"><span>Last 7 days: ${fmtMin(week)} of ${fmtMin(g.weeklyMinutes)}</span><b>${pct(week, g.weeklyMinutes)}%</b></div><span class="tbar mid"><span style="width:${Math.min(100, Math.max(2, pct(week, g.weeklyMinutes)))}%"></span></span></div>
<div class="goal"><div class="topic-row"><span>Flashcards today: ${dayRow(t).reviews || 0} of ${g.dailyCards}</span><b>${pct(dayRow(t).reviews || 0, g.dailyCards)}%</b></div><span class="tbar good"><span style="width:${Math.min(100, Math.max(2, pct(dayRow(t).reviews || 0, g.dailyCards)))}%"></span></span></div>
<div class="field-row three"><label class="field"><span>Minutes a day</span><input class="input" type="number" min="5" max="720" step="5" data-goal="dailyMinutes" value="${g.dailyMinutes}"></label><label class="field"><span>Minutes a week</span><input class="input" type="number" min="10" max="5000" step="10" data-goal="weeklyMinutes" value="${g.weeklyMinutes}"></label><label class="field"><span>Cards a day</span><input class="input" type="number" min="1" max="500" data-goal="dailyCards" value="${g.dailyCards}"></label></div>
<p class="fine">Study time counts focus-timer blocks and time spent reading sections.</p></section>
<section class="card"><h2 class="h2">${icon('bell', 20)}Reminders</h2>
${perm === 'granted' ? `<div class="status ok">${icon('checkCircle', 20)}<p>Notifications are allowed${isNative() ? '' : ' (they appear while this page is open)'}.</p></div>`
      : perm === 'unsupported' ? `<div class="status warn">${icon('info', 20)}<p>This browser can’t show notifications. Reminders work in the Android and iPhone apps.</p></div>`
      : `<div class="status warn">${icon('bellOff', 20)}<div><p>${perm === 'denied' ? 'Notifications are blocked. Allow them for Prvlar in your phone’s Settings › Apps › Notifications.' : 'Allow notifications to get reminders.'}</p>${perm === 'denied' ? '' : `<button class="btn primary sm" data-action="allowNotif">${icon('bell', 17)}Allow notifications</button>`}</div></div>`}
${perm === 'granted' && state.exactPerm === 'denied' ? `<div class="status warn">${icon('info', 20)}<div><p>On-time reminders are off, so Android may deliver reminders a few minutes late.</p><button class="btn primary sm" data-action="allowExact">${icon('bell', 17)}Allow on-time reminders</button></div></div>` : ''}
<label class="toggle-row"><span><b>Daily study reminder</b><span>Every day at the time below.</span></span><input type="checkbox" data-remind="daily"${r.daily ? ' checked' : ''}><span class="switch${r.daily ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>
<label class="field"><span>Reminder time</span><input class="input" type="time" id="remind-time" value="${esc(r.time)}"></label>
<label class="toggle-row"><span><b>Exam reminders</b><span>A week before, a day before and on the morning of each exam.</span></span><input type="checkbox" data-remind="exams"${r.exams ? ' checked' : ''}><span class="switch${r.exams ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>
<label class="toggle-row"><span><b>Task reminders</b><span>At the due time, or 9:00 on the due day.</span></span><input type="checkbox" data-remind="todos"${r.todos ? ' checked' : ''}><span class="switch${r.todos ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label></section>`;
  }
  return `${backHead('Planner')}<div class="view narrow">${seg('ptab', tab, [['exams', 'Exams', 'calendar'], ['todo', 'To-do', 'todo'], ['goals', 'Goals', 'target']])}<div class="plan-body">${body}</div></div>`;
}
function examRow(e, t) {
  const d = daysUntil(e.date, t), cls = d < 0 ? 'past' : d <= 3 ? 'soon' : d <= 14 ? 'near' : '';
  return `<li class="card exam ${cls}"><div class="countdown"><b>${d > 1 ? d : d === 1 ? '1' : d === 0 ? '!' : '✓'}</b><span>${d > 1 ? 'days' : d === 1 ? 'day' : d === 0 ? 'today' : 'done'}</span></div>
<div class="exam-text"><b>${esc(e.title)}</b><span class="fine">${esc(fmtDate(dayStart(e.date)))} · ${countdownText(d)}</span>${e.documentId && docById(e.documentId) ? `<button class="chip chip-btn" data-open="${esc(e.documentId)}">${icon('file', 13)}${esc(titleOf(e.documentId))}</button>` : ''}</div>
<button class="icon-btn sm" data-delplan="${esc(e.id)}" aria-label="Delete exam" title="Delete">${icon('trash', 17)}</button></li>`;
}
function todoRow(x, t) {
  const d = x.date ? daysUntil(x.date, t) : null, late = !x.done && d !== null && (d < 0 || (d === 0 && x.time && atTime(x.date, x.time) < Date.now()));
  return `<li class="todo${x.done ? ' is-done' : ''}${late ? ' is-late' : ''}"><label class="todo-check"><input type="checkbox" data-todo="${esc(x.id)}"${x.done ? ' checked' : ''}><span class="ol-mark${x.done ? ' is-done' : ''}">${x.done ? icon('check', 13, '', 3) : ''}</span></label>
<div class="todo-text"><span>${esc(x.title)}</span>${x.date ? `<span class="fine">${late ? 'Overdue · ' : ''}${esc(fmtDate(dayStart(x.date)))}${x.time ? ' ' + esc(x.time) : ''}${!x.done && d !== null && d >= 0 ? ' · ' + countdownText(d).toLowerCase() : ''}</span>` : ''}</div>
<button class="icon-btn sm" data-delplan="${esc(x.id)}" aria-label="Delete task" title="Delete">${icon('trash', 17)}</button></li>`;
}

/* ---------- focus timer ---------- */
const PHASES = { focus: 'Focus', short: 'Short break', long: 'Long break' };
const phaseMs = ph => (ph === 'focus' ? state.focusPrefs.focus : ph === 'short' ? state.focusPrefs.short : state.focusPrefs.long) * 60000;
const focusLeft = () => { const r = state.focusRun; return r.running ? Math.max(0, r.endsAt - Date.now()) : r.left ?? phaseMs(r.phase === 'idle' ? 'focus' : r.phase); };
const saveRun = () => writeJSON('prvlar-focus-run', state.focusRun);
function focusStart(phase = state.focusRun.phase === 'idle' ? 'focus' : state.focusRun.phase) {
  const r = state.focusRun, len = r.phase === phase && r.left ? r.left : phaseMs(phase);
  Object.assign(r, { phase, running: true, endsAt: Date.now() + len, left: null, docId: r.docId === undefined ? state.doc : r.docId });
  if (phase === 'focus' && !r.blockStart) r.blockStart = Date.now();
  saveRun();
  scheduleFocusEnd(r.endsAt, phase === 'focus' ? 'Focus block done' : 'Break over', phase === 'focus' ? 'Time for a break. Open Prvlar.' : 'Ready for the next focus block?');
  if (phase === 'focus' && state.focusPrefs.sound !== 'off') playAmbient(state.focusPrefs.sound, state.focusPrefs.volume, { sleepMin: state.focusPrefs.sleep });
  if (phase !== 'focus' && state.focusPrefs.stopAtEnd) stopAmbient(true);
  musicTimer(phase === 'focus' ? 'focus-start' : 'break');
}
function focusPause() {
  const r = state.focusRun; if (!r.running) return;
  r.left = Math.max(0, r.endsAt - Date.now()); r.running = false; saveRun(); cancelFocusEnd(); stopAmbient(); musicTimer('pause');
}
// Logs the focus minutes of the current block (whole minutes actually spent).
async function logFocus(fullBlock) {
  const r = state.focusRun; if (r.phase !== 'focus') return 0;
  const spent = fullBlock ? phaseMs('focus') : phaseMs('focus') - focusLeft();
  const min = Math.floor(spent / 60000);
  r.blockStart = 0;
  if (min >= 1) await addMinutes(r.docId || null, min, 'focus');
  return min;
}
async function focusComplete() {
  const r = state.focusRun, was = r.phase, endedAt = r.endsAt || Date.now();
  let min = 0;
  if (was === 'focus') min = await logFocus(true);
  const n = nextPhase(was, r.cycle || 0, { longEvery: state.focusPrefs.longEvery });
  Object.assign(r, { phase: n.phase, cycle: n.cycle, running: false, left: null, endsAt: 0 });
  if (state.focusPrefs.stopAtEnd || was !== 'focus') stopAmbient(true); if (was === 'focus') musicTimer('break'); chime(was === 'focus');
  const msg = was === 'focus' ? `Focus block done: ${fmtMin(min)} logged. Take a ${n.phase === 'long' ? 'long ' : ''}break (${fmtMin(phaseMs(n.phase) / 60000)}).` : 'Break over. Ready for the next focus block?';
  state.notice = msg; notifyNow(was === 'focus' ? 'Focus block done' : 'Break over', msg);
  if (state.focusPrefs.autoNext) {
    focusStart(n.phase);
    const late = Math.max(0, Date.now() - endedAt);                  // the app was in the background or asleep
    if (late) { r.endsAt -= late; if (r.endsAt <= Date.now()) { Object.assign(r, { running: false, left: null, endsAt: 0 }); stopAmbient(); cancelFocusEnd(); } else scheduleFocusEnd(r.endsAt, r.phase === 'focus' ? 'Focus block done' : 'Break over', 'Open Prvlar.'); saveRun(); }
  } else saveRun();
  render();
}
function tickFocus() {
  const r = state.focusRun;
  if (r.running && Date.now() >= r.endsAt) { focusComplete().catch(fail); return; }
  if (r.phase === 'idle' && !r.running) return;
  const left = focusLeft(), txt = fmtTime(left);
  const t = document.getElementById('focus-time'); if (t) t.textContent = txt;
  const arc = document.getElementById('focus-arc');
  if (arc) { const c = 2 * Math.PI * 92; arc.setAttribute('stroke-dashoffset', (c * (1 - left / phaseMs(r.phase === 'idle' ? 'focus' : r.phase))).toFixed(2)); }
  document.querySelectorAll('[data-focus-badge]').forEach(b => { b.textContent = txt; });
}
const focusPill = () => { const r = state.focusRun; if (r.phase === 'idle' || state.view === 'focus') return ''; return `<button class="focus-pill ph-${r.phase}${r.running ? '' : ' is-paused'}" data-view="focus" aria-label="Open the focus timer">${icon(r.phase === 'focus' ? 'timer' : 'coffee', 17)}<span data-focus-badge>${fmtTime(focusLeft())}</span>${r.running ? '' : icon('pause', 14)}</button>`; };
function viewFocus() {
  const r = state.focusRun, p = state.focusPrefs, ph = r.phase === 'idle' ? 'focus' : r.phase, left = focusLeft(), total = phaseMs(ph);
  const R = 92, c = 2 * Math.PI * R, t = today();
  const todayFocus = state.sessions.filter(s => s.day === t && s.kind === 'focus').reduce((a, s) => a + s.minutes, 0);
  const num = (k, label, min, max) => `<label class="field"><span>${label}</span><input class="input" type="number" min="${min}" max="${max}" data-focus="${k}" value="${p[k]}"></label>`;
  return `${backHead('Focus timer')}<div class="view narrow focus-view">
<div class="seg phase-seg">${Object.entries(PHASES).map(([k, l]) => `<button class="seg-btn${ph === k ? ' is-on' : ''}" data-phase="${k}"${r.running ? ' disabled' : ''}>${l}</button>`).join('')}</div>
<div class="focus-ring ph-${ph}"><svg viewBox="0 0 200 200" width="230" height="230" aria-hidden="true"><circle class="fr-track" cx="100" cy="100" r="${R}"/><circle class="fr-val" id="focus-arc" cx="100" cy="100" r="${R}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - left / total)).toFixed(2)}"/></svg>
<div class="fr-text"><b id="focus-time" role="timer">${fmtTime(left)}</b><span>${PHASES[ph]}${r.cycle ? ` · ${plural(r.cycle, 'block')} done` : ''}</span></div></div>
<div class="focus-actions">${r.running ? `<button class="btn primary big" data-action="focusPause">${icon('pause', 20)}Pause</button>` : `<button class="btn primary big" data-action="focusGo">${icon('play', 20)}${r.left ? 'Resume' : 'Start'}</button>`}
${r.phase !== 'idle' ? `<button class="icon-btn square" data-action="focusSkip" aria-label="Skip to the next part" title="Skip">${icon('skip', 21)}</button><button class="icon-btn square" data-action="focusStop" aria-label="Stop and reset" title="Stop">${icon('stop', 20)}</button>` : ''}</div>
<label class="field"><span>Studying (study minutes are logged to this document)</span><select class="input select" id="focus-doc">${docOptions(r.docId === undefined ? state.doc || '' : r.docId || '', 'General study')}</select></label>
<p class="fine center">Today: ${fmtMin(todayFocus)} of focus · goal ${fmtMin(state.goals.dailyMinutes)} a day</p>
<section class="card"><h2 class="h2">${icon('headphones', 20)}Focus sound</h2>
${soundSupported() ? `<div class="seg wrap">${SOUNDS.map(([k, l]) => `<button class="seg-btn${p.sound === k ? ' is-on' : ''}" data-sound="${k}">${l}</button>`).join('')}</div>
<label class="field"><span>Volume</span><input type="range" min="0" max="1" step="0.05" id="focus-vol" value="${p.volume}"></label><label class="toggle-row compact"><span><b>Stop when the focus block ends</b><span>Off: keeps playing through breaks.</span></span><input type="checkbox" class="switch" id="focus-stopend"${p.stopAtEnd ? ' checked' : ''}></label><label class="field"><span>Sleep timer</span><select class="input select" id="focus-sleep">${[[0, 'Off'], [15, '15 min'], [30, '30 min'], [60, '1 hour'], [120, '2 hours']].map(([v, l]) => `<option value="${v}"${p.sleep === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label><p class="fine">Endless and gap-free: generated by the app, so it works offline and keeps playing with the screen off.</p>` : '<p class="muted">Sound is not supported on this device.</p>'}</section>
${musicCardHTML()}
<section class="card"><h2 class="h2">${icon('settings', 20)}Timer settings</h2>
<div class="field-row"><div class="field-row">${num('focus', 'Focus (min)', 1, 180)}${num('short', 'Short break', 1, 60)}</div><div class="field-row">${num('long', 'Long break', 1, 90)}${num('longEvery', 'Long break every', 2, 12)}</div></div>
<label class="toggle-row"><span><b>Start the next part automatically</b><span>Break after each focus block, then focus again.</span></span><input type="checkbox" id="focus-auto"${p.autoNext ? ' checked' : ''}><span class="switch${p.autoNext ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>
<p class="fine">A chime plays and a notification appears when each part ends${isNative() ? ', even if the app is in the background (allow notifications in Planner › Goals)' : ''}.</p></section></div>`;
}

function musicCardHTML() {
  const src = music.source, q = music.q, sp = music.spotify;
  const spot = `<form class="sp-row" data-form="spotify"><input class="input" id="sp-url" placeholder="Paste a Spotify track, album, playlist or podcast link" value="${esc(state.spInput || '')}" autocomplete="off"><button class="btn primary" type="submit">Play</button></form>
<div class="sp-curated" aria-label="Study playlists">${CURATED.map(([l, u]) => `<button class="chip-btn${sp && spotifyUri(sp) === u ? ' is-on' : ''}" data-spcur="${u}">${esc(l)}</button>`).join('')}</div>
${sp ? `<p class="fine sp-note">${icon('info', 14)} Previews only — log in for full songs. Playlists then continue to the next track and repeat.</p><div class="code-acts"><button class="btn outline sm" data-action="spLogin">Log in to Spotify</button><a class="btn ghost sm" href="${esc(spotifyUri(sp))}" data-spapp="${esc(spotifyUri(sp))}">Open in Spotify app</a></div>` : '<p class="fine">Uses Spotify’s own player. No account needed for previews.</p>'}`;
  const local = `<label class="btn outline file-btn">${icon('upload', 18)}Add music files<input type="file" accept="audio/*" multiple data-musicfiles hidden></label>
${q.items.length ? `<ol class="queue">${q.items.map((t, i) => `<li class="${i === q.at ? 'is-on' : ''}"><button class="icon-btn" data-mqplay="${i}" aria-label="Play ${esc(t.name)}">${icon(i === q.at && music.playing ? 'volume' : 'play', 18)}</button><span>${esc(t.name)}</span><button class="icon-btn" data-mqdel="${i}" aria-label="Remove ${esc(t.name)}">${icon('x', 18)}</button></li>`).join('')}</ol>
<div class="local-ctrls"><button class="icon-btn square" data-mqplay="${prevIndex(q)}" aria-label="Previous">${icon('back', 20)}</button>${music.playing ? `<button class="btn primary" data-action="musicPause">${icon('pause', 18)}Pause</button>` : `<button class="btn primary" data-action="musicPlay">${icon('play', 18)}Play</button>`}<button class="icon-btn square" data-mqplay="${nextIndex(q)}" aria-label="Next">${icon('skip', 20)}</button></div>` : '<p class="fine">Files stay on this device and play offline. The queue repeats.</p>'}`;
  return `<section class="card music-card"><h2 class="h2">${icon('listen', 20)}Music</h2><div class="music-tabs" role="tablist">${[['spotify', 'Spotify'], ['local', 'My music']].map(([k, l]) => `<button role="tab" class="chip-btn${src === k ? ' is-on' : ''}" data-msrc="${k}" aria-selected="${src === k}">${l}</button>`).join('')}</div>
${src === 'spotify' ? spot : local}<div id="music-slot"></div>
<label class="toggle-row compact"><span><b>Pause and resume with the timer</b><span>Music starts with each focus block and pauses on breaks.</span></span><input type="checkbox" class="switch" id="music-follow"${state.focusPrefs.musicFollow ? ' checked' : ''}></label></section>`;
}

/* ---------- progress dashboard ---------- */
function barsSVG(values, labels, { goal = 0, h = 120, unit = '' } = {}) {
  const max = Math.max(goal, ...values, 1), w = 100 / values.length;
  return `<svg class="bars" viewBox="0 0 ${values.length * 24} ${h + 18}" preserveAspectRatio="none" role="img" aria-label="Chart">${values.map((v, i) => { const bh = Math.round((v / max) * h); return `<rect class="bar${v ? '' : ' is-zero'}" x="${i * 24 + 4}" y="${h - Math.max(bh, 2)}" width="16" height="${Math.max(bh, 2)}" rx="3"><title>${esc(labels[i])}: ${v}${unit}</title></rect><text x="${i * 24 + 12}" y="${h + 14}" text-anchor="middle">${esc(String(labels[i]).slice(0, 3))}</text>`; }).join('')}${goal ? `<line class="goal-line" x1="0" x2="${values.length * 24}" y1="${h - Math.round(goal / max * h)}" y2="${h - Math.round(goal / max * h)}"/>` : ''}</svg>`;
}
const recAction = r => r.kind === 'cards' ? `data-review="${esc(r.documentId || '')}"` : r.kind === 'errors' ? 'data-view="errors"' : r.kind === 'test' && r.documentId ? `data-rec-test="${esc(r.documentId)}"` : r.kind === 'test' ? 'data-view="test"' : r.kind === 'weak' ? `data-rec-topic="${esc(r.documentId)}::${esc(r.topic)}"` : `data-open="${esc(r.documentId)}"`;
const recIcon = { cards: 'cards', weak: 'target', study: 'read', test: 'test', errors: 'alert' };
function recList(list) {
  return `<ul class="rec-list">${list.map(r => `<li><button class="rec" ${recAction(r)}><span class="feature-icon f-${r.kind === 'cards' ? 'amber' : r.kind === 'weak' || r.kind === 'errors' ? 'red' : r.kind === 'test' ? 'green' : 'blue'}">${icon(recIcon[r.kind] || 'bulb', 20)}</span><span class="lr-text"><b>${esc(r.title)}</b><span>${esc(r.why)}</span></span>${icon('chevR', 20)}</button></li>`).join('')}</ul>`;
}
function viewProgress() {
  const s = progressStats(), t = today(), days = lastDays(14, t), mins = days.map(minutesOn);
  const labels = days.map(d => new Date(dayStart(d)).toLocaleDateString(undefined, { weekday: 'short' }));
  const perDoc = state.docs.map(d => ({ d, m: state.sessions.filter(x => x.documentId === d.id).reduce((a, x) => a + x.minutes, 0) })).filter(x => x.m > 0).sort((a, b) => b.m - a.m);
  const general = state.sessions.filter(x => !x.documentId || !docById(x.documentId)).reduce((a, x) => a + x.minutes, 0);
  const maxDoc = Math.max(1, ...perDoc.map(x => x.m), general);
  const tests = state.attempts.slice(0, 12).reverse(), avg = state.attempts.length ? Math.round(state.attempts.reduce((a, x) => a + x.percent, 0) / state.attempts.length) : null;
  const correct = state.days.reduce((a, d) => a + (d.correct || 0), 0), weak = weakAll().slice(0, 6), recs = recommendations(), earned = new Set(earnedBadges(s).map(b => b.id));
  return `${backHead('Progress')}<div class="view narrow progress">
${themeBanner(s)}
<section class="card level-card"><div class="level-top"><div class="level-badge"><span>Level</span><b>${s.lvl.level}</b></div><div class="level-text"><b>${s.xp} XP</b><span class="fine">${s.lvl.need - s.lvl.into} XP to level ${s.lvl.level + 1}</span><span class="meter"><span style="width:${pct(s.lvl.into, s.lvl.need)}%"></span></span></div>
<div class="streak${s.today ? ' is-lit' : ''}">${icon('flame', 26)}<b>${s.current}</b><span>day streak</span></div></div>
<p class="fine">Best streak ${plural(s.longest, 'day')}. XP: 1 per study minute, 2 per flashcard, 5 per section, and up to 20 per test.</p></section>
${recs.length ? `<h2 class="section-h">${icon('bulb', 20)}What to revise next</h2>${recList(recs)}` : ''}
<section class="stats3"><div class="stat"><b>${fmtMin(minutesOn(t))}</b><span>Today (goal ${fmtMin(state.goals.dailyMinutes)})</span></div><div class="stat"><b>${(s.minutes / 60).toFixed(1)} h</b><span>Studied in total</span></div><div class="stat"><b>${avg === null ? '–' : avg + '%'}</b><span>Test average</span></div></section>
<section class="card"><h2 class="h2">${icon('chart', 20)}Minutes studied, last 14 days</h2>${barsSVG(mins, labels, { goal: state.goals.dailyMinutes, unit: ' min' })}<p class="fine">The line is your daily goal.</p></section>
<section class="card topics"><h2>Time per document</h2>${perDoc.length || general ? `<ul>${perDoc.map(x => `<li><div class="topic-row"><span>${esc(docTitle(x.d))}</span><b>${fmtMin(x.m)}</b></div><span class="tbar good"><span style="width:${Math.max(2, pct(x.m, maxDoc))}%"></span></span></li>`).join('')}${general ? `<li><div class="topic-row"><span>General study</span><b>${fmtMin(general)}</b></div><span class="tbar mid"><span style="width:${Math.max(2, pct(general, maxDoc))}%"></span></span></li>` : ''}</ul>` : '<p class="muted">Use the focus timer or read a section to log study time.</p>'}</section>
<section class="card"><h2 class="h2">${icon('trend', 20)}Test scores</h2>${tests.length ? barsSVG(tests.map(a => a.percent), tests.map(a => fmtDate(a.submittedAt)), { unit: '%' }) + `<p class="fine">Your last ${plural(tests.length, 'test')}, oldest on the left. Best ${s.bestPercent}%.</p>` : '<p class="muted">No tests yet.</p>'}
<div class="stats3 inner"><div class="stat"><b>${s.reviews}</b><span>Cards reviewed</span></div><div class="stat"><b>${s.reviews ? pct(correct, s.reviews) + '%' : '–'}</b><span>Remembered</span></div><div class="stat"><b>${openErrors().length}</b><span>Mistakes to retry</span></div></div></section>
<section class="card topics"><h2>Weak sections</h2>${weak.length ? `<ul>${weak.map(w => `<li><button class="topic-btn" data-rec-topic="${esc(w.docId)}::${esc(w.topic)}"><div class="topic-row"><span>${esc(w.topic)} <span class="fine">· ${esc(titleOf(w.docId))}</span></span><b>${w.percent}%</b></div><span class="tbar ${w.percent >= 50 ? 'mid' : 'low'}"><span style="width:${Math.max(2, w.percent)}%"></span></span></button></li>`).join('')}</ul>` : '<p class="muted">Topics where you score under 70% across your tests appear here.</p>'}</section>
<h2 class="section-h">${icon('award', 20)}Badges <span class="count">${earned.size}/${BADGES.length}</span></h2>
<ul class="badges">${BADGES.map(b => `<li class="badge${earned.has(b.id) ? ' is-on' : ''}"><span class="badge-icon">${icon(earned.has(b.id) ? b.icon : 'lock', 22)}</span><b>${esc(b.label)}</b><span>${esc(b.desc)}</span></li>`).join('')}</ul></div>`;
}

/* Theme-only decoration hooks. Hidden by default (.th-only); a theme opts in with CSS. */
function themeChips() {
  const c = [['home', 'For you'], ['cards', `Due ${dueCount()}`], ['planner', 'Planner'], ['focus', 'Focus'], ['errors', 'Mistakes']];
  return `<nav class="th-only th-chips" aria-label="Shortcuts">${c.map(([v, l], i) => `<button class="th-chip${i === 0 ? ' is-on' : ''}" data-view="${v}">${esc(l)}</button>`).join('')}</nav>`;
}
function themeHero(doc, done, total) {
  return `<section class="th-only th-hero"><div class="th-hero-art" aria-hidden="true"></div><div class="th-hero-body"><span class="th-hero-eyebrow">${icon('sparkles', 15)}Tonight's study quest</span><h2>${esc(docTitle(doc))}</h2><p>${done} of ${total} sections explored · keep the streak glowing</p><div class="th-hero-actions"><button class="th-pill light" data-open="${esc(doc.id)}">${icon('map', 17)}Open map</button><button class="th-pill ghost" data-view="cards" aria-label="Review cards">${icon('cards', 18)}</button></div></div></section>`;
}
function themeBanner(s) {
  return `<section class="th-only th-banner"><div class="th-banner-art" aria-hidden="true"></div><div class="th-avatar" aria-hidden="true"></div><h2>Level ${s.lvl.level} scholar</h2><div class="th-stats"><div><b>${s.xp}</b><span>XP</span></div><div><b>${s.current}</b><span>Day streak</span></div><div><b>${s.reviews}</b><span>Cards</span></div></div></section>`;
}
function themeProfile() {
  return `<section class="th-only th-profile"><div class="th-avatar sm" aria-hidden="true"></div><div><b>My study space</b><span>${state.docs.length} ${state.docs.length === 1 ? 'document' : 'documents'} · ${state.cards.length} cards</span></div></section>`;
}
// The "Today" card on Home: streak, minutes against the goal, cards due, the next exam and the top suggestion.
function todayCard() {
  const s = streaks(activeDays(), today()), m = minutesOn(today()), due = dueCount(), rec = recommendations()[0];
  const exam = state.plans.filter(p => p.kind === 'exam' && daysUntil(p.date) >= 0).sort(sortPlans)[0];
  return `<section class="card today-card"><div class="today-grid">
<button class="today-item" data-view="progress"><span class="streak${s.today ? ' is-lit' : ''}">${icon('flame', 22)}</span><b>${s.current}</b><span>Day streak</span></button>
<button class="today-item" data-view="focus"><span class="feature-icon f-violet">${icon('timer', 20)}</span><b>${m}/${state.goals.dailyMinutes}</b><span>Minutes today</span></button>
<button class="today-item" data-view="cards"><span class="feature-icon f-amber">${icon('cards', 20)}</span><b>${due}</b><span>Cards due</span></button>
<button class="today-item" data-view="planner"><span class="feature-icon f-green">${icon('calendar', 20)}</span><b>${exam ? (daysUntil(exam.date) === 0 ? 'Today' : daysUntil(exam.date) + 'd') : '–'}</b><span>${exam ? esc(exam.title.slice(0, 22)) : 'No exam'}</span></button></div>
${rec ? `<button class="rec slim" ${recAction(rec)}>${icon('bulb', 18)}<span class="lr-text"><b>Next: ${esc(rec.title)}</b></span>${icon('chevR', 18)}</button>` : ''}</section>`;
}

/* ---------- read aloud and text size ---------- */
const applyReading = () => { document.documentElement.style.setProperty('--fs', String(state.reading.size)); };
async function toggleSpeak(text, id) {
  if (state.speaking === id) { state.speaking = null; await stopSpeaking(); return render(); }
  state.speaking = id; render();
  speak(text, { rate: state.reading.rate }, () => { state.speaking = null; render(); }).catch(e => { state.speaking = null; fail(e); });
}
function stopReading() { if (state.speaking) { state.speaking = null; stopSpeaking(); } }

// Mind map export: the study map as an indented Markdown outline with your notes (opens in any mind-map app that imports Markdown, such as XMind or Markmap).
function mapMarkdown(doc) {
  const lines = [`# ${docTitle(doc)}`, ''];
  const rootNote = state.notes[noteKey('root', doc.id)]; if (rootNote) lines.push(`> ${rootNote.replace(/\n/g, '\n> ')}`, '');
  const seen = new Set(state.visited[doc.id] || []);
  for (const n of outline(doc)) {
    if (n.id === 'root') continue;
    lines.push(`${'  '.repeat(Math.max(0, n.depth - 1))}- ${seen.has(n.id) ? '[x] ' : ''}${n.title}`);
    const note = state.notes[noteKey(n.id, doc.id)];
    if (note && note.trim()) lines.push(`${'  '.repeat(n.depth)}- Note: ${note.trim().replace(/\n+/g, ' ')}`);
  }
  return lines.join('\n') + '\n';
}

/* =================================================================== timer and live updates */
function updateTimer() {
  if (!examLive() || state.busy) return;
  const now = Date.now(), delta = now - (state.lastTick || now); state.lastTick = now;
  if (state.timeUp) { const b = document.querySelector('[data-tu]'); if (b) b.textContent = Math.max(0, 10 - Math.floor((now - state.timeUp) / 1000)); return; }
  if (isPaused()) return;
  const q = state.questions[Math.min(state.qIndex, state.questions.length - 1)], perQ = state.examMeta?.timing?.perQ || 0;
  state.qTimes = tickQuestion(state.qTimes || {}, q?.id, delta);
  if (q && questionExpired(state.qTimes, q.id, perQ) && !(state.qExpired || []).includes(q.id)) {
    state.qExpired = [...(state.qExpired || []), q.id];
    if (state.qIndex < state.questions.length - 1) { state.qIndex++; toast('Time for that question is up — moved to the next one.', 'warn'); render(); }
  }
  const lim = examMinutes(), w = dueWarning(timeLeft(), state.warned || [], lim);
  if (w) { state.warned = [...(state.warned || []), ...[600, 300, 60].filter(x => x >= w)]; toast(`${w / 60} minute${w === 60 ? '' : 's'} left.`, w === 60 ? 'error' : 'warn'); chime(false); saveDraft(); }
  const left = timeLeft(), txt = fmtTime(left);
  const t = document.getElementById('timer-text');
  if (t) t.textContent = txt;
  const arc = document.getElementById('timer-arc');
  if (arc) { const c = 2 * Math.PI * 54; arc.setAttribute('stroke-dashoffset', (c * (1 - Math.max(0, left) / (examMinutes() * 60000))).toFixed(2)); arc.classList.toggle('is-low', left < 300000); }
  document.querySelectorAll('[data-timer-badge]').forEach(b => { b.textContent = txt; });
  if (examMinutes() && left <= 0 && !state.autoFailed && !state.timeUp) timeUp();   // runs on every screen, not only Test
}
// Time's up: a short confirm with a 10-second countdown, then the test is submitted.
function timeUp() {
  state.timeUp = Date.now(); render();
  const go = () => { if (!state.timeUp || !examLive()) return; state.timeUp = 0; submit().catch(fail); };
  clearTimeout(state.timeUpT); state.timeUpT = setTimeout(go, 10000);
}
const timeUpHTML = () => state.timeUp && examLive() ? `<div class="onboard" role="alertdialog" aria-modal="true" aria-labelledby="tu-h"><div class="ob-card card"><span class="ob-art">${icon('hourglass', 44)}</span><h1 id="tu-h">Time’s up</h1><p>Your answers will be submitted in <b data-tu>${Math.max(0, 10 - Math.floor((Date.now() - state.timeUp) / 1000))}</b> s.</p><div class="ob-acts"><button class="btn primary" data-action="timeUpNow">Submit now</button></div></div></div>` : '';
function refreshProgress() {
  const qs = state.questions; if (!qs) return;
  const done = qs.filter(answered).length;
  const c = document.getElementById('answered-count'); if (c) c.textContent = `${done} of ${qs.length} answered`;
  const f = document.getElementById('qbar-fill'); if (f) f.style.width = pct(done, qs.length) + '%';
}

/* =================================================================== actions */
function fail(e) { state.busy = ''; state.error = e?.message || String(e); render(); }
function go(view, { push = true, keep = false } = {}) {
  if (!VIEWS.includes(view)) return;
  if (view !== 'test') state.review = null;
  if (view !== 'cards') state.fc = null;
  if (view !== 'section' || state.view !== 'section') stopReading();
  if (view !== 'errors') state.retry = null;
  Object.assign(state, { view, menu: false, showGrid: false });
  if (!keep) Object.assign(state, { error: '', notice: '' });
  if (push && location.hash !== '#' + view) location.hash = view;   // lets the Android back button step between screens
  render(); window.scrollTo(0, 0);
}
function goBack() {
  if (state.view === 'test' && shown()) { if (state.review) return go('results'); return actions.reset(); }
  const to = BACK[state.view] || 'home';
  go(to);
}
function selectDoc(id) {
  if (state.doc === id) return;
  Object.assign(state, { doc: id, selected: 'root', questions: null, answers: {}, flags: new Set(), qIndex: 0, result: null, review: null, showReview: false, conn: null, studyTab: 'map' });
  restoreDraft();
}
function openSection(id, tab = 'content') { if (id !== state.selected) { state.askDraft = ''; stopReading(); } state.selected = id; state.sectionTab = tab; go('section'); }
// Replaces a document's sections (AI-organised or original). Notes and study progress move to the section that
// now holds their text (notes that can't be placed go to the whole-document notes); old explanations are cleared.
async function setStructure(doc, sections, extra = {}) {
  const id = doc.id, map = matchSections(doc.sections, sections), moved = {};
  for (const k of Object.keys(state.notes)) {
    if (!k.startsWith(id + '::s')) continue;
    const j = map.get(Number(k.slice(id.length + 3))), note = state.notes[k], to = j === undefined ? 'root' : 's' + j;
    delete state.notes[k];
    if (String(note).trim()) moved[to] = moved[to] ? moved[to] + '\n\n' + note : note;
  }
  for (const [to, note] of Object.entries(moved)) { const key = `${id}::${to}`; state.notes[key] = state.notes[key] ? state.notes[key] + '\n\n' + note : note; }
  persistNotes();
  state.visited[id] = [...new Set((state.visited[id] || []).map(v => map.get(Number(String(v).slice(1)))).filter(j => j !== undefined).map(j => 's' + j))];
  writeJSON('prvlar-visited', state.visited);
  await db.settings.where('key').startsWith('explain::' + id).delete();
  await db.settings.where('key').startsWith('ask::' + id).delete();
  for (const k of Object.keys(state.explain)) if (k.startsWith('explain::' + id)) delete state.explain[k];
  for (const k of Object.keys(state.asks)) if (k.startsWith('ask::' + id)) delete state.asks[k];
  const updated = { ...doc, ...extra, sections };
  await saveDocument(updated);
  state.docs = state.docs.map(d => d.id === id ? updated : d);
  Object.assign(state, { selected: 'root', collapsedFor: null, animatedFor: null, studyTab: 'map', menu: false });
}

async function refresh() {
  [state.docs, state.attempts] = await Promise.all([getDocuments(), getAttempts(), reloadStudyData()]);
  if (!state.docs.some(d => d.id === state.doc)) { state.doc = state.docs[0]?.id || null; state.selected = 'root'; }
  render();
  updateStorage();
}

async function submit() {
  if (!state.questions || state.busy || state.result) return;
  state.busy = 'submit';
  if (state.view === 'test') render();
  try {
    saveDraft();
    const doc = current(), { questions } = state, answers = { ...state.answers };
    const grades = state.examMeta?.profileId
      ? questions.filter(q => q.type !== 'written').map(q => { const n = scoreQuestion(q, answers[q.id]); return { id: q.id, awarded: n, max: q.marks, method: 'answer key', feedback: n >= q.marks ? 'Correct answer.' : n > 0 ? 'Partly correct: some correct options were left out.' : n < 0 ? `Wrong: ${neg(q.negative)} marks.` : 'Not answered or not correct.' }; })
      : gradeMCQ(questions, answers);
    const written = questions.filter(q => q.type === 'written');
    if (written.length) {
      try {
        if (!aiAvailable()) throw Error('no AI key or AI server is set');
        if (!state.aiConsent) throw Error('sending answers to the AI was not confirmed');
        if (!usingServer() && !navigator.onLine) throw Error('you are offline');
        grades.push(...await gradeWritten(doc, aiConfig(), questions, answers));
      } catch (e) {
        grades.push(...written.map(q => ({ id: q.id, awarded: 0, max: q.marks, method: 'self assessment pending', feedback: 'Automatic marking was not available. Compare your answer with the model answer, then enter your own mark.' })));
        state.error = 'Mark your written answers yourself: ' + e.message + '.';
      }
    }
    const attempt = makeAttempt(state.doc, questions, answers, state.startedAt, Date.now(), grades, doc?.name || '');
    attempt.timing = { limitMin: examMinutes(), activeMs: activeMs(state.startedAt, Date.now(), state.pauses || []), qTimes: { ...(state.qTimes || {}) }, perQ: state.examMeta?.timing?.perQ || 0 };
    if (state.examMeta?.profileId) { attempt.exam = state.examMeta; attempt.percent = Math.max(0, attempt.percent); }
    await saveAttempt(attempt);
    state.attempts = await getAttempts();
    Object.assign(state, { result: attempt, showGrid: false, showReview: false });
    sessionStorage.removeItem(draftKey(state.doc));
    await recordTrace(traceFromAttempt(attempt, topicPerformance(attempt, doc), attempt.exam ? 'exam' : 'test')).catch(() => {});
    const made = await mistakeCards(attempt).catch(() => 0);
    if (made && !state.error) state.notice = `${plural(made, 'flashcard')} made from the questions you got wrong. Find ${made === 1 ? 'it' : 'them'} in Flashcards and Mistakes.`;
  } catch (e) { state.autoFailed = true; throw e; } finally { state.busy = ''; }
  if (state.view !== 'test') go('test', { keep: true }); else { render(); window.scrollTo(0, 0); }
}

function setZoom(z) { state.zoom = Math.round(Math.min(2, Math.max(0.3, z)) * 100) / 100; saveView(); render(); }
function gotoQ(i) { state.qIndex = Math.max(0, Math.min(state.questions.length - 1, i)); state.showGrid = false; saveDraft(); render(); window.scrollTo(0, 0); }

async function sendAsk(question) {
  const doc = current(), node = outline(doc).find(n => n.id === state.selected);
  if (!node?.text || !question.trim() || state.busy) return;
  const ai = requireAi('ask questions');
  if (!consentFor(doc)) return;
  const k = askKey(doc.id, node.id), thread = state.asks[k] || (state.asks[k] = []);
  thread.push({ role: 'user', text: question.trim() });
  state.askDraft = ''; state.busy = 'ask'; render(); revealComposer('askq');
  try {
    const answer = await askSection(node.title, node.text, question.trim(), ai, thread.slice(0, -1));
    thread.push({ role: 'ai', text: answer });
    setSetting(k, thread.slice(-30)).catch(() => {});
  } catch (e) { thread.pop(); state.askDraft = question; throw e; } finally { state.busy = ''; }
  render(); revealComposer('askq');
}
// Keeps the question box (and the newest answer above it) on screen after sending.
function revealComposer(id) {
  if (id === 'askq' && isWide()) return;              // the side panel scrolls by itself
  const el = document.getElementById(id);
  if (el) try { el.scrollIntoView({ block: 'nearest' }); } catch { el.scrollIntoView(false); }
}
async function sendChat(question) {
  const doc = current();
  if (!doc || !question.trim() || state.busy) return;
  const ai = requireAi('chat about your document');
  if (!consentFor(doc)) return;
  const thread = state.chats[doc.id] || (state.chats[doc.id] = []);
  thread.push({ role: 'user', text: question.trim() });
  state.chatDraft = ''; state.busy = 'chat'; render(); revealComposer('chatq');
  try {
    const r = await chatDocument(doc, question.trim(), ai, thread.slice(0, -1), { docsOnly: docsOnly() });
    thread.push({ role: 'ai', text: r.text, general: r.general, topic: question.trim().slice(0, 80) });
    setSetting('chat::' + doc.id, thread.slice(-40)).catch(() => {});
  } catch (e) { thread.pop(); state.chatDraft = question; throw e; } finally { state.busy = ''; }
  render(); revealComposer('chatq');
}

// Figures on questions: a past-paper figure the question was built from, or the page of your PDF it cites.
const pageOf = src => Number((String(src || '').match(/\bpage\s*(\d+)/i) || [])[1]) || 0;
function attachFigures(questions, figures, doc) {
  return questions.map(q => {
    const f = matchFigure({ prompt: q.prompt, figure: q.figureRef }, figures);
    if (f) return { ...q, figure: { img: f.img, caption: `Figure from past paper${f.q ? `, question ${f.q}` : ''} (page ${f.page})` } };
    const n = pageOf(q.source);
    return n && doc?.figPages?.includes(n) ? { ...q, figurePage: { docId: doc.id, page: n } } : q;
  });
}
const figureHTML = q => q.figure ? `<figure class="q-fig"><button class="zoomable" data-zoom="${esc(q.figure.img)}" aria-label="Zoom figure"><img src="${esc(q.figure.img)}" alt="${esc(q.figure.caption)}"></button><figcaption>${esc(q.figure.caption)} · tap to zoom</figcaption></figure>`
  : q.figurePage ? `<button class="btn outline sm q-figbtn" data-figpage="${esc(q.figurePage.docId)}:${q.figurePage.page}">${icon('file', 16)}Show figure (page ${q.figurePage.page})</button>` : '';
function figButtons(m) {
  const set = new Map();
  for (const x of m.sources || []) { const d = docById(x.docId), n = pageOf(x.ref); if (n && d?.figPages?.includes(n)) set.set(d.id + ':' + n, n); }
  const d = current(); if (!m.sources && d?.figPages) for (const mm of String(m.text).matchAll(/\[page\s*(\d+)\]/gi)) if (d.figPages.includes(+mm[1])) set.set(d.id + ':' + mm[1], +mm[1]);
  return set.size ? `<div class="sm-src">${[...set].slice(0, 4).map(([k, n]) => `<button class="chip fig-chip" data-figpage="${esc(k)}">${icon('file', 13)} Figure · p. ${n}</button>`).join('')}</div>` : '';
}
async function showFigure(key) {
  const i = key.lastIndexOf(':'), docId = key.slice(0, i), n = +key.slice(i + 1);
  const bytes = await getBlob('pdf:' + docId);
  if (!bytes) throw Error('The original PDF is not stored for this document. Import it again to see its pages.');
  zoomImage(await renderPdfPage(bytes, n));
}

// Shared by AI Chat and Smarty: "Only use my documents" switch, general-knowledge badge, pictures.
const docsOnly = () => readJSON('prvlar-docs-only', false) === true;
const docsOnlyToggle = () => `<label class="toggle-row compact"><span><b>Only use my documents</b><span>Off: answers from your documents first, then general knowledge (marked).</span></span><input type="checkbox" id="docsonly"${docsOnly() ? ' checked' : ''}><span class="switch${docsOnly() ? ' is-on' : ''}" aria-hidden="true"><span></span></span></label>`;
function msgExtras(m, scope, i) {
  if (m.role === 'user') return '';
  const imgs = m.images ? (m.images.length ? `<div class="cm-imgs">${m.images.slice(0, 3).map(x => `<figure class="cm-img"><button class="zoomable" data-zoom="${esc(x.thumb)}" aria-label="Zoom picture"><img src="${esc(x.thumb)}" alt="${esc(x.title)}" loading="lazy"></button><figcaption>${esc(x.title)} · ${esc(x.author)} · <a href="${esc(x.licenseUrl || x.page)}" target="_blank" rel="noopener">${esc(x.license)}</a> · <a href="${esc(x.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>`).join('')}</div>` : '<p class="fine">No freely licensed picture found.</p>') : '';
  return `${m.general ? `<span class="chip warn gen-badge">${icon('info', 13)} Not from your documents</span>` : ''}${figButtons(m)}${imgs}<div class="msg-tools"><button class="link-btn" data-findimg="${scope}:${i}"${state.busy ? ' disabled' : ''}>${icon('search', 14)}Find image</button></div>`;
}
async function findImage(scope, i) {
  const th = scope === 'smarty' ? state.smartyChat : state.chats[state.doc]; const m = th?.[i]; if (!m || state.busy) return;
  const q = m.topic || th[i - 1]?.text || ''; if (!q.trim()) return;
  state.busy = 'img'; render();
  try { m.images = await findCommonsImages(q.slice(0, 80)); } finally { state.busy = ''; }
  render();
}
/* ---------- Smarty explains a selection (text, notes, or a picture area) ---------- */
const SEL_AREAS = '.reading, .notes-area, .ocr-text, .doc-text, .pdf-text, .explain-text';
function blockText(el) { return (el?.innerText || el?.textContent || '').trim(); }
function readSelection() {
  const ae = document.activeElement;
  if (ae && ae.matches?.('textarea.notes-area, textarea.ocr-text')) {
    const v = ae.value, a = ae.selectionStart, b = ae.selectionEnd; const text = v.slice(a, b).trim();
    return text.length >= 3 ? { text, before: v.slice(Math.max(0, a - 600), a), after: v.slice(b, b + 600) } : null;
  }
  const sel = window.getSelection?.(); if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const text = sel.toString().trim(); if (text.length < 3) return null;
  const r = sel.getRangeAt(0), host = (r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement);
  if (!host?.closest?.(SEL_AREAS)) return null;
  const blk = n => (n.nodeType === 1 ? n : n.parentElement)?.closest('p, li, h1, h2, h3, h4, pre, blockquote, td, div.reading > *');
  const first = blk(r.startContainer), last = blk(r.endContainer);
  return { text, before: blockText(first?.previousElementSibling), after: blockText(last?.nextElementSibling), rect: r.getBoundingClientRect() };
}
function selButton() {
  let b = document.getElementById('sm-sel-btn');
  if (!b) { b = document.createElement('button'); b.id = 'sm-sel-btn'; b.className = 'sm-sel-btn'; b.type = 'button'; b.hidden = true; b.innerHTML = `${icon('smarty', 16)} Smarty explains`;
    b.addEventListener('pointerdown', e => e.preventDefault());   // keep the selection
    b.addEventListener('click', () => actions.explainSel()); document.body.appendChild(b); }
  return b;
}
document.addEventListener('selectionchange', () => {
  const s = readSelection(), b = selButton();
  if (!s) { b.hidden = true; return; }
  state.sel = { text: s.text, before: s.before, after: s.after };
  const r = s.rect || document.activeElement?.getBoundingClientRect?.();
  b.hidden = false;
  if (r) { b.style.top = Math.max(8, Math.min(innerHeight - 52, (r.bottom || 0) + 8)) + 'px'; b.style.left = Math.max(8, Math.min(innerWidth - 180, (r.left || 0))) + 'px'; }
});
function selExplainHTML() {
  const x = state.selExp; if (!x) return '';
  return `<div class="zoom-ov sel-exp-ov" role="dialog" aria-modal="true" aria-label="Smarty explains"><div class="card sel-exp"><div class="ask-head"><span class="ask-icon">${icon('smarty', 20)}</span><h2>Smarty explains</h2><button class="icon-btn soft" data-action="selExpClose" aria-label="Close">✕</button></div>
${x.image ? `<img class="sel-exp-img" src="${x.image}" alt="Selected area">` : `<blockquote class="sel-quote">${esc(x.text.slice(0, 400))}${x.text.length > 400 ? '…' : ''}</blockquote>`}
${x.busy ? '<p><span class="spin"></span> Smarty is explaining…</p>' : x.error ? `<p class="status warn">${esc(x.error)}</p>` : paras(x.explanation || '')}
<p class="fine">Made by Smarty from your selection only. Check it against your document.</p></div></div>`;
}
async function runSelExplain(sel, images = []) {
  const ai = requireAi('get explanations');
  if (!confirm(images.length ? 'Send the selected picture area to Smarty for an explanation?' : 'Send the selected text (and a line of context around it) to Smarty for an explanation?')) return;
  const doc = current();
  state.selExp = { ...sel, busy: true }; render();
  try { state.selExp = { ...sel, explanation: await explainSelection({ title: doc ? docTitle(doc) : '', selection: sel.text || '', before: sel.before || '', after: sel.after || '' }, ai, images) }; }
  catch (e) { state.selExp = { ...sel, error: e?.message || String(e) }; }
  render();
}
// Drag to select an area of a picture (scans, PDF pages); the crop goes to Smarty with vision.
function areaSelect(img, done) {
  const box = img.parentElement; box.classList.add('area-mode'); let st = null; const r = document.createElement('div'); r.className = 'area-rect'; box.appendChild(r);
  const pt = e => { const b = img.getBoundingClientRect(); return [Math.max(0, Math.min(b.width, e.clientX - b.left)), Math.max(0, Math.min(b.height, e.clientY - b.top)), b]; };
  const draw = (a, c) => { const ib = img.getBoundingClientRect(), bb = box.getBoundingClientRect(); Object.assign(r.style, { left: ib.left - bb.left + Math.min(a[0], c[0]) + 'px', top: ib.top - bb.top + Math.min(a[1], c[1]) + 'px', width: Math.abs(c[0] - a[0]) + 'px', height: Math.abs(c[1] - a[1]) + 'px' }); };
  img.addEventListener('pointerdown', e => { e.preventDefault(); st = pt(e); img.setPointerCapture?.(e.pointerId); });
  img.addEventListener('pointermove', e => { if (st) draw(st, pt(e)); });
  img.addEventListener('pointerup', e => { if (!st) return; const en = pt(e), b = en[2], sx = img.naturalWidth / b.width, sy = img.naturalHeight / b.height;
    const x = Math.min(st[0], en[0]), y = Math.min(st[1], en[1]), w = Math.abs(en[0] - st[0]), h = Math.abs(en[1] - st[1]); st = null;
    if (w < 12 || h < 12) return; const c = document.createElement('canvas'); const scale = Math.min(1, 1400 / Math.max(w * sx, h * sy)); c.width = Math.round(w * sx * scale); c.height = Math.round(h * sy * scale);
    c.getContext('2d').drawImage(img, x * sx, y * sy, w * sx, h * sy, 0, 0, c.width, c.height); done(c.toDataURL('image/jpeg', 0.85)); });
}
function zoomImage(src) {
  const o = document.createElement('div'); o.className = 'zoom-ov'; o.setAttribute('role', 'dialog'); o.innerHTML = `<div class="zoom-in"><img alt="Zoomed picture"></div><button class="icon-btn round zoom-x" aria-label="Close">✕</button>`;
  o.querySelector('img').src = src; o.addEventListener('click', e => { if (e.target === o || e.target.closest('.zoom-x')) o.remove(); });
  const im = o.querySelector('img'); let area = false;
  im.addEventListener('click', e => { if (!area) e.currentTarget.classList.toggle('is-big'); });
  const sb = document.createElement('button'); sb.className = 'btn primary zoom-area'; sb.innerHTML = `${icon('smarty', 16)} Select an area for Smarty`;
  sb.addEventListener('click', e => { e.stopPropagation(); if (area) return; area = true; sb.textContent = 'Drag over the part to explain'; areaSelect(im, url => { o.remove(); runSelExplain({ text: '', image: url }, [url]).catch(err => toast(err.message, 'error')); }); });
  o.appendChild(sb);
  document.body.appendChild(o);
}

// ---------- Smarty: personal tutor (memory, profile, grounded chat, verified practice) ----------
let smIdx = null, smKey = '';
function smartyIndex() { const k = state.docs.map(d => d.id + ':' + (d.sections || []).length).join('|'); if (k !== smKey) { smIdx = buildIndex(chunkDocs(state.docs)); smKey = k; } return smIdx; }
async function recordTrace(trace) {
  state.traces = [...(state.traces || []), trace]; await saveTrace(trace);
  state.learner = updateProfile(state.learner, trace); await setSetting('learner-profile', state.learner);
}
// Conversations (history drawer): each has an id, title, messages and time. The open one is state.smartyChat.
async function loadConvs() {
  if (state.smConvs) return; state.smConvs = (await getSetting('smarty-convs').catch(() => null)) || [];
  const old = await getSetting('smarty-chat').catch(() => null);
  if (!state.smConvs.length && Array.isArray(old) && old.length) state.smConvs = [{ id: uuid(), title: String(old[0]?.text || 'Chat').slice(0, 60), msgs: old, at: Date.now() }];
  const c = state.smConvs[0]; state.smConv = c?.id || null; state.smartyChat = c ? c.msgs : [];
  if (state.view === 'smarty') render();
}
function saveConvs() {
  const th = state.smartyChat || []; if (!th.length) return;
  let c = state.smConvs.find(x => x.id === state.smConv);
  if (!c) { c = { id: uuid(), title: String(th[0].text).slice(0, 60), msgs: th, at: Date.now() }; state.smConvs.unshift(c); state.smConv = c.id; }
  c.msgs = th; c.at = Date.now(); state.smConvs.sort((a, b) => b.at - a.at);
  setSetting('smarty-convs', state.smConvs.slice(0, 60).map(x => ({ ...x, msgs: x.msgs.slice(-40) }))).catch(() => {});
}
const SM_SERVICES = () => [['auto', 'Auto (fallback order)'], ...fallbackChain().map((c, i) => [String(i), describeAI(c)])];
function smartyAi() { const pick = state.smModel || 'auto', chain = fallbackChain(); if (pick === 'auto' || !chain[+pick]) return aiConfig(); return state.fb?.on ? { chain: [chain[+pick], ...chain.filter((_, i) => i !== +pick)] } : chain[+pick]; }
function smartyConsent() { if (state.smartyOk) return true; if (!confirm('Smarty sends short excerpts from your documents and a summary of your weak topics to the AI service. Continue?')) return false; state.smartyOk = true; return true; }
async function smartySend(q) {
  q = String(q || '').trim(); if (!q || state.busy) return;
  requireAi('ask Smarty'); const ai = smartyAi(); if (!smartyConsent()) return;
  await loadConvs(); const th = state.smartyChat || (state.smartyChat = []);
  const slash = parseSlash(q, skillsList()); const skill = slash.skill || (state.smSkill && skillsList().find(x => x.id === state.smSkill)) || null; if (slash.skill) q = slash.rest || q;
  const att = (state.smAtt || []).filter(a => !a.busy && !a.error), images = att.filter(a => a.image || a.audio).map(a => a.image || a.audio);
  th.push({ role: 'user', text: (skill ? `/${skill.name} ` : '') + q, files: att.map(a => a.name) }); state.smartyDraft = ''; state.busy = 'smarty'; state.smPlus = false; state.smSuggest = null; render();
  const extra = skillPrompt(skill) + attachmentBlock(att);
  try {
    const hits = retrieve(smartyIndex(), q, 6);
    let r = null, webNote = '';
    if (state.smWeb && !docsOnly()) {
      const gk = state.key.trim().startsWith('AIza') ? state.key.trim() : (state.fb?.gemini || '').trim();
      try { const w = await webSearchAnswer(gk, q, { system: 'You are Smarty, a friendly tutor. Answer clearly for a student, using the web results. Use Markdown.', extra: extra + (hits.length ? '\nSTUDENT NOTES (untrusted):\n' + hits.map(h => h.text).join('\n').slice(0, 6000) : '') });
        r = { text: w.text, sources: [], web: w.sources, topic: '', general: true }; }
      catch (e) { webNote = e.code === 'NO_GROUNDING' ? 'Web search needs a free Gemini key, so this was answered without searching.' : e.code === 'RATE' ? 'Google web search isn’t available on this key’s free quota right now, so this was answered without searching.' : `Web search failed (${e.message}), so this was answered without searching.`; }
    }
    if (!r) r = await smartyAnswer(q, hits, ai, { level: tutorLevel(state.learner, q), hint: profileHint(state.learner), history: th.slice(0, -1), docsOnly: docsOnly(), extra, images });
    th.push({ role: 'ai', text: r.text, sources: r.sources, topic: r.topic, general: r.general, web: r.web, webNote, skill: skill?.title });
    state.smAtt = [];
    await recordTrace(makeTrace({ kind: 'tutor', topic: r.topic || q.slice(0, 60), summary: q.slice(0, 200), steps: r.sources.map(x => 'Used ' + x.cite) })).catch(() => {});
    saveConvs();
  } catch (e) { th.pop(); state.smartyDraft = q; throw e; } finally { state.busy = ''; }
  render(); revealComposer('smartyq');
}
async function startPractice() {
  if (state.busy) return; const ai = requireAi('make practice questions'); if (!ai || !smartyConsent()) return;
  const targets = practiceTargets(state.learner, 3);
  state.busy = 'practice'; render();
  try {
    const idx = smartyIndex(), q = targets.map(t => t.topic).join(' ');
    let hits = q ? retrieve(idx, q, 8) : []; if (hits.length < 3) hits = [...hits, ...idx.chunks.filter((_, i) => i % Math.max(1, Math.floor(idx.chunks.length / 8)) === 0).slice(0, 8 - hits.length)];
    state.practice = { items: await smartyPractice(targets, hits, ai, 5), answers: {}, targets };
  } finally { state.busy = ''; }
  render();
}
function finishPractice() { const p = state.practice; if (p.done) return; p.done = true; recordTrace(traceFromPractice(p.items, p.answers)).then(render).catch(() => {}); }
const masteryBar = t => `<li class="sm-topic"><span>${esc(t.name)}</span><span class="sm-bar" aria-label="${Math.round(t.mastery * 100)}% mastery"><i style="width:${Math.round(t.mastery * 100)}%"></i></span><b>${Math.round(t.mastery * 100)}%</b></li>`;

/* ---------- Smarty '+' menu: attachments, photo, skills, web search ---------- */
const skillsList = () => (state.skills ??= (readJSON(SKILLS_KEY, []) || []).filter(x => x && x.id && x.title));
const saveSkills = l => { state.skills = l; writeJSON(SKILLS_KEY, l); };
const KIND_ICON = { pdf: 'file', image: 'image', docx: 'file', pptx: 'file', xlsx: 'outline', csv: 'outline', text: 'file', audio: 'listen' };
function smComposerExtras() {
  state.smWeb ??= !!readJSON('prvlar-smweb', false);
  const att = state.smAtt || [], sk = state.smSkill && skillsList().find(x => x.id === state.smSkill), sug = !sk && state.smSuggest && skillsList().find(x => x.id === state.smSuggest);
  const menu = state.smPlus ? `<div class="sm-plus-menu" role="menu">
<label class="sm-plus-item" role="menuitem">${icon('upload', 18)}<span>Upload file</span><input type="file" data-smattach multiple hidden></label>
<label class="sm-plus-item" role="menuitem">${icon('camera', 18)}<span>Take photo</span><input type="file" data-smattach accept="image/*" capture="environment" hidden></label>
<button class="sm-plus-item" role="menuitem" data-action="smUseSkill">${icon('sparkles', 18)}<span>Use a skill</span></button>
<button class="sm-plus-item" role="menuitem" data-action="skillNew">${icon('plus', 18)}<span>Create skill</span></button>
${state.smPickSkill ? `<div class="sm-skill-pick">${skillsList().length ? skillsList().map(x => `<button class="chip-btn" data-smskill="${esc(x.id)}">/${esc(x.name)}</button>`).join('') : '<p class="fine">No skills yet. Create one first.</p>'}</div>` : ''}</div>` : '';
  const chips = att.map(a => `<span class="att-chip${a.error ? ' bad' : ''}" title="${esc(a.error || a.note || '')}">${a.image ? `<img src="${a.image}" alt="">` : icon(KIND_ICON[a.kind] || 'file', 15)}<span class="att-name">${esc(a.name)}</span><span class="fine">${a.busy ? 'reading…' : a.error ? 'error' : (a.size / 1024 < 1024 ? Math.max(1, Math.round(a.size / 1024)) + ' KB' : (a.size / 1048576).toFixed(1) + ' MB')}</span><button class="att-x" data-smattrm="${esc(a.id)}" aria-label="Remove ${esc(a.name)}">×</button></span>`).join('');
  const notes = att.filter(a => a.note || a.error).map(a => `<p class="fine ${a.error ? 'bad' : ''}">${esc((a.error || '').startsWith(a.name) ? a.error : `${a.name}: ${a.error || a.note}`)}</p>`).join('');
  return `${menu}<div class="sm-extras">${chips}${sk ? `<span class="att-chip skill">${icon('sparkles', 15)}<span class="att-name">/${esc(sk.name)}</span><button class="att-x" data-action="smSkillClear" aria-label="Stop using this skill">×</button></span>` : ''}${sug ? `<button class="chip-btn sm-suggest" data-smskill="${esc(sug.id)}">${icon('sparkles', 14)} Use skill “${esc(sug.title)}”?</button>` : ''}
<button class="chip-btn${state.smWeb ? ' is-on' : ''}" data-action="smWeb" aria-pressed="${!!state.smWeb}">${icon('search', 14)} Search the web</button></div>${notes}`;
}
async function addAttachments(files) {
  const list = state.smAtt || (state.smAtt = []);
  for (const f of [...files]) {
    if (list.length >= MAX_FILES) { toast(`Up to ${MAX_FILES} files per message.`, 'warn'); break; }
    const tmp = { id: Math.random().toString(36).slice(2), name: f.name, size: f.size, kind: 'file', busy: true }; list.push(tmp); render();
    try { Object.assign(tmp, await readAttachment(f, { parseFile, JSZip, toDataURL: x => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(Error('Could not read the picture.')); r.readAsDataURL(x); }) }), { busy: false }); }
    catch (e) { tmp.busy = false; tmp.error = e.message || 'Could not read this file.'; }
    render();
  }
}
function skillsHTML() {
  const l = skillsList(), ed = state.skillEdit;
  const editor = ed ? `<section class="card skill-edit"><h2 class="h3">${ed.id ? 'Edit skill' : 'New skill'}</h2>
<label class="field"><span>Ask Smarty to write it (optional)</span><div class="composer"><input class="input" id="sk-ask" placeholder="e.g. make a skill that turns a chapter into 10 flashcards" autocomplete="off"><button class="btn outline" data-action="skillDraft"${state.busy ? ' disabled' : ''}>${state.busy === 'skill' ? '<span class="spin"></span>' : icon('sparkles', 16)}Draft</button></div></label>
<label class="field"><span>Name</span><input class="input" id="sk-title" value="${esc(ed.title || '')}" maxlength="60" placeholder="Flashcard maker"></label>
<label class="field"><span>When to use</span><input class="input" id="sk-when" value="${esc(ed.when || '')}" maxlength="200" placeholder="When I want to revise a chapter quickly"></label>
<label class="field"><span>Steps (one per line)</span><textarea class="input" id="sk-steps" rows="6" placeholder="Find the 10 most important facts&#10;Write each as a question and answer">${esc((ed.steps || []).join('\n'))}</textarea></label>
<label class="field"><span>Output format (optional)</span><input class="input" id="sk-format" value="${esc(ed.format || '')}" maxlength="400" placeholder="A numbered list of Q: … A: …"></label>
<div class="code-acts"><button class="btn primary" data-action="skillSave">${icon('check', 17)}Save skill</button><button class="btn outline" data-action="skillCancel">Cancel</button></div></section>` : '';
  return `${editor}<section class="card"><div class="row between"><h2 class="h3">Your skills</h2>${ed ? '' : `<button class="btn primary sm" data-action="skillNew">${icon('plus', 16)}New skill</button>`}</div>
<p class="fine">A skill is a set of steps Smarty follows. Pick one from <b>+</b>, or type <code>/name</code> before your question. Saved on this device and synced if you sign in.</p>
${l.length ? `<ul class="skill-list">${l.map(x => `<li><div><b>${esc(x.title)}</b> <code>/${esc(x.name)}</code>${x.when ? `<p class="fine">${esc(x.when)}</p>` : ''}</div><div class="code-acts"><button class="btn outline sm" data-skilledit="${esc(x.id)}">Edit</button><button class="btn ghost danger sm" data-skilldel="${esc(x.id)}">Delete</button></div></li>`).join('')}</ul>` : '<p class="muted">No skills yet.</p>'}</section>`;
}
function readSkillForm(ed) { const v = id => document.getElementById(id)?.value || ''; return { ...ed, title: v('sk-title'), when: v('sk-when'), steps: v('sk-steps'), format: v('sk-format') }; }

/* ---------- Report a problem + automatic error reports ---------- */
// REPORT_URL: the owner's Google Apps Script web app (responses land in the owner's Sheet). Public build config.
const REPORT_URL = String(import.meta.env?.VITE_REPORT_URL || '').trim();
let REPORT_EMAIL = '', REPORT_CSV = '';   // the owner pack may set them (never in the public bundle)
const reportRepo = () => UPDATE_REPO || (/github\.io$/.test(location.hostname) && location.pathname.split('/').filter(Boolean)[0] ? `${location.hostname.split('.')[0]}/${location.pathname.split('/').filter(Boolean)[0]}` : '');
const autoReportsOn = () => readJSON('prvlar-report-auto', true) !== false;
const diagNow = () => ({ version: VERSION, platform: platform(), userAgent: navigator.userAgent, screen: `${innerWidth}×${innerHeight}`, theme: state.theme, online: navigator.onLine, log: [...crashes().slice(-5).map(c => 'crash: ' + c.msg), ...logs.all().filter(l => l.lvl === 'error' || l.lvl === 'warn').slice(-10).map(l => `${l.lvl}: ${l.msg}`)] });
function reportHTML() {
  const r = state.reportForm || (state.reportForm = { text: '', diag: true, shot: '' }), sent = state.reportSent;
  return `${backHead('Report a problem')}<div class="view narrow"><section class="card report-card"><h1 class="h2">${icon('bug', 22)}Report a problem</h1>
<p class="fine">Tell us what happened. Reports go to the app’s developer${REPORT_URL ? '' : ' through GitHub or email'}; we can’t reply unless you leave a contact.</p>
<label class="field"><span>What went wrong?</span><textarea class="input" id="rp-text" rows="6" maxlength="4000" placeholder="What did you do, what did you expect, what happened instead?">${esc(r.text)}</textarea></label>
<label class="btn outline file-btn">${icon('camera', 17)}<span>${r.shot ? 'Screenshot added' : 'Add a screenshot (optional)'}</span><input type="file" accept="image/*" data-rpshot hidden></label>${r.shot ? ` <button class="btn ghost sm" data-action="rpShotRm">Remove</button>` : ''}
<label class="toggle-row compact"><span><b>Include diagnostics</b><span>App version, platform, screen size, theme and recent app errors. No documents, names, emails or keys.</span></span><input type="checkbox" class="switch" id="rp-diag"${r.diag ? ' checked' : ''}></label>
<label class="field"><span>Contact (optional)</span><input class="input" id="rp-contact" maxlength="120" placeholder="Email or handle, only if you want a reply" value="${esc(r.contact || '')}" autocomplete="off"></label>
<div class="code-acts">${REPORT_URL ? `<button class="btn primary" data-action="rpSend">${icon('send', 17)}Send report</button>` : ''}${reportRepo() ? `<button class="btn ${REPORT_URL ? 'outline' : 'primary'}" data-action="rpIssue">${icon('share', 17)}Open as GitHub issue</button>` : ''}${REPORT_EMAIL ? `<button class="btn outline" data-action="rpMail">Email it</button>` : ''}<button class="btn outline" data-action="rpCopy">Copy report</button></div>
${sent ? `<p class="status ok" role="status">${esc(sent)}</p>` : ''}
<label class="toggle-row compact"><span><b>Send crash reports automatically</b><span>When the app hits an error, send the error message, app version and platform (never your documents or personal data). A few per day at most.</span></span><input type="checkbox" class="switch" id="rp-auto"${autoReportsOn() ? ' checked' : ''}></label></section></div>`;
}
function reportNow() { const r = state.reportForm || {}; const text = document.getElementById('rp-text')?.value ?? r.text ?? ''; const contact = document.getElementById('rp-contact')?.value ?? r.contact ?? ''; const diag = document.getElementById('rp-diag')?.checked ?? r.diag;
  Object.assign(state.reportForm, { text, contact, diag }); if (!text.trim()) throw Error('Describe the problem first.');
  const rep = buildReport({ text, kind: 'user', diag: diag ? diagNow() : null, contact, error: r.error || null }); if (r.shot) rep.screenshot = r.shot; return rep; }
// Automatic, silent: errors are posted to the owner's Apps Script (rate-limited per device; no personal data).
async function autoReport(err) {
  if (!REPORT_URL || !autoReportsOn() || !navigator.onLine) return;
  const rep = buildReport({ kind: 'auto', error: err instanceof Error ? err : Error(String(err?.message || err)), diag: { ...diagNow(), log: [] } });
  if (/ResizeObserver|Script error\.?$|AbortError|NetworkError|Failed to fetch|Load failed/i.test(rep.error.message)) return;
  if (allowReport(localStorage, rep)) postReport(REPORT_URL, rep).catch(() => {});
}
window.addEventListener('error', e => autoReport(e.error || e.message));
window.addEventListener('unhandledrejection', e => autoReport(e.reason));
// No AI yet: recommend the free Gemini key (Groq as a second option). Shown in Smarty and in Settings › AI providers.
function keyHelpHTML() {
  if (aiAvailable()) return '';
  const r = state.khRes;
  return `<section class="card key-help" aria-labelledby="kh-h"><h2 class="h3" id="kh-h">${icon('sparkles', 20)}Get a free AI key</h2><p class="fine">Smarty needs an AI key. Google Gemini’s is free and takes about a minute.</p>
<a class="btn primary block" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">${icon('share', 18)}Get free Gemini key</a>
<ol class="kh-steps"><li>Sign in with your Google account.</li><li>Tap <b>Create API key</b>.</li><li>Copy the key and paste it here.</li></ol>
<div class="composer"><input class="input" id="kh-key" type="password" placeholder="Paste your key (AIza… or gsk_…)" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn outline" data-action="khTest"${state.busy ? ' disabled' : ''}>${state.busy === 'kh' ? '<span class="spin"></span>' : icon('checkCircle', 18)}Test key</button></div>
${r ? `<p class="status ${r.ok ? 'ok' : 'warn'}" role="status">${esc(r.text)}</p>` : ''}
<p class="fine">Or use Groq (also free): <a href="https://console.groq.com/keys" target="_blank" rel="noopener">get a Groq key</a> and paste it the same way.</p></section>`;
}
function viewSmarty() {
  if (!state.smConvs) loadConvs();
  const tab = state.smartyTab || 'chat', P = state.learner || emptyProfile(), weak = tutorWeak(P);
  let body;
  if (tab === 'chat') {
    const th = state.smartyChat || [];
    body = `<section class="card chat-card">${th.length ? `<div class="thread">${th.map((m, i) => `<div class="msg ${m.role}">${m.role === 'user' ? esc(m.text) : fmtAnswer(m.text, null)}${m.webNote ? `<p class="fine web-note">${icon('info', 13)} ${esc(m.webNote)}</p>` : ''}${m.web?.length ? `<div class="sm-web"><span class="fine">${icon('search', 13)} From the web:</span> ${m.web.map((w, j) => `<a class="chip" href="${esc(w.url)}" target="_blank" rel="noopener">[${j + 1}] ${esc(w.title)}</a>`).join(' ')}</div>` : ''}${m.files?.length ? `<div class="fine">${icon('file', 13)} ${m.files.map(esc).join(', ')}</div>` : ''}${m.sources?.length ? `<div class="sm-src">${m.sources.map(x => `<span class="chip">[${x.n}] ${esc(x.cite)}</span>`).join('')}</div>` : ''}${msgExtras(m, 'smarty', i)}${m.role === 'ai' ? `<div class="msg-acts"><button class="icon-btn soft" data-smact="copy:${i}" aria-label="Copy" title="Copy">${icon('note', 17)}</button><button class="icon-btn soft" data-smact="speak:${i}" aria-label="Read aloud" title="Read aloud">${icon('listen', 17)}</button>${i === th.length - 1 ? `<button class="icon-btn soft" data-smact="regen:${i}" aria-label="Regenerate" title="Regenerate">${icon('refresh', 17)}</button>` : ''}</div>` : ''}</div>`).join('')}${state.busy === 'smarty' ? '<div class="msg ai typing"><span></span><span></span><span></span></div>' : ''}</div>`
      : `<div class="chat-empty"><span class="ask-icon big">${icon('brain', 30)}</span><h2>Hi, I’m Smarty</h2><p class="muted">Ask about anything. I answer from your own notes first, show where each point came from, draw diagrams and explain at your level.</p><div class="prompts">${['Explain my weakest topic simply', 'Make a 5-step revision plan', 'Draw a diagram of the main process', 'Quiz me on one key idea'].map(t => `<button class="prompt" data-smsuggest="${esc(t)}">${icon('sparkles', 16)}<span>${esc(t)}</span></button>`).join('')}</div></div>`}
${state.freeLimit && aiAvailable() ? keyHelpHTML() : ''}${!aiAvailable() ? keyHelpHTML() : `<div id="sm-extras-wrap">${smComposerExtras()}</div><div class="composer sm-composer"><button class="icon-btn soft" data-action="smPlus" aria-haspopup="menu" aria-expanded="${!!state.smPlus}" title="Add files, photos or skills" aria-label="Add files, photos or skills">${icon('plus', 20)}</button><textarea class="input" id="smartyq" rows="2" placeholder="Ask Smarty…" aria-label="Ask Smarty">${esc(state.smartyDraft || '')}</textarea><button class="send" data-action="smartySend" aria-label="Send"${state.busy ? ' disabled' : ''}>${state.busy === 'smarty' ? '<span class="spin"></span>' : icon('send', 19)}</button></div>${docsOnlyToggle()}<p class="fine">Searches ${plural(state.docs.length, 'document')} on this device; sends only the matching excerpts to ${esc(aiName())}.</p>`}</section>`;
  } else if (tab === 'skills') {
    body = skillsHTML();
  } else if (tab === 'practice') {
    const p = state.practice;
    body = !p ? `<section class="card"><h2 class="h2">Practice made for you</h2><p class="muted">${weak.length ? `Focuses on: ${weak.slice(0, 3).map(t => esc(t.name)).join(', ')}.` : 'Take a test or chat with Smarty first so it learns your weak topics. Until then it practises your main ideas.'} Each question is checked by a second AI pass before you see it.</p>${aiAvailable() ? `<button class="btn primary" data-action="smartyPractice"${state.busy || !state.docs.length ? ' disabled' : ''}>${state.busy === 'practice' ? '<span class="spin"></span>Smarty is writing and checking…' : icon('sparkles', 18) + 'Start practice'}</button>` : `<button class="btn outline" data-view="settings">${icon('settings', 18)}Set up the AI helper</button>`}</section>`
      : `<div class="sm-step"><span>Question ${Math.min(p.at || 0, p.items.length - 1) + 1} of ${p.items.length}</span><span class="sm-bar"><i style="width:${Math.round(100 * Object.keys(p.answers).length / p.items.length)}%"></i></span></div><ol class="sm-practice">${p.items.filter((_, k) => p.done ? true : k === (p.at || 0)).map(q => { const a = p.answers[q.id], shown = a !== undefined; return `<li class="card"><div class="row"><span class="chip">${esc(q.topic || 'General')}</span><span class="chip diff-${q.difficulty}">${q.difficulty}</span>${q.verified ? `<span class="chip">${icon('checkCircle', 14)} checked</span>` : ''}</div><p class="q-text">${esc(q.prompt)}</p><div class="options">${q.options.map((o, j) => `<button class="option${shown ? (j === q.correct ? ' is-right' : j === a ? ' is-wrong' : '') : ''}" data-smpick="${q.id}:${j}"${shown ? ' disabled' : ''}><span class="opt-letter">${'ABCD'[j]}</span><span class="opt-text">${esc(o)}</span></button>`).join('')}</div>${shown && q.explanation ? `<p class="fine smarty-exp">${icon('smarty', 14)} <b>Smarty explains:</b> ${esc(q.explanation)}</p>` : ''}</li>`; }).join('')}</ol>
${p.done ? `<div class="status ok">${icon('trophy', 20)}<p>${p.items.filter(q => p.answers[q.id] === q.correct).length}/${p.items.length} correct. Your profile was updated.</p></div>` : ''}${!p.done && p.items[p.at || 0]?.id in p.answers ? `<button class="btn primary big block" data-action="smNext">${(p.at || 0) + 1 < p.items.length ? 'Next question' : 'See results'} ${icon('next', 18)}</button>` : ''}<button class="btn outline" data-action="smartyNewPractice"${state.busy ? ' disabled' : ''}>${icon('restore', 18)}New practice</button>`;
  } else if (tab === 'profile') {
    const strong = strongTopics(P);
    body = `<section class="card"><h2 class="h2">Needs work</h2>${weak.length ? `<ul class="sm-topics">${weak.map(masteryBar).join('')}</ul>` : '<p class="muted">No weak topics yet.</p>'}</section>
<section class="card"><h2 class="h2">Strengths</h2>${strong.length ? `<ul class="sm-topics">${strong.map(masteryBar).join('')}</ul>` : '<p class="muted">Keep practising; topics you get right repeatedly show here.</p>'}</section>
<section class="card"><h2 class="h2">Recent mistakes</h2>${P.recent.length ? `<ul class="sm-list">${P.recent.slice(0, 8).map(m => `<li><b>${esc(m.topic)}</b><span>${esc(m.prompt)}</span></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}<p class="fine">Built from ${plural(P.sessions, 'session')}. Weak topics also get priority in exam-style tests and End Sem practice.</p><button class="btn outline danger" data-action="smartyReset">${icon('trash', 18)}Reset my profile</button></section>`;
  } else {
    const list = searchTraces(state.traces, state.smartyQuery || '');
    body = `<section class="card"><input class="input" id="smartysearch" type="search" placeholder="Search your study history…" aria-label="Search study history" value="${esc(state.smartyQuery || '')}"></section>${list.length ? `<ul class="sm-list card">${list.slice(0, 60).map(t => `<li><b>${esc(t.kind)} · ${esc(t.topic)}</b><span>${esc(t.summary)}</span>${t.mistakes.length ? `<span class="fine">${plural(t.mistakes.length, 'mistake')}: ${esc(t.mistakes.slice(0, 2).map(m => m.topic).join(', '))}</span>` : ''}<span class="fine">${esc(fmtDateTime(t.at))}</span></li>`).join('')}</ul>` : `<div class="empty card">${icon('brain', 34)}<h2>No sessions ${state.smartyQuery ? 'match' : 'yet'}</h2><p>Every Smarty chat, practice round and test is remembered here.</p></div>`}`;
  }
  const convs = state.smConvs || [], q = (state.smConvQ || '').toLowerCase();
  const drawer = state.smDrawer ? `<aside class="card sm-drawer" aria-label="Conversations"><div class="card-head"><h2 class="h2">Chats</h2><button class="btn primary sm" data-action="smNew">${icon('plus', 16)}New chat</button></div><input class="input" id="smconvq" type="search" placeholder="Search chats" value="${esc(state.smConvQ || '')}"><ul class="sm-convs">${convs.filter(c => !q || c.title.toLowerCase().includes(q) || c.msgs.some(m => String(m.text).toLowerCase().includes(q))).map(c => `<li class="${c.id === state.smConv ? 'is-on' : ''}"><button class="sm-conv" data-smconv="${esc(c.id)}"><b>${esc(c.title)}</b><span class="fine">${esc(fmtDay(c.at))}</span></button><button class="icon-btn soft" data-smren="${esc(c.id)}" aria-label="Rename" title="Rename">${icon('pencil', 16)}</button><button class="icon-btn soft" data-smdel="${esc(c.id)}" aria-label="Delete" title="Delete">${icon('trash', 16)}</button></li>`).join('') || '<li class="fine">No chats yet.</li>'}</ul></aside>` : '';
  const head = `<button class="icon-btn" data-action="smDrawer" aria-label="Chat history" title="Chat history">${icon('outline', 20)}</button><button class="icon-btn" data-action="smNew" aria-label="New chat" title="New chat">${icon('plus', 20)}</button>`;
  const picker = aiAvailable() ? `<label class="sm-model"><span class="sr-only">AI service</span><select class="input select" id="smmodel">${SM_SERVICES().map(([v, l]) => `<option value="${v}"${(state.smModel || 'auto') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>` : '';
  return `${backHead('Smarty', head)}${drawer}<div class="view narrow smarty">${tab === 'chat' ? picker : ''}<p class="muted page-sub">Your personal tutor · level: ${tutorLevel(P)}</p>${seg('smtab', tab, [['chat', 'Ask', 'chat'], ['practice', 'Practice', 'target'], ['profile', 'Profile', 'trend'], ['memory', 'History', 'outline'], ['skills', 'Skills', 'sparkles']])}${body}</div>`;
}

/* ---------- Owner mode: Developer panel (convenience only, not security; harmless diagnostics) ---------- */
async function refreshOwner({ afterSignIn = false } = {}) {
  const a = account(); const was = state.owner + '|' + state.role; state.owner = !!(a?.email && await isOwnerEmail(a.email).catch(() => false));
  state.role = state.owner ? 'owner' : (a?.email ? await roleOf(a.email, localStorage, await publishedRoles()).catch(() => null) : null);
  if (afterSignIn && !was.startsWith('true') && (state.role === 'codev' || state.role === 'tester')) toast(state.role === 'codev' ? 'Co-developer mode on: Developer panel unlocked.' : 'Beta tester mode on: early features are in More › Beta features.', 'ok');
  if (was !== state.owner + '|' + state.role) render();
  let r = await syncOwnerPack();
  // First time on this device: ask the pack passphrase once; it is then kept in secure storage, so later sign-ins unlock instantly.
  if (afterSignIn && state.owner && r?.reason === 'locked') { const pass = prompt('Owner pack passphrase (asked once on this device)'); if (pass) { r = await syncOwnerPack({ passphrase: pass, interactive: true }); if (r?.error) toast(r.error, 'error'); } }
  if (afterSignIn && state.owner && ownerPack.isActive()) toast('Owner mode on, AI ready', 'ok');
  else if (afterSignIn && state.owner && r?.reason === 'missing') toast('Owner mode on. No owner pack found: import it in the Developer panel.', 'warn');
}
// Secure store after the rename: read the new store, fall back to the old Knowledge Atlas one (and copy the value over).
function legacyAware(store, legacy = store) { const oldKey = k => k.replace(/^prvlar-/, 'ka-'); return { ...store, async get(k) { const v = await store.get(k); if (v != null) return v; for (const [st, key] of [[store, oldKey(k)], [legacy, k], [legacy, oldKey(k)]]) { if (st === store && key === k) continue; const o = await st.get(key).catch(() => null); if (o != null) { await store.set(k, o).catch(() => {}); return o; } } return null; } }; }
let PUBLISHED_ROLES = null;
async function publishedRoles() { if (PUBLISHED_ROLES) return PUBLISHED_ROLES; try { const r = await fetch('./roles.json', { cache: 'no-cache' }); PUBLISHED_ROLES = r.ok ? await r.json() : []; } catch { PUBLISHED_ROLES = []; } return PUBLISHED_ROLES; }
const canDo = what => can(state.owner ? 'owner' : state.role, what);
const ownerBadge = () => state.owner ? `<span class="chip owner-badge" title="Owner mode: developer tools are unlocked">${icon('shield', 13)} Owner</span>`
  : state.role === 'codev' ? `<span class="chip owner-badge role-codev" title="Co-developer: Developer panel unlocked">${icon('code', 13)} Co-dev</span>`
  : state.role === 'tester' ? `<span class="chip owner-badge role-tester" title="Beta tester: early features unlocked">${icon('flask', 13)} Tester</span>` : '';
const DEV_TABS = [['pack', 'Owner pack'], ['errors', 'Errors'], ['info', 'Build'], ['logs', 'Logs'], ['ai', 'AI requests'], ['db', 'Database'], ['flags', 'Flags'], ['data', 'Test data'], ['crash', 'Crashes'], ['owners', 'Owners'], ['access', 'Access']];
function viewBeta() {
  if (!canDo('beta')) return `${backHead('Beta features')}<div class="view narrow"><section class="card"><p>Beta features are for beta testers. Sign in with a tester Google account.</p></section></div>`;
  return `${backHead('Beta features', ownerBadge())}<div class="view narrow beta-view"><section class="card"><h2 class="h2">${icon('flask', 18)} Early features</h2><p class="fine">These may change or break. Turn one on, try it, and tell us how it went.</p>
${BETA_FLAGS.map(([k, l]) => `<label class="toggle-row compact"><span><b>${esc(l)}</b><span>${esc(k)}</span></span><input type="checkbox" class="switch" data-devflag="${k}"${flags()[k] ? ' checked' : ''}></label>`).join('') || '<p class="muted">No early features right now.</p>'}</section>
<section class="card"><h2 class="h2">${icon('bug', 18)} Found something?</h2><p class="fine">Reports include app diagnostics only unless you choose to add more.</p><button class="btn primary" data-view="report">Report a problem</button></section></div>`;
}
function viewDev() {
  if (!state.owner && !canDo('dev')) return `${backHead('Developer panel')}<div class="view narrow"><section class="card"><p>Developer tools are available in owner mode only (sign in with an owner Google account).</p></section></div>`;
  const tabs = state.owner ? DEV_TABS : DEV_TABS.filter(([k]) => CODEV_TABS.includes(k));
  const tab = tabs.some(([k]) => k === state.devTab) ? state.devTab : 'info', pre = x => `<pre class="code-out dev-pre">${esc(typeof x === 'string' ? x : JSON.stringify(x, null, 2))}</pre>`;
  let body = '';
  if (tab === 'info') {
    const nav = performance.getEntriesByType?.('navigation')?.[0], mem = performance.memory;
    body = pre({ version: VERSION, edition: __EDITION__, platform: platform(), native: isNative(), userAgent: navigator.userAgent, online: navigator.onLine, screen: `${innerWidth}×${innerHeight} @${devicePixelRatio}x`, theme: state.theme, renders: perf.renders, avgRenderMs: perf.renders ? +(perf.renderMs / perf.renders).toFixed(1) : 0, slowestRenderMs: +perf.slowest.toFixed(1), loadMs: nav ? Math.round(nav.loadEventEnd || nav.domComplete) : null, jsHeapMB: mem ? +(mem.usedJSHeapSize / 1e6).toFixed(1) : null, sync: syncStatus() });
  } else if (tab === 'logs') body = `<button class="btn outline sm" data-action="devClearLogs">Clear</button>${pre(logs.all().slice(-150).map(l => `${new Date(l.at).toLocaleTimeString()} ${l.lvl.toUpperCase()} ${l.msg}`).join('\n') || 'No log lines yet.')}`;
  else if (tab === 'ai') body = `<p class="fine">Keys and tokens are masked. ${flags()['verbose-ai'] ? 'Showing prompt previews.' : 'Turn on “verbose-ai” to see prompt previews.'}</p>${requests.all().slice().reverse().map(r => `<details class="dev-req"><summary><b>${r.status ?? 'ERR'}</b> ${esc(r.model || '')} · ${r.ms} ms · ${esc(r.url.slice(0, 80))}</summary>${pre({ ...r, preview: flags()['verbose-ai'] ? r.preview : '(hidden)' })}</details>`).join('') || '<p class="muted">No AI requests yet.</p>'}`;
  else if (tab === 'db') body = `<div class="code-acts">${(state.devCounts || []).map(([t, n]) => `<button class="chip-btn${state.devTable === t ? ' is-on' : ''}" data-devtable="${t}">${t} (${n})</button>`).join('') || '<button class="btn outline sm" data-action="devCount">Load tables</button>'}</div>${state.devTable ? `<div class="code-acts"><button class="btn outline sm" data-action="devExport">${icon('download', 16)}Export ${esc(state.devTable)} as JSON</button></div>${pre(maskSecrets(state.devRows || []))}` : ''}`;
  else if (tab === 'flags') body = FLAGS.map(([k, l]) => `<label class="toggle-row compact"><span><b>${esc(k)}</b><span>${esc(l)}</span></span><input type="checkbox" class="switch" data-devflag="${k}"${flags()[k] ? ' checked' : ''}></label>`).join('');
  else if (tab === 'data') body = `<p>Adds a sample document, a Smarty profile with weak topics and a few study traces, all tagged “seed”. Reset removes only seeded items.</p><div class="code-acts"><button class="btn primary" data-action="devSeed">Seed test data</button><button class="btn outline danger" data-action="devUnseed">Remove test data</button></div>`;
  else if (tab === 'errors') { const e = state.devErr || {}; const c = crashes();
    body = `<div class="code-acts"><button class="btn outline sm" data-action="devErrLoad"${state.busy ? ' disabled' : ''}>${icon('refresh', 16)}Refresh</button></div>
<h3 class="h3">Reports in your Sheet</h3>${REPORT_CSV ? (e.sheetErr ? `<p class="status warn">${esc(e.sheetErr)}</p>` : e.sheet ? (e.sheet.length ? `<ul class="dev-errs">${e.sheet.slice(-50).reverse().map(r => `<li><details><summary>${esc(r.at || r.Timestamp || '')} · <b>${esc(r.kind || '')}</b> ${esc((r.message || r.text || '').slice(0, 90))}</summary>${pre(JSON.stringify(r, null, 1))}</details></li>`).join('')}</ul>` : '<p class="muted">No reports yet.</p>') : '<p class="muted">Tap Refresh.</p>') : '<p class="fine">Add the Sheet’s published CSV link to the owner pack (reports.csv) to see automatic reports here. See docs/error-reports.md.</p>'}
<h3 class="h3">GitHub issues (user-report)</h3>${!reportRepo() ? '<p class="fine">No repository configured.</p>' : e.ghErr ? `<p class="status warn">${esc(e.ghErr)}</p>` : e.gh ? (e.gh.length ? `<ul class="dev-errs">${e.gh.map(i => `<li><a href="${esc(i.html_url)}" target="_blank" rel="noopener">#${i.number} ${esc(i.title)}</a> <span class="fine">${esc(i.state)} · ${new Date(i.created_at).toLocaleDateString()}</span></li>`).join('')}</ul>` : '<p class="muted">No issues.</p>') : '<p class="muted">Tap Refresh.</p>'}
<h3 class="h3">This device</h3>${c.length ? c.slice().reverse().slice(0, 15).map(x => `<details><summary>${new Date(x.at).toLocaleString()} · ${esc(x.msg.slice(0, 80))}</summary>${pre(x.stack || x.msg)}</details>`).join('') : '<p class="muted">No errors on this device.</p>'}`; }
  else if (tab === 'crash') { const c = crashes(); body = `<button class="btn outline sm" data-action="devClearCrashes">Clear</button>${c.length ? c.slice().reverse().map(x => `<details><summary>${new Date(x.at).toLocaleString()} · ${esc(x.msg.slice(0, 80))}</summary>${pre(x.stack || x.msg)}</details>`).join('') : '<p class="muted">No crashes recorded.</p>'}`; }
  else if (tab === 'pack') body = ownerPackHTML();
  else if (tab === 'access') { const list = roleList();
    body = `<p class="fine">Give a Gmail a role. It is stored as a SHA-256 hash (the address is not kept) and syncs with your own settings. Roles are a client-side convenience, not security.</p>
<div class="code-acts"><input id="dev-role-email" class="input" type="email" placeholder="Gmail address" autocomplete="off"><select id="dev-role" class="input"><option value="codev">Co-developer</option><option value="tester">Beta tester</option></select><button class="btn primary" data-action="devAddRole">Add</button></div>
<p class="fine"><b>Co-developer:</b> Developer panel (logs, errors, flags, build, crashes), no roles, keys or owner pack. <b>Beta tester:</b> early features and the Report shortcut, no developer data.</p>
<ul class="sm-list">${list.map(r => `<li>${icon(r.role === 'codev' ? 'code' : 'flask', 14)} <code>${r.h.slice(0, 12)}…</code> <span class="chip">${esc(ROLES[r.role])}</span> <button class="btn outline sm danger" data-devrmrole="${r.h}">Remove</button></li>`).join('') || '<li class="muted">No roles yet.</li>'}</ul>
<p class="fine">To recognise them on their own devices, publish the hashes as <code>roles.json</code> next to the app (website root), then redeploy.</p><div class="code-acts"><button class="btn outline sm" data-action="devCopyRoles">${icon('download', 16)}Copy roles.json</button></div>`; }
  else { const added = addedOwners(); body = `<p class="fine">Owners are recognised by a SHA-256 hash of their Google email; addresses are not stored. Added owners sync through your own Drive. Built-in owners are set in the code (docs/owner-mode.md). Co-developers must also be test users on the Google consent screen while it is in Testing.</p><ul class="sm-list">${OWNER_HASHES.map(h => `<li><code>${h.slice(0, 12)}…</code> <span class="chip">built-in</span></li>`).join('')}${added.map(h => `<li><code>${h.slice(0, 12)}…</code> <button class="link-btn danger" data-devrmowner="${h}">Remove</button></li>`).join('')}</ul><div class="code-acts"><input class="input" id="dev-owner" type="email" placeholder="Co-developer’s Gmail address" autocomplete="off"><button class="btn primary" data-action="devAddOwner">Add owner</button></div>`; }
  return `${backHead('Developer panel', ownerBadge())}<div class="view narrow dev"><p class="fine">${state.owner ? 'Owner' : 'Co-developer'} mode is a convenience, not security. Nothing here changes what the app may legally show.</p><div class="code-modes" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="chip-btn${tab === k ? ' is-on' : ''}" data-devtab="${k}">${l}</button>`).join('')}</div><section class="card">${body}</section></div>`;
}
function ownerPackHTML() {
  const st = state.packStatus || ownerPack.status(), label = { on: 'Active', off: 'Not loaded', locked: 'Locked — enter the passphrase', missing: 'Not in your Drive yet', error: 'Error' }[st.status] || st.status;
  return `<p class="fine">Owner-only content (exam-prep tools, defaults, theme art) lives in an encrypted owner pack in your own Google Drive’s hidden app folder, never in the app. It is cached encrypted on this device for offline use and removed when you sign out.</p>
<p><b>Status:</b> ${esc(label)}${st.version ? ` · pack ${esc(st.version)}` : ''}${st.built ? ` · built ${esc(fmtDate(st.built))}` : ''}</p>${st.error ? `<p class="status warn">${esc(st.error)}</p>` : ''}
<label class="field"><span>Owner-pack passphrase</span><input class="input" type="password" id="pack-pass" autocomplete="off" placeholder="Asked once; kept in secure storage"></label>
<div class="code-acts"><button class="btn primary" data-action="packUnlock">${icon('shield', 17)}Unlock from my Drive</button>
<label class="btn outline file-btn">${icon('upload', 17)}<span>Upload owner pack to my Drive</span><input type="file" data-packfile accept=".json,application/json"></label><label class="btn outline file-btn">${icon('file', 17)}<span>Import owner pack from file</span><input type="file" data-packfile="local" accept=".json,application/json"></label>
${ownerPack.isActive() ? `<button class="btn outline" data-action="packRemove">${icon('trash', 17)}Remove from this device</button>` : ''}</div>
<p class="fine">Build a pack with <code>npm run owner-pack</code>, unzip it and pick <code>owner-pack.json</code>. “Import from file” works without Drive and keeps the pack on this device only.</p>`;
}
const packPass = () => { const el = document.getElementById('pack-pass'), v = el?.value || ''; if (el) el.value = ''; return v; };
const SEED = 'seed-';
async function devSeed() {
  const doc = { id: SEED + 'doc', title: 'Sample: Thermodynamics basics', created: Date.now(), seed: true, sections: [{ id: 's1', title: 'First law', text: 'Energy is conserved: ΔU = Q − W. Heat added minus work done by the system.', level: 1 }, { id: 's2', title: 'Entropy', text: 'Entropy measures disorder; in an isolated system it never decreases.', level: 1 }] };
  await saveDocument(doc);
  for (const [i, [topic, ok]] of [['Entropy', 0], ['Recursion', 0], ['First law', 1]].entries()) await recordTrace({ id: SEED + 't' + i, kind: 'practice', at: Date.now() - i * 1000, topic, summary: 'seed', steps: [], topics: [{ topic, right: ok, total: 1 }], mistakes: ok ? [] : [{ topic, prompt: 'Seeded question', note: 'seed' }], seed: true });
  state.docs = await getDocuments(); toast('Test data added.', 'ok'); render();
}
async function devUnseed() {
  await db.documents.where('id').startsWith(SEED).delete(); await db.traces.where('id').startsWith(SEED).delete();
  state.docs = await getDocuments(); state.traces = await getTraces(); toast('Test data removed.', 'ok'); render();
}
/* ---------- Account: optional Google sign-in and sync to the user's own Drive ---------- */
function accountHTML() {
  const a = account(), st = syncStatus(), p = syncPrefs(), busy = state.busy === 'sync';
  const head = '<h2 class="h2" id="acct-h">Account and sync</h2>';
  if (!cloudAvailable()) return `<section class="card" aria-labelledby="acct-h">${head}<p class="fine">Prvlar works fully without an account. Everything is saved on this device; use Data and backup to move it.${__PUBLIC__ ? '' : ' Google sync is off in this build (no Google client ID configured).'}</p></section>`;
  if (!a) return `<section class="card" aria-labelledby="acct-h">${head}<p>Optional: sign in with Google to back up and sync your documents, notes and progress across devices. It is stored only in a hidden app folder in <b>your own</b> Google Drive; we have no server and can't see it.</p><button class="btn outline big block g-btn" data-action="cloudSignIn"${state.busy ? ' disabled' : ''}>${busy ? '<span class="spin"></span>' : icon('login', 20)}Sign in with Google</button><p class="fine">Asks only for your name, email and access to this app's own Drive folder (not your other files).</p></section>`;
  return `<section class="card" aria-labelledby="acct-h">${head}<div class="acct-row">${icon('user', 22)}<div><b>${esc(a.name || a.email)}</b><span class="fine">${esc(a.email)}</span></div></div>
<p class="sync-line">${st.error ? `${icon('cloudOff', 16)} <span class="bad">${esc(st.error)}</span>` : st.at ? `${icon('cloud', 16)} Last synced ${new Date(st.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${fmtBytes(st.size)} in your Drive${st.conflicts ? ` · ${st.conflicts} conflict${st.conflicts === 1 ? '' : 's'} resolved (newest kept)` : ''}` : `${icon('cloud', 16)} Not synced yet`}</p>
${st.reason === 'scope' ? `<div class="code-acts"><button class="btn primary" data-action="cloudGrant"${state.busy ? ' disabled' : ''}>${icon('cloud', 18)}Allow Drive access</button></div><p class="fine">On Google's screen, tick the box that lets Prvlar see and manage its own app data in your Drive.</p>` : ''}<div class="code-acts"><button class="btn primary" data-action="cloudSync"${state.busy ? ' disabled' : ''}>${busy ? '<span class="spin"></span>' : icon('refresh', 18)}Sync now</button><button class="btn outline" data-action="cloudSignOut">${icon('logout', 18)}Sign out</button></div>
<label class="toggle-row compact"><span><b>Sync automatically</b><span>On open, after changes and every 10 minutes while online.</span></span><input type="checkbox" class="switch" id="sync-auto"${p.auto ? ' checked' : ''}></label>
<label class="toggle-row compact"><span><b>Encrypt my cloud copy</b><span>AES-GCM with a passphrase only you know. If you forget it, the cloud copy can't be read.</span></span><input type="checkbox" class="switch" id="sync-encrypt"${p.encrypt ? ' checked' : ''}></label>
${p.encrypt ? `<div class="code-acts"><button class="btn outline sm" data-action="cloudPass">${icon('lock', 16)}${hasPassphrase() ? 'Change passphrase' : 'Enter passphrase'}</button></div><label class="toggle-row compact"><span><b>Include my AI keys</b><span>Only inside the encrypted copy.</span></span><input type="checkbox" class="switch" id="sync-keys"${p.keys ? ' checked' : ''}></label>` : '<p class="fine">AI keys are never synced unless you turn on encryption.</p>'}
<button class="btn ghost danger" data-action="cloudDelete">${icon('trash', 18)}Delete cloud data</button></section>`;
}
async function cloudDo(fn) { state.busy = 'sync'; render(); try { await fn(); } catch (e) { toast(e.message || 'Something went wrong.', 'error'); } finally { state.busy = ''; render(); } }
/* ---------- Smarty Code: guided coding practice (Plan → Test → Implement → Review → Verify → Remember) ---------- */
const STREAMS = [['cs', 'Computer science / IT'], ['eng', 'Engineering (other)'], ['sci', 'Science'], ['com', 'Commerce / business'], ['arts', 'Arts / humanities'], ['school', 'School'], ['other', 'Other']];
const userStream = () => readJSON('prvlar-stream', ED.defaultStream || '');
const runnerCfg = () => readJSON('prvlar-runner', { url: '', key: '' });
function codeState() {
  if (!state.code) {
    const saved = readJSON('prvlar-code', {}), p = PROBLEMS.find(x => x.id === saved.pid) || PROBLEMS[0], lang = saved.lang || (userStream() === 'cs' ? 'python' : 'javascript');
    state.code = { mode: saved.mode || 'solve', lang, pid: p.id, problem: p, step: 'plan', src: saved.src || starter(p, lang), tests: formatTests(problemTests(p)), hint: '', hintsUsed: 0, topic: '', level: '' };
  }
  return state.code;
}
const saveCode = () => { const c = state.code; writeJSON('prvlar-code', { mode: c.mode, lang: c.lang, pid: c.pid, src: c.src }); };
function loadProblem(p) { const c = codeState(); Object.assign(c, { pid: p.id, problem: p, src: starter(p, c.lang), tests: formatTests(problemTests(p)), step: 'plan', plan: null, review: null, run: null, hint: '', hintsUsed: 0, saved: false, startedAt: Date.now() }); saveCode(); }
const codeAi = () => smartyAi();
function runRows(run) {
  if (!run) return '';
  if (run.error) return `<div class="status bad" role="alert">${icon('xCircle', 20)}<pre class="code-err">${esc(run.error)}</pre></div>`;
  const g = run.grade;
  return `<div class="run-head">${run.simulated ? `<span class="chip warn">${icon('info', 13)} Simulated — the AI traced your code by hand; it was not run</span>` : `<span class="chip">${icon('terminal', 13)} Ran on ${run.where}</span>`}<b>${g.passed}/${g.total} tests pass</b></div>
<table class="run-table"><thead><tr><th>Input</th><th>Expected</th><th>Got</th><th></th></tr></thead><tbody>${g.rows.map(r => `<tr class="${r.pass ? 'ok' : 'bad'}"><td><code>${esc(r.args.map(a => JSON.stringify(a)).join(', '))}</code></td><td><code>${esc(JSON.stringify(r.expected))}</code></td><td><code>${esc(r.error || JSON.stringify(r.got))}</code></td><td>${r.pass ? icon('check', 16) : icon('x', 16)}<span class="sr-only">${r.pass ? 'pass' : 'fail'}</span></td></tr>`).join('')}</tbody></table>${run.out?.length ? `<details><summary>Printed output</summary><pre class="code-out">${esc(run.out.join('\n'))}</pre></details>` : ''}${run.notes ? `<p class="fine">${esc(run.notes)}</p>` : ''}`;
}
async function runCode() {
  const c = codeState(), { tests, errors } = parseTests(c.tests);
  if (errors.length) { c.run = { error: errors.join('\n') }; return render(); }
  if (!tests.length) { c.run = { error: 'Add at least one test case in the Test first step.' }; return render(); }
  state.busy = 'code-run'; render();
  try {
    let r, where = 'this device', simulated = false;
    if (c.lang === 'javascript') r = await runJS(c.src, c.problem.fn, tests);
    else if (c.lang === 'python') r = await runPy(c.src, c.problem.fn, tests);
    else if (runnerCfg().url) { r = await runRemote(runnerCfg(), c.src, c.lang, tests); where = 'your code runner'; }
    else if (aiAvailable()) { r = await codeSimulate(codeAi(), { lang: LANGS[c.lang].label, code: c.src, tests }); simulated = true; }
    else r = { error: `${LANGS[c.lang].label} can't run on the phone. Add a code runner in Settings › AI, or set up the AI helper for a simulated dry run.` };
    c.run = r.error ? { error: r.error } : { grade: grade(tests, r.results), out: r.out, notes: r.notes, simulated, where };
    if (!r.error && c.step === 'code') c.step = 'verify';
  } catch (e) { c.run = { error: e.message }; } finally { state.busy = ''; render(); }
}
async function codeAsk(kind) {
  const c = codeState(); if (!aiAvailable()) return toast('Set up the AI helper in Settings first.', 'warn');
  state.busy = 'code-' + kind; render();
  const P = state.learner || emptyProfile(), level = tutorLevel(P), task = c.problem ? `${c.problem.title}: ${c.problem.text}` : '';
  try {
    if (kind === 'plan') c.plan = await codePlan(codeAi(), { task, lang: LANGS[c.lang].label, level });
    else if (kind === 'tests') { const t = await codeTests(codeAi(), { task, fn: c.problem.fn, params: c.problem.params, level }); if (t.length) c.tests = formatTests(t); }
    else if (kind === 'review') { c.review = normalizeReview(await codeReview(codeAi(), { task: c.mode === 'debug' ? 'Find and fix the bug. ' + (c.bug || '') : task, lang: LANGS[c.lang].label, code: c.src, results: c.run?.grade ? c.run.grade.rows.map(r => `${JSON.stringify(r.args)} expected ${JSON.stringify(r.expected)} got ${r.error || JSON.stringify(r.got)}`).join('\n') : '', level })); c.hint = ''; }
    else if (kind === 'explain') c.explain = await codeExplain(codeAi(), { lang: LANGS[c.lang].label, code: c.src, level });
    else if (kind === 'lesson') { c.lesson = await codeLesson(codeAi(), { concept: c.concept || 'Recursion', lang: LANGS[c.lang].label, level }); }
    else if (kind === 'interview') { const p = await interviewProblem(codeAi(), { topic: c.topic || TOPICS[0], level: c.level || 'medium' }); loadProblem(p || suggestProblem(tutorWeak(P).map(t => t.name))); c.interviewAt = Date.now(); }
  } catch (e) { toast(e.message, 'error'); } finally { state.busy = ''; render(); }
}
async function codeRemember() {
  const c = codeState(); if (c.saved) return;
  const trace = codeTrace({ problem: c.problem, lang: c.lang, grade: c.run?.grade, review: c.review, hintsUsed: c.hintsUsed });
  await recordTrace(trace); c.saved = true; c.done = [...new Set([...(c.done || []), c.pid])]; render();
}
function codeSteps(c) {
  const busy = k => state.busy === 'code-' + k, dis = state.busy ? ' disabled' : '';
  const strip = `<ol class="code-steps" aria-label="Steps">${STEPS.map(([k, l], i) => `<li><button class="code-step${c.step === k ? ' is-on' : ''}" data-cstep="${k}" aria-current="${c.step === k ? 'step' : 'false'}"><span>${i + 1}</span>${l}</button></li>`).join('')}</ol>`;
  const S = STEPS.find(s => s[0] === c.step), next = STEPS[STEPS.indexOf(S) + 1];
  let panel = '';
  if (c.step === 'plan') panel = `<p>Before coding, write the steps you'll take in plain words.</p><textarea class="input" id="cplan" rows="4" placeholder="1. …">${esc(c.myPlan || '')}</textarea>
<button class="btn outline" data-action="codePlan"${dis}>${busy('plan') ? '<span class="spin"></span>' : icon('sparkles', 18)}Help me break it down</button>${c.plan ? `<ol class="sm-list">${c.plan.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${c.plan.edgeCases.length ? `<p class="fine"><b>Edge cases to test:</b> ${c.plan.edgeCases.map(esc).join(' · ')}</p>` : ''}` : ''}`;
  else if (c.step === 'test') panel = `<p>Write the cases first, one per line: <code>arguments =&gt; expected</code> (JSON). Example: <code>[1, 2, 3] =&gt; 6</code></p><textarea class="input mono" id="ctests" rows="6" spellcheck="false">${esc(c.tests)}</textarea>${(() => { const e = parseTests(c.tests).errors; return e.length ? `<p class="fine bad">${e.map(esc).join('<br>')}</p>` : `<p class="fine">${parseTests(c.tests).tests.length} test cases</p>`; })()}<button class="btn outline" data-action="codeTests"${dis}>${busy('tests') ? '<span class="spin"></span>' : icon('flask', 18)}Suggest test cases</button>`;
  else if (c.step === 'code' || c.step === 'verify') panel = `${c.step === 'code' ? editorHTML(c) : ''}<div class="code-acts"><button class="btn primary" data-action="codeRun"${dis}>${state.busy === 'code-run' ? '<span class="spin"></span>' : icon('play', 18)}Run tests</button>${c.step === 'verify' ? '<button class="btn outline" data-cstep="code">Edit code</button>' : ''}</div>${runRows(c.run)}`;
  else if (c.step === 'review') {
    const r = c.review, rung = c.hint;
    panel = `<p>Smarty reviews your code for bugs, style, complexity and security. Hints come first; the full answer only if you ask.</p><button class="btn primary" data-action="codeReview"${dis}>${busy('review') ? '<span class="spin"></span>' : icon('bug', 18)}Review my code</button>
${r ? `${r.summary ? `<p>${esc(r.summary)}</p>` : ''}${r.complexity ? `<p class="fine"><b>Complexity:</b> ${esc(r.complexity)}</p>` : ''}<ul class="issues">${r.issues.map(x => `<li class="issue ${x.kind}"><span class="chip">${esc(x.kind)}</span>${x.line ? `<b>Line ${x.line}</b> ` : ''}${esc(x.msg)}</li>`).join('') || '<li class="issue ok">No problems found.</li>'}</ul>
<div class="hint-ladder" aria-label="Hint ladder">${HINT_LADDER.map(k => `<span class="rung${HINT_LADDER.indexOf(k) <= HINT_LADDER.indexOf(rung) ? ' is-on' : ''}">${HINT_LABEL[k]}</span>`).join('')}</div>
${rung ? HINT_LADDER.slice(0, HINT_LADDER.indexOf(rung) + 1).map(k => r.hints[k] ? `<div class="hint-box"><b>${HINT_LABEL[k]}</b>${k === 'pseudo' || k === 'solution' ? `<pre class="code-out">${esc(r.hints[k])}</pre>` : `<p>${esc(r.hints[k])}</p>`}</div>` : '').join('') : ''}
${rung !== 'solution' ? `<button class="btn outline" data-action="codeHint">${icon('bulb', 18)}${rung ? 'Next: ' + HINT_LABEL[nextHint(rung)] : 'Give me a nudge'}</button>` : ''}` : ''}`;
  } else panel = `${c.run?.grade ? `<p><b>${c.run.grade.passed}/${c.run.grade.total}</b> tests passed with ${c.hintsUsed} hint${c.hintsUsed === 1 ? '' : 's'}.</p>` : '<p class="muted">Run your tests first so Smarty can record how it went.</p>'}
${c.review?.concepts?.length ? `<p>Concepts to strengthen: ${c.review.concepts.map(x => `<span class="chip">${esc(x)}</span>`).join(' ')}</p>` : ''}
${c.saved ? `<div class="status ok">${icon('check', 20)}<p>Saved to your Smarty profile. Weak concepts will come up in practice.</p></div><button class="btn primary" data-action="codeNext">${icon('next', 18)}Next problem for you</button>` : `<button class="btn primary" data-action="codeRemember"${c.run?.grade ? '' : ' disabled'}>${icon('brain', 18)}Save to my profile</button>`}`;
  return `${strip}<section class="card code-panel" aria-labelledby="cstep-h"><h2 class="h2" id="cstep-h">${S[1]}</h2><p class="fine">${S[2]}</p>${panel}${next && c.step !== 'remember' ? `<button class="btn ghost" data-cstep="${next[0]}">Next: ${next[1]} ${icon('next', 16)}</button>` : ''}</section>`;
}
const editorHTML = c => `<div class="code-bar"><label><span class="sr-only">Language</span><select class="input select" id="clang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${c.lang === k ? ' selected' : ''}>${v.label}${v.run === 'remote' ? (runnerCfg().url ? ' (your runner)' : ' (simulated)') : ''}</option>`).join('')}</select></label><button class="btn ghost sm" data-action="codeReset">${icon('restore', 16)}Starter code</button></div>
<div class="cm-host" id="cm-host"><textarea class="input mono cm-fallback" id="csrc" rows="12" spellcheck="false" aria-label="Code editor">${esc(c.src)}</textarea></div>`;
function viewCode() {
  const c = codeState(), P = state.learner || emptyProfile(), weak = tutorWeak(P).map(t => t.name);
  const modes = `<div class="code-modes" role="tablist" aria-label="Mode">${MODES.map(([k, l]) => `<button role="tab" class="chip-btn${c.mode === k ? ' is-on' : ''}" data-cmode="${k}" aria-selected="${c.mode === k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (c.mode === 'solve' || c.mode === 'interview') {
    const list = problemsBy({ topic: c.topic, level: c.level }), sug = suggestProblem(weak, c.done || []);
    body = `<section class="card"><div class="code-filters"><select class="input select" id="ctopic" aria-label="Topic"><option value="">All topics</option>${TOPICS.map(t => `<option${c.topic === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select><select class="input select" id="clevel" aria-label="Difficulty"><option value="">Any difficulty</option>${['easy', 'medium', 'hard'].map(l => `<option value="${l}"${c.level === l ? ' selected' : ''}>${l[0].toUpperCase() + l.slice(1)}</option>`).join('')}</select></div>
${c.mode === 'interview' ? `<button class="btn outline" data-action="codeInterview"${state.busy ? ' disabled' : ''}>${state.busy === 'code-interview' ? '<span class="spin"></span>' : icon('sparkles', 18)}New interview problem</button>${c.interviewAt ? `<p class="fine">Started ${new Date(c.interviewAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Think aloud: write your plan before coding.</p>` : ''}` : `<ul class="prob-list">${list.map(p => `<li><button class="prob${p.id === c.pid ? ' is-on' : ''}" data-cprob="${p.id}"><b>${esc(p.title)}</b><span class="chip">${esc(p.topic)}</span><span class="chip lvl-${p.level}">${p.level}</span>${p.id === sug.id ? '<span class="chip warn">For you</span>' : ''}</button></li>`).join('') || '<li class="muted">No problems match.</li>'}</ul>`}</section>
<section class="card prob-card"><h2 class="h2">${esc(c.problem.title)}</h2><p>${esc(c.problem.text)}</p><p class="fine">Function: <code>${esc(c.lang === 'python' ? snake(c.problem.fn) : c.problem.fn)}(${c.problem.params.map(esc).join(', ')})</code></p></section>${codeSteps(c)}`;
  } else if (c.mode === 'debug') {
    body = `<section class="card"><p>Paste the code that misbehaves and say what goes wrong. Smarty gives hints before the fix.</p><input class="input" id="cbug" placeholder="What goes wrong? e.g. returns 0 for [2, 4]" value="${esc(c.bug || '')}">${editorHTML(c)}</section>${codeSteps({ ...c, step: ['code', 'test', 'verify', 'review', 'remember'].includes(c.step) ? c.step : 'review' })}`;
  } else if (c.mode === 'explain') {
    const x = c.explain;
    body = `<section class="card">${editorHTML(c)}<button class="btn primary" data-action="codeExplain"${state.busy ? ' disabled' : ''}>${state.busy === 'code-explain' ? '<span class="spin"></span>' : icon('bulb', 18)}Explain this code</button></section>${x ? `<section class="card"><h2 class="h2">What it does</h2><p>${esc(x.overview)}</p><ol class="explain-lines">${x.lines.map(l => `<li>${l.line ? `<b>Line ${l.line}</b> ` : ''}${esc(l.text)}</li>`).join('')}</ol>${x.complexity ? `<p class="fine"><b>Complexity:</b> ${esc(x.complexity)}</p>` : ''}${x.tryThis ? `<p class="fine"><b>Try this:</b> ${esc(x.tryThis)}</p>` : ''}</section>` : ''}`;
  } else {
    const l = c.lesson;
    body = `<section class="card"><label class="field"><span>Concept</span><select class="input select" id="cconcept">${CONCEPTS.map(k => `<option${(c.concept || weak.find(w => CONCEPTS.includes(w)) || 'Recursion') === k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></label><button class="btn primary" data-action="codeLesson"${state.busy ? ' disabled' : ''}>${state.busy === 'code-lesson' ? '<span class="spin"></span>' : icon('study', 18)}Teach me</button></section>
${l ? `<section class="card lesson">${fmtAnswer(l.lesson, null)}${l.exercise ? `<button class="btn primary" data-action="codeExercise">${icon('code', 18)}Try the exercise: ${esc(l.exercise.title || 'practice')}</button>` : ''}</section>` : ''}`;
  }
  const ai = aiAvailable() ? '' : `<div class="status warn">${icon('info', 20)}<p>Running JavaScript and Python works offline. Plans, reviews, hints and lessons need the AI helper. <button class="link-btn" data-view="settings">Set it up</button></p></div>`;
  return `${backHead('Smarty Code')}<div class="view narrow smarty-code"><p class="muted page-sub">Learn to code step by step: plan, test first, implement, review, verify, remember.</p>${modes}${ai}${body}</div>`;
}
async function mountCodeEditor() {
  const host = app.querySelector('#cm-host'); if (!host || !state.code) return;
  try {
    const dark = document.documentElement.matches('[data-theme="dark"],[data-theme="glass"],[data-theme="anime"],[data-theme="royal"]');
    await mountEditor(host, { code: state.code.src, lang: state.code.lang, dark, onChange: v => { state.code.src = v; saveCode(); } });
    host.querySelector('.cm-fallback')?.remove(); host.classList.add('is-cm');
  } catch { /* the plain textarea stays as a fallback */ }
}

const actions = {
  async fetchModels() {
    state.busy = 'models'; render();
    try { state.models = await fetchModels(state.ai.url.trim() || preset().url, state.key.trim()); if (!state.models.length) state.notice = 'The server returned no models. Keep “auto”.'; }
    finally { state.busy = ''; }
    render();
  },
  async glassDefault() { state.glassBg = ''; await setSetting('glass-bg', ''); applyGlassBg(); render(); },
  async glassNone() { state.glassBg = 'none'; await setSetting('glass-bg', 'none'); applyGlassBg(); render(); },
  cloudGrant: () => cloudDo(async () => { await grantDrive(); await refreshOwner({ afterSignIn: true }); const s = await syncNow({ interactive: true }); if (!s.error) toast('Drive access allowed. Synced.', 'ok'); }),
  cloudSignIn: () => cloudDo(async () => { await signIn(); await refreshOwner({ afterSignIn: true }); startAutoSync(); const s = await syncNow({ interactive: true }); if (!s.error) toast('Signed in. Your data is synced to your Google Drive.', 'ok'); }),
  cloudSync: () => cloudDo(async () => { const s = await syncNow({ interactive: true }); if (s.error) toast(s.error, 'warn'); else { await reloadAll(); toast('Synced.', 'ok'); } }),
  cloudSignOut() { if (!confirm('Sign out of Google? Your data stays on this device and in your Drive.')) return; signOut();  state.role = null; writeJSON('prvlar-entry', afterSignOut().entry); state.owner = false; ownerPack.remove().finally(() => { state.packStatus = ownerPack.status(); render(); }); render(); },
  devClearLogs() { logs.clear(); render(); }, devClearCrashes() { clearCrashes(); render(); },
  async devCount() { state.devCounts = await Promise.all(db.tables.map(async t => [t.name, await t.count()])); render(); },
  devExport() { const b = new Blob([JSON.stringify(maskSecrets(state.devRowsAll || []), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `prvlar-${state.devTable}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); },
  devSeed: () => devSeed(), devUnseed: () => devUnseed(),
  async devAddRole() { if (!state.owner) return toast('Only the owner can manage roles.', 'warn'); const v = document.getElementById('dev-role-email')?.value || '', r = document.getElementById('dev-role')?.value; try { await addRole(v, r); toast(`${ROLES[r]} added (stored as a hash).`, 'ok'); } catch (e) { toast(e.message, 'warn'); } render(); },
  async devCopyRoles() { if (!state.owner) return; const t = JSON.stringify(roleList(), null, 1); try { await navigator.clipboard.writeText(t); toast('roles.json copied.', 'ok'); } catch { prompt('Copy roles.json', t); } },
  async devAddOwner() { if (!state.owner) return toast('Only the owner can manage owners.', 'warn'); const v = document.getElementById('dev-owner')?.value || ''; try { await addOwner(v); toast('Owner added (stored as a hash).', 'ok'); } catch (e) { toast(e.message, 'warn'); } render(); },
  cloudDelete: () => { if (!confirm('Delete everything Prvlar stored in your Google Drive? Data on this device is not touched.')) return; cloudDo(async () => { const n = await deleteCloudData(); toast(`Deleted ${n} file${n === 1 ? '' : 's'} from your Drive.`, 'ok'); }); },
  cloudPass() { const v = prompt('Sync passphrase (at least 8 characters). Use the same one on every device.'); if (v == null) return; if (v.length < 8) return toast('Use at least 8 characters.', 'warn'); setPassphrase(v); render(); },
  musicPlay() { musicPlay(); }, musicPause() { musicPause(); },
  spLogin() { spotifyLogin(); },
  pbAdd() { state.pb.sections.push({ ...BLANK_SECTION, name: `Section ${String.fromCharCode(65 + state.pb.sections.length)}` }); render(); },
  pbDel(el) { state.pb.sections.splice(Number(el.dataset.i), 1); render(); },
  async pbSave() { try { const p = profileFromPattern(state.pb, state.pb.id); await saveProfileAndUse(p); state.pb = null; toast(`Saved “${p.name}”. Tests now follow it.`, 'ok'); go('test'); } catch (e) { toast(e.message, 'error'); } },
  async packUnlock() { const pass = packPass(); state.busy = 'pack'; try { const r = await syncOwnerPack({ passphrase: pass || undefined, interactive: true, preferRemote: true }); toast(r.ok ? 'Owner pack active.' : r.error || ownerPack.status().error || 'Owner pack not active.', r.ok ? 'ok' : 'error'); } finally { state.busy = ''; } },
  async packRemove() { await ownerPack.remove(); state.packStatus = ownerPack.status(); toast('Owner pack removed from this device. It stays in your Drive.'); },
  timeUpNow() { clearTimeout(state.timeUpT); state.timeUp = 0; submit().catch(fail); },
  testPause() { if (!canPause(state.examMeta?.timing)) return; const p = state.pauses || (state.pauses = []), open = p.find(x => x.to == null); if (open) open.to = Date.now(); else p.push({ from: Date.now() }); saveDraft(); render(); },
  codeRun: () => runCode(), codePlan: () => codeAsk('plan'), codeTests: () => codeAsk('tests'), codeReview: () => codeAsk('review'),
  codeExplain: () => codeAsk('explain'), codeLesson: () => codeAsk('lesson'), codeInterview: () => codeAsk('interview'), codeRemember: () => codeRemember(),
  codeHint() { const c = codeState(); if (!c.review) return; const n = c.hint ? nextHint(c.hint) : 'nudge'; if (n === 'solution' && !confirm('Show the full solution? Try the pseudo-code first if you can.')) return; c.hint = n; c.hintsUsed += 1; render(); },
  codeNext() { const c = codeState(); loadProblem(suggestProblem(tutorWeak(state.learner || emptyProfile()).map(t => t.name), c.done || [])); render(); },
  codeReset() { const c = codeState(); c.src = starter(c.problem, c.lang); saveCode(); render(); },
  codeExercise() { const c = codeState(), x = c.lesson?.exercise; if (!x) return; loadProblem({ id: 'lesson-' + Date.now(), topic: c.concept || 'Recursion', level: 'easy', title: String(x.title || 'Exercise'), text: String(x.text || ''), fn: String(x.fn), params: (x.params || []).map(String), tests: (x.tests || []).filter(t => Array.isArray(t?.args)).map(t => [t.args, t.expected]) }); c.mode = 'solve'; render(); },
  gateSignIn: () => cloudDo(async () => { await signIn(); const a = afterSignIn(); writeJSON('prvlar-entry', a.entry); writeJSON('prvlar-onboarded', a.onboarded); const n = account()?.name; if (n && !readJSON('prvlar-name', '')) writeJSON('prvlar-name', String(n).split(' ')[0].slice(0, 40)); await refreshOwner({ afterSignIn: true }); startAutoSync(); render(); syncNow({ interactive: true }).catch(() => {}); }),
  gateGuest() { writeJSON('prvlar-entry', afterGuest().entry); render(); },
  async devErrLoad() { const e = state.devErr = {}; state.busy = 'deverr'; render();
    try { await Promise.all([
      REPORT_CSV ? fetch(REPORT_CSV).then(r => { if (!r.ok) throw Error(`Sheet answered ${r.status}`); return r.text(); }).then(t => { e.sheet = parseCsv(t); }).catch(x => { e.sheetErr = x.message || 'Could not read the Sheet.'; }) : null,
      reportRepo() ? fetch(`https://api.github.com/repos/${reportRepo()}/issues?labels=user-report&state=all&per_page=30`, { headers: { Accept: 'application/vnd.github+json' } }).then(r => { if (!r.ok) throw Error(`GitHub answered ${r.status}`); return r.json(); }).then(j => { e.gh = j.filter(i => !i.pull_request); }).catch(x => { e.ghErr = x.message; }) : null]); }
    finally { state.busy = ''; render(); } },
  reportFromToast() { const msg = state.error; state.error = ''; state.reportForm = { text: '', diag: true, shot: '', error: { message: msg } }; state.reportSent = ''; go('report'); },
  async rpSend() { const rep = reportNow(); if (!allowReport(localStorage, rep)) return toast('You’ve sent a few reports already. Please try again in an hour.', 'warn'); const ok = await postReport(REPORT_URL, { ...rep, screenshot: rep.screenshot ? rep.screenshot.slice(0, 400000) : undefined }); state.reportSent = ok ? 'Thanks! Your report was sent.' : 'Could not send. Use “Copy report” or GitHub instead.'; if (ok) state.reportForm = { text: '', diag: true, shot: '' }; render(); },
  rpIssue() { const rep = reportNow(); window.open(issueUrl(reportRepo(), rep), '_blank', 'noopener'); state.reportSent = rep.screenshot ? 'GitHub opened. Drag your screenshot into the issue before submitting.' : 'GitHub opened in a new tab. Submit the issue there.'; render(); },
  rpMail() { location.href = mailtoUrl(REPORT_EMAIL, reportNow()); },
  async rpCopy() { const t = reportText(reportNow()); try { await navigator.clipboard.writeText(t); toast('Report copied. Paste it wherever you like.'); } catch { if (navigator.share) navigator.share({ title: 'Prvlar problem report', text: t }).catch(() => {}); } },
  rpShotRm() { state.reportForm.shot = ''; render(); },
  smPlus() { state.smPlus = !state.smPlus; state.smPickSkill = false; render(); },
  smUseSkill() { state.smPickSkill = !state.smPickSkill; render(); },
  smSkillClear() { state.smSkill = null; render(); },
  smWeb() { state.smWeb = !state.smWeb; writeJSON('prvlar-smweb', state.smWeb); render(); },
  skillNew() { state.skillEdit = {}; state.smartyTab = 'skills'; state.smPlus = false; go('smarty'); },
  skillCancel() { state.skillEdit = null; render(); },
  skillSave() { try { const sk = normalizeSkill(readSkillForm(state.skillEdit || {})); saveSkills(upsertSkill(skillsList(), sk)); state.skillEdit = null; toast(`Skill saved. Use it with /${skillsList().find(x => x.id === sk.id)?.name || sk.name}.`, 'ok'); } catch (e) { toast(e.message, 'warn'); } render(); },
  async skillDraft() { const req = document.getElementById('sk-ask')?.value.trim(); if (!req) return toast('Describe the skill first.', 'warn'); const ai = requireAi('draft a skill'); if (!ai) return;
    state.busy = 'skill'; render(); try { const o = await draftSkill(req, ai); state.skillEdit = { ...(state.skillEdit || {}), title: o.title || '', when: o.when || '', steps: Array.isArray(o.steps) ? o.steps : [], format: o.format || '' }; } finally { state.busy = ''; render(); } },
  obNext() { state.onStep = (state.onStep || 0) + 1; render(); },
  obBack() { state.onStep = Math.max(0, (state.onStep || 0) - 1); render(); },
  obDone() { writeJSON('prvlar-onboarded', true); render(); },
  obKey() { writeJSON('prvlar-onboarded', true); go('settings'); setTimeout(() => document.getElementById('apikey')?.focus(), 80); },
  smNext() { const p = state.practice; if (!p) return; if ((p.at || 0) + 1 < p.items.length) p.at = (p.at || 0) + 1; else finishPractice(); render(); window.scrollTo(0, 0); },
  smDrawer() { state.smDrawer = !state.smDrawer; render(); },
  smNew() { saveConvs(); state.smConv = null; state.smartyChat = []; state.smDrawer = false; state.smartyTab = 'chat'; render(); },
  smartySend() { return smartySend(document.getElementById('smartyq')?.value || ''); },
  smartyPractice() { return startPractice(); },
  smartyNewPractice() { state.practice = null; return startPractice(); },
  async smartyReset() { if (!confirm('Reset Smarty’s profile and study history?')) return; state.learner = emptyProfile(); state.traces = []; await setSetting('learner-profile', state.learner); await clearTraces(); render(); },
  dismiss() { state.error = ''; state.notice = ''; render(); },
  back() { goBack(); },
  toggleMenu() { state.menu = !state.menu; render(); },
  toggleTheme() { state.theme = isDark() ? 'light' : 'dark'; writeJSON('prvlar-theme', state.theme); applyTheme(); render(); },
  toggleKey() { state.showKey = !state.showKey; render(); document.getElementById('apikey')?.focus(); },
  toggleReview() { state.showReview = !state.showReview; render(); if (state.showReview) document.getElementById('review')?.scrollIntoView({ block: 'start' }); },
  openExplain() {
    const doc = current(); if (!doc) return go('library');
    const nodes = outline(doc), sel = nodes.find(n => n.id === state.selected && n.id !== 'root' && n.text), first = nodes.find(n => n.id !== 'root' && n.text);
    if (sel || first) openSection((sel || first).id, 'explain'); else go('study');
  },
  showOnMap() { state.studyTab = 'map'; go('study'); },
  hideNudge() { state.nudgeHidden[state.doc] = true; writeJSON('prvlar-nudge', state.nudgeHidden); render(); },
  async remapAI() {
    const doc = current(); if (!doc || state.busy) return;
    state.menu = false;
    const ai = requireAi('organise the map');
    const source = { ...doc, sections: doc.originalSections || doc.sections };   // always start from the document's own sections
    const kb = Math.max(1, Math.round(organiseSize(source) / 1000));
    if (!confirm(`Send the beginning of each paragraph of “${docTitle(doc)}” (about ${kb} KB of text) to ${aiName() || 'Smarty'} to organise the map into topics?\n\nYour document's text is not changed, and you can switch back with ⋯ › Use the original headings.`)) return render();
    if (state.view !== 'study') go('study');
    state.busy = 'remap'; render();
    let sections;
    try { sections = await organiseMap(source, ai); } finally { state.busy = ''; }
    await setStructure(doc, sections, { originalSections: source.sections, mapBy: 'ai' });
    const nodes = chartNodes(outline({ ...doc, sections })), chapters = nodes.filter(n => n.depth === 1).length, parts = nodes.filter(n => n.depth > 1).length;
    state.notice = `Map organised by AI: ${plural(chapters, 'chapter')}${parts ? ' and ' + plural(parts, 'section') : ''}. To undo, use ⋯ › Use the original headings.`;
    render(); window.scrollTo(0, 0);
  },
  async restoreMap() {
    const doc = current(); if (!doc?.originalSections || state.busy) return;
    const { originalSections, mapBy, ...rest } = doc;
    await setStructure(rest, originalSections);
    state.notice = 'Back to the document’s original headings.';
    render(); window.scrollTo(0, 0);
  },
  addNote() { if (state.selected && state.selected !== 'root' && outline(current()).some(n => n.id === state.selected)) openSection(state.selected, 'notes'); else { state.studyTab = 'notes'; render(); } },
  zoomIn() { setZoom(state.zoom + 0.15); },
  zoomOut() { setZoom(state.zoom - 0.15); },
  zoomReset() { setZoom(1); },
  zoomFit() {
    const doc = current(), wrap = document.querySelector('#chartwrap');
    if (!doc || !wrap) return;
    const { width } = flowchartSVG(chartNodes(outline(doc)), mapOpts());
    setZoom((wrap.clientWidth - 16) / width);
  },
  flipLayout() { state.layout = direction() === 'vertical' ? 'horizontal' : 'vertical'; saveView(); render(); },
  expandAll() { state.collapsed = new Set(); render(); },
  foldAll() { const nodes = chartNodes(outline(current())), kids = childrenMap(nodes); state.collapsed = new Set(nodes.filter(n => n.depth >= 1 && kids.get(n.id).length).map(n => n.id)); render(); },
  async generate() {
    const doc = current(); if (!doc || state.busy) return;
    const ai = requireAi('generate a test');
    const info = contextInfo(doc);
    if (!confirm('Send your document’s text to the AI to write your test? Your written answers will also be sent for marking when you submit.' + (info.truncated ? '\n\nThis document is long, so a sample from every section is sent.' : ''))) return;
    state.busy = 'generate'; render();
    try {
      const prof = pickedProfile(), pk = pick(); let planMin = 0;
      if (prof) {
        const plan = buildPlan(prof, pk.level, pk.size); planMin = plan.minutes || 0;
        plan.focus = tutorWeak(state.learner).map(t => t.name);
        plan.figures = prof.meta?.figures || [];
        state.questions = attachFigures(await generatePlanExam(doc, ai, plan), plan.figures, doc);
        state.examMeta = { profileId: prof.id, profileName: prof.name, level: pk.level, levelName: plan.levelName, minutes: plan.minutes, mix: plan.mix };
      } else { state.questions = attachFigures(await generateExam(doc, ai), [], doc); state.examMeta = {}; }
      state.examMeta.timing = normalizeTiming(state.timing); state.examMeta.minutes = resolveMinutes(state.timing, { questions: state.questions, paperMinutes: planMin });
      Object.assign(state, { answers: {}, flags: new Set(), qIndex: 0, startedAt: Date.now(), result: null, review: null, aiConsent: true, autoFailed: false, pauses: [], qTimes: {}, warned: [], lastTick: Date.now(), timeUp: 0 });
      saveDraft();
    } finally { state.busy = ''; }
    render(); window.scrollTo(0, 0);
  },
  nextQ() { gotoQ(state.qIndex + 1); },
  prevQ() { gotoQ(state.qIndex - 1); },
  openGrid() { state.showGrid = true; render(); },
  closeGrid() { state.showGrid = false; render(); },
  async submit() {
    if (aiAvailable() && !state.aiConsent) state.aiConsent = confirm('Send your written answers and parts of your document to the AI for marking? Choose Cancel to mark them yourself.');
    const left = state.questions.length - state.questions.filter(answered).length;
    if (confirm(left ? `Submit now? ${plural(left, 'question')} unanswered will score zero.` : 'Submit your test?')) await submit();
  },
  async adjust() {
    const r = shown(); if (!r) return;
    for (const el of document.querySelectorAll('[data-adjust]')) {
      const q = r.questions.find(x => x.id === el.dataset.adjust), g = r.grades.find(x => x.id === el.dataset.adjust), n = Number(el.value);
      if (!Number.isInteger(n) || n < 0 || n > q.marks) throw Error(`Marks must be a whole number from 0 to ${q.marks}.`);
      if (g.awarded !== n || g.method === 'self assessment pending') { g.awarded = n; g.method = 'manual review'; }
    }
    r.earned = r.grades.reduce((s, g) => s + g.awarded, 0);
    r.percent = r.total ? Math.max(0, Math.round(100 * r.earned / r.total)) : 0;
    r.provisional = r.grades.some(g => g.method === 'self assessment pending');
    await saveAttempt(r);
    const made = await mistakeCards(r).catch(() => 0);
    state.attempts = await getAttempts();
    state.notice = 'Marks saved.' + (made ? ` ${plural(made, 'flashcard')} made from wrong answers.` : ''); render(); window.scrollTo(0, 0);
  },
  reset() { Object.assign(state, { examMeta: null, questions: null, answers: {}, flags: new Set(), qIndex: 0, result: null, review: null, showReview: false }); render(); window.scrollTo(0, 0); },
  async newTest() { const doc = state.docs.find(d => d.id === shown()?.documentId); if (doc) selectDoc(doc.id); actions.reset(); if (state.view !== 'test') go('test'); await actions.generate(); },
  async shareResult() {
    const a = shown(); if (!a) return;
    const how = await shareText('Prvlar result', `I scored ${a.percent}% (${a.earned}/${a.total} marks) on “${attemptTitle(a)}” in Prvlar.`);
    if (how === 'copied') { state.notice = 'Result copied to the clipboard.'; render(); }
  },
  async explainSel() { const s = readSelection() || state.sel; selButton().hidden = true; if (!s?.text) return toast('Select some text first (long-press on a phone), then tap Smarty explains.', 'warn'); return runSelExplain({ text: s.text, before: s.before, after: s.after }); },
  selExpClose() { state.selExp = null; render(); },
  async explain() {
    const doc = current(), node = outline(doc).find(n => n.id === state.selected);
    if (!node?.text || state.busy) return;
    const s = state.sel?.text && node.text.includes(state.sel.text.slice(0, 40)) ? state.sel : null;
    if (s) return runSelExplain({ text: s.text, before: s.before, after: s.after });
    if (!confirm('Tip: select a passage (long-press on a phone) and tap “Smarty explains” to explain just that part.\n\nExplain this whole page instead?')) return;
    const ai = requireAi('get explanations');
    if (!confirm('Send this section’s text to the AI for a plain-language explanation?')) return;
    state.busy = 'explain'; render();
    try {
      const text = await explainSection(node.title, node.text, ai);
      const k = explainKey(doc.id, node.id);
      state.explain[k] = text; await setSetting(k, text);
    } finally { state.busy = ''; }
    render();
  },
  askSend() { const el = document.getElementById('askq'); const q = el?.value || ''; return sendAsk(q); },
  chatSend() { const el = document.getElementById('chatq'); const q = el?.value || ''; return sendChat(q); },
  clearAsk() { const k = askKey(state.doc, state.selected); state.asks[k] = []; setSetting(k, []).catch(() => {}); render(); },
  clearChat() { if (!confirm('Clear this conversation?')) return; state.chats[state.doc] = []; setSetting('chat::' + state.doc, []).catch(() => {}); render(); },
  ...examActions,
  ...papersActions,
  checkUpdate() { return runUpdateCheck(true); },
  toggleNotices() { state.notices = !state.notices; render(); },
  showUpdate() { state.update.dialog = true; render(); },
  closeUpdate() { if (state.update.busy === 'download') return; state.update.dialog = false; state.update.error = ''; render(); },
  async doUpdate() {
    const u = state.update, r = u.release; if (!r || u.busy) return;
    if (isNative() && platform() === 'android' && r.apk) {
      u.busy = 'download'; u.progress = 0; u.error = ''; render();
      try {
        let last = 0;
        const ok = await downloadAndInstallApk(r.apk.url, r.apk.name, pc => { u.progress = pc; if (pc - last >= 5) { last = pc; render(); } });
        u.busy = ''; if (ok) { u.dialog = false; state.notice = 'Follow Android\'s prompt to install the update.'; return render(); }
      } catch (e) { u.busy = ''; u.error = 'In-app download failed, opening it in your browser instead.'; render(); }
      return openExternal(r.apk.url);
    }
    u.dialog = false; render();
    openExternal(r.page || RELEASES_PAGE);
  },
  async khTest() {
    const k = (document.getElementById('kh-key')?.value || '').trim(); if (!k) { state.khRes = { ok: false, text: 'Paste your key first.' }; return render(); }
    state.busy = 'kh'; state.khRes = null; render();
    try { const r = await testConnection(k); state.key = k; state.freeLimit = false; state.ai = { ...state.ai, mode: 'cloud' }; writeJSON('prvlar-ai', state.ai); saveKey(); state.khRes = null; toast(`Key works: ${providerFor(k).name} connected in ${(r.ms / 1000).toFixed(1)} s. Smarty is ready.`, 'ok'); }
    catch (e) { state.khRes = { ok: false, text: e?.message || String(e) }; } finally { state.busy = ''; render(); }
  },
  async testConn() {
    if (state.busy) return;
    state.busy = 'conn'; state.conn = null; render();
    try {
      const r = await testConnection(usingServer() ? aiConfig() : requireAi('test the connection'));
      state.conn = { ok: true, text: `Successfully connected to ${describeAI(aiConfig())} in ${(r.ms / 1000).toFixed(1)} s.` };
    } catch (e) {
      state.conn = { ok: false, text: e?.message || String(e) };
    } finally { state.busy = ''; }
    render();
  },
  fcFlip() { if (state.fc) { state.fc.flipped = true; render(); } },
  fcEnd() { state.fc = null; render(); window.scrollTo(0, 0); },
  async fcAdd() {
    const card = newCard({ documentId: document.getElementById('fc-doc')?.value || null, front: document.getElementById('fc-front')?.value, back: document.getElementById('fc-back')?.value });
    await addCards([card]); state.cardsOpen = card.documentId || '-'; state.notice = 'Card added. It shows up in your next review.'; render();
  },
  async fcAddHere() {
    const node = outline(current()).find(n => n.id === state.selected);
    const card = newCard({ documentId: state.doc, nodeId: node?.id || null, source: node?.source || '', front: document.getElementById('fc-front')?.value, back: document.getElementById('fc-back')?.value });
    await addCards([card]); state.notice = 'Card added.'; render();
  },
  async fcAI() {
    const doc = current(), node = outline(doc).find(n => n.id === state.selected);
    if (!node?.text || state.busy) return;
    const ai = requireAi('make flashcards');
    if (!confirm('Send this section’s text to the AI to write flashcards?')) return;
    state.busy = 'cards'; render();
    let made;
    try {
      const list = await makeFlashcards(node.title, node.text, ai);
      const have = new Set(state.cards.filter(c => c.documentId === doc.id).map(c => c.front.toLowerCase()));
      made = await addCards(list.filter(c => !have.has(c.front.toLowerCase())).map(c => newCard({ ...c, documentId: doc.id, nodeId: node.id, source: node.source, origin: 'ai' })));
    } finally { state.busy = ''; }
    state.notice = made ? `${plural(made, 'flashcard')} added for this section.` : 'No new cards: these are already in your deck.';
    render();
  },
  retryShow() { if (state.retry) { state.retry.text = document.getElementById('retry-text')?.value || ''; state.retry.shown = true; render(); } },
  retryClose() { state.retry = null; render(); },
  async planAdd(el) {
    const kind = el.dataset.kind, title = (document.getElementById('pl-title')?.value || '').trim(), date = document.getElementById('pl-date')?.value || '';
    if (!title) throw Error(kind === 'exam' ? 'Enter the name of the exam.' : 'Enter the task.');
    if (kind === 'exam' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Choose the exam date.');
    const plan = { id: uuid(), kind, title: title.slice(0, 160), date, time: kind === 'todo' ? (document.getElementById('pl-time')?.value || '') : '', documentId: kind === 'exam' ? (document.getElementById('pl-doc')?.value || null) : null, done: false, created: Date.now() };
    await savePlan(plan); state.plans = [...state.plans, plan];
    const ok = await rescheduleReminders().catch(() => false);
    state.notice = (kind === 'exam' ? `Exam added: ${countdownText(daysUntil(date)).toLowerCase()} to go.` : 'Task added.') + (ok || state.notifPerm === 'unsupported' ? '' : ' Allow notifications in Planner › Goals to get reminders.');
    render();
  },
  async allowExact() { state.exactPerm = await askExactAlarm(); await rescheduleReminders().catch(() => {}); render(); },
  async allowNotif() { state.notifPerm = await askPermission(); await rescheduleReminders().catch(() => {}); render(); },
  focusGo() { focusStart(); render(); },
  focusPause() { focusPause(); render(); },
  async focusSkip() {
    const r = state.focusRun;
    if (r.phase === 'focus') { const m = await logFocus(false); if (m) state.notice = `${fmtMin(m)} of focus logged.`; }
    const n = nextPhase(r.phase === 'idle' ? 'focus' : r.phase, r.cycle || 0, { longEvery: state.focusPrefs.longEvery });
    stopAmbient(); cancelFocusEnd();
    Object.assign(r, { phase: n.phase, cycle: n.cycle, running: false, left: null, endsAt: 0 }); saveRun(); render();
  },
  async focusStop() {
    const r = state.focusRun, m = r.phase === 'focus' ? await logFocus(false) : 0;
    stopAmbient(); cancelFocusEnd(); musicTimer('stop');
    state.focusRun = { phase: 'idle', cycle: 0, running: false, endsAt: 0, left: null, docId: r.docId }; saveRun();
    state.notice = m ? `Stopped. ${fmtMin(m)} of focus logged.` : 'Timer stopped.'; render();
  },
  async exportOutline() {
    const doc = current(); if (!doc) return; state.menu = false;
    const name = fileTitle(doc).replace(/[^\w\- ]+/g, '').trim().slice(0, 60) + ' - mind map.md';
    const how = await saveTextFile(name, mapMarkdown(doc), 'text/markdown');
    state.notice = how === 'cancelled' ? '' : `Mind map exported as ${name}. Open it in a mind-map app that imports Markdown (Markmap, XMind, Obsidian).`; render();
  },
  async exportBackup() {
    const name = 'prvlar-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    const how = await saveTextFile(name, JSON.stringify(await exportAll()));
    if (how !== 'cancelled') { state.notice = how === 'shared' ? `Backup ready: ${name}. Choose where to save it.` : `Backup saved: ${name}`; render(); }
  }
};

async function openAttempt(id) {
  const a = await db.attempts.get(id);
  if (!a) throw Error('That result could not be found.');
  Object.assign(state, { review: a, showReview: false });
  go('test');
  state.review = a; render();
}
async function importFiles(files) {
  const errors = [];
  let last = null;
  for (const file of files) {
    try { const d = await parseFile(file); await saveDocument(d); if (d.bytes) await saveBlob('pdf:' + d.id, d.bytes).catch(() => {}); last = d; }
    catch (err) { errors.push(`${file.name}: ${err.message}`); }
  }
  if (last) { selectDoc(last.id); state.studyTab = 'map'; }
  state.docs = await getDocuments();
  state.error = errors.join('\n');
  state.notice = !last ? '' : files.length - errors.length > 1 ? `Imported ${files.length - errors.length} documents. Showing ${docTitle(last)}.` : `Imported ${docTitle(last)}. Select a section to start studying.`;
  if (last) go('study', { keep: true }); else render();
  updateStorage();
}
async function reloadAll() {
  state.notes = readJSON('prvlar-notes', {}); state.visited = readJSON('prvlar-visited', {});
  loadPrefs(); applyTheme(); applyReading(); applyUiSize(); await refresh();
  state.learner = (await getSetting('learner-profile').catch(() => null)) || state.learner; state.traces = await getTraces().catch(() => state.traces);
}
async function restoreBackup(file) {
  if (!file) return;
  let data; try { data = JSON.parse(await file.text()); } catch { throw Error('That file is not a Prvlar backup.'); }
  await importAll(data);
  state.notes = readJSON('prvlar-notes', {}); state.visited = readJSON('prvlar-visited', {});
  loadPrefs(); applyTheme(); applyReading();
  state.notice = 'Backup restored.'; await refresh();
  rescheduleReminders().catch(() => {});
}
async function deleteDoc(id) {
  const d = state.docs.find(x => x.id === id);
  state.menu = false;
  if (!d || !confirm(`Delete “${docTitle(d)}” with its notes and flashcards? Your test results and study time are kept.`)) return render();
  await db.documents.delete(id);
  await db.cards.where('documentId').equals(id).delete();
  state.cards = state.cards.filter(c => c.documentId !== id);
  await db.settings.where('key').startsWith('explain::' + id).delete();
  await db.settings.where('key').startsWith('ask::' + id).delete();
  await db.settings.delete('chat::' + id);
  for (const k of Object.keys(state.notes)) if (k.startsWith(id + '::')) delete state.notes[k];
  delete state.visited[id]; writeJSON('prvlar-visited', state.visited);
  delete state.lastStudied[id]; writeJSON('prvlar-last', state.lastStudied);
  persistNotes(); sessionStorage.removeItem(draftKey(id));
  if (state.doc === id) Object.assign(state, { doc: null, questions: null, result: null, review: null });
  state.notice = `Deleted ${docTitle(d)}.`;
  await refresh();
  if (['study', 'section', 'chat'].includes(state.view)) go('library', { keep: true });
}

/* =================================================================== events */
const run = fn => { Promise.resolve().then(fn).catch(fail); };
app.addEventListener('click', e => {
  const b = e.target.closest('[data-action],[data-smattrm],[data-smskill],[data-skilledit],[data-skilldel],[data-devrmrole],[data-view],[data-open],[data-del],[data-toggle],[data-node],[data-docnode],[data-attempt],[data-q],[data-flag],[data-theme-set],[data-stab],[data-stab2],[data-prompt],[data-review],[data-review-node],[data-grade],[data-deck],[data-delcard],[data-errf],[data-retry],[data-retry-pick],[data-retry-self],[data-errcard],[data-delplan],[data-ptab],[data-phase],[data-sound],[data-rec-test],[data-rec-topic],[data-speak],[data-speak-card],[data-font],[data-level],[data-lab],[data-useprof],[data-delprof],[data-delpaper],[data-upsem],[data-mesem],[data-meretry],[data-smtab],[data-smpick],[data-findimg],[data-zoom],[data-figpage],[data-fbup],[data-go],[data-smsuggest],[data-smconv],[data-smren],[data-smdel],[data-smact],[data-uisize],[data-cmode],[data-cstep],[data-cprob],[data-devtab],[data-devtable],[data-devrmowner],[data-tmode],[data-msrc],[data-spcur],[data-mqplay],[data-mqdel],[data-spapp]');
  if (!b || b.disabled) { if (state.menu && !e.target.closest('.menu-wrap')) { state.menu = false; render(); } return; }
  const d = b.dataset;
  if (d.action) return run(() => actions[d.action](b));
  if (d.review !== undefined) return startReview(d.review || null);
  if (d.reviewNode) return startReview(state.doc, d.reviewNode);
  if (d.grade) return run(() => gradeCard(Number(d.grade)));
  if (d.deck) { state.cardsOpen = state.cardsOpen === d.deck ? null : d.deck; return render(); }
  if (d.delcard) return run(async () => { if (!confirm('Delete this flashcard?')) return; await deleteCard(d.delcard); state.cards = state.cards.filter(c => c.id !== d.delcard); render(); });
  if (d.errf) { state.errFilter = d.errf; state.retry = null; return render(); }
  if (d.retry) { state.retry = { key: d.retry }; return render(); }
  if (d.retryPick !== undefined) return run(async () => { const e = errorEntries(state.attempts).find(x => x.key === state.retry?.key); if (!e) return; state.retry.choice = Number(d.retryPick); await retryResult(e.key, state.retry.choice === e.question.correct); render(); });
  if (d.retrySelf !== undefined) return run(async () => { const k = state.retry?.key; if (!k) return; await retryResult(k, d.retrySelf === '1'); state.notice = d.retrySelf === '1' ? 'Marked as fixed. Well done!' : 'Kept on your retry list.'; state.retry = null; render(); });
  if (d.errcard) return run(async () => { const e = errorEntries(state.attempts).find(x => x.key === d.errcard); if (!e) return; const a = state.attempts.find(x => x.id === e.attemptId); const n = await addCards([cardFromQuestion(e.question, a, nodeForSource(docById(e.documentId), e.question.source)?.id || null)]); state.notice = n ? 'Flashcard made.' : 'That card already exists.'; render(); });
  if (d.delplan) return run(async () => { const p = state.plans.find(x => x.id === d.delplan); if (!p || !confirm(`Delete “${p.title}”?`)) return; await deletePlan(p.id); state.plans = state.plans.filter(x => x.id !== p.id); await rescheduleReminders().catch(() => {}); render(); });
  if (d.ptab) { state.planTab = d.ptab; if (d.ptab === 'goals') Promise.all([permission(), exactAlarm()]).then(([v, x]) => { state.notifPerm = v; state.exactPerm = x; if (state.view === 'planner') render(); }); return render(); }
  if (d.phase) { const r = state.focusRun; if (r.running) return; Object.assign(r, { phase: d.phase, left: null }); saveRun(); return render(); }
  if (d.sound) { state.focusPrefs.sound = d.sound; writeJSON('prvlar-focus', state.focusPrefs); if (d.sound === 'off') stopAmbient(); else if (state.focusRun.running && state.focusRun.phase === 'focus') playAmbient(d.sound, state.focusPrefs.volume); else { playAmbient(d.sound, state.focusPrefs.volume); setTimeout(() => { if (!(state.focusRun.running && state.focusRun.phase === 'focus')) stopAmbient(); }, 2500); } return render(); }
  if (d.recTest) { selectDoc(d.recTest); actions.reset(); return go('test'); }
  if (d.recTopic) { const [docId, topic] = d.recTopic.split('::'); const doc = docById(docId); if (!doc) return; selectDoc(docId); const n = nodeForTopic(doc, topic); if (n) return openSection(n.id); state.studyTab = 'map'; return go('study'); }
  if (d.speak) { const node = outline(current()).find(n => n.id === d.speak); if (node) return run(() => toggleSpeak(node.title + '. ' + withoutTitle(node.text, node.title), node.id)); return; }
  if (d.speakCard) { const c = state.cards.find(x => x.id === state.fc?.queue[state.fc.i]); if (c) return run(() => toggleSpeak(d.speakCard === 'back' ? c.back : c.front, 'card:' + c.id + d.speakCard)); return; }
  if (d.font) { state.reading.size = Math.round(Math.min(1.6, Math.max(0.8, state.reading.size + Number(d.font) * 0.1)) * 10) / 10; writeJSON('prvlar-reading', state.reading); applyReading(); return render(); }
  if (d.level !== undefined) { writeJSON('prvlar-exam-pick', { ...pick(), level: Number(d.level) }); return render(); }
  if (d.lab) { state.labTab = d.lab; if (state.view !== 'examlab') return go('examlab'); return render(); }
  if (d.useprof) { writeJSON('prvlar-exam-pick', { ...pick(), id: d.useprof, level: 0 }); return go('test'); }
  if (d.delprof) return run(async () => { const p = state.profiles.find(x => x.id === d.delprof); if (!p || !confirm(`Delete the exam profile “${p.name}”?`)) return; await deleteProfile(p.id); state.profiles = await getProfiles(); if (pick().id === p.id) writeJSON('prvlar-exam-pick', { ...pick(), id: 'standard' }); render(); });
  if (d.delpaper !== undefined) { state.lab.papers.splice(Number(d.delpaper), 1); return render(); }
  if (d.go) { const [v, sub] = d.go.split(':'); if (v === 'smarty') state.smartyTab = sub; go(v); if (v === 'settings' && sub) setTimeout(() => document.getElementById(sub)?.scrollIntoView({ block: 'start' }), 60); return; }
  if (d.devtab) { state.devTab = d.devtab; if (d.devtab === 'db' && !state.devCounts) return actions.devCount(); if (d.devtab === 'errors' && !state.devErr) return actions.devErrLoad(); return render(); }
  if (d.devtable) { state.devTable = d.devtable; db.table(d.devtable).toArray().then(rows => { state.devRowsAll = rows; state.devRows = rows.slice(0, 20).map(r => JSON.parse(JSON.stringify(r, (k, v) => typeof v === 'string' && v.length > 200 ? v.slice(0, 200) + '…' : v instanceof Uint8Array || v instanceof ArrayBuffer ? `[${v.byteLength} bytes]` : v))); render(); }); return; }
  if (d.devrmrole) { if (state.owner) removeRole(d.devrmrole); return render(); }
  if (d.devrmowner && !state.owner) return;
  if (d.devrmowner) { try { removeOwner(d.devrmowner); } catch (e) { toast(e.message, 'warn'); } return render(); }
  if (d.tmode) { state.timing.mode = d.tmode; if (d.tmode === 'preset') state.timing.minutes = Number(d.tmin); saveTiming(); return render(); }
  if (d.msrc) { music.source = d.msrc; return render(); }
  if (d.spcur) { loadSpotify(d.spcur).then(() => { if (state.focusRun.running && music.follow) musicPlay(); }).catch(e => toast(e.message, 'warn')); return; }
  if (d.mqplay != null && d.mqplay !== '') { const i = Number(d.mqplay); if (i >= 0) playLocal(i); return; }
  if (d.mqdel != null && d.mqdel !== '') { removeLocal(Number(d.mqdel)); return; }
  if (d.spapp) { e.preventDefault(); openSpotifyApp(d.spapp); return; }
  if (d.cmode) { const c = codeState(); c.mode = d.cmode; if (d.cmode === 'debug') c.step = 'review'; saveCode(); return render(); }
  if (d.cstep) { codeState().step = d.cstep; return render(); }
  if (d.cprob) { const p = PROBLEMS.find(x => x.id === d.cprob); if (p) loadProblem(p); return render(); }
  if (d.uisize) { writeJSON('prvlar-uisize', d.uisize); applyUiSize(); return render(); }
  if (d.smsuggest) return run(() => smartySend(d.smsuggest));
  if (d.smconv) { const c = state.smConvs.find(x => x.id === d.smconv); if (c) { saveConvs(); state.smConv = c.id; state.smartyChat = c.msgs; state.smDrawer = false; state.smartyTab = 'chat'; } return render(); }
  if (d.smren) { const c = state.smConvs.find(x => x.id === d.smren); const t = c && prompt('Rename chat', c.title); if (t && t.trim()) { c.title = t.trim().slice(0, 60); saveConvs(); setSetting('smarty-convs', state.smConvs).catch(() => {}); } return render(); }
  if (d.smdel) { if (!confirm('Delete this chat?')) return; state.smConvs = state.smConvs.filter(x => x.id !== d.smdel); if (state.smConv === d.smdel) { state.smConv = null; state.smartyChat = []; } setSetting('smarty-convs', state.smConvs).catch(() => {}); return render(); }
  if (d.smact) { const [a, i] = d.smact.split(':'), th = state.smartyChat || [], m = th[+i]; if (!m) return;
    if (a === 'copy') { navigator.clipboard?.writeText(m.text).then(() => { state.notice = 'Copied.'; render(); }).catch(() => {}); return; }
    if (a === 'speak') return run(() => toggleSpeak(m.text.replace(/```[\s\S]*?```/g, ' ').replace(/[$*#`]/g, ''), 'sm' + i));
    if (a === 'regen') { const q = th[+i - 1]?.text; if (!q) return; th.splice(+i - 1, 2); return run(() => smartySend(q)); } return; }
  if (d.fbup) { const i = +d.fbup, o = state.fb.order; [o[i - 1], o[i]] = [o[i], o[i - 1]]; saveFb(); return render(); }
  if (d.findimg) { const [sc, i] = d.findimg.split(':'); return run(() => findImage(sc, +i)); }
  if (d.zoom) return zoomImage(d.zoom);
  if (d.figpage) return run(() => showFigure(d.figpage));
  if (d.smtab) { state.smartyTab = d.smtab; return render(); }
  if (d.smattrm) { state.smAtt = (state.smAtt || []).filter(a => a.id !== d.smattrm); return render(); }
  if (d.smskill) { state.smSkill = d.smskill; state.smPlus = false; state.smPickSkill = false; state.smSuggest = null; return render(); }
  if (d.skilledit) { state.skillEdit = { ...skillsList().find(x => x.id === d.skilledit) }; state.smartyTab = 'skills'; return render(); }
  if (d.skilldel) { const x = skillsList().find(y => y.id === d.skilldel); if (x && confirm(`Delete the skill “${x.title}”?`)) { saveSkills(removeSkill(skillsList(), x.id)); if (state.smSkill === x.id) state.smSkill = null; } return render(); }
  if (d.smpick) { const q = state.practice?.items.find(x => x.id === d.smpick.split(':')[0]); if (q && !(q.id in state.practice.answers)) { state.practice.answers[q.id] = +d.smpick.split(':')[1]; render(); } return; }
  if (ED.onClick(d, e)) return;
  if (d.view) return go(d.view);
  if (d.open) { selectDoc(d.open); state.studyTab = 'map'; return go('study'); }
  if (d.del) return run(() => deleteDoc(d.del));
  if (d.toggle) { state.collapsed.has(d.toggle) ? state.collapsed.delete(d.toggle) : state.collapsed.add(d.toggle); return render(); }
  if (d.docnode) { const [docId, nodeId] = d.docnode.split(':'); selectDoc(docId); if (nodeId === 'root') { state.studyTab = 'notes'; return go('study'); } return openSection(nodeId, d.tab || 'content'); }
  if (d.node) {
    const doc = current();
    if (d.node === 'root' || (chartNodes(outline(doc))[0]?.id === d.node && !outline(doc).find(n => n.id === d.node)?.text)) { state.selected = d.node; state.studyTab = 'outline'; return go('study'); }
    return openSection(d.node, d.tab || (state.view === 'section' ? state.sectionTab : 'content'));
  }
  if (d.attempt) return run(() => openAttempt(d.attempt));
  if (d.q) return gotoQ(Number(d.q));
  if (d.flag) {
    const on = !state.flags.has(d.flag);
    on ? state.flags.add(d.flag) : state.flags.delete(d.flag);
    b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
    return saveDraft();
  }
  if (d.themeSet) { state.theme = d.themeSet; writeJSON('prvlar-theme', state.theme); applyTheme(); return render(); }
  if (d.stab) { if (state.view === 'study' && ['map', 'outline', 'notes'].includes(d.stab)) { state.studyTab = d.stab; return render(); } state.sectionTab = d.stab; if (state.view !== 'section') return go('section'); return render(); }
  if (d.stab2) { state.sectionTab = d.stab2; return render(); }
  if (d.prompt) return run(() => d.scope === 'chat' ? sendChat(d.prompt) : sendAsk(d.prompt));
});
app.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-import]')) { const files = [...t.files]; t.value = ''; return run(() => importFiles(files)); }
  if (t.matches('[data-restore]')) { const f = t.files[0]; t.value = ''; return run(() => restoreBackup(f)); }
  if (t.id === 'docpick') { selectDoc(t.value); return render(); }
  if (t.id === 'exam-pick') { writeJSON('prvlar-exam-pick', { ...pick(), id: t.value, level: 0 }); return render(); }
  if (t.id === 'exam-size') { writeJSON('prvlar-exam-pick', { ...pick(), size: Number(t.value) || 20 }); return render(); }
  if (t.id === 'tm-h-in' || t.id === 'tm-m-in') { const h = Number(document.getElementById('tm-h-in')?.value) || 0, m = Number(document.getElementById('tm-m-in')?.value) || 0; state.timing.minutes = Math.max(1, h * 60 + m); saveTiming(); return; }   // no re-render on blur
  if (t.id === 'pb-name' || t.id === 'pb-dur' || t.id === 'pb-topics' || t.dataset.pbf) {
    const b = state.pb; if (!b) return;
    if (t.id === 'pb-name') b.name = t.value; else if (t.id === 'pb-dur') b.durationMin = Number(t.value); else if (t.id === 'pb-topics') b.topics = t.value;
    else { const s = b.sections[Number(t.closest('[data-pbsec]').dataset.pbsec)]; s[t.dataset.pbf] = t.dataset.pbf === 'name' || t.dataset.pbf === 'type' ? t.value : Number(t.value); }
    const el = document.getElementById('pb-sum'); if (el) el.innerHTML = pbSummary(b);   // no full re-render: keeps focus and the next click
    return;
  }
  if (t.id === 'tm-perq') { state.timing.perQ = Number(t.value); saveTiming(); return; }
  if (t.id === 'tm-practice') { state.timing.practice = t.checked; saveTiming(); return; }
  if (t.id === 'focus-stopend') { state.focusPrefs.stopAtEnd = t.checked; writeJSON('prvlar-focus', state.focusPrefs); return; }
  if (t.id === 'focus-sleep') { state.focusPrefs.sleep = Number(t.value); writeJSON('prvlar-focus', state.focusPrefs); return; }
  if (t.id === 'music-follow') { state.focusPrefs.musicFollow = music.follow = t.checked; writeJSON('prvlar-focus', state.focusPrefs); return; }
  if (t.matches?.('[data-musicfiles]')) { const n = addLocalFiles(t.files || []); if (!n) toast('No audio files found.', 'warn'); else if (music.q.at >= 0 && !music.playing) playLocal(music.q.at); t.value = ''; return; }
  if (t.dataset?.devflag) { if (!canDo('beta') && !canDo('dev')) return; setFlag(t.dataset.devflag, t.checked); return render(); }
  if (t.id === 'sync-auto' || t.id === 'sync-encrypt' || t.id === 'sync-keys') { setSyncPrefs({ [t.id.slice(5)]: t.checked }); if (t.id === 'sync-encrypt' && t.checked && !hasPassphrase()) actions.cloudPass(); return render(); }
  if (t.id === 'clang') { const c = codeState(); const fresh = c.src.trim() === starter(c.problem, c.lang).trim(); c.lang = t.value; if (fresh) c.src = starter(c.problem, c.lang); c.run = null; saveCode(); return render(); }
  if (t.id === 'ctopic' || t.id === 'clevel') { codeState()[t.id === 'ctopic' ? 'topic' : 'level'] = t.value; return render(); }
  if (t.id === 'cconcept') { codeState().concept = t.value; return; }
  if (t.id === 'ob-stream' || t.id === 'set-stream') { writeJSON('prvlar-stream', t.value); if (t.id === 'set-stream') render(); return; }
  if (t.id === 'runner-url' || t.id === 'runner-key') { const r = runnerCfg(); r[t.id === 'runner-url' ? 'url' : 'key'] = t.value.trim(); writeJSON('prvlar-runner', r); return; }
  if (t.id === 'csrc') { codeState().src = t.value; saveCode(); return; }
  if (t.id === 'ctests') { codeState().tests = t.value; return; }
  if (t.id === 'cplan') { codeState().myPlan = t.value; return; }
  if (t.id === 'cbug') { codeState().bug = t.value; return; }
  if (t.id === 'ob-name' || t.id === 'set-name') { writeJSON('prvlar-name', t.value.trim().slice(0, 40)); return; }
  if (t.id === 'smmodel') { state.smModel = t.value; return render(); }
  if (t.id === 'aivision') { state.ai.vision = t.checked; saveAi(); return render(); }
  if (t.id === 'fb-on') { state.fb.on = t.checked; saveFb(); return render(); }
  if (t.id === 'docsonly') { writeJSON('prvlar-docs-only', t.checked); return render(); }
  if (t.matches('[data-glassbg]')) { const f = t.files[0]; t.value = ''; return run(() => pickGlassBg(f)); }
  if (t.matches('[data-rpshot]')) { const f = t.files[0]; t.value = ''; if (!f) return; if (f.size > 6 * 1048576) return toast('Screenshot too big (6 MB max).', 'warn'); const fr = new FileReader(); fr.onload = () => { state.reportForm.text = document.getElementById('rp-text')?.value || state.reportForm.text; state.reportForm.shot = fr.result; render(); }; fr.readAsDataURL(f); return; }
  if (t.id === 'rp-auto') { writeJSON('prvlar-report-auto', t.checked); return; }
  if (t.matches('[data-smattach]')) { const fs = [...t.files]; t.value = ''; state.smPlus = false; return run(() => addAttachments(fs)); }
  if (t.matches('[data-packfile]')) { const f = t.files[0], pass = packPass(); t.value = ''; if (!f) return; return run(async () => {
    if (!state.owner) throw Error('Sign in with an owner Google account first.');
    if (!pass) throw Error('Type the owner-pack passphrase first, then pick the file.');
    let env; try { env = JSON.parse(await f.text()); } catch { throw Error('Pick owner-pack.json (unzip the download first).'); }
    if (!isPackEnvelope(env)) throw Error('This is not a Prvlar owner pack.');
    const local = t.dataset.packfile === 'local';
    const r = await ownerPack.install(env, pass, { upload: !local }); state.packStatus = ownerPack.status();
    toast(local ? 'Owner pack active on this device.' : r.driveError ? `Owner pack active on this device, but not saved to Drive: ${r.driveError}` : 'Owner pack uploaded to your Drive and active on this device.', r.driveError ? 'warn' : 'ok');
  }); }
  if (t.matches('[data-paperpdf]')) { const files = [...t.files]; t.value = ''; return run(() => addPaperFiles(files)); }
  if (ED.onChange(t)) return;
  if (t.dataset.multi !== undefined) {
    const id = t.dataset.multi, set = new Set(Array.isArray(state.answers[id]) ? state.answers[id] : []);
    t.checked ? set.add(Number(t.value)) : set.delete(Number(t.value));
    state.answers[id] = [...set].sort(); saveDraft(); t.closest('.option')?.classList.toggle('is-on', t.checked); refreshProgress(); return;
  }
  if (t.id === 'aimode') { state.ai = { mode: t.value, url: '', model: '' }; state.conn = null; saveAi(); return render(); }
  if (t.dataset.todo) return run(async () => { const p = state.plans.find(x => x.id === t.dataset.todo); if (!p) return; p.done = t.checked; await savePlan(p); await rescheduleReminders().catch(() => {}); render(); });
  if (t.dataset.remind) { state.remind[t.dataset.remind] = t.checked; writeJSON('prvlar-remind', state.remind); return run(async () => { if (t.checked && state.notifPerm !== 'granted') state.notifPerm = await askPermission(); await rescheduleReminders(); render(); }); }
  if (t.id === 'remind-time') { if (/^\d\d:\d\d$/.test(t.value)) { state.remind.time = t.value; writeJSON('prvlar-remind', state.remind); rescheduleReminders().catch(() => {}); } return; }
  if (t.dataset.goal) { const n = Math.round(Number(t.value)); if (n > 0) { state.goals[t.dataset.goal] = n; writeJSON('prvlar-goals', state.goals); loadPrefs(); } return render(); }
  if (t.dataset.focus) { const n = Math.round(Number(t.value)); if (n > 0) { state.focusPrefs[t.dataset.focus] = n; writeJSON('prvlar-focus', state.focusPrefs); loadPrefs(); if (state.focusRun.phase === 'idle') state.focusRun.left = null; } return render(); }
  if (t.id === 'focus-doc') { state.focusRun.docId = t.value || null; saveRun(); return; }
  if (t.id === 'focus-auto') { state.focusPrefs.autoNext = t.checked; writeJSON('prvlar-focus', state.focusPrefs); return render(); }
  if (t.id === 'autoupdate') { writeJSON('prvlar-update', { ...updPrefs(), auto: t.checked }); return render(); }
  if (t.id === 'autocards') { writeJSON('prvlar-autocards', t.checked); return render(); }
  if (t.id === 'tts-rate') { state.reading.rate = Number(t.value) || 1; writeJSON('prvlar-reading', state.reading); return; }
  if (t.id === 'font-size') { state.reading.size = Number(t.value) || 1; writeJSON('prvlar-reading', state.reading); applyReading(); return render(); }
  if (t.id === 'remember') { state.remember = t.checked; writeJSON('prvlar-remember', state.remember); saveKey(); return render(); }
  if (t.type === 'radio' && t.dataset.answer !== undefined) {
    state.answers[t.dataset.answer] = t.value; saveDraft();
    t.closest('.options')?.querySelectorAll('.option').forEach(l => l.classList.toggle('is-on', l.contains(t)));
    refreshProgress();
  }
});
app.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form="spotify"]'); if (!f) return; e.preventDefault();
  const v = f.querySelector('#sp-url').value; state.spInput = v;
  loadSpotify(v).then(() => { if (state.focusRun.running && music.follow) musicPlay(); }).catch(err => toast(err.message, 'warn'));
});
app.addEventListener('input', e => {
  const t = e.target;
  if (/^fb-(gemini|groq|url|key|model)$/.test(t.id)) { state.fb[t.id.slice(3)] = t.value; saveFb(); return; }
  if (t.id === 'smconvq') { state.smConvQ = t.value; render(); const el = document.getElementById('smconvq'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } return; }
  if (t.id === 'smartyq') { state.smartyDraft = t.value; if (!state.smSkill && !t.value.startsWith('/')) { const sg = suggestSkill(t.value, skillsList())?.id || null; if (sg !== state.smSuggest) { state.smSuggest = sg; const w = document.getElementById('sm-extras-wrap'); if (w) w.innerHTML = smComposerExtras(); } } return; }
  if (t.id === 'smartysearch') { state.smartyQuery = t.value; render(); const el = document.getElementById('smartysearch'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } return; }
  if (t.id === 'cx-name') { state.lab.name = t.value; return; }
  if (t.id === 'pp-subject') { state.lab.ppSubject = t.value; return; }
  if (t.id === 'pp-url') { state.ppUrl = t.value; return; }
  if (t.id === 'uni-name' || t.id === 'uni-prog' || t.id === 'uni-sem') { writeJSON('prvlar-uni-me', { ...myUni(), [t.id.slice(4) === 'prog' ? 'program' : t.id.slice(4) === 'sem' ? 'semester' : 'name']: t.value }); return; }
  if (t.id === 'cx-text') { state.lab.pasted = t.value; return; }
  if (t.tagName === 'INPUT' && t.type === 'text' && t.dataset.answer !== undefined) { state.answers[t.dataset.answer] = t.value.replace(',', '.').trim(); saveDraft(); refreshProgress(); return; }
  if (t.tagName === 'TEXTAREA' && t.dataset.answer !== undefined) {
    state.answers[t.dataset.answer] = t.value; saveDraft(); refreshProgress();
    const wc = document.querySelector(`[data-wc="${CSS.escape(t.dataset.answer)}"]`);
    if (wc) wc.textContent = wordCount(t.value);
  } else if (t.id === 'apikey') {
    state.key = t.value; state.conn = null; saveKey();
    const det = document.getElementById('detected');
    if (det) { const k = t.value.trim(); det.hidden = !k; if (k) det.innerHTML = `${icon('checkCircle', 16)}Detected: ${esc(providerFor(k).name)}`; }
  } else if (t.id === 'aiurl') { state.ai.url = t.value; state.conn = null; saveAi(); }
  else if (t.id === 'focus-vol') { state.focusPrefs.volume = Number(t.value); setAmbientVolume(state.focusPrefs.volume); writeJSON('prvlar-focus', state.focusPrefs); }
  else if (t.id === 'font-size') { document.documentElement.style.setProperty('--fs', t.value); const v = document.querySelector('.size-val'); if (v) v.textContent = Math.round(t.value * 100) + '%'; }
  else if (t.id === 'aimodel') { state.ai.model = t.value; state.conn = null; saveAi(); }
  else if (t.dataset.note !== undefined) {
    state.notes[noteKey(t.dataset.note)] = t.value; persistNotes();
    const s = document.querySelector(`[data-note-status="${CSS.escape(t.dataset.note)}"]`); if (s) s.textContent = 'Saved.';
  } else if (t.id === 'gsearch' || t.id === 'lsearch') {
    state.search = t.value;
    clearTimeout(searchTimer);
    const id = t.id;
    searchTimer = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el || document.activeElement !== el) return;          // the person has moved on
      const pos = el.selectionStart;
      if (state.view !== 'library') { if (!state.search.trim()) return; go('library'); } else render();
      const again = document.getElementById(id); if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* ignore */ } }
    }, 220);
  }
});
let searchTimer;
// Enter sends a question (Shift+Enter for a new line); keyboard access for the map's SVG boxes.
app.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && (e.target.id === 'askq' || e.target.id === 'chatq' || e.target.id === 'smartyq')) { e.preventDefault(); return run(() => actions[e.target.id === 'askq' ? 'askSend' : e.target.id === 'smartyq' ? 'smartySend' : 'chatSend']()); }
  if (e.key === 'Escape' && state.showGrid) { state.showGrid = false; return render(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('g[data-node], g[data-toggle]')) {
    e.preventDefault();
    const id = e.target.dataset.toggle || e.target.dataset.node, attr = e.target.dataset.toggle ? 'data-toggle' : 'data-node';
    e.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    requestAnimationFrame(() => document.querySelector(`[${attr}="${CSS.escape(id)}"]`)?.focus());
  }
});

// Drag and drop files onto the window to import them.
let dragDepth = 0;
const hasFiles = e => Array.from(e.dataTransfer?.types || []).includes('Files');
const setDragging = on => { state.dragging = on; document.querySelector('.shell')?.classList.toggle('is-dragging', on); };
window.addEventListener('dragenter', e => { if (hasFiles(e)) { e.preventDefault(); dragDepth++; setDragging(true); } });
window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('dragleave', e => { if (hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; setDragging(false); } });
window.addEventListener('drop', e => {
  if (!hasFiles(e)) return;
  e.preventDefault(); dragDepth = 0; setDragging(false);
  const files = Array.from(e.dataTransfer.files || []);
  if (files.length) run(() => importFiles(files));
});

// Back button / hash links move between screens.
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (VIEWS.includes(v) && v !== state.view) go(v, { push: false }); });

// Rotating a phone or resizing a window can switch layouts; the system theme can change too.
let resizeTimer, wasWide = isWide(), lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const nowWide = isWide(), widthChanged = window.innerWidth !== lastWidth;
    if ((state.view === 'study' && state.studyTab === 'map' && widthChanged) || (state.view === 'section' && nowWide !== wasWide)) render();
    wasWide = nowWide; lastWidth = window.innerWidth;
  }, 200);
});
try {
  const mq = matchMedia('(prefers-color-scheme: dark)'), onScheme = () => { if (state.theme === 'system') { applyTheme(); render(); } };
  if (mq.addEventListener) mq.addEventListener('change', onScheme); else mq.addListener(onScheme);
} catch { /* very old WebView */ }

// Android back button: step back through screens, and leave the app from the first one.
if (isNative() && platform() === 'android') {
  import('@capacitor/app').then(({ App }) => App.addListener('backButton', ({ canGoBack }) => { if (state.showGrid) { state.showGrid = false; return render(); } if (state.fc) { state.fc = null; return render(); } if (canGoBack) history.back(); else App.exitApp(); })).catch(() => {});
}

/* =================================================================== boot */
applyTheme();
applyReading();
applyUiSize();
preloadVisuals().then(() => { if (['chat', 'smarty'].includes(state.view)) render(); }).catch(() => {});
requestPersistence();
// Run-time config (config.json next to the app): lets the owner switch on the free proxy without a rebuild.
fetch('./config.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(c => {
  if (!c?.freeProxy || !setFreeProxy(c.freeProxy, c.freeToken)) return;
  const v = readJSON('prvlar-ai', {});
  if (!v.mode && !state.key.trim()) { state.ai = { mode: 'prvlar', url: '', model: '', vision: true }; render(); }
}).catch(() => {});
autoCheckUpdate();
/* ---------- Owner pack: owner-only content, decrypted at runtime from the owner's own Drive (see ownerpack.js) ---------- */
const undoable = (apply, revert) => { apply(); return revert; };
const packCtx = {
  state, render: () => render(), esc, icon, plural, fmtDate, readJSON, writeJSON, getSetting, setSetting, getUrl, pdfText, analysePapers, profileFromAnalysis,
  estimateDifficulty, mostRepeated, mergeRepeated, labFigures, saveProfile, getProfiles, saveProfileAndUse, aiAvailable, aiConfig, requireAi, aiName,
  uuid, run, paperFromText, labPapersForAI, papersHTML, normalizeProfile,
  builtin: () => BUILTIN,
  extendHooks: h => { const before = { ...ED }; Object.assign(ED, h); return () => { for (const k of Object.keys(ED)) delete ED[k]; Object.assign(ED, before); }; },
  addActions: a => { const keys = Object.keys(a).filter(k => !(k in actions)); keys.forEach(k => { actions[k] = a[k]; }); return () => keys.forEach(k => delete actions[k]); },
  addKinds: ks => undoable(() => EXTRA_KINDS.push(...ks), () => ks.forEach(k => { const i = EXTRA_KINDS.indexOf(k); if (i >= 0) EXTRA_KINDS.splice(i, 1); })),
  addBackupPrefs: ks => { const add = ks.filter(k => !BACKUP_PREFS.includes(k)); BACKUP_PREFS.push(...add); return () => add.forEach(k => BACKUP_PREFS.splice(BACKUP_PREFS.indexOf(k), 1)); },
  addExams: list => { const ps = list.map(normalizeProfile), ids = new Set(ps.map(p => p.id)); BUILTIN = [...BUILTIN.filter(p => !ids.has(p.id)), ...ps]; return () => { BUILTIN = BUILTIN.filter(p => !ids.has(p.id)); }; },
  addServerPreset: (key, preset, help) => { SERVER_PRESETS[key] = { label: preset.label, url: preset.url, model: preset.model, brand: preset.brand }; SERVER_HELP[key] = help; SELF_HOSTED.push(key); return () => { delete SERVER_PRESETS[key]; delete SERVER_HELP[key]; SELF_HOSTED.splice(SELF_HOSTED.indexOf(key), 1); }; },
  // Owner pack's own Gemini/Groq keys: used in memory only (never written to storage or synced), only where the owner has none.
  setReportConfig: c => { const old = [REPORT_EMAIL, REPORT_CSV]; REPORT_EMAIL = String(c?.email || ''); REPORT_CSV = /^https:\/\//.test(c?.csv || '') ? c.csv : ''; return () => { [REPORT_EMAIL, REPORT_CSV] = old; }; },
  setAiKeys: k => { const g = String(k?.gemini || ''), q = String(k?.groq || ''); const before = { key: state.key, gemini: state.fb.gemini, groq: state.fb.groq };
    const u = String(k?.url || ''), uk = String(k?.urlKey || ''); before.url = state.fb.url; before.fbKey = state.fb.key; before.on = state.fb.on;
    if (g && !state.key.trim()) state.key = g; if (g && !state.fb.gemini.trim()) state.fb.gemini = g; if (q && !state.fb.groq.trim()) state.fb.groq = q;
    if (u && !state.fb.url.trim()) { state.fb.url = u; if (uk) state.fb.key = uk; }
    if (g || q) state.fb.on = true;
    PACK_KEYS = new Set([g, q, u, uk].filter(Boolean)); render();
    return () => { if (state.key === g) state.key = before.key; if (state.fb.gemini === g) state.fb.gemini = before.gemini; if (state.fb.groq === q) state.fb.groq = before.groq;
      if (u && state.fb.url === u) { state.fb.url = before.url; state.fb.key = before.fbKey; } state.fb.on = before.on; PACK_KEYS = new Set(); }; },
  setAiDefaults: (ai, fbOn) => { const old = [DEFAULT_AI, DEFAULT_FB_ON]; DEFAULT_AI = { ...DEFAULT_AI, ...ai }; DEFAULT_FB_ON = !!fbOn;
    if (localStorage.getItem('prvlar-ai') === null) state.ai = { ...DEFAULT_AI }; const fb = readJSON('prvlar-fallback', {}) || {}; if (fb.on === undefined) state.fb.on = DEFAULT_FB_ON;
    return () => { [DEFAULT_AI, DEFAULT_FB_ON] = old; if (localStorage.getItem('prvlar-ai') === null) state.ai = { ...DEFAULT_AI }; if ((readJSON('prvlar-fallback', {}) || {}).on === undefined) state.fb.on = DEFAULT_FB_ON; }; },
  setTeam: t => { TEAM = t; return () => { TEAM = PUBLIC_TEAM; }; },
  setUpdateRepo: r => { setUpdateRepo(r); return () => setUpdateRepo(''); },
  setGlassPhoto: url => { PACK_GLASS = url; applyGlassBg(); return () => { PACK_GLASS = ''; applyGlassBg(); }; },
  setStickers: st => { const old = { ...STK }; Object.assign(STK, st); return () => Object.assign(STK, old); },
  onBootNow: () => { if (booted) ED.onBoot(); }
};
const AtlasSecure = registerPlugin('AtlasSecure');
const packCache = { get: () => getSetting('ownerPack').catch(() => null), set: v => setSetting('ownerPack', v), del: () => db.settings.delete('ownerPack').catch(() => {}) };
const ownerPack = ownerPackController({
  ctx: packCtx, cache: packCache, isOwner: e => isOwnerEmail(e),
  secure: platform() === 'android' ? legacyAware(nativeSecureStore(AtlasSecure)) : globalThis.indexedDB ? legacyAware(webSecureStore(), webSecureStore('ka-secure')) : memoryStore(),
  remote: { download: async () => { const d = await driveClient(false); const [f] = await d.list(OWNER_PACK_NAME); if (f) return d.read(f.id); const [old] = await d.list(LEGACY_OWNER_PACK_NAME).catch(() => []); return old ? d.read(old.id) : null; },
    upload: async env => { const d = await driveClient(true); const [f] = await d.list(OWNER_PACK_NAME); return f ? d.update(f.id, env) : d.create(OWNER_PACK_NAME, env); } }
});
let booted = false;
async function syncOwnerPack(opts) { const a = account(); const r = await ownerPack.sync(a?.email || '', opts).catch(e => ({ ok: false, error: e.message })); state.packStatus = ownerPack.status(); render(); return r; }
const ownerReady = account() ? (startAutoSync(), refreshOwner().catch(() => {})) : Promise.resolve();
onSyncStatus(st => { if (st.changed) reloadAll().catch(() => {}); else if (state.view === 'settings' && !state.busy) render(); });
setInterval(updateTimer, 1000);
setInterval(() => { try { tickFocus(); tickReading(); } catch (e) { console.error(e); } }, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tickFocus(); exactAlarm().then(x => { if (x !== state.exactPerm) { state.exactPerm = x; if (state.view === 'planner') render(); } }); } });
// Installable web app: offline cache (only for the website, not inside the Android/iOS/Windows apps).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !isNative() && !isElectron()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
{
  const fromHash = location.hash.slice(1);
  state.view = VIEWS.includes(fromHash) && fromHash !== 'section' ? fromHash : 'home';
}
refresh().then(async () => {
  if (restoreDraft()) { state.view = 'test'; render(); }   // a test in progress survives a reload
  try { history.replaceState(null, '', '#' + state.view); } catch { /* file:// or sandboxed */ }
  state.notifPerm = await permission(); state.exactPerm = await exactAlarm();
  booted = true; ED.onBoot();
  rescheduleReminders().catch(() => {});
  // Startup work done behind the launch intro: data, settings/theme, Google session + owner pack (from cache), fonts.
  await Promise.race([Promise.all([ownerReady, document.fonts?.ready]), new Promise(r => setTimeout(r, 4000))]);
  appReady();
  // Warm the heavier tab bundles in idle time so the first open is instant.
  (globalThis.requestIdleCallback || (f => setTimeout(f, 1500)))(() => { import('./editor.js').catch(() => {}); import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => {}); });
}).catch(e => { appReady(); fail(e); });
function appReady() { try { performance.mark('prvlar-ready'); } catch { /* old browsers */ } globalThis.__prvlarReady?.(); }
