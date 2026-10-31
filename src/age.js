// Age eligibility (0.9.9 compliance hotfix). The user types a date of birth; only the result is stored
// ('adult' or 'minor' plus the check date), never the date itself. Online AI, Google sign-in AI features and
// problem reports need 'adult'. This is a self-declaration: it does not verify identity and is not parental consent.
const KEY = 'prvlar-age';
export function ageOn(dob, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || '')); if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], b = new Date(y, mo - 1, d);
  if (b.getFullYear() !== y || b.getMonth() !== mo - 1 || b.getDate() !== d) return null;   // 2026-02-31 etc.
  if (b > today || y < today.getFullYear() - 120) return null;
  let a = today.getFullYear() - y; if (today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d)) a--;
  return a;
}
export function checkAge(dob, store = localStorage, today = new Date()) {
  const a = ageOn(dob, today); if (a === null) throw Error('Enter a real date of birth.');
  const result = a >= 18 ? 'adult' : 'minor';
  store.setItem(KEY, JSON.stringify({ result, checked: today.toISOString().slice(0, 10) }));   // the date of birth is not kept
  return result;
}
export function ageStatus(store = localStorage) { try { const v = JSON.parse(store.getItem(KEY) || 'null'); return v && ['adult', 'minor'].includes(v.result) ? v.result : 'unknown'; } catch { return 'unknown'; } }
// ECC M7: after an under-18 result, the check can be repeated only after 30 days (a typo can be fixed by clearing app data).
export function ageRecheckAllowed(store = localStorage, now = new Date()) { try { const v = JSON.parse(store.getItem(KEY) || 'null'); if (!v || v.result !== 'minor') return true; return (now - new Date(v.checked)) / 864e5 >= 30; } catch { return true; } }
export const isAdult = (store = localStorage) => ageStatus(store) === 'adult';
export const MINOR_MSG = 'Online AI, Google sign-in and problem reports are only for users aged 18 or over. Everything else in Prvlar works offline on this device: documents, the study map, notes, flashcards, the planner, the focus timer and your progress.';
