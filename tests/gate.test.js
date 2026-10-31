import test from 'node:test';
import assert from 'node:assert/strict';
import { needsWelcome, afterSignIn, afterGuest, afterSignOut } from '../src/gate.js';
test('first launch shows the welcome gate when Google sign-in is available', () => {
  assert.equal(needsWelcome({ available: true, signedIn: false, entry: '' }), true);
});
test('guest choice and sign-in hide the gate', () => {
  assert.equal(needsWelcome({ available: true, signedIn: false, entry: afterGuest().entry }), false);
  assert.equal(needsWelcome({ available: true, signedIn: true, entry: afterSignIn().entry }), false);
  assert.equal(afterSignIn().onboarded, true);
});
test('sign-out shows the gate again; no gate without Google sign-in', () => {
  assert.equal(needsWelcome({ available: true, signedIn: false, entry: afterSignOut().entry }), true);
  assert.equal(needsWelcome({ available: false, signedIn: false, entry: '' }), false);
});
test('iOS (sign-in coming) still shows the gate until guest is chosen', () => {
  assert.equal(needsWelcome({ available: false, soon: true, signedIn: false, entry: '' }), true);
  assert.equal(needsWelcome({ available: false, soon: true, signedIn: false, entry: 'guest' }), false);
});
