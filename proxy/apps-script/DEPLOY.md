# Deploy the Prvlar free AI proxy (Google Apps Script) — steps for a browser agent

Account: the box browser signed in as the owner's Google account. Never paste the Gemini key anywhere except step 4, never screenshot it, and remove it from the code in step 6.

1. Open https://script.google.com/home and click **New project**.
2. Click the title "Untitled project" and rename it to **Prvlar free AI proxy**.
3. In the editor, select all the text in `Code.gs` and replace it with the full contents of `/workspace/out/proxy/Code.gs`. Press **Ctrl+S**.
4. In line `var SETUP_GEMINI_KEY = '';` paste the Gemini key between the quotes (the owner/parent supplies it). Press **Ctrl+S**.
5. In the toolbar function dropdown choose **setup**, click **Run**. On first run: **Review permissions** → choose the owner account → **Advanced** → **Go to Prvlar free AI proxy (unsafe)** → **Allow** (scopes: external requests, script storage). Open **Execution log**: it must show `Gemini key stored: yes` and `APP TOKEN ...: <uuid>`. Copy the APP TOKEN (it is not secret).
6. Set the line back to `var SETUP_GEMINI_KEY = '';` and press **Ctrl+S**. (The key now lives only in Project Settings › Script Properties.) Optionally run **status** to confirm `"keySet":true`.
7. Optional: **Project Settings** (gear) › Time zone **(GMT+05:30) India Standard Time**. Optional daily cleanup: **Triggers** (clock) › **Add Trigger** › function `cleanup`, event source **Time-driven**, **Day timer**, any hour › Save.
8. Click **Deploy › New deployment** › gear next to "Select type" › **Web app**. Description `v1`, **Execute as: Me**, **Who has access: Anyone**. Click **Deploy** (authorize again if asked).
9. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfy…/exec`).
10. Check it: open the URL in a new tab. It must show `{"status":200,"body":{"ok":true,"service":"prvlar-free-ai","configured":true}}`.
11. Give the parent the **Web app URL** and the **APP TOKEN**. The app reads them from:
    - `public/config.json` → `{ "freeProxy": "<Web app URL>", "freeToken": "<APP TOKEN>" }` (website, takes effect on the next Pages deploy, no rebuild of logic), and
    - `.env.production` → `VITE_PRVLAR_PROXY=<Web app URL>` and `VITE_PRVLAR_PROXY_TOKEN=<APP TOKEN>` (built into the APK and Windows app).
    Both values are public; the Gemini key is never in the app.

Updating the code later: edit, save, then **Deploy › Manage deployments** › pencil › Version **New version** › Deploy (the URL stays the same).

Limits: 30 messages per device per day, 1,000 per day overall (edit DEVICE_LIMIT / GLOBAL_LIMIT at the top). Apps Script consumer quotas: 20,000 URL fetches/day, 6 min per call; Gemini free-tier limits also apply.
To switch it off: Deploy › Manage deployments › Archive, or delete GEMINI_KEY in Script Properties.
