# Publishing the website (PUBLIC edition)

`npm run build:web` → `dist-web/` (static files; fails if any personal/university string is found).
The app uses relative URLs, so it works at a domain root or a sub-path (GitHub Pages project sites).

Pages that must be reachable (linked from the Google OAuth consent screen): `/privacy/`, `/terms/`, `/about/` (landing).

## Free hosting options
- **GitHub Pages**: `.github/workflows/pages.yml`. Repo › Settings › Pages › Source: *GitHub Actions*. Push to `main`.
  The site is `https://<user>.github.io/<repo>/`.
- **Netlify**: `netlify.toml` (build `npm run build:web`, publish `dist-web`). Import the repo in Netlify.
- **Vercel**: `vercel.json`. Import the repo; framework "Other".
- **Firebase Hosting**: `firebase.json`. `npm i -g firebase-tools && firebase init hosting` (keep the file) `&& npm run build:web && firebase deploy`.
- Or unzip `Prvlar-0.9.5-web.zip` onto any static host (HTTPS required for the service worker and sign-in).

## After publishing
1. Add the site origin (e.g. `https://<user>.github.io`) to the **web OAuth client**'s Authorised JavaScript origins.
2. Put `https://<site>/privacy/` and `/terms/` on the consent screen; switch the consent screen to **Production**.

## Web vs. app differences
- Installable PWA (manifest + service worker). The app shell is cached at install; Pyodide (~13 MB) and OCR data are
  cached the first time they are used, then work offline.
- Notifications use the browser Notification API (only while the site is open); read-aloud uses Web Speech; files use
  the file picker / downloads; network requests use `fetch`.
- **CORS**: the browser only lets the site read other servers that allow it. Gemini and Groq do. A **custom
  OpenAI-compatible endpoint** must send `Access-Control-Allow-Origin` (or use the Android/Windows app). Past-paper
  links from sites without CORS must be downloaded and added as files. A Judge0 runner must allow CORS too.
- No APK update checker on the web.

# Windows desktop app
Electron (MIT). `npm run package:win` builds `release-public/` with the public web build inside:
- `Prvlar-<v>-windows-x64.zip` (portable, unzip and run `Prvlar.exe`), and
- `Prvlar-<v>-windows-setup.exe` (NSIS installer) — **needs Windows or Wine**; the
  `.github/workflows/windows.yml` workflow (windows-latest) builds it on tags `v*` or manually and uploads it.
Google sign-in on Windows opens the system browser and returns through `http://localhost:53682/oauth`
(add that redirect URI to the web client).
