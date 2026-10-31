# Google sign-in and Drive sync — setup

Prvlar can optionally sync to the user's **own** Google Drive, in the hidden *appDataFolder*
(scope `drive.appdata`, plus `openid email profile`). There is no server of ours. Client IDs are public
configuration, not secrets; they live in `.env`:

```
VITE_GOOGLE_WEB_CLIENT_ID=876024537457-4l7n0a10ps4fpc3la9qcf0pf34camqrf.apps.googleusercontent.com
VITE_GOOGLE_ANDROID=1
VITE_GOOGLE_ANDROID_CLIENT_PUBLIC=876024537457-gnt8c9hfefm20kkim12n6uj3obldpe7q.apps.googleusercontent.com
```

If `VITE_GOOGLE_WEB_CLIENT_ID` is empty, the button is hidden on the web and desktop; if `VITE_GOOGLE_ANDROID` is not `1`,
it is hidden on Android. The app works fully without signing in.

## What is already set up (project `knowledge-atlas-513306`)
- Drive API enabled; OAuth consent screen **External**, status **Testing**, scopes `drive.appdata`, `openid`, `email`, `profile`.
- Web client (above): JavaScript origins `http://localhost:5173` and `http://localhost:4173`.
- One Android client for `com.knowledgeatlas.app` (the only app id since 0.9.5; the old personal client can be deleted), with the
  release keystore SHA-1 `0E:AD:62:9A:D3:0C:B8:74:B6:48:56:37:34:7F:7B:19:6C:23:E2:DB`.

## Steps from scratch (Google Cloud Console)
1. **Create a project** (console.cloud.google.com › project picker › New project).
2. **APIs & Services › Library** › *Google Drive API* › **Enable**.
3. **OAuth consent screen** (Google Auth Platform): User type **External**; app name, support email, developer email;
   App domain links: home page, **privacy policy `https://<your-site>/privacy/`**, **terms `https://<your-site>/terms/`**.
   **Data access › Add scopes**: `.../auth/drive.appdata`, `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   `drive.appdata` is a *non-sensitive* scope, so verification is light (branding check only).
   **Audience › Test users**: add every Google account that should sign in while the app is in Testing (max 100).
4. **Clients › Create client › Android** — once per edition:
   - Package `com.knowledgeatlas.app`
   - SHA-1 of the release key: `keytool -list -v -keystore knowledge-atlas-release.jks -alias knowledgeatlas` (prompts for the password)
   - Debug builds need another Android client with the debug key's SHA-1.
5. **Clients › Create client › Web application**:
   - Authorised JavaScript origins: `http://localhost:5173`, `http://localhost:4173`, **and later your published site**
     (e.g. `https://<user>.github.io`). Origins have no path.
   - Authorised redirect URIs (Windows desktop app sign-in): `http://localhost:53682/oauth`.
6. Put the web client ID in `.env` (`VITE_GOOGLE_WEB_CLIENT_ID`) and set `VITE_GOOGLE_ANDROID=1`, then rebuild.

## How each platform signs in
- **Android**: our small Capacitor plugin `GoogleDrivePlugin.java` uses Google's *Authorization API* (Play services). Google
  matches the Android client by package name + SHA-1; no secret is in the app. Returns a ~1 h access token.
- **Web**: Google Identity Services *token client* (popup) with the web client ID.
- **Windows (Electron)**: opens the system browser to Google with `redirect_uri=http://localhost:53682/oauth`; a one-shot
  local page passes the token back to the app (`electron/main.cjs`, `google:token`).
- **iOS**: not wired yet. It needs an **iOS OAuth client** (bundle ID `com.knowledgeatlas.app`) and a native sign-in plugin; the button is hidden on iOS (see docs/ios.md).

## Going to Production
While **Testing**, only listed test users can sign in and tokens/consent expire after 7 days. Before release:
add the published site origin to the web client, then **Audience › Publish app** (Production). Because only
non-sensitive scopes are used, Google usually approves branding quickly. Owners/co-developers who sign in during
Testing must be on the test-user list.

## Data handling (also in the in-app and website privacy policy)
Data is sent only between the device and the user's own Drive. Optional AES-GCM encryption with a passphrase
(PBKDF2-SHA256, 210k rounds). AI keys are synced only inside an encrypted copy and only if the user opts in.
"Delete cloud data" removes every file in the app folder.
