# Sapa — Rubric review 2 (adversarial, judge's view)

*15 Oct 2026. A second review by an AI reviewer that acts as a skeptical industry judge. It checks the current specs (05 implementation spec, 06 dashboard PRD) against the official guide and rubric (07, guide PDF) and the workshop transcripts. It also checks which findings in [08](08-rubric-review.md) are fixed. Not yet acted on. The team decides which findings to accept.*

**Fixed constraints from the team.** This review does not recommend against these:
- Build time, team size and effort do not matter. AI agents build everything. This review does not cut scope for time.
- The Q&A bot stays. The HR dashboard stays.
- Demo logistics (stage, wifi, rehearsal, delivery) are out of scope. This review judges the product and its design.
- The model route (Gemini via OmniRoute, DeepSeek fallback) is decided. This review flags it only where it costs rubric points.

**File name note.** This file was first saved as 09 and renamed to 10, because `09-cohort-size-estimate.md` already used 09.

## 1. Predicted score

Scores are out of 10. The total is the weighted sum, out of 100.

| Criterion (weight) | 08 said | Now | Reason, one line | After top 8 fixes |
|---|---|---|---|---|
| Problem (15%) | 7 | **7** | Strong desk research, but still zero primary evidence, and the 05 problem statement has no number in it. | 8.5 |
| AI Solution (20%) | 6 | **7** | Testable rules R1–R38, good eval design and Q&A guards. But three AI steps have no metric, and the "HR checks every label" claim is false in 05. | 8.5 |
| Innovation (20%) | 5.5 | **6.5** | The resolution notice, recheck and handbook-gap signal are original. But the core is the guide's own example list, and the new parts are not in the demo path. | 7.5 |
| Business (15%) | 6 | **6** | ROI still rests on unsourced 25% and a generous 0.5× cost. The product cannot measure retention, because no field records who left. | 7.5 |
| ESG (10%) | 7.5 | **7.5** | Above hackathon level. Still shows HR who declined or stopped. Q&A groups have no minimum size. Escalation precision is not measured. | 9 |
| Pitch, Demo, Teamwork (20%) | 5.5 | **6.5** | The 90-second loop is clear and ends on a strong moment. The product is large (38 rules, 4 AI calls plus Q&A), so it is hard for every member to explain. Docs disagree on the demo. | 7.5 |
| **Weighted total** | ~62 | **~67** | | **~80** |

Arithmetic now: 1.05 + 1.40 + 1.30 + 0.90 + 0.75 + 1.30 = 6.70.
Arithmetic after: 1.275 + 1.70 + 1.50 + 1.125 + 0.90 + 1.50 = 8.00.

The Pitch score holds delivery and teamwork as neutral (out of scope). It moves only for causes that come from the product design.

## 2. Requirement compliance (guide pages)

| Requirement | Status | Evidence or gap |
|---|---|---|
| ONE challenge (p.1) | Met | 05 title; deliverables/01 |
| ONE pain point, ONE user (p.2) | At risk | Q&A adds a second pain point (new hires lack answers). Frame Q&A as a second *signal source* for the same pain point (fix F7). |
| Show exactly where AI adds value (p.2 step 5; p.8 "only where it creates measurable value") | **Partly met** | Classifier and Q&A have metrics. Narrative (step B), draft (step C) and probe choice have none (05 Testing Decisions). |
| Decisions reviewable by people (p.2, p.8 Q6, p.9) | Met in 05 | R11, R28, tag override, action states. But 01 and the dossier overclaim (see F5). |
| Test whether it improves the process (p.2 step 7; p.8 Q7) | Planned | 05 eval method is good. Tests 3–5 (deliverables/09) are "Not started". No user has seen the product. |
| Minimum output: feedback → themes → review → action (p.6) | Met in design | 05 demo beats 1–5 |
| Track a clear HR or manager action (p.6 step 5) | Met | Action state machine, R26 recheck, R28 notice |
| No secret monitoring; voluntary, transparent (p.6) | Met, with one leak | R16, consent flow, R36. Leak: story 36 and 06 Flow F show HR each person's declined or stopped status. |
| Safe sample data (p.11) | Met | 05 Out of Scope; module 12 |
| Slides and working demo (p.10) | Planned | deliverables/10, 11 |

