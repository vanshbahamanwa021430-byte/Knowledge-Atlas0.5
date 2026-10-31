import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVersion, compareVersions, versionCode, parseRelease, checkForUpdate, setUpdateRepo } from '../src/update.js';
import * as U from '../src/update.js';
setUpdateRepo('example/repo');

test('parseVersion handles v prefix, short and pre-release tags', () => {
  assert.deepEqual(parseVersion('v0.8.1').nums, [0, 8, 1]);
  assert.deepEqual(parseVersion('1.2').nums, [1, 2, 0]);
  assert.equal(parseVersion('v1.0.0-beta.2').pre, 'beta.2');
  assert.equal(parseVersion('latest'), null);
});
test('compareVersions orders semver correctly', () => {
  assert.equal(compareVersions('0.8.1', '0.8.0'), 1);
  assert.equal(compareVersions('v0.10.0', '0.9.9'), 1);
  assert.equal(compareVersions('0.8.0', 'v0.8.0'), 0);
  assert.equal(compareVersions('0.7.9', '0.8.0'), -1);
  assert.equal(compareVersions('1.0.0-beta', '1.0.0'), -1);
  assert.equal(compareVersions('1.0.0-beta.10', '1.0.0-beta.2'), 1);
});
test('versionCode always grows with the version', () => {
  assert.equal(versionCode('0.8.1'), 801);
  assert.equal(versionCode('0.7.1'), 701);
  assert.ok(versionCode('0.10.0') > versionCode('0.9.99'));
  assert.ok(versionCode('1.0.0') > versionCode('0.99.99'));
});
const rel = { tag_name: 'v0.9.0', name: 'Prvlar 0.9.0', body: '## New\n- Stuff', html_url: 'https://github.com/x/y/releases/tag/v0.9.0', draft: false, prerelease: false,
  assets: [{ name: 'Prvlar-0.9.0-debug.apk', browser_download_url: 'https://d/debug.apk', size: 1 }, { name: 'Prvlar-0.9.0.apk', browser_download_url: 'https://d/rel.apk', size: 5 }, { name: 'notes.txt', browser_download_url: 'https://d/n' }] };
test('parseRelease picks the release APK and notes', () => {
  const r = parseRelease(rel);
  assert.equal(r.version, '0.9.0'); assert.equal(r.apk.url, 'https://d/rel.apk'); assert.match(r.notes, /Stuff/); assert.match(r.page, /v0\.9\.0/);
  assert.equal(parseRelease({ ...rel, assets: [] }).apk, null);
  assert.equal(parseRelease({ ...rel, draft: true }), null);
  assert.equal(parseRelease({ message: 'Not Found' }), null);
});
const resp = (status, body, headers = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => body, headers: { get: k => headers[k] ?? null } });
test('checkForUpdate: newer, current, offline, rate limit, no releases', async () => {
  let url; const r = await checkForUpdate('0.8.1', async u => { url = u; return resp(200, rel); });
  assert.equal(r.status, 'newer'); assert.ok(url.includes(U.UPDATE_REPO) && U.UPDATE_REPO === 'example/repo');
  assert.equal((await checkForUpdate('0.9.0', async () => resp(200, rel))).status, 'current');
  await assert.rejects(checkForUpdate('0.8.1', async () => { throw new TypeError('Failed to fetch'); }), e => e.kind === 'offline');
  await assert.rejects(checkForUpdate('0.8.1', async () => resp(403, {}, { 'x-ratelimit-reset': '2000000000' })), e => e.kind === 'rate');
  await assert.rejects(checkForUpdate('0.8.1', async () => resp(404, {})), e => e.kind === 'none');
  await assert.rejects(checkForUpdate('0.8.1', async () => resp(200, { tag_name: 'nightly' })), e => e.kind === 'bad');
});
