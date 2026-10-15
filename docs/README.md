# Docs

Read these in order. The `.md` files are snapshots of the live Claude Docs; if you edit one, edit the other too (or just edit here and tell Abraham).

| # | Doc | What it's for | Live version |
| --- | --- | --- | --- |
| 1 | [Product rundown & deliverables](01-product-rundown-and-deliverables.md) | **Start here.** What Sapa does in plain words, every deliverable the guide requires, how judges score | [Claude Doc](https://claude.ai/code/artifact/db43d8dd-2495-4e94-a72b-93be99a5fb42) |
| 2 | [Prototype architecture](02-prototype-architecture.md) | How the prototype is built: stack, components, AI layer, privacy enforcement, demo script, build plan | [Claude Doc](https://claude.ai/code/artifact/e40dee12-b432-4053-a659-68b1cc87acda) |
| 3 | [Research & product dossier](03-research-dossier.md) | The evidence and product spec: statistics, competitors, personas, question bank, taxonomy, testing plan, ROI, ESG, judge Q&A | [Claude Doc](https://claude.ai/code/artifact/8cef3335-cecc-4bce-812e-b8fd6617111e) |
| 4 | [Adversarial review](04-adversarial-review.md) | What breaks in 01–03, ranked by severity, with the fix for each | — |
| 5 | [Implementation spec](05-implementation-spec.md) | Bot, Q&A, AI, rules R1–R53, modules, data model, tests. **Wins over 02 where they disagree** | — |
| 6 | [Dashboard design spec](06-dashboard-prd.md) | High-level brief for the web app: situation, problem, goal, commitments and user flows. Screens are recommendations only | — |
| 7 | [Official rules & requirements](07-official-rules-and-requirements.md) | PDF + aifm.asia + workshop videos in one place: dates, eligibility, judging, pitch rules, open questions for the organisers | — |
| 8 | [Rubric review 1](08-rubric-review.md) | First AI judge review against the rubric (history) | — |
| 9 | [Client story](09-client-story.md) | The reference customer, Contoh GBS (a fictional Penang shared services centre): why it needs Sapa, its people, its money case, and which numbers are sourced or fictional | — |
| 10 | [Rubric review 2](10-rubric-review-2.md) | Second AI judge review: about 67 now, about 80 with its fixes. Fixes 1–7 applied 15 Oct | — |
| 11 | [Rubric review 3](11-rubric-review-3.md) | Third AI judge review (product only): about 81.5 now, about 95 with its fixes. G1–G23 applied 15 Oct, except G19 (rejected by the team) | — |
| 12 | [Rubric review 4](12-rubric-review-4.md) | Fourth AI judge review (product only, skeptical judge): about 89 now, about 95 with its fixes. H1–H15 and contradictions K1–K17 applied 15 Oct | — |
| 13 | [Classifier bake-off](13-classifier-bakeoff.md) | Gemini vs Cloudflare Clef on 150 BM/English/Manglish replies. Why classify stays on Gemini, and the Gemini latency risk | — |

## Reference

- [`reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf`](reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf) — the organisers' guide. **Every requirement in `/deliverables` is quoted from this PDF.** Nothing else counts as an official requirement until the organisers confirm it (see [`/admin/organiser-questions.md`](../admin/organiser-questions.md)).

## Where docs disagree

- **Demo script.** The implementation spec (05, "Updated 2-minute demo" and "Demo setup") is the only source. The dossier (section K) and the architecture doc (section 7.1) have older versions.
- **Eval set size.** The dossier and the architecture (about 150) are older than the spec. Aim for about 200 (the dossier minimum is 50–100), with at least 40 escalation cases (05 eval method). A smaller escalation set gives an interval too wide to use.
- **Reference customer.** The rubric reviews (04, 08, 10, 11, 12) are history and describe a 300-staff factory, Contoh Manufacturing. The current customer is Contoh GBS, a Penang shared services centre ([09](09-client-story.md)).
- **Group size and window.** The dossier (03), review (04) and rubric review (08) are history and still say "intake of 6", "3 of 5" or "rolling 90 days". The current rule is everyone hired in the last six months (about 100 hires at Contoh GBS), matching the guide's "leave within six months". Specs 01, 02, 05 and 06 are current.