## 3. Status of the findings in 08

| 08 finding | Status now | Note |
|---|---|---|
| F1 Scope cannot be built in time | **No longer applies** | Team constraint. A residual cost stays: the product is hard to explain in 8–10 minutes (see F7). |
| F2 Q&A breaks the responsible-AI contract | **Mostly fixed** | Fixed: R11 and 06 commitment 6 now name the Q&A exception. R31 strips markdown before the quote check. The fallback text now says "logged for HR without your name", not "I sent this to HR". R32 never escalates resignation or pay questions. R32 defines "pay problem" versus "how pay works". R30 routes `kind = feedback` to classify. **Still open:** (a) the quote check proves the quote exists, not that the answer follows from it; (b) question groups have no minimum size, so "1 asked: how much notice do I give?" is visible to HR; (c) two privacy models (anonymous questions, confidential check-ins) with two thresholds (3 and 5). |
| F3 Live dependencies on the demo path | **Partly fixed, partly out of scope** | Named tunnel, status lights and DeepSeek fallback are in 05. Deliverables still say "Funnel" and "direct Gemini" (see section 6). The production data path still hurts ESG (F8). |
| F4 No primary evidence | **Open** | deliverables/09 now has an interview guide. No interview is done. Dossier C still says "What to add before the pitch". |
| F5 Causal story is a survey with extra steps | **Partly fixed** | 05 does not claim retention. But 05 has no impact-metric section and no field for who left, so retention can never be shown (F3). |
| F6 Some AI is for show | **Open** | Narrative, R18 and AI draft are unchanged and unmeasured. |
| F7 Surveillance optics | **Open** | Story 36 and 06 Flow F still show who declined or stopped. Escalation precision and hyperbole cases are still not in the eval. |
| F8 "4 of 6" window | **Fixed** | Default is everyone in their first six months. October view reads "4 of 5 needed". Seed numbers add up (24 + 6 = 30; 15 + 3 = 18). |
| F9 ROI does not survive an HR judge | **Open** | Dossier H unchanged. 05 Further Notes says "lead ROI with break-even" but gives no numbers. |
| F10 PDPA and legal | **Partly fixed** | s.81B handled (05 story 32, Further Notes 2). DeepSeek-in-China noted. Still open: consent text does not cover health (sensitive) data; the home server is a data processor on the production path. |
| F11 Teamwork | **Out of scope** | Delivery. Note only: a product with 38 rules makes "every member can explain it" harder. |
| F12 Document drift | **Mostly open** | Some new drift added. See section 6. |

## 4. Gaps ranked by points at stake

Points are on the 100-point total.

### F1. No primary evidence of the problem (about 3.0 points: Problem +1.5, Business +0.5, Pitch Q&A +0.25)

**What a judge says.** "Where did you get 25%? Did you talk to one HR person? Our judges are from industry. CKM places people every week. Why not ask them?"

**Where.** 05 Problem Statement (no number, no source, no quote). Dossier C ("What to add before the pitch"). Dossier M ("replace with interview data"). deliverables/09 (all tests "Not started").

**Fix.**
- Add a short "Evidence" section to 05 under Problem Statement. Put three sourced numbers in it: Aon 18.2% Malaysian attrition (2025); Employment Hero via Malay Mail, about 2 in 10 new hires at 200–500-staff companies leave within six months (already in `09-cohort-size-estimate.md`, so promote it); Enboarder top 90-day exit reasons.
- Add a slot for 3–5 practitioner quotes and their real early-leaver numbers. This needs people, not agents. If no interview happens, say "desk research only" on slide 3.
- Ask each interviewee one pilot question: "Would you run one intake for 90 days?" One yes is worth more than every global statistic.

### F2. The person who speaks up gets no individual help (about 2.0 points: AI Solution +0.5, Business +0.5, ESG +0.25)

**What a judge says.** "Mei Ling says she is lost. She chose HR only, which is your default. What does HR do for *her*? Your rules say HR can only make a team-wide fix."

