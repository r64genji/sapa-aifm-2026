# 07 — Sample data

**Status:** Not started · **Owner:** Teammate B · **Guide says:** Required ("IMPORTANT")

## Requirement (AIFM guide, p.11)

> IMPORTANT - USE SAFE SAMPLE DATA: Do not upload real confidential CVs, employee records or company personal data into public AI tools. For the competition, use fictional, anonymised or properly permitted sample data.

## Rules for this repo

- **Every person, reply and company in this folder is fictional.** Never paste a real employee's words here, even anonymised, unless they gave written permission.
- If the repo is public, assume anyone can read this folder.

## What goes in this folder

| File | What it is | Used by |
| --- | --- | --- |
| `cohort/` | Synthetic intake: 30 fictional hires × six monthly intakes, with planted themes (e.g. role clarity in week 2) | Demo seed, Test 3 |
| `eval-set.csv` | About 200 labelled replies (dossier asks for 50–100 minimum): one-third each BM, English, Manglish, including at least 40 escalation cases (forced-labour cases in BM and English among them) and 10–15 hyperbole cases and normal pay deductions (EPF, SOCSO, tax, lateness) that must not escalate. | Test 1 |
| `labelling-guide.md` | How to label: the 5 drivers, context tags, POSITIVE, ESCALATE, concern level (dossier F5) | Labellers |
| `answer-key.md` | The "right answers" for the Test 3 timing exercise | Test 3 |

Suggested `eval-set.csv` columns: `id, language, touchpoint, reply_text, label_a_drivers, label_b_drivers, gold_drivers, gold_concern_level, gold_escalate, notes`

## Tasks (our plan, not an organiser rule)

- [ ] Write `labelling-guide.md` from dossier F5
- [ ] Write ~200 synthetic replies (mix of easy, ambiguous, Manglish slang, and at least 40 escalation cases)
- [ ] Two people label independently (columns `label_a`, `label_b`)
- [ ] Agree gold labels where they differ
- [ ] Write the synthetic cohort for the demo seed as files (the coding agents write them; no model call makes seed or test data, spec 05 module 12; Teammate B checks it reads naturally)
- [ ] Write the Test 3 answer key
- [ ] Final check: nothing here is real data

## Definition of done

Eval set and cohort are complete, gold-labelled, and confirmed fictional.
