// Small helpers that differ between the Android/iOS app (Capacitor), the Windows app (Electron) and a browser.
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform();          // 'android' | 'ios' | 'web'
export const isElectron = () => !!globalThis.window?.atlasNative;

// crypto.randomUUID needs Chrome 92 / Safari 15.4; older WebViews get an equivalent v4 UUID.
export function uuid() {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); } catch { /* fall through */ }
  const b = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Saves a backup file. Phones: writes it to the app cache and opens the share sheet
// (Save to Files, Google Drive, email…); a WebView cannot download files itself.
// Windows and browsers: a normal download. Returns 'shared' | 'downloaded' | 'cancelled'.
export async function saveTextFile(name, text, mime = 'application/json') {
  if (isNative()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: name, files: [uri], dialogTitle: 'Save your backup' });
    } catch (e) {
      if (/cancel/i.test(String(e?.message || e))) return 'cancelled';
      throw e;
    }
    return 'shared';
  }
  const blob = new Blob([text], { type: mime });
  try {
    const file = new File([blob], name, { type: mime });
    if (!isElectron() && navigator.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return 'downloaded';
}

// Shares a short text (score summary). Native share sheet on phones, Web Share where available, otherwise the clipboard.
export async function shareText(title, text) {
  try {
    if (isNative()) { const { Share } = await import('@capacitor/share'); await Share.share({ title, text, dialogTitle: title }); return 'shared'; }
    if (navigator.share) { await navigator.share({ title, text }); return 'shared'; }
  } catch (e) { if (/cancel|abort/i.test(String(e?.message || e?.name || e))) return 'cancelled'; }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

// How much space this app's data uses on the device, if the browser engine can tell.
export async function storageEstimate() {
  try { const e = await navigator.storage?.estimate?.(); if (e && e.quota) return { used: e.usage || 0, quota: e.quota }; } catch { /* unsupported */ }
  return null;
}

// Status bar colours to match the app theme on Android and iOS (no-op in browsers and on Windows).
export async function setStatusBar(dark, color) {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    if (platform() === 'android') await StatusBar.setBackgroundColor({ color });
  } catch { /* plugin missing or not supported on this Android version */ }
}

// Open a web page outside the app (system browser on Android/iOS, default browser on Windows).
export function openExternal(url) {
  // ('noopener' would make window.open return null, so detach the opener by hand.)
  try { const w = window.open(url, '_blank'); if (w) { try { w.opener = null; } catch { /* cross-origin */ } return; } if (isNative() || isElectron()) return; } catch { /* fall through */ }
  location.href = url;   // pop-ups blocked: open it here
}

// Android: download an update APK into the app cache and hand it to the system package installer.
// Needs REQUEST_INSTALL_PACKAGES (added by scripts/native-assets.mjs); Android asks the user once to
// "Allow from this source". Returns false when native install isn't possible, so the caller can open the URL instead.
export async function downloadAndInstallApk(url, name, onProgress) {
  if (platform() !== 'android') return false;
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { FileOpener } = await import('@capacitor-community/file-opener');
  const path = `updates/${String(name || 'update.apk').replace(/[^\w.-]/g, '_')}`;
  let handle;
  if (onProgress) handle = await Filesystem.addListener('progress', p => { if (p.contentLength > 0) onProgress(Math.round(p.bytes / p.contentLength * 100)); });
  try {
    try { await Filesystem.deleteFile({ path, directory: Directory.Cache }); } catch { /* not there yet */ }
    const res = await Filesystem.downloadFile({ url, path, directory: Directory.Cache, recursive: true, progress: !!onProgress });
    const file = res.path || (await Filesystem.getUri({ path, directory: Directory.Cache })).uri;
    await FileOpener.open({ filePath: file, contentType: 'application/vnd.android.package-archive', openWithDefault: true });
    return true;
  } finally { handle?.remove?.(); }
}