**Where.** 05 R10 (an action from a non-consenting author must have team or intake scope and name no person). 05 stories 43–47 (the flag queue ends at "mark as reviewed"). 06 Flow B ("A fix aimed at that one person is only possible if they agreed to share").

HR already reads her words under "HR only". Contact from HR does not expose her to the manager. But no flow lets HR reach her. So for the default consent, the individual path ends in a queue.

**Fix.** Add a rule and a story to 05, and a branch to 06 Flow B:
- **R39 HR offer.** On a reply flagged `needs_follow_up`, HR may send one fixed, HR-approved offer: "HR would like to help with what you raised. Would you like a short private chat? [Yes] [No thanks]". "Yes" shows HR a contact task. "No thanks" closes it. It is never sent to someone who stopped or deleted, and never more than once per check-in. The manager never sees it.
- This gives two paths that a judge can follow: a team fix for the pattern, and an offer of help for the person.

### F3. The product cannot show its own business outcome (about 2.0 points: Business +1.0, Problem +0.25)

**What a judge says.** "You sell retention. How would a customer know Sapa worked? Your RM225,000 uses 0.5× salary for a RM2,500 operator. That is generous."

**Where.** 05 data model (`people` has stopped and deleted times, but no "left the company" date). 05 has no impact-metrics section. 06 §8 mentions "impact numbers" with no data behind them. Dossier H1 (25% assumed; 0.5× salary). deliverables/10 slide 10 ("RM225k problem").

**Fix.**
- Add `people.left_company_on` (HR enters it; HR-only; never shown per person; used only in intake-level counts of 5 or more).
- Add an "Impact" view to 05 and 06 with four intake-level numbers: response rate; median days from reply to action done; share of rechecks that say "clearer"; six-month retention of each intake against the company's own baseline (HR enters the baseline once).
- Rewrite the ROI. Use the CAP review median of about 21% of salary for non-executive roles (about RM6,000 per early leaver at RM2,500 a month). Use the Malaysian "2 in 10 leave within six months" figure in place of 25%. Lead with break-even: about one prevented exit a year pays for 60 hires at RM90. State that a prevented exit cannot be proven per person; the pilot measures retention by intake.
- Align the hiring rate: 05 and dossier H say 60 a year; `09-cohort-size-estimate.md` says 50–55. Pick one.

### F4. Three AI steps have no metric (about 1.75 points: AI Solution +0.75, ESG +0.25)

**What a judge says.** "The guide says use AI only where it creates measurable value. What does the narrative add over the counts? How good are the drafts? How many false crisis alarms does Manglish slang cause?"

**Where.** 05 Testing Decisions, "Evaluation method". It measures classify (κ, recall) and Q&A only. 05 "Narrative and draft (AI steps B and C)". 05 classifier `probe_id`.

**Fix.** Add these lines to the 05 eval method:
- **Narrative.** Pass rate of the R18 number check on first try. Human-rated faithfulness (each sentence is supported by the input counts), on 20 runs.
- **Draft action.** In Test 4, record how much HR edits the draft (unchanged, light edit, rewrite). Target: 70% unchanged or light edit (matches dossier F11).
- **Probe choice.** Agreement of `probe_id` with a human choice on the labelled set.
- **Q&A faithfulness.** On the 15 answerable questions, a human checks that the answer says what the quote says. The quote check alone cannot catch a wrong overtime rate next to a real quote.
- **Escalation precision.** Report false alarms as well as recall. Add 10–15 Manglish hyperbole cases ("OT everyday, mati la") to the test split.

If a step cannot show value on these numbers, demote it to a template. That is the guide's own rule.

### F5. Demo and docs do not show what is new (about 1.5 points: Innovation +0.5, Pitch +0.25)

**What a judge says.** "The guide lists 'new-employee check-in assistant' as an example. What is new here?"

**Where.** Guide p.6 lists all four Sapa parts as example builds. 05 "Updated 90-second demo" has no Q&A moment. 06 Flow H cites "architecture doc, section 7.1", which has no resolution notice. docs/README says the same.

