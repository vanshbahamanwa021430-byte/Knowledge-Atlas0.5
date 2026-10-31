/**
 * Prvlar free AI proxy — Google Apps Script web app (Execute as: Me, Who has access: Anyone).
 * Holds the owner's Gemini key in Script Properties and forwards chat requests from the Prvlar app to Gemini.
 * Stores only daily/minute counters (hashed device or account ids). No message text, key or token is stored in logs.
 *
 * One-time setup (see DEPLOY.md):
 *   1. Paste the Gemini key between the quotes in SETUP_GEMINI_KEY, run setup(), then clear it again and save.
 *   2. Read APP_TOKEN in Project Settings › Script properties and put it in the app's config (it is public; it only filters casual misuse).
 *   3. Optional: set ALLOWED_AUD (comma-separated OAuth client IDs) so requests carrying a Google ID token are limited per account.
 */
var SETUP_GEMINI_KEY = '';            // paste ONLY for the one setup() run, then delete and save
var DEVICE_LIMIT = 30;                // messages per device (or verified Google account) per day
var GLOBAL_LIMIT = 1000;              // messages per day for everyone together
var ANON_LIMIT = 700;                 // of those, at most this many from unverified devices (device ids are client-made)
var MINUTE_LIMIT = 20;                // messages per minute for everyone together (stops one script draining the day)
var MAX_BODY = 12000000;              // only for requests with a picture or audio part
var MAX_TEXT_BODY = 400000;           // requests that are text only
var MAX_CHARS = 120000, MAX_TOKENS = 4096, MAX_MESSAGES = 40;
var ROLES = { system: 1, user: 1, assistant: 1 }, PARTS = { text: 1, image_url: 1, input_audio: 1 };
var MODEL = 'gemini-flash-latest';
var GEMINI = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

function setup() {
  var p = PropertiesService.getScriptProperties();
  if (SETUP_GEMINI_KEY) p.setProperty('GEMINI_KEY', SETUP_GEMINI_KEY.trim());
  if (!p.getProperty('APP_TOKEN')) p.setProperty('APP_TOKEN', Utilities.getUuid());
  Logger.log('Gemini key stored: ' + (p.getProperty('GEMINI_KEY') ? 'yes' : 'NO — paste it into SETUP_GEMINI_KEY and run setup again'));
  Logger.log('APP TOKEN is set. Read it in Project Settings › Script properties (APP_TOKEN) and put it in the app config as freeToken.');
  Logger.log('Now clear SETUP_GEMINI_KEY, save, and deploy as a web app.');
}
/** Shows status without revealing the key. */
function status() {
  var p = PropertiesService.getScriptProperties();
  Logger.log(JSON.stringify({ keySet: !!p.getProperty('GEMINI_KEY'), tokenSet: !!p.getProperty('APP_TOKEN'), today: today_(), globalUsed: Number(p.getProperty('g:' + today_()) || 0) }));
}
/** Optional: run daily via a time trigger to remove old counters. */
function cleanup() {
  var p = PropertiesService.getScriptProperties(), all = p.getProperties(), t = today_();
  Object.keys(all).forEach(function (k) { if (/^(g|a|m|d):/.test(k) && k.indexOf(t) === -1) p.deleteProperty(k); });
}

function today_() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }
function hash_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('').slice(0, 24); }
function out_(status, body) { return ContentService.createTextOutput(JSON.stringify({ status: status, body: body })).setMimeType(ContentService.MimeType.JSON); }
function err_(status, msg, code) { return out_(status, { error: { message: code ? code + ': ' + msg : msg, code: code || status } }); }

/** Masks every occurrence of the key (not only the first). */
function mask_(text, key) { return key ? String(text).split(key).join('***') : String(text); }
/** Checks the message list: known roles, string or known content parts, total text size. Returns '' or an error. */
function validate_(msgs) {
  var chars = 0, media = false;
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i];
    if (!m || typeof m !== 'object' || !ROLES[m.role]) return { error: 'Bad message role.' };
    if (typeof m.content === 'string') chars += m.content.length;
    else if (Array.isArray(m.content) && m.content.length <= 12) {
      for (var j = 0; j < m.content.length; j++) {
        var c = m.content[j];
        if (!c || !PARTS[c.type]) return { error: 'Unsupported message part.' };
        if (c.type === 'text') { if (typeof c.text !== 'string') return { error: 'Bad text part.' }; chars += c.text.length; }
        else if (c.type === 'image_url') { if (!c.image_url || !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(String(c.image_url.url || ''))) return { error: 'Pictures must be sent inline.' }; media = true; }
        else { if (!c.input_audio || typeof c.input_audio.data !== 'string' || !/^(mp3|wav)$/.test(String(c.input_audio.format))) return { error: 'Bad audio part.' }; media = true; }
      }
    } else return { error: 'Bad message content.' };
  }
  if (chars > MAX_CHARS) return { error: 'Request too long for the free option. Use your own key for big documents.', code: 413 };
  return { media: media };
}
/** Optional: a Google ID token (from Sign in with Google) makes the daily limit per account instead of per device. */
function verifiedUser_(idToken) {
  if (!idToken) return '';
  var aud = String(PropertiesService.getScriptProperties().getProperty('ALLOWED_AUD') || '').split(',').filter(String);
  if (!aud.length) return '';
  try {
    var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return '';
    var t = JSON.parse(r.getContentText());
    if (aud.indexOf(t.aud) === -1 || String(t.email_verified) !== 'true' || Number(t.exp) * 1000 < Date.now()) return '';
    return 'u:' + t.sub;
  } catch (x) { return ''; }
}

