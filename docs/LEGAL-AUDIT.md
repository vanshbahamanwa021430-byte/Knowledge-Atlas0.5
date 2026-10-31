# Prvlar Compliance & Launch Readiness — 0.9.9 audit (31 Oct 2026)

I'm not a lawyer; this is an engineering self-audit. Verify every item with a qualified Indian lawyer / CA before beta and before paid launch.

Type: **LR** = legal requirement, **PP** = platform policy, **RS** = recommended safeguard.
Status: **Implemented** only where confirmed in code (file:line) or live URL; roadmap items = **Planned**; otherwise **Open**.
Gate: **Now** / **Before beta** / **Before paid launch**.

| # | Area | Type | Risk | Requirement / what could happen | Fix | Status (evidence) | Gate |
|---|---|---|---|---|---|---|---|
| 1a | Gemini 18+ / minors | PP | High | Gemini API Additional Terms (eff. 23 Mar 2026): users must be 18+; no use in apps "directed towards or likely to be accessed by" under-18s. Students (incl. school/JEE/NEET) are likely minors → key/project suspension. | Age gate (18+ for AI features) now; long-term choose a provider whose terms allow 13–17 or restrict audience to 18+. | Open. Privacy text only (src/legal.js:21); no age gate in code. | Now |
| 1b | Free-tier data use via owner proxy | PP | High | Unpaid quota: Google uses prompts/outputs to improve products, human review; "do not submit … personal information". Proxy puts the public on Vansh's free key. | Keep disclosure; before paid launch move proxy to a billed Cloud project (Paid Services: no training, DPA). | Disclosure Implemented (live privacy page). Proxy not deployed (proxy/apps-script/DEPLOY.md). | Before beta |
| 1c | Commercial use | PP | Medium | Terms say AI Studio/Gemini API is for professional/business use; paid tier needed for EEA/CH/UK users. | Billed project + server quotas before Pro. | Planned (roadmap 1.0). | Before paid launch |
| 2a | DPDP Act 2023 + Rules 2025 | LR | High | Rules notified 13 Nov 2025; Rule 4 (consent managers) 13 Nov 2026; Rules 3, 5–16 (notice, security, breach, children, rights) 13 May 2027. Penalties up to ₹250 cr (Act Schedule). | DPDP-style notice, public grievance email, retention policy. | Partial: consent prompt (src/main.js:214), Delete cloud data (src/main.js:2372). No public contact email. | Before beta (full by 13 May 2027) |
| 2b | Children / parental consent | LR | High | S.9 + Rule 10: verifiable parental consent before processing under-18 data; no tracking/targeted ads. | Age declaration + block sign-in/sync/reports for under-18 until VPC flow exists. | Open (text only, src/legal.js:21). | Before beta |
| 2c | Breach notice | LR | Medium | Rule 7: notify users and Board without delay, detailed report in 72 h. CERT-In 2022 directions: 6 h report of data breaches. | Write incident runbook; restrict Sheet access. | Open. | Before beta |
| 3 | IT Act / Intermediary Rules 2021 | LR | Low now, Medium if sharing ships | If users share content (Campus/teacher maps), Prvlar may be an intermediary: Rule 3 due diligence, grievance officer, 24h/15-day timelines. | Keep private-by-default; add grievance officer + takedown before any sharing. | N/A today (no sharing); Planned 1.1. | Before sharing feature |
| 4 | Copyright | LR | Medium | Copyright Act 1957: uploads of textbooks for personal study are user's responsibility; generated slides/maps that reproduce long passages and are shared could infringe. | Private-by-default; quote limits in slide maker; source refs. | Terms clause Implemented (src/legal.js:29). | Before beta |
| 5a | Play Billing | PP | High (paid) | Payments policy: digital subs in Android app must use Play Billing (India user-choice billing option). | Play Billing for Android Pro. | Planned. | Before paid launch |
| 5b | Owner/complimentary grants | PP | Medium | Free server-side entitlements involve no payment; policy silent → verify with Play; must not link out to external payment. | Grant without any purchase UI; document. | Planned (roadmap). | Before paid launch |
| 5c | AI-generated content | PP | High | Play AI-Generated Content policy: in-app report/flag of offensive AI output without leaving app. | Add "Report this answer" on Smarty replies. | Open (none found in src). | Before Play listing |
| 5d | Families / target audience / Data safety | PP | Medium | Accurate target-age and Data safety answers; under-13 targeting triggers Families policy. | Declare 18+ (or 13+) honestly; fill Data safety incl. sign-in, crash, AI sends. | Open (not on Play yet). | Before Play listing |
| 5e | Account deletion | PP | Medium | Play requires in-app + web deletion path for apps with account creation. | Web deletion page / email. | Partial (Delete cloud data, src/main.js:2372). | Before Play listing |
| 6 | Google OAuth | PP | Medium | drive.appdata is non-sensitive: no full verification, but brand verification to show name/logo; 100-user cap while Testing; User Data Policy applies. | Rename consent screen to Prvlar, publish to Production, brand verification. | Scope Implemented (src/cloud.js:10); branding Open. | Before beta |
| 7 | OSS licences & fonts | LR | Low | MIT/ISC/BSD/Apache/MPL notices; OFL fonts (Pinyon Script, Playfair Display, Inter) need licence text, no font-name reuse if modified. | Rerun gen-licenses on dep change. | Implemented: THIRD_PARTY_NOTICES.md:48 (Inter), :245 (Playfair etc.), :291 (Pinyon); public/fonts/OFL-PinyonScript.txt; public/third-party-licenses.txt. | Now (keep) |
| 8 | Trademark "Prvlar" + icon | LR | Medium | Unregistered; conflicting earlier mark could force rename. | IP India search Class 9/41/42; file TM-A; keep icon original. | Open (web search only). | Before paid launch |
| 9a | GST / business | LR | Medium | CGST s.22: registration above ₹20 lakh (₹10 lakh special states); s.24 compulsory cases. Need entity + bank account to take payments. | CA advice; sole prop/LLP. | Open. | Before paid launch |
| 9b | Contributor / co-developer IP | RS | High | No written agreement: unclear ownership of code contributed by Anirudh (contributor/co-developer). | Signed contributor IP assignment agreement to Vansh/entity; check UPES IP policy. | Open. | Before beta |
| 10 | Consumer protection / auto-renew | LR | Medium | CPA 2019, E-Commerce Rules 2020 (grievance officer, refund policy), Dark Patterns Guidelines 2023 (no subscription trap); RBI e-mandate: 24 h pre-debit notice, AFA above ₹15,000. | Easy cancel, clear price/renewal, refund policy page. | Planned. | Before paid launch |
| 11 | AI grading disclaimer | RS | Medium | Wrong marks → complaints/misleading claims. | Label every AI mark "provisional". | Implemented: src/ai.js:278, src/main.js:1043 ("AI, first opinion"), terms src/legal.js:27. | Now (keep) |
| 12 | Error/crash data | LR/RS | Medium | 0.9.9 crash reports are local-only (src/main.js:1178) but live privacy page still says they go to a Google Sheet → notice mismatch. Problem reports still go to Sheet. | Update privacy text for 0.9.9; restrict Sheet; deletion within 30 days. | Code Implemented; privacy text Open. | Now (with 0.9.9) |
| 13 | Apple / iOS Add to Home Screen | PP | Low | PWA isn't App Store distributed, so App Store rules don't apply; native iOS app later needs App Store Review Guidelines (IAP 3.1.1, account deletion 5.1.1(v)). | Keep PWA; plan IAP if native. | N/A. | Before native iOS |