The new parts are: (1) the "Update from HR" notice and recheck that close the loop for the employee; (2) consent-gated action scope that the app enforces; (3) Manglish evidence quotes; (4) questions new hires ask, used as a signal of onboarding gaps. Only (1) and (3) are on stage.

**Fix.**
- In 05 demo beat 2, show the Overview "top questions" tile next to the theme card: "Where can I park my motorbike? 3 asked, not in the handbook". It costs no extra beat.
- In beat 3, say the R10 check out loud: HR picks "Raj's team", not Mei Ling, because she chose HR only, and the app blocks the other choice.
- Make 05 the only demo source. Change 06 Flow H and docs/README to cite 05, or update 02 §7.1.
- Define the "8 of 19" base exactly in 05 story 53 and in the seed. Today it is unclear if "who answered" means Day 14 only or any check-in in the window. The May hires are past Day 90, so a judge can ask.

### F6. The human-review claims contradict 05 (about 1.0 point: AI Solution +0.25, Pitch Q&A +0.25)

**What a judge says.** "Your slide says HR checks every label. Your spec counts AI-confident labels that nobody reviewed. Which is true?"

**Where.**
- 01 §1 "HR checks every label". 01 §1 item 2 and §3 Q5: the AI "counts" themes.
- Dossier D6 and I: "HR reviews every flag … every tag".
- deliverables/06: "Nothing is sent to an employee or manager without a human click."
- Against: 05 story 58 (confident tags count without review), 05 Solution ("It never counts"), 05 R31 (Q&A answers go out with no click), 06 §7 ("Review serves decisions, not inbox zero").

**Fix.** Use one sentence in every doc: "SQL counts. The AI suggests labels. Labels that the AI is unsure about wait for HR. HR reviews the evidence before any action. Handbook answers are the only AI words that reach a new hire, and they quote a page HR published." In 06, show on each theme card how many labels HR reviewed ("8 of 19: 5 reviewed, 3 AI-confident").

### F7. Visibility of individuals (about 1.0 point: ESG +0.75)

