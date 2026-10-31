# Prvlar 0.9.9 private adult beta
Gates before the beta: security tests, regression tests (Smarty, imports, flowcharts, theory, easy explanations, quizzes, progress), Android + Windows builds and install tests, code review (ECC checklist), then a **private beta for adults (18+) with informed consent** (a written beta notice: what is collected, AI provider terms, that answers can be wrong, how to leave and delete data).

## Beta metrics (collected only with consent; no analytics SDK is in the app, so these come from testers' exported reports and a short weekly form)
| Metric | How it is measured |
|---|---|
| Import success | imports that finished / imports tried (by type: PDF, scanned PDF, DOCX, PPTX, notes) |
| Correct source refs | sampled Smarty and test answers whose cited page/section is right |
| Flowchart usefulness | 1–5 rating per study map |
| Test completion and improvement | tests finished / started; score change on retakes of the same document |
| Smarty answer reports | reports per 100 answers, by category (from the in-app report export) |
| Crash-free sessions | sessions without an entry in the on-device crash log (testers who opt in) |
| Weekly returning students | testers active in at least 2 days of a week |

## Open blockers (must be closed before the beta starts)
1. **Paid AI account and terms**: move the free proxy to a billed Google Cloud project (paid-services terms, no training on prompts) or another provider whose terms allow this audience; confirm the 18+ requirement.
2. **Signed contributor IP assignment agreement** with Anirudh Behre (contributor/co-developer; keeps automatic co-dev Pro).
