# 09 — Testing evidence

**Status:** Not started · **Owner:** Teammate B (Abraham runs the eval script) · **Guide says:** Required (item 7); slide 8 content recommended

## Requirement (AIFM guide)

> 7. Test whether your prototype improves the current process. (p.2, How to Start)

> 7. TESTING — Did your prototype make the process faster, clearer, more consistent or more useful? (p.8)

> Slide 8. Testing / Result — What did you test? What improved? What did users say? (p.10, suggested slide)

## Our five tests (dossier section G)

| Test | Method | Target |
| --- | --- | --- |
| 1. AI tagging accuracy | Labelled eval set from [deliverable 07](../07-sample-data/), split by BM / English / Manglish; test split includes 10–15 Manglish hyperbole cases ("OT everyday, mati la") | κ ≥ 0.6 overall (≥ 0.5 Manglish, disclosed); follow-up recall ≥ 0.9; escalation recall as "k of n" with a 95% interval over at least 40 escalation cases, plus false alarms (including normal pay deductions); a pack other than BM and English needs its own set (30 replies, 20 escalation cases) before its AI counts without review; precision of tags that count without review; each AI step against a plain template (spec 05 eval method) |
| 2. Reliability | 100 runs + prompt-injection, gibberish, empty, emoji-only replies | ≥ 98% valid JSON first try; 100% safe handling |
| 3. Time to insight | 20 hires × 3 check-ins; one person uses a spreadsheet, another uses Sapa | ≥ 70% faster with equal or better accuracy |
| 4. HR user value | 3–5 HR practitioners or recruiters do set tasks | Average ≥ 4/5; at least 2 quotable statements |
| 5. New-hire experience | 5–10 volunteers role-play new hires on the real bot | ≤ 2 min per check-in; "I'd answer honestly" ≥ 4/5; 100% can say who sees their answers |

## What goes in this folder

- `results.md` — the numbers from every test, with date and sample size
- `quotes.md` — HR practitioner and volunteer quotes (with permission to use them)

## Practitioner evidence (slot, empty until real interviews happen)

Slide 3 needs 3–5 HR practitioner quotes and one answer to "Would you let Sapa run for three monthly intakes, each until Month 6?". The team must get these from real interviews ([guide](interview-and-user-test-guide.md)). Never invent a quote, a name or a number. If no interview happens, slide 3 says "desk research only". The same slot is in [dossier section C](../../docs/03-research-dossier.md#c-current-process-and-where-it-breaks-slide-3).

| # | Role and company type | Quote | Early leavers last year (their number) | Run three intakes until Month 6? |
| --- | --- | --- | --- | --- |
| 1 | *(empty)* | *(empty)* | *(empty)* | *(empty)* |
| 2 | *(empty)* | *(empty)* | *(empty)* | *(empty)* |
| 3 | *(empty)* | *(empty)* | *(empty)* | *(empty)* |
- `charts/` — κ by language chart and before/after time bar for slide 8
- `limitations.md` — the honest limitation line ("Synthetic data and a small sample…")

## Tasks (our plan, not an organiser rule)

- [ ] Test 1: run the eval script once the eval set is gold-labelled; record κ per language
- [ ] Test 2: reliability run including the nasty inputs
- [ ] Test 3: timed spreadsheet vs Sapa comparison
- [ ] Test 4: book 3–5 HR practitioners or recruiters (Teammate A helps find them); ask each the pilot question (until Month 6); fill the evidence slot above
- [ ] Test 5: 5–10 role-play volunteers on the real bot
- [ ] Make the two charts for slide 8
- [ ] Fill in the [N], κ and recall blanks in dossier section L, question 7 (recall as "k of n" with a 95% interval)
- [ ] Write the limitation line

## Definition of done

`results.md` has numbers for all five tests, two charts are ready, and slide 8 is drafted from them.
