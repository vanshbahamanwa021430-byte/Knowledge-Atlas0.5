// Welcome gate: on first launch and after sign-out, offer Sign in with Google (or continue as a guest) before the app.
// entry: 'google' | 'guest' | '' (stored as ka-entry). Pure, so it is unit-tested.
export function needsWelcome({ available, soon = false, signedIn, entry }) {
  if (signedIn) return false;          // already signed in: straight into the app
  if (!available && !soon) return false; // no Google sign-in here (and none planned): normal onboarding
  // soon: platform where sign-in is coming (iOS): the gate still shows, with a note and Continue without account
  return entry !== 'guest';            // first launch, or signed out (entry cleared)
}
// What to remember after each choice.
export const afterSignIn = () => ({ entry: 'google', onboarded: true });
export const afterGuest = () => ({ entry: 'guest' });
export const afterSignOut = () => ({ entry: '' });
