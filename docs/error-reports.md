# Error reports (free, no server)

Reports from the app land in a Google Sheet you own, through a small Google Apps Script web app.

## One-time setup (about 5 minutes)

1. Open https://sheets.new while signed in to your Google account. Name it **Prvlar reports**.
2. In the Sheet, choose **Extensions › Apps Script**. Delete the sample code and paste all of `docs/error-reports.gs`. Click **Save**.
3. Click **Deploy › New deployment**. Click the gear icon and choose **Web app**.
   - Description: `reports`
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy**, then **Authorize access**, pick your account, then **Advanced › Go to (project) › Allow**.
4. Copy the **Web app URL** (it looks like `https://script.google.com/macros/s/…/exec`).
5. Put it in `.env.production` as `VITE_REPORT_URL=<that URL>` and rebuild. (The URL is not a secret: it can only add rows.)
6. To see reports in the Developer panel: in the Sheet choose **File › Share › Publish to web**, pick the **Reports** sheet and **Comma-separated values (.csv)**, click **Publish** and copy the link. Put it in the owner pack config as `"reports": { "csv": "<link>", "email": "<your email>" }` and rebuild the pack. (Anyone with that link can read the reports, which contain no personal data unless a user typed a contact. Skip this step to keep the Sheet private and read it in Google Sheets instead.)

## What is sent

- **Automatic reports** (on by default, can be switched off in More › Report a problem): error message and the first lines of its stack, app version, platform, screen size and theme. Keys, emails and long numbers are removed. At most 3 per hour and 10 per day per device, and one per distinct error per day.
- **User reports**: what the user typed, plus diagnostics and a screenshot only if they choose to include them, plus a contact only if they type one.

The GitHub issue (label `user-report`) and email routes remain as fallbacks.