**What a judge says** (from the workshop 3 trainer's test): "Does it label quiet people as a problem? Can an employee challenge it?"

**Where.**
- 05 story 36 and 06 Flow F: HR sees who declined and who stopped.
- 05 `checkin_schedule`: per-person sent, answered, reminded and skipped times. deliverables/05 says "no response-time tracking, no activity data".
- 05 R34: HR sees every question group with its asker count. Groups of 1–2 are not hidden. Questions in R32 important topics (resignation, health) are grouped too.
- No command lets a new hire see the AI summary and tags that HR sees about their own reply.

**Fix.**
- Story 36 and Flow F: show HR only "invite used / not used" per person. Show declined, stopped and skipped as intake counts of 5 or more.
- R34: HR sees a group's text only at 3 or more distinct askers. Important-topic questions are counted by topic only, never grouped by text.
- Add `/myanswers` (`/jawapansaya`): the bot shows the person their stored replies with the AI summary and tags, and lets them flag "this is wrong" to HR. This answers "can an employee challenge it?" and supports the PDPA access right.
- Pick one threshold story for the pitch: "5 for themes, 3 for questions, and why."

### F8. The pilot data path is not stated (about 0.75 point: ESG +0.5, Business +0.25)

**What a judge says.** "In a real company, where does an employee's text go?" Today's answer: a student's home server, then Google, with a fallback in China.

**Where.** 05 Architecture (OmniRoute on a home server; DeepSeek fallback). 05 Further Notes ("DeepSeek data location"). 05 Out of Scope ("formal PDPA DPIA … next steps"). 05 story 4 (consent text content).

The team decided the competition route. This is not a request to change it. The gap is that 05 does not say what a pilot uses.

**Fix.**
- Add one "Pilot data path" paragraph to 05: Gemini on Vertex AI in a Singapore or Malaysia region under a no-training contract; no home server; no DeepSeek; a DPA with the employer as controller and Sapa as processor.
- Add one line to the consent text spec (story 4): the bot may receive health or safety information; it is shared only with HR; it is processed by a named AI provider outside Malaysia. PDPA treats health data as sensitive.

### Other gaps (smaller)

- **PRisMA link as a product output (Business, ESG, Innovation; about 0.5 point).** Dossier I maps the drivers to DOSH psychosocial risk factors. Workshop 2 said organisation-level pulse tools for psychosocial safety are rare. Add an intake-level export: "psychosocial hazard themes, k ≥ 5, for your PRisMA risk assessment". Keep the dossier's caveat: Sapa is not a PRisMA assessment.
- **Telegram versus WhatsApp (Business feasibility).** An industry judge will ask. 05 Further Notes Q3 is still open. Answer it in the interviews (F1).
- **Agency channel.** CKM, the co-host, is a recruitment agency. Dossier H3 names the agency plan, but 05 has no agency role. One line on the controller question would help: the employer owns the data; the agency sees only intake-level themes with the employer's consent.

## 5. Does it solve the problem: new-hire retention within six months?

**The causal chain in the specs.**

1. A new hire joins voluntarily and answers honestly.
2. The AI labels the reply with evidence. SQL counts it into a theme.
3. HR sees a shared problem early (Day 14, not month 5).
4. HR assigns a fix. The manager does it.
5. The fix removes the cause for this hire and the next intake.
6. The new hire sees the change ("Update from HR") and trusts the channel more.
7. Fewer new hires leave within six months.

**Evidence per link.**

| Link | Evidence in the specs | Strength |
|---|---|---|
| 1 Participation and honesty | Dossier L2 (chatbot surveys get 39% more information); HR-only default; Test 5 is role-play by friends | **Weak.** No real new hire, and no one on probation, has used it. |
| 2 Correct labels | κ eval per language, evidence check R15 | Good once run |
| 3 Early signal | Schedule Day 3–Month 6; k ≥ 5 over six months | Good for patterns |
| 4 Action done | Action states, overdue flags, Telegram buttons | Good |
| 5 Fix removes the cause | Action library (dossier F6) from general research | Medium. Generic fixes. |
| 6 Trust grows | Notice and recheck (R26, R28) | Good. This is the strongest part. |
| 7 Retention | Nothing in 05. No leaver field. | **Missing measurement** (F3) |

**The weakest link is between 3 and 5, for the individual.** The design finds *patterns* well. It does not help the *person* who spoke. With the HR-only default, R10 allows only team or intake fixes. The theme needs 5 or more answers in a six-month pool. So a hire who says "I am lost" at Day 14 gets, at best, a team-wide fix some weeks later. The theme mostly helps the *next* intake. A judge who thinks about retention will ask: "Did Mei Ling stay?" Fix F2 (HR offer of a private chat) closes this link without breaking any privacy rule.

The second-weakest link is 1. The whole chain depends on honest answers from people on probation. Nothing tests that with real new hires. Test 5 should at least use people who started a job in the last year, and ask them if they would tell an employer's bot the truth.

## 6. Contradictions a judge or teammate could see

| # | Topic | Says one thing | Says another |
|---|---|---|---|
| C1 | Does the AI count? | 01 §1 item 2, §3 Q5: AI "counts" themes | 05 Solution: "It never counts"; R18 |
| C2 | Does HR check every label? | 01 §1; dossier D6, I | 05 story 58; 06 §7 "not inbox zero" |
| C3 | Manager edits and approves | 02 §1, §4.3, §5.2, §7.1; deliverables/04 step 5, /06, /11 beat 4 | 05 action states: accept and done, no edit |
| C4 | AI-written follow-up questions | 02 §4.1, §5.2; deliverables/03 phase 3 | 05 R11: fixed probe bank only |
| C5 | Fallback model | 02 §5.1, §8; deliverables/03 phase 1: direct Gemini | 05: DeepSeek V4.1 Flash |
| C6 | Tunnel | 02 §3, §5.1, §7.2; deliverables/03, /11 checklist: Tailscale Funnel | 05: Cloudflare named tunnel |
| C7 | Langfuse | 02 §2, §3, §5.4; deliverables/03 (`links.md`, phase 3); app/README | 05: "No Langfuse in the competition build" |
| C8 | Which demo script | docs/README, 06 Flow H, deliverables/11 cite 02 §7.1 (no resolution notice; manager "approves") | 05 "Updated 90-second demo" (notice is the climax) |
| C9 | Demo seed | deliverables/11: "October intake, 6 synthetic hires at Day 13, 5 already replied" | 05 Demo setup: 30 hires in six intakes; 5 synthetic in October, 3 answered; live hire at Day 13 |
| C10 | Seed made by a model | deliverables/07: "Abraham can script this with Gemini" | 05 module 12: "no model call is used to make seed or test data" |
| C11 | Rule range | 06 header: "R1–R29" | 05: R1–R38; 06 body cites R31 and R34 |
| C12 | Names | 01 §1: new hire "Aisyah" | 06 §5: HR executive "Aishah"; new hire "Mei Ling" |
| C13 | Activity data | deliverables/05: "no response-time tracking, no activity data" | 05 `checkin_schedule` per-person times; story 36; 06 Flow F |
| C14 | Human click on every message | deliverables/06 task list | 05 R11, R31 (Q&A answers); 06 commitment 6 |
| C15 | Manager web view | 02 §4.3: managers see only the Actions board | 05 story 84: weekly snapshots |
| C16 | What Sapa is | 01 ("Start here") never mentions Q&A, the resolution notice or the recheck | 05 Solution, 06 §3 |
| C17 | Official site | 01 §4: aifm.asia "could not be opened" | 07: it opens |
| C18 | Hires per year | 05 Demo setup, dossier H1: about 60 | 09-cohort-size-estimate: 50–55 |
| C19 | Escalation target | deliverables/09: escalation recall 100% | 05: "k of n" with a 95% interval |
| C20 | Thinking level (inside 05) | 05 Architecture: Gemini at the lowest thinking setting | 05 Classifier: "low for classify; medium for narrative and draft" |
| C21 | Notice timing (inside 05) | 05 R28: next working-hours slot | 05 demo beat 5: "at once". R19 waives working hours in demo mode for touchpoints only. Extend it to R28. |
| C22 | File number | docs/09-cohort-size-estimate.md | this file, docs/09-rubric-review-2.md |

**Fix for all of section 6.** Mark 02 as superseded in its header, or update §1, §4–§5 and §7. Rewrite 01 §1 from the 05 Solution section. Sweep deliverables/03, 04, 05, 06, 07, 09 and 11 against 05. Each sweep is a text edit only.

## 7. Top 8 fixes

| # | Fix | Where | Points |
|---|---|---|---|
| 1 | Add an Evidence section with Malaysian numbers and 3–5 practitioner quotes and pilot intent | 05 Problem Statement; dossier C; deliverables/09 | ~3.0 |
| 2 | Add R39: a fixed, HR-approved "private chat" offer for flagged replies under HR-only consent | 05 Rules, stories 43–47; 06 Flow B | ~2.0 |
| 3 | Add a leaver-date field, an intake-level Impact view and a rewritten ROI (21% cost, break-even, Malaysian 2-in-10) | 05 Data model; 06 §7–8; dossier H1 | ~2.0 |
| 4 | Measure narrative, draft, probe choice, Q&A faithfulness and escalation precision (with hyperbole cases) | 05 Evaluation method | ~1.75 |
| 5 | Put the question-gap tile and the R10 consent block in the demo; make 05 the single demo source; define the "8 of 19" base | 05 demo, story 53; 06 Flow H; docs/README | ~1.5 |
| 6 | One true sentence about human review and counting, used in every doc; reviewed vs AI-confident split on theme cards | 01 §1, §3; dossier D, I; deliverables/06; 06 commitment 3 | ~1.0 |
| 7 | Remove per-person declined/stopped view; minimum size for question groups; add `/myanswers` | 05 story 36, R34, R36; 06 Flow F, Flow I | ~1.0 |
| 8 | State the pilot data path (Vertex region, no home server, no DeepSeek) and add health data to the consent text | 05 Architecture or Further Notes; story 4 | ~0.75 |
| | **Total** | | **~13 (67 → 80)** |

Also do the section 6 sweep. It does not add points by itself, but every contradiction a judge finds costs credibility in Q&A.
