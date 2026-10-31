# Prvlar

Turn your own documents into a study map, study them section by section, and test yourself. One HTML/CSS/JS app (Vite) packaged for every platform. Your documents, notes, study progress and results stay on the device (IndexedDB/localStorage). No account, no server.

**Download:** https://vanshbahamanwa021430-byte.github.io/Knowledge-Atlas0.5/download/ (Android APK, Windows, iPhone/iPad web app) · **Use it in your browser:** https://vanshbahamanwa021430-byte.github.io/Knowledge-Atlas0.5/

## Runs on

| Platform | Minimum | How it's built |
|---|---|---|
| Android phones and tablets | Android 6.0 (API 23), with Android System WebView updated from the Play Store | Capacitor 7, GitHub Actions → `app-debug.apk` |
| iPhone and iPad | iOS 14 | Capacitor 7, GitHub Actions on macOS → unsigned `.ipa` to sideload, or add the web version to the Home Screen |
| Windows | Windows 10 or 11 | Electron, GitHub Actions → `.exe` installer |
| Any browser (installable web app) | Chrome/Edge 79+, Safari 13+, Firefox 68+ | GitHub Actions → GitHub Pages, or a zip to host anywhere |

The JavaScript is compiled for 2019-era engines (`es2019`, Chrome 73, Safari 13) and PDF import uses pdf.js's legacy build, so older devices work. If a device's engine is too old, `public/compat.js` shows what to update instead of a blank screen.

