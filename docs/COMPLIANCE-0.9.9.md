# 0.9.9 compliance hotfix: what was built, and the limits
- **Age eligibility** (src/age.js): a date of birth is asked before online AI, Google sign-in and problem reports; only `adult`/`minor` + check date is stored (`prvlar-age`), never the DOB. Under-18s keep all offline features. **This is a self-declaration. It is not verifiable parental consent (DPDP s.9 / Rule 10) and does not by itself satisfy the Gemini API terms (18+ and not directed at minors).** A provider/terms decision is still required (see BETA-PLAN.md blockers).
- **Server enforcement** (proxy/apps-script/Code.gs): requests without `eligible:true` get 403 PRVLAR_AGE; when `ALLOWED_AUD` is set, requests without a valid Google ID token get 401. The flag is client-asserted; with ALLOWED_AUD it is tied to a verified Google account. Android has no ID token yet, so with ALLOWED_AUD set the free option needs a web/desktop sign-in or the user's own key.
- **Report AI answer** (src/aireport.js): on every Smarty reply and every AI-provisional mark; categories inaccurate/harmful/inappropriate/privacy + note; stores the answer (≤4000 chars) and a ≤300-char context excerpt, scrubbed of keys, tokens, emails and phone numbers. Kept on the device; Developer panel › AI reports (owner and co-developer only) has status new/reviewing/resolved, an audit trail and export.
- **Accuracy notice** under Smarty answers, Smarty-everywhere results and AI marks.
- **Privacy page** corrected: 0.9.9 sends no automatic crash/error reports (the public build has no report URL; automatic reports are now opt-in and adults-only even when one is configured). Data locations, retention, and the grievance contact vanshbahamanwa021430@gmail.com.
- **Deletion**: Delete cloud data also deletes AI reports, crash logs and the report send-history on the device.

## Evidence register (code at efc6b6a; screenshots in /workspace/out/test-0.9.9/)
| Control | Code | Test | Screenshot |
|---|---|---|---|
| Age check, DOB not stored | src/age.js:16; src/main.js:217 | tests/compliance099.test.js; fulltest "Age" (2 steps) | 75-age-check.png, 76-age-minor.png |
| Age gate: online AI / sign-in / reports | src/main.js:243, 2588 (+ gateSignIn), 2623 | fulltest "Age – under-18" (no network request made) | 76-age-minor.png |
| Proxy rejects missing eligibility | proxy/apps-script/Code.gs:96 | tests/proxygas098.test.js "direct proxy request without the eligibility flag" | – |
| Proxy requires ID token when ALLOWED_AUD set | proxy/apps-script/Code.gs:107 | tests/proxygas098.test.js "ALLOWED_AUD" | – |
| App sends eligibility flag | src/ai.js:54; src/main.js:3276 | tests/idtoken099.test.js | – |
| Proxy stores no content | proxy/apps-script/Code.gs (counts only) | tests/proxygas098.test.js "stores no message content" | – |
| Report AI answer (Smarty, AI marks) | src/main.js:2293, 1091; src/aireport.js | compliance099 test; fulltest "Report AI answer" (real answer, scrub verified) | 77-report-answer.png |
| Report scrub (keys, tokens, emails, phones, ≤300-char context) | src/aireport.js:6 | compliance099 test + fulltest | – |
| Reports tab: owner + co-dev only, status, audit, export | src/main.js:2364; src/devlog.js:55 | fulltest "AI reports", codev/tester role steps | 79-dev-reports.png |
| Accuracy notice | src/main.js:232 | fulltest "Report AI answer" (text asserted) | 77-report-answer.png |
| Privacy page matches code | src/legal.js:11, 13, 26 | fulltest "Privacy page" | 78-privacy.png |
| Automatic reports opt-in, adults only | src/main.js:2250 | – (no report URL in public build) | – |
| Deletion also clears reports and crash logs | src/main.js:2598 | fulltest "Deletion" | – |

## Install tests
| Test | Status |
|---|---|
| Real-device Android install (update over 0.9.8) | **NOT YET RUN**: owner will verify after release. Only static checks were done: signature certificate matches 0.9.8, versionName 0.9.9, versionCode 100909. |
| Windows install (setup exe + portable zip) | **NOT YET RUN**: owner will verify after release. |
