/**
 * Prvlar free AI proxy — Google Apps Script web app (Execute as: Me, Who has access: Anyone).
 * Holds the owner's Gemini key in Script Properties and forwards chat requests from the Prvlar app to Gemini.
 * Stores only daily counters (hashed device ids). No message text is stored or logged.
 *
 * One-time setup (see DEPLOY.md):
 *   1. Paste the Gemini key between the quotes in SETUP_GEMINI_KEY, run setup(), then clear it again and save.
 *   2. The log shows the APP TOKEN to put in the app's config (it is public; it only filters casual misuse).
 */
var SETUP_GEMINI_KEY = '';            // paste ONLY for the one setup() run, then delete and save
var DEVICE_LIMIT = 30;                // messages per device (or Google account) per day
var GLOBAL_LIMIT = 1000;              // messages per day for everyone together
var MAX_BODY = 200000, MAX_TOKENS = 4096, MAX_MESSAGES = 40;
var MODEL = 'gemini-flash-latest';
var GEMINI = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

function setup() {
  var p = PropertiesService.getScriptProperties();
  if (SETUP_GEMINI_KEY) p.setProperty('GEMINI_KEY', SETUP_GEMINI_KEY.trim());
  if (!p.getProperty('APP_TOKEN')) p.setProperty('APP_TOKEN', Utilities.getUuid());
  Logger.log('Gemini key stored: ' + (p.getProperty('GEMINI_KEY') ? 'yes' : 'NO — paste it into SETUP_GEMINI_KEY and run setup again'));
  Logger.log('APP TOKEN (put in the app config as freeToken): ' + p.getProperty('APP_TOKEN'));
  Logger.log('Now clear SETUP_GEMINI_KEY, save, and deploy as a web app.');
}
/** Shows status without revealing the key. */
function status() {
  var p = PropertiesService.getScriptProperties();
  Logger.log(JSON.stringify({ keySet: !!p.getProperty('GEMINI_KEY'), token: p.getProperty('APP_TOKEN'), today: today_(), globalUsed: Number(p.getProperty('g:' + today_()) || 0) }));
}
/** Optional: run daily via a time trigger to remove old counters. */
function cleanup() {
  var p = PropertiesService.getScriptProperties(), all = p.getProperties(), t = today_();
  Object.keys(all).forEach(function (k) { if (/^(g|d):/.test(k) && k.indexOf(t) === -1) p.deleteProperty(k); });
}

function today_() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }
function hash_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('').slice(0, 24); }
function out_(status, body) { return ContentService.createTextOutput(JSON.stringify({ status: status, body: body })).setMimeType(ContentService.MimeType.JSON); }
function err_(status, msg, code) { return out_(status, { error: { message: code ? code + ': ' + msg : msg, code: code || status } }); }

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
  var pl = req.payload || {};
  if (!Array.isArray(pl.messages) || !pl.messages.length || pl.messages.length > MAX_MESSAGES) return err_(400, 'Bad request.');

  var t = today_(), gk = 'g:' + t, dk = 'd:' + t + ':' + hash_(String(req.account || req.device));
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (x) { return err_(429, 'The free option is busy right now. Try again in a minute.', 'PRVLAR_BUSY'); }
  try {
    var g = Number(p.getProperty(gk) || 0), n = Number(p.getProperty(dk) || 0);
    if (n >= DEVICE_LIMIT) return err_(429, 'You have used today’s free messages. Add your own free Gemini key in Settings › AI providers, or come back tomorrow.', 'PRVLAR_LIMIT');
    if (g >= GLOBAL_LIMIT) return err_(429, 'The free option is busy today. Add your own free Gemini key in Settings › AI providers.', 'PRVLAR_LIMIT');
    p.setProperty(gk, String(g + 1)); p.setProperty(dk, String(n + 1));
  } finally { lock.releaseLock(); }

  var body = { model: MODEL, messages: pl.messages, max_tokens: Math.min(Number(pl.max_tokens) || MAX_TOKENS, MAX_TOKENS) };
  if (pl.response_format && pl.response_format.type === 'json_object') body.response_format = { type: 'json_object' };
  if (typeof pl.temperature === 'number') body.temperature = Math.max(0, Math.min(1, pl.temperature));
  var r = UrlFetchApp.fetch(GEMINI, { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + key }, payload: JSON.stringify(body), muteHttpExceptions: true });
  var code = r.getResponseCode(), text = r.getContentText();
  if (code === 429) return err_(429, 'The free option is busy right now. Try again in a minute, or add your own free Gemini key.', 'PRVLAR_BUSY');
  var json; try { json = JSON.parse(text); } catch (x) { return err_(502, 'Gemini returned an unreadable reply.'); }
  if (code >= 400) return err_(code, (json.error && json.error.message || ('Gemini error ' + code)).replace(key, '***'));
  return out_(200, json);
}