## Recommended 0.9.9 changes (not implemented)
1. 18+ age confirmation before AI features, Google sign-in and problem reports (Gemini terms, DPDP s.9).
2. "Report this answer" button on Smarty / AI outputs (Play AI-Generated Content policy).
3. Privacy page: crash reports now local-only; add a public contact/grievance email; bump to 0.9.9.
4. One-line AI disclaimer under Smarty chat ("AI can be wrong; marks are provisional").

## Release gates
- **Now:** privacy text matches 0.9.9; age gate; AI disclaimer; licence notices regenerated.
- **Before beta:** AI report button; OAuth branding/production; contact email; signed contributor IP assignment agreement; incident runbook; proxy on paid/consented setup.
- **Before paid launch:** billed Gemini project; Play Billing + grants verified; entity, GST advice, bank; refund/cancel policy & dark-pattern review; trademark filing; full DPDP compliance (by 13 May 2027).

## Sources (read 31 Oct 2026)
- Gemini API Additional Terms (eff. 23 Mar 2026): https://ai.google.dev/gemini-api/terms
- DPDP Rules 2025 (MeitY): https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa ; Rule 7 text: https://www.dpdpa.in/dpdpa_rules_2025/Rule_7.htm
- CERT-In Directions 28 Apr 2022: https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf
- Play AI-Generated Content: https://support.google.com/googleplay/android-developer/answer/13985936 ; Families: https://support.google.com/googleplay/android-developer/answer/9893335 ; Payments: https://support.google.com/googleplay/android-developer/answer/9858738
- Drive scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth ; OAuth verification: https://support.google.com/cloud/answer/13463073
- Dark Patterns Guidelines 2023: https://consumeraffairs.nic.in/sites/default/files/The%20Guidelines%20for%20Prevention%20and%20Regulation%20of%20Dark%20Patterns%2C%202023.pdf
- RBI e-mandate directions: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13374
- CGST s.22: https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter6/section22_v1.00.html
- IP India TM: https://www.ipindia.gov.in/pages/trade-marks/learn/forms-and-official-fees
