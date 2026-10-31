# Legal-risk audit — Prvlar 0.9.8 (31 Oct 2026)

Not legal advice. This is an engineering self-audit; a lawyer should review before any commercial launch.

| # | Area | Risk | Finding | Fixed in 0.9.8 | Owner must do |
|---|---|---|---|---|---|
| 1 | Dependency licences | Low | 204 production packages: MIT/ISC/BSD/Apache-2.0/OFL-1.1/0BSD/Unlicense, DOMPurify (MPL-2.0 OR Apache-2.0), JSZip (MIT OR GPL-3.0, used under MIT), Pyodide (MPL-2.0, unmodified). No GPL-only code. | THIRD_PARTY_NOTICES now lists CodeMirror, DOMPurify, KaTeX, Mermaid (+deps), Pyodide/CPython; full texts shipped as `third-party-licenses.txt` (linked from Open-source licences). | Rerun `node scripts/gen-licenses.mjs` when dependencies change. |
| 2 | DeepTutor (Apache-2.0), ECC (MIT) | Low | Ideas only; no code, prompts or assets copied (bundle grep clean). | ECC attribution added to notices (DeepTutor already credited). | — |
| 3 | Copied UI/assets (ChatGPT, Claude, study apps) | Low | No third-party logos/images; icons are Lucide (ISC); new Prvlar mark is original. | — | — |
| 4 | Exam names | Low–Medium | Profiles are named “…-style” and hold patterns/statistics only, citing public bulletins. | Terms: exam-name/non-affiliation clause (NTA, IITs, UPSC, CBSE, ETS, …); exam screen disclaimer. | Don’t use exam logos or say “official”. |
| 5 | Past papers | Low | No papers in the public bundle; owner pack is private. Users upload at their own responsibility. | Terms strengthened (“do not upload material you may not copy”). | Keep copyrighted papers out of the repo/public builds. |
| 6 | Spotify / sounds | Low | Official Embed only, no download; sounds synthesised on device. | Privacy “Third-party embeds”; notices section. | — |
| 7 | Google API User Data Policy / Limited Use | Medium | `drive.appdata` only; Limited Use statement present; data goes only to the user’s own Drive. | Privacy already covers Drive, crash reports, problem reports, diagnostics. | OAuth verification: keep privacy/terms URLs current; update consent-screen app name to “Prvlar” (needs your go-ahead) and re-verify branding. |
| 8 | Error-report Sheet | Medium | Scrubbed, rate-limited, opt-out; screenshots/contact only if user opts in. | Privacy “Your rights”: deletion within 30 days on request. | Honour deletion requests; restrict Sheet sharing to you. |
| 9 | Gemini / Groq / FreeLLMAPI terms | Medium | Users bring their own keys; no key in public bundle. FreeLLMAPI only in the encrypted owner pack (personal use). | AI-services clause expanded (own key, provider terms, not for medical/legal/financial decisions). | Don’t share the owner pack or your keys; keep FreeLLMAPI personal. |
| 10 | Secrets / personal data | Low | Git history scan: no API keys, private keys, keystores, passphrases or real Gmails (only test placeholders). Public build check passes. | — | Keep keystore, passphrase, ai-keys.env and owner pack outside the repo. |
| 11 | Children / DPDP 2023 / COPPA | Medium | No account needed; optional sign-in, keys, reports. | Privacy “Children and age” (18+ or parental consent; under-13 must not sign in) and “Your rights” (consent, withdrawal, deletion). | Provide a public grievance/contact email (DPDP) — currently in-app routes only. If you target under-18s at scale, add verifiable parental consent. |
| 12 | Trademark “Prvlar” | Low–Medium | Web search: no conflicting use found. | “Name” clause in terms. | Official registry search still pending: IP India (Class 9 and 41) and USPTO/WIPO before relying on the name. |
| 13 | Names shown (Bahamanwa family line, developers, beta tester) | Low | Shown at the owner’s request. | — | Confirm written consent from Vansh Bahamanwa, Anirudh Behre, Ashish Arora and the family for public display. |
| 14 | Roles | Low | Client-side only; docs and UI say “not security”. | docs/roles.md | — |
