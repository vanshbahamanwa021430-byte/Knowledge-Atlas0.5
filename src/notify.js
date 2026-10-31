// Reminders: exam countdowns, to-do due dates, a daily study reminder and the focus timer's end of block.
// Android/iOS: @capacitor/local-notifications, so reminders arrive even when the app is closed.
// Browser/Windows: the Notification API while the app is open (if allowed), otherwise nothing; the app still works.
import { isNative } from './platform.js';

let plugin = null;
async function native() {
  if (!isNative()) return null;
  if (!plugin) { try { plugin = (await import('@capacitor/local-notifications')).LocalNotifications; } catch { plugin = false; } }
  return plugin || null;
}

// Notification ids must be 32-bit integers: hash the item id (focus timer uses a fixed id).
export const FOCUS_ID = 7001;
export function notifId(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return 10000 + (Math.abs(h) % 2000000000); }

export async function permission() {
  const n = await native();
  if (n) { try { return (await n.checkPermissions()).display; } catch { return 'denied'; } }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : Notification.permission;
}
export async function askPermission() {
  const n = await native();
  if (n) { try { return (await n.requestPermissions()).display; } catch { return 'denied'; } }
  if (typeof Notification === 'undefined') return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

// Exact alarms (Android 12+): without them Android may delay reminders by several minutes.
// Android 13+ grants USE_EXACT_ALARM at install; on Android 12/12L SCHEDULE_EXACT_ALARM can be turned off in Settings.
// Returns 'granted', 'denied' or 'unsupported' (browser, iOS, older plugin).
export function exactStatus(res) { const v = res && (res.exact_alarm || res.exactAlarm); return v === 'granted' ? 'granted' : v ? 'denied' : 'unsupported'; }
export async function exactAlarm() {
  const n = await native();
  if (!n || typeof n.checkExactNotificationSetting !== 'function') return 'unsupported';
  try { return exactStatus(await n.checkExactNotificationSetting()); } catch { return 'unsupported'; }
}
export async function askExactAlarm() {
  const n = await native();
  if (!n || typeof n.changeExactNotificationSetting !== 'function') return 'unsupported';
  try { return exactStatus(await n.changeExactNotificationSetting()); } catch { return exactAlarm(); }
}

// Web fallback: timers that fire while the page is open.
const webTimers = new Map();
function webSchedule(list) {
  for (const t of webTimers.values()) clearTimeout(t);
  webTimers.clear();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const now = Date.now();
  for (const r of list) {
    const ms = r.at - now;
    if (ms <= 0 || ms > 2147483000) continue;      // setTimeout limit (about 24 days)
    webTimers.set(r.id, setTimeout(() => { try { new Notification(r.title, { body: r.body, icon: './icons/icon-192.png', tag: String(r.id) }); } catch { /* ignore */ } }, ms));
  }
}

// Replaces every planner/daily reminder with `list`: [{ id, title, body, at }] plus an optional daily repeat { hour, minute }.
export async function scheduleReminders(list, daily) {
  const n = await native();
  const future = list.filter(r => r.at > Date.now() + 5000).slice(0, 60);
  if (n) {
    try {
      const { notifications } = await n.getPending();
      const old = notifications.filter(x => x.id !== FOCUS_ID).map(x => ({ id: x.id }));
      if (old.length) await n.cancel({ notifications: old });
      if ((await n.checkPermissions()).display !== 'granted') return false;
      const items = future.map(r => ({ id: notifId(r.id), title: r.title, body: r.body, schedule: { at: new Date(r.at), allowWhileIdle: true } }));
      if (daily) items.push({ id: notifId('daily'), title: daily.title, body: daily.body, schedule: { on: { hour: daily.hour, minute: daily.minute }, allowWhileIdle: true } });
      if (items.length) await n.schedule({ notifications: items });
      return true;
    } catch { return false; }
  }
  webSchedule(future);
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

// The focus timer's "time's up" notice, for when the app is in the background or closed.
export async function scheduleFocusEnd(at, title, body) {
  const n = await native();
  if (!n) return;
  try {
    await n.cancel({ notifications: [{ id: FOCUS_ID }] });
    if (at && (await n.checkPermissions()).display === 'granted') await n.schedule({ notifications: [{ id: FOCUS_ID, title, body, schedule: { at: new Date(at), allowWhileIdle: true } }] });
  } catch { /* plugin missing */ }
}
export const cancelFocusEnd = () => scheduleFocusEnd(0);

// A notice shown right now (web: only if allowed and the page is hidden; native apps show the in-app message instead).
export function notifyNow(title, body) {
  try { if (!isNative() && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) new Notification(title, { body, icon: './icons/icon-192.png' }); } catch { /* ignore */ }
}
