# Build and install guide (GitHub Actions, nothing to set up on your computer)

## Upload correctly
Upload the **contents** of the project folder to the repository root, so `package.json`, `index.html`, `vite.config.js`, `capacitor.config.json`, `src/`, `public/`, `resources/`, `scripts/`, `tests/`, `electron/` and `.github/` are at the top level. If the browser uploader skips the hidden `.github` folder, create each workflow with **Add file > Create new file** using its path, for example `.github/workflows/ios-app.yml`.

## Android phone or tablet (Android 6.0 or later)
1. **Actions > Build Prvlar Android APK > Run workflow.** It also runs by itself on every push to `main`.
2. Open the finished run and download **Knowledge-Atlas-2-debug-APK**. Unzip it, copy `app-debug.apk` to the phone, open it and allow installing from that source.
3. On older phones, first update **Android System WebView** and **Chrome** in the Play Store.
4. **Updating:** from version 0.4 every build is signed with the same key (a debug key kept outside the public repo), so a new APK (such as 0.5) installs over the old one and keeps your documents, notes and results. Versions built before 0.4 used a random key each time: uninstall that old app once before installing (this deletes its data, so re-import your documents).
5. If the home-screen icon still shows the old design after updating, restart the phone or the launcher; Android caches icons.

## iPhone or iPad (iOS 14 or later)
Apple only runs apps signed with an Apple ID. Choose one route.

**Route A: the app, sideloaded with your Apple ID (free).**
1. **Actions > Build Prvlar iPhone app > Run workflow** (about 15–25 minutes). On a private repository, macOS minutes count ten times against the free monthly allowance.
2. Download **Knowledge-Atlas-iOS-unsigned-IPA** and unzip it to get `Knowledge-Atlas-unsigned.ipa`.
3. On a Windows PC or Mac, install **Sideloadly** (sideloadly.io) and connect the iPhone by cable. On Windows, Sideloadly also needs Apple's iTunes and iCloud from apple.com, not the Microsoft Store versions.
4. Drag the `.ipa` into Sideloadly, enter your Apple ID, and press Start.
5. On the iPhone: **Settings > General > VPN & Device Management**, then trust your Apple ID. On iOS 16 or later also turn on **Settings > Privacy & Security > Developer Mode** and restart.
6. With a free Apple ID the app works for 7 days, then you install it again the same way. Your data stays as long as you don't delete the app. A paid Apple Developer account ($99 a year) extends this to a year and allows TestFlight.

**Route B: the web version on your Home Screen (no Apple ID, no expiry).**
1. **Actions > Build Prvlar web app > Run workflow.**
2. To publish it on GitHub Pages, first open **Settings > Pages** and set **Build and deployment > Source** to **GitHub Actions** (Pages needs a public repository, or a paid plan for a private one). The run then shows the site's address under **pages**. If Pages is off, the run still succeeds: the **pages** job is skipped with a note, and you can download **Knowledge-Atlas-web** and put its files on any static host, such as Netlify Drop or Cloudflare Pages.
3. Open the address in **Safari** on the iPhone, tap **Share > Add to Home Screen**. It opens full screen and works offline after the first visit.
4. Route B also works on any Android phone (Chrome: **⋮ > Install app**) and on computers.

## Windows
**Actions > Build Prvlar Windows installer > Run workflow**, download **Prvlar-Windows-installer**, and run the `.exe`. It's unsigned, so if SmartScreen warns you, choose **More info > Run anyway**.

## Every workflow checks before building
Each one runs `npm run check` (syntax of every source file) and `npm test` (unit tests) first, so a red step tells you exactly where it stopped. Open the red step and copy the first `ERROR` or `What went wrong:` block.

## Verified before shipping (in a sandbox)
- Every source file passes the syntax check, and all unit tests pass.
- The production build contains only ES2019 syntax, so it runs on 2019-era engines. Newer browser features are only used behind feature checks.
- A full walkthrough in Chromium at phone (390 px), tablet (820 px) and desktop (1440 px) sizes, light and dark, against a fake OpenAI-compatible AI server: import, map, outline, notes, connection test, explanation, Ask AI, AI Chat, a 20-question test with bookmarks and the overview sheet, AI marking, result with topic performance, review, search, back navigation. No console errors.
- Every screen at 320 px and 360 px wide, with very long titles and unbroken words: nothing runs off the side of the screen.
- The Electron (Windows) shell, run on Linux: the `app://` loader, Content-Security-Policy with the bundled Inter font and graphics, and AI requests (connection test and Ask AI) through the main-process bridge.
- The web version's offline cache: it installs, caches 23 files, and the app reloads with the network off.
- `npx cap add android` plus `scripts/native-assets.mjs`: adaptive icon, launch screen, light and dark bar colours applied, and every Android resource reference resolves.

## Not verified here (the GitHub builds will show any problem)
The Gradle compile of the APK, the Xcode build of the IPA, running on real phones (native HTTP, share sheet, back button, safe areas), real PDF/DOCX/PPTX files from your own documents, and live calls to Gemini, Groq, OpenAI or LiteRT-LM.

## Troubleshooting
- `ENOENT package.json`: the files are inside a folder; move them to the repository root.
- Android build fails at "Compile Android debug APK": copy the first `What went wrong:` block.
- `The file name must end with .xml or .png` (for example `res/mipmap-mdpi/m`): the repository has a stray file inside `resources/android/`, usually a placeholder made while creating folders in GitHub's web editor. From 0.5.1 the build skips such files and names them in the log; delete them from the repository when convenient.
- `These icon files are missing from the repository`: upload the listed PNGs from the project zip, keeping their folders.
- Web app run fails with `Failed to create deployment (status: 404)` / `Ensure GitHub Pages has been enabled`: that was the 0.5.0 workflow trying to publish while Pages was off. From 0.5.1 the publish job is skipped instead; to publish, set **Settings > Pages > Source: GitHub Actions** and run it again.
- iPhone build fails at "Generate the Xcode project": usually a CocoaPods download hiccup, so run the workflow again.
- Sideloadly says "Your maximum App ID limit has been reached": free Apple IDs allow 3 sideloaded apps at a time; remove one.
- Blank screen with "This device needs an update": update Android System WebView and Chrome, or iOS.
- AI request fails with a network error: in Settings, use **Test connection**. For a server on your PC, check the address, the port, and that the firewall allows it.
