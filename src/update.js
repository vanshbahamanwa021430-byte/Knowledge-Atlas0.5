// In-app update check against GitHub Releases.
// Android: downloads the release APK and opens the system installer. It installs over the old app and keeps all
// data only when the APK is signed with the same release key and has a higher versionCode (from package.json).
// Windows/web: opens the release page.
// The public edition updates through its store, so it has no GitHub release check.
// No repo in the app; an owner pack can set one (live bindings, so importers see the change).
export let UPDATE_REPO = '', RELEASES_API = '', RELEASES_PAGE = '';
export function setUpdateRepo(repo) {
  UPDATE_REPO = /^[\w.-]+\/[\w.-]+$/.test(repo || '') ? repo : '';
  RELEASES_API = UPDATE_REPO ? `https://api.github.com/repos/${UPDATE_REPO}/releases/latest` : '';
  RELEASES_PAGE = UPDATE_REPO ? `https://github.com/${UPDATE_REPO}/releases/latest` : '';
}
export const AUTO_INTERVAL = 24 * 3600e3;

// 'v0.8.1' -> [0, 8, 1, pre] ; null when not a version.
export function parseVersion(v) {
  const m = String(v || '').trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?/);
  return m ? { nums: [+m[1], +(m[2] || 0), +(m[3] || 0)], pre: m[4] || '' } : null;
}
// -1, 0, 1 like a sort comparator. Pre-releases sort before the release (0.9.0-beta < 0.9.0).
export function compareVersions(a, b) {
  const x = parseVersion(a), y = parseVersion(b);
  if (!x || !y) return x ? 1 : y ? -1 : 0;
  for (let i = 0; i < 3; i++) if (x.nums[i] !== y.nums[i]) return x.nums[i] > y.nums[i] ? 1 : -1;
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1; if (!y.pre) return -1;
  return x.pre.localeCompare(y.pre, undefined, { numeric: true }) > 0 ? 1 : -1;
}
// Android versionCode used by the build: 0.8.1 -> 801, 1.2.3 -> 10203.
export const versionCode = v => { const p = parseVersion(v); return p ? p.nums[0] * 10000 + p.nums[1] * 100 + p.nums[2] : 0; };

// GitHub release JSON -> what the app needs. Ignores drafts; picks the .apk asset (prefers non-debug).
export function parseRelease(json) {
  if (!json || typeof json !== 'object' || json.draft || !json.tag_name) return null;
  const v = parseVersion(json.tag_name); if (!v) return null;
  const apks = (Array.isArray(json.assets) ? json.assets : []).filter(a => a && /\.apk$/i.test(a.name || '') && a.browser_download_url);
  const apk = apks.find(a => !/debug/i.test(a.name)) || apks[0] || null;
  return {
    version: v.nums.join('.') + (v.pre ? '-' + v.pre : ''), tag: json.tag_name, name: json.name || json.tag_name,
    notes: String(json.body || '').trim().slice(0, 4000), page: json.html_url || RELEASES_PAGE,
    prerelease: !!json.prerelease, published: json.published_at || '',
    apk: apk ? { name: apk.name, url: apk.browser_download_url, size: apk.size || 0 } : null
  };
}

export class UpdateError extends Error { constructor(kind, msg) { super(msg); this.kind = kind; } }

// Returns { status: 'newer' | 'current', release }.
export async function checkForUpdate(current, fetchImpl = globalThis.fetch) {
  let res;
  try { res = await fetchImpl(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' }); }
  catch { throw new UpdateError('offline', 'Could not reach GitHub. Check your internet connection and try again.'); }
  if (res.status === 404) throw new UpdateError('none', 'No releases have been published yet.');
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers?.get?.('x-ratelimit-reset')) * 1000;
    const when = reset ? ` after ${new Date(reset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' later';
    throw new UpdateError('rate', `GitHub is limiting update checks right now. Try again${when}.`);
  }
  if (!res.ok) throw new UpdateError('http', `GitHub answered with error ${res.status}. Try again later.`);
  let json; try { json = await res.json(); } catch { throw new UpdateError('bad', 'GitHub sent an unreadable answer.'); }
  const release = parseRelease(json);
  if (!release) throw new UpdateError('bad', 'The latest release has no version number.');
  return { status: compareVersions(release.version, current) > 0 ? 'newer' : 'current', release };
}
