# Owner pack (0.9.5)

Since 0.9.5 there is **one app**: `com.knowledgeatlas.app` (APK), the website and the Windows/iOS builds all ship
the same clean code. Nothing owner-only is in the APK, the web bundle or the source tree under `src/`
(`npm run build` / `npm run build:web` fail if university-specific names, the self-hosted AI preset, personal names, emails or the owner's photo or
sticker art are found; `npm run check:source` scans the source tree the same way).

Owner-only content lives in `owner/` (private; never copied into builds or the public source zip):

| Path | What |
|---|---|
| `owner/src/module.js` | Owner module: university End Sem prep UI and background preparation (`activate(ctx, pack)` / `deactivate()`) |
| `owner/src/*.js` | University question-bank parser and catalog helpers (all university names, domains and URLs) |
| `owner/data/*.json` | Bundled catalog and the End Sem exam profile |
| `owner/data/stickers.json`, `owner/assets/*.webp` | Vintage sticker art and the Glass theme photo |
| `owner/config.json` | Self-hosted AI preset + default provider order, name prefill, team card, update repo |
| `owner/scripts/build-pack.mjs` | `npm run owner-pack` |
| `owner/tests/` | `npm run test:owner` (parser/catalog, owner email, real-module activation) |

## Build

    npm run owner-pack                     # → /workspace/out/owner-pack-0.9.5.zip
    OWNER_PACK_PASS='…' npm run owner-pack # use your own passphrase

Without `OWNER_PACK_PASS` a random passphrase is generated and written to `/workspace/out/owner-pack-passphrase.txt`
(mode 600, never printed). The zip holds `owner-pack.json` (encrypted envelope) and a README.

Format: `{ format: 'ka-owner-pack', version: 1, encrypted: 'AES-GCM', kdf: 'PBKDF2-SHA256', rounds: 310000, gzip, salt, iv, data }`.
The plaintext (module source, data, assets as data URLs) is gzip-compressed, then encrypted with AES-256-GCM using a key
derived from the passphrase. See `src/ownerpack.js`.

## Install (once)

1. Open the app and sign in with Google using an owner account (owner = SHA-256 email hash in `OWNER_HASHES` or the Owners list).
2. More › Developer panel › **Owner pack**: type the passphrase, then **Upload owner pack to my Drive** and pick `owner-pack.json`.
3. The app checks the passphrase, uploads the pack to your Drive's **appDataFolder** (hidden, private to this app; it
   uses the existing `drive.appdata` scope, so no new consent-screen scope is needed), caches the encrypted pack locally
   and activates it.

On another device: sign in with the owner account → the pack downloads → **Unlock from my Drive** with the passphrase (asked once).

## Runtime

- Sign-in (or app start with a cached owner account) → owner? → cached pack or Drive download → passphrase from secure
  storage (Android Keystore via the `AtlasSecure` plugin; web/desktop: wrapped by a non-extractable WebCrypto key in
  IndexedDB) → decrypt → `import()` of the module from a Blob URL → `activate()`.
- Activated: End Sem prep (Exam profiles tab, background preparation), the self-hosted AI preset and default order
  (only when you have not saved your own AI settings), name prefill, team card, update checker repo, Glass photo,
  vintage stickers, plus the Developer panel (owner mode).
- Works offline from the encrypted cache.
- Sign-out, or a non-owner sign-in: the module is deactivated (every hook undone) and the cached pack and stored
  passphrase are deleted. The pack stays in your Drive. "Delete cloud data" leaves the pack alone.

## Notes

- Owner mode is a convenience, not a security boundary; the pack's encryption is what keeps the content private.
- Profiles you built earlier with the pack's own kind remain in your data; they are listed again when the pack is active.