function doGet() { return out_(200, { ok: true, service: 'prvlar-free-ai', configured: !!PropertiesService.getScriptProperties().getProperty('GEMINI_KEY') }); }

function doPost(e) {
  var p = PropertiesService.getScriptProperties();
  var key = p.getProperty('GEMINI_KEY'), token = p.getProperty('APP_TOKEN');
  if (!key) return err_(503, 'The free option is not set up yet.');
  var raw = (e && e.postData && e.postData.contents) || '';
  if (raw.length > MAX_BODY) return err_(413, 'Request too large for the free option. Use your own key for big documents.');
  var req; try { req = JSON.parse(raw); } catch (x) { return err_(400, 'Bad request.'); }
  if (!req || req.token !== token) return err_(403, 'This proxy only serves the Prvlar app.');
  if (!/^device-[0-9a-f-]{36}$/.test(String(req.device || ''))) return err_(400, 'Missing device id.');
  // 0.9.9 compliance: server-side enforcement. The app sends eligible:true only after the 18+ date-of-birth check;
  // a direct request without it is refused. When ALLOWED_AUD is set, a valid Google ID token is required as well.
  if (req.eligible !== true) return err_(403, 'Online AI is only for users aged 18 or over.', 'PRVLAR_AGE');
  var audSet = String(p.getProperty('ALLOWED_AUD') || '').split(',').filter(String).length > 0;
  var pl = req.payload || {};
  if (!Array.isArray(pl.messages) || !pl.messages.length || pl.messages.length > MAX_MESSAGES) return err_(400, 'Bad request.');
  var v = validate_(pl.messages);
  if (v.error) return err_(v.code || 400, v.error);
  if (!v.media && raw.length > MAX_TEXT_BODY) return err_(413, 'Request too large for the free option. Use your own key for big documents.');

  // Limits are keyed on a verified Google account when an ID token checks out, otherwise on the device id.
  // The client-supplied "account" field is ignored (0.9.8 review M1).
  var user = verifiedUser_(req.idToken);
  if (audSet && !user) return err_(401, 'Sign in with Google to use the free option.', 'PRVLAR_SIGNIN');
  var now = new Date(), t = today_(), gk = 'g:' + t, ak = 'a:' + t;
  var mk = 'm:' + Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy-MM-dd-HH-mm');
  var dk = 'd:' + t + ':' + hash_(user || String(req.device));
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (x) { return err_(429, 'The free option is busy right now. Try again in a minute.', 'PRVLAR_BUSY'); }
  try {
    var g = Number(p.getProperty(gk) || 0), n = Number(p.getProperty(dk) || 0), a = Number(p.getProperty(ak) || 0), m = Number(p.getProperty(mk) || 0);
    if (n >= DEVICE_LIMIT) return err_(429, 'You have used today’s free messages. Add your own free Gemini key in Settings › AI providers, or come back tomorrow.', 'PRVLAR_LIMIT');
    if (g >= GLOBAL_LIMIT || (!user && a >= ANON_LIMIT)) return err_(429, 'The free option is busy today. Add your own free Gemini key in Settings › AI providers.', 'PRVLAR_LIMIT');
    if (m >= MINUTE_LIMIT) return err_(429, 'The free option is busy right now. Try again in a minute.', 'PRVLAR_BUSY');
    p.setProperty(gk, String(g + 1)); p.setProperty(dk, String(n + 1)); p.setProperty(mk, String(m + 1));
    if (!user) p.setProperty(ak, String(a + 1));
  } finally { lock.releaseLock(); }

  var body = { model: MODEL, messages: pl.messages, max_tokens: Math.min(Number(pl.max_tokens) || MAX_TOKENS, MAX_TOKENS) };
  if (pl.response_format && pl.response_format.type === 'json_object') body.response_format = { type: 'json_object' };
  if (typeof pl.temperature === 'number') body.temperature = Math.max(0, Math.min(1, pl.temperature));
  var r = UrlFetchApp.fetch(GEMINI, { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + key }, payload: JSON.stringify(body), muteHttpExceptions: true });
  var code = r.getResponseCode(), text = r.getContentText();
  if (code === 429) return err_(429, 'The free option is busy right now. Try again in a minute, or add your own free Gemini key.', 'PRVLAR_BUSY');
  var json; try { json = JSON.parse(text); } catch (x) { return err_(502, 'Gemini returned an unreadable reply.'); }
  if (code >= 400) return err_(code, mask_(json.error && json.error.message || ('Gemini error ' + code), key));
  return out_(200, json);
}