## What it does
- **Home:** import a document, or carry on where you left off, with your progress, average score and recent tests.
- **Library:** your documents with study progress and best score. Search finds words in every document, section and note.
- **Study map** (Map, Outline and Notes tabs): the document's headings as a flowchart. Chapters are blue, sections green, and each section's ring fills with a check once you've studied it. Side by side on wide screens, top to bottom on phones; fold branches, zoom and fit. PDFs are first split by page and slide decks by slide; **Organise with AI** (⋯ menu, or the suggestion above a page-by-page map) turns any map into proper chapters, sections and subsections. The AI only decides where each topic starts and what it's called: every sentence of your document stays, in its original order, in exactly one topic, notes and study progress move with their text, and **Use the original headings** puts the old map back. Scanned documents need OCR (not included).
- **Section** (Content, AI Explanation and Notes tabs): the original text, an "In simple words" explanation (saved once written), notes that save as you type, and Previous/Next. **Ask AI about this section** offers quick prompts (simpler words, real examples, common mistakes, key points) or your own question, answered only from that section. On a computer the AI panel sits beside the text.
- **AI Chat:** ask anything about a whole document. Answers come only from the document and name the sections they used; tap one to open it.
- **Test:** 20 questions (10 multiple choice × 1 mark, 10 written × 5 marks, 30 minutes) written from your document by AI after you confirm, shown one at a time with a timer ring, progress bar, bookmarks and an overview of all questions. It survives a reload and submits itself when time runs out.
- **Result:** score ring, correct answers, time taken and performance per chapter. Review every answer with the model answer and source, change any mark, share your score, or generate a new test. Multiple choice is marked by the answer key; written answers get an AI first opinion.
- **Flashcards** (spaced repetition, SM-2): a deck per document; cards per section from **Make flashcards with AI** (a section's **Cards** tab) or written by you; questions you get wrong in a test become cards automatically (Settings › Study). Review shows the question, then Again / Hard / Good / Easy with when each brings the card back.
- **Mistakes**: every question answered wrong in any test, to retry. Multiple choice is checked straight away; written answers are compared with the model answer. Fixed ones move to the Fixed tab.
- **Planner**: exam dates with countdowns, a to-do and assignment list with due dates, daily and weekly study-time goals and a daily flashcard goal, and reminders (a week before, a day before and on the morning of each exam, at a task's due time, and an optional daily study reminder). On Android and iPhone reminders are local notifications that arrive with the app closed; in a browser they appear only while the page is open.
- **Focus timer**: Pomodoro (25/5/15 by default, all adjustable, long break every 4 blocks), a chime and a notification when each part ends, optional rain, brown-noise or white-noise sound made by the app (no audio files), and study minutes logged to the document you choose. Time spent reading a section is counted too (only while you are active).
- **Progress**: level and XP, day streak, minutes per day (last 14 days, against your goal), time per document, test scores, flashcard recall, weak sections across your tests, badges, and **What to revise next** (due flashcards, weak topics before an exam, mistakes to retry, sections not yet studied). Home shows a Today card with the same highlights.
- **Read aloud** (speaker button on a section, and on flashcards) with the phone's own voice, adjustable speed; **reading text size** in Settings › Appearance.
- **Themes** (Settings › Appearance): Device, Light, Dark, Aesthetic (soft pastels, serif headings), Anime (pink, purple and cyan with CSS sakura and star motifs) and Glass (frosted translucent cards over a gradient; solid cards where the WebView can't blur).
- **Mind map export** (⋯ menu on the study map): the map with your notes and studied sections as a Markdown outline that Markmap, XMind or Obsidian can open.
- **More** (on phones): Results (every test, kept even after a document is deleted), Notes (everything you've written), AI Chat, Settings, About us, dark mode, back up and restore.
- **About us:** made by the Prvlar team. On phones the backup opens the share sheet, so you can save it to Files or Drive or send it by email.

## Design
A bright study theme: royal-blue actions, a blue-to-violet "Import a document" button, white rounded cards on a softly glowing background, and a navy dark theme (Settings > Appearance: Device, Light or Dark). Phones get a bottom tab bar (Home, Library, Study, Test, More); tablets in landscape and computers get a sidebar with a storage meter and a search bar. Interface type is Inter (SIL Open Font License) and icons are from Lucide (ISC licence), both bundled so the app looks the same offline (see `THIRD_PARTY_NOTICES.md`). The app icon is a blue gradient tile with a white brain-circuit mark; on Android it is an adaptive icon that also supports themed icons, and the status bar, navigation bar and launch screen follow the phone's dark mode. The icon, splash screens and web-app icons are generated from `src/brand.js` with `npm run assets` (needs Playwright and Python Pillow). The PNGs in `resources/` and `public/icons/` are committed, so builds don't need image tools.

## Commands
```
npm install
npm run dev            # browser at 127.0.0.1
npm test               # unit tests
npm run check          # syntax check of every source file
npm run build          # web build in dist/ (also the installable web app)
npm run desktop        # build and open the Electron app
npm run package:win    # Windows installer in release/
npm run android:sync   # build, create android/, apply icon/splash, sync. Then: npm run android:open
npm run ios:sync       # same for ios/ (needs a Mac with Xcode). Then: npm run ios:open
```
Android needs JDK 21 (Capacitor 7). `android/` and `ios/` are generated, not committed; `scripts/native-assets.mjs` applies the icon, launch screen, colours and network settings after `cap add`. See `VERIFY_AND_BUILD.md` for the GitHub Actions builds and how to install on each device.

## AI services
Choose one in **Settings > AI Settings**:

| Option | Cost | Notes |
|---|---|---|
| Key starting `AIza` | Google Gemini, free tier | `gemini-flash-lite-latest`; key from aistudio.google.com/apikey |
| Key starting `gsk_` | Groq, free tier | `llama-3.3-70b-versatile`; key from console.groq.com/keys |
| Key starting `sk-` | OpenAI, paid | `gpt-4o-mini` |
| OmniRoute or another self-hosted router | free, self-hosted | routers that stack free tiers; model `auto`; paste the router's own key |
| Google LiteRT-LM / Gemma | free, offline on your PC | `litert-lm serve`, model `gemma,cpu,16384` (see below) |
| Other OpenAI-compatible server | depends | any `/v1/chat/completions` endpoint |

**Test connection** sends a tiny request (no document text) to check the key or server.

**Offline Gemma on your PC (Google LiteRT-LM).** Google AI Edge Gallery itself can't be called by other apps, but its engine has an OpenAI-compatible server:
```
pip install -U litert-lm
litert-lm import --from-huggingface-repo litert-community/gemma-4-E2B-it-litert-lm gemma-4-E2B-it.litertlm gemma
litert-lm serve --host 0.0.0.0
```
Address `http://localhost:9379/v1` from the Windows app on the same PC, or `http://<PC Wi-Fi address>:9379/v1` from a phone on the same Wi-Fi (allow port 9379 in the Windows firewall). The model is about 2.6 GB and nothing leaves your PC. A full test can take several minutes on a PC processor; use `gemma,gpu,16384` if the PC has a supported graphics card.

**Self-hosted routers.** OmniRoute (`http://localhost:20128/v1`) need each provider's free key added in their dashboard. On a phone, `localhost` means a server running on the phone itself (Termux). Don't route ChatGPT, Claude or Copilot subscriptions through OmniRoute, because that can break those providers' terms.

**Networking.** In the Android and iOS apps, AI requests go through native HTTP (Capacitor), and in the Windows app through the Electron main process (`electron/preload.cjs`). So browser CORS rules don't block providers or local servers, and plain `http://` works for servers on your network (Android `server.cleartext`, iOS `NSAllowsArbitraryLoads`/`NSAllowsLocalNetworking`). In a plain browser, the provider or server must allow the page's origin.

Free tiers limit requests per minute and per day (a 429 error means wait or try tomorrow). Google says free-tier Gemini prompts may be used to improve its products and may be read by human reviewers, so don't use a free key with confidential documents.

## Exam mode

Test > Exam style picks how a practice test looks: one of 31 built-in “-style” exam patterns (JEE, BITSAT, GATE per branch, NEET UG/PG, CUET, CBSE 12, UPSC GS + CSAT, SSC, RRB, IBPS/SBI, NDA, CLAT, CAT, SAT/GRE/GMAT/IELTS-style), past papers, or a custom exam (from past papers or your own pattern), plus a level (Easier / Exam normal / Harder) and the number of questions. Profiles are versioned JSON in `src/exams/` (schema in `src/examprofile.js`): pattern and marking, difficulty mix, topic weights, style notes, traps, coverage years, sources, and an `assumptions` list for anything not from an official or published source. Exam normal uses the profile's measured difficulty mix; where none exists a 30/50/20 mix is used and the app says so.

Custom exams (paste text or add PDFs) are made on the device: the papers' text goes only to the AI provider you chose. Profiles you make are in backups. Owner-only tools come from the encrypted owner pack (docs/owner-pack.md).

## Updates and releases
The in-app update check is off unless a release repo is configured (`setUpdateRepo` in `src/update.js`; the owner pack sets one). **About › App updates** has *Check for updates* and an *automatic check* (at most once a day, can be turned off). On Android the new APK downloads inside the app and Android's installer opens; in Windows and the browser the release page opens.

**An update installs over the old app and keeps all documents, cards and progress only when:**
1. every release APK is signed with the **same release key** (`knowledge-atlas-release.jks`, alias `knowledgeatlas`) — keep that file and its password safe and backed up; a lost key means users must uninstall (and lose data) to update;
2. the version in `package.json` is higher (versionCode is derived from it: 0.8.1 → 801, so MINOR and PATCH must stay under 100).

Apps signed with another key (older debug builds) must be uninstalled once after a backup (More › Back up, then restore).

### Publishing a release from GitHub Actions
Add these repository secrets (Settings › Secrets and variables › Actions):

| Secret | Value |
| --- | --- |
| `KEYSTORE_BASE64` | `base64 -w0 knowledge-atlas-release.jks` (macOS: `base64 -i knowledge-atlas-release.jks`) |
| `KEYSTORE_PASSWORD` | the keystore password |
| `KEY_ALIAS` | `knowledgeatlas` |
| `KEY_PASSWORD` | the key password (same as the keystore password for this key) |

Then bump `"version"` in `package.json`, commit, and push a matching tag: `git tag v0.8.2 && git push origin v0.8.2`. `.github/workflows/release.yml` builds, signs (v1+v2+v3), verifies and attaches `Prvlar-<version>.apk` to a GitHub Release. Optional: put release notes in `RELEASE_NOTES.md`; otherwise GitHub generates them. Every user then sees the update in the app.

## Privacy
- Document text goes to the AI only after you confirm: to organise the map (the beginning of each paragraph, about 4–25 KB), to write a test (long documents are sampled across all sections, up to 22,000 characters), to mark written answers (confirmed when you start or submit), for explanations (confirmed each time), and for Ask AI and AI Chat (confirmed once per document each time you open the app; Ask AI sends only the open section).
- With **Remember the key on this device** on (the default), the key is kept in this app's own storage on the device so you don't paste it every time. Turn it off and the key is forgotten when the app closes. The key is never put in backups and never bundled in a build. Don't use a personal key on a shared device.
- Uninstalling or clearing app data deletes everything. Use **Settings > Back up** regularly. Backups (format 2, from 0.7) include flashcards, planner items, study time, goals, reminders and the theme; backups from 0.6 and earlier still restore.

## Known limitations
- Questions are schema-checked and each source label is checked against the document's sections (unmatched labels are flagged), but facts still need your judgement.
- No OCR, voice notes or online study groups (they would need a server). No on-phone AI model, no encryption at rest. The map follows the document's headings, not meaning.
- The Android app is a debug build and the iPhone build is unsigned; app-store releases need your own signing keys.
