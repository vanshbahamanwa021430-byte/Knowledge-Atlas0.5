/**
 * Prvlar — error report intake (Google Apps Script web app).
 * Each POST from the app becomes one row in the bound Google Sheet. No other access.
 * Setup: see docs/error-reports.md.
 */
const MAX = 20000;   // characters kept per field
function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) || '';
    if (body.length > 600000) return out('too big');
    const r = JSON.parse(body);
    if (!r || r.v !== 1 || !/^(auto|user)$/.test(r.kind)) return out('bad');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reports') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Reports');
    if (sheet.getLastRow() === 0) sheet.appendRow(['received', 'at', 'kind', 'version', 'platform', 'message', 'text', 'stack', 'screen', 'theme', 'log', 'contact', 'screenshot']);
    // Simple global throttle: at most 300 rows per hour.
    const cache = CacheService.getScriptCache(), n = Number(cache.get('n') || 0); if (n > 300) return out('busy'); cache.put('n', String(n + 1), 3600);
    let shot = '';
    if (r.screenshot && /^data:image\/(png|jpeg|webp);base64,/.test(r.screenshot)) {
      const [, type, b64] = r.screenshot.match(/^data:(image\/\w+);base64,(.*)$/);
      const file = DriveApp.getFolderById(folderId()).createFile(Utilities.newBlob(Utilities.base64Decode(b64), type, 'report-' + Date.now()));
      shot = file.getUrl();
    }
    const d = r.diag || {}, c = s => String(s == null ? '' : s).slice(0, MAX);
    sheet.appendRow([new Date(), c(r.at), c(r.kind), c(d.version), c(d.platform), c(r.error && r.error.message), c(r.text), c(r.error && r.error.stack), c(d.screen), c(d.theme), c((d.log || []).join('\n')), c(r.contact), shot]);
    return out('ok');
  } catch (err) { return out('error'); }
}
function folderId() {
  const p = PropertiesService.getScriptProperties(); let id = p.getProperty('SHOTS');
  if (!id) { id = DriveApp.createFolder('Prvlar report screenshots').getId(); p.setProperty('SHOTS', id); }
  return id;
}
function out(s) { return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT); }
