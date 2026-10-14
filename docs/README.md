# Docs

Read these in order. The `.md` files are snapshots of the live Claude Docs; if you edit one, edit the other too (or just edit here and tell Abraham).

| # | Doc | What it's for | Live version |
| --- | --- | --- | --- |
| 1 | [Product rundown & deliverables](01-product-rundown-and-deliverables.md) | **Start here.** What Sapa does in plain words, every deliverable the guide requires, how judges score | [Claude Doc](https://claude.ai/code/artifact/db43d8dd-2495-4e94-a72b-93be99a5fb42) |
| 2 | [Prototype architecture](02-prototype-architecture.md) | How the prototype is built: stack, components, AI layer, privacy enforcement, demo script, build plan | [Claude Doc](https://claude.ai/code/artifact/e40dee12-b432-4053-a659-68b1cc87acda) |
| 3 | [Research & product dossier](03-research-dossier.md) | The evidence and product spec: statistics, competitors, personas, question bank, taxonomy, testing plan, ROI, ESG, judge Q&A | [Claude Doc](https://claude.ai/code/artifact/8cef3335-cecc-4bce-812e-b8fd6617111e) |
| 4 | [Adversarial review](04-adversarial-review.md) | What breaks in 01–03, ranked by severity, with the fix for each | — |
| 5 | [Build spec](05-build-spec.md) | The full app spec: user stories, rules R1–R27, modules, data model, tests. **Wins over 02 where they disagree** | — |

## Reference

- [`reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf`](reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf) — the organisers' guide. **Every requirement in `/deliverables` is quoted from this PDF.** Nothing else counts as an official requirement until the organisers confirm it (see [`/admin/organiser-questions.md`](../admin/organiser-questions.md)).

## Where docs disagree

- **Demo script.** The dossier (section K) has an earlier version with Mei Ling and "3 of 5". The architecture doc (section 7.1) is the current one: demo clock, live reply, "4 of 6". Use the architecture version.
- **Eval set size.** The dossier says 50–100 labelled replies; the architecture says about 150. Aim for 150, accept 100 if time runs out.
