// ECC H1 (0.9.9): one rule for every AI path. A model on this device is always allowed; anything online needs an
// 18+ age result and the one-time online-AI consent. 'ask-age' / 'ask-consent' mean the app may prompt (foreground
// actions); background work (marking, plan weights) treats anything but 'ok' as "do not send".
export function aiDecision({ local = false, age = 'unknown', consent = false }) {
  if (local) return 'ok';
  if (age === 'minor') return 'minor';
  if (age !== 'adult') return 'ask-age';
  return consent ? 'ok' : 'ask-consent';
}
