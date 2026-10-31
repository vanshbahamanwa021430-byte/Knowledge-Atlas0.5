# Owner mode

Owner mode unlocks a **Developer panel** (build info and performance, debug logs, AI request inspector with keys masked,
Dexie inspector/export, feature flags, test-data seed/reset, crash log, Owners manager) and an **Owner** badge.
It turns on when Google sign-in returns an email whose **SHA-256 hash** is on the owner list. Plain addresses are never
stored in the app or the builds.

**It is a convenience, not security.** Anyone with the source or a debugger can switch it on. Only harmless
diagnostics are behind it. Owner-only content is not in any build: it comes from the encrypted owner pack in the owner's own Drive (docs/owner-pack.md).

## Built-in owners (in code)
`src/devlog.js` → `OWNER_HASHES`. To add one:
```
npm run owner:hash someone@example.com     # prints the hash (input is trimmed and lower-cased)
```
Paste the hash into `OWNER_HASHES` and rebuild. Built-in owners cannot be removed in the app.

## Added owners (in the app)
Developer panel › Owners › *Add owner* (Gmail only). Stored as hashes in `ka-owners` on that device, and synced through
the owner's own Drive appData. Remove them there.

## Google consent screen
While the OAuth consent screen is in **Testing**, every co-developer's Gmail must also be added as a **test user**
(Google Auth Platform › Audience › Test users), or Google will refuse their sign-in.
