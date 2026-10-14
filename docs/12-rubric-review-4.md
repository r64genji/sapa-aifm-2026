# Sapa — Rubric review 4 (product only, skeptical judge)

*15 Oct 2026. A fourth review by an AI reviewer that acts as a hard industry judge. It checks the product design in 05 (R1–R51), 06, 01, 02, 03 and the deliverable READMEs against the official rubric (07, guide) and the workshop transcripts. It also checks how well the review-3 fixes G1–G23 were applied (G19 was rejected by the team and is not raised again). Not yet acted on. The team decides which findings to accept.*

## 0. Scope and rules of this review

- **Product only.** Everything that is not the product gets full marks: primary research, HR interviews, statistics, market sizing, delivery, slides, teamwork, demo logistics and rehearsal.
- **What it judges.** What the product does. How well it keeps new hires past six months. The AI design. Human review. Privacy and responsible AI. The HR dashboard and the bot. The business model built into the product. Innovation. Whether the specified demo shows the product well. Contradictions between product docs.
- **Fixed constraints.** Build time does not matter. The Q&A bot and the HR dashboard stay. The model route (Gemini through OmniRoute, DeepSeek fallback) stays. This review makes no pilot-data-path, region, provider or provider-disclosure recommendation.
- **10 out of 10** means a top judge can find nothing more to ask of the product.

## 1. Scores

Scores are out of 10. "Points" are on the 100-point total.

| Criterion (weight) | Now | Main reason, one line | After all fixes |
|---|---|---|---|
| Problem (15%) | **9.7** | Targets the guide's root causes, managers and migrant hires. The top exit reason (job does not match what was promised) is set at hiring, but Sapa never sends it back to hiring. | 9.9 |
| AI Solution (20%) | **8.7** | The review-3 fixes are sound. But HR cannot read 6 of the 8 languages it must review, the quality watch measures a biased sample, and the recheck has no baseline for 3 of 5 drivers. | 9.5 |
| Innovation (20%) | **8.6** | R43 (fixes learn what works here) and the exit check are real advances. But R43 ranks fixes by a raw rise that teams picked for a fix get anyway. Core is still the guide's example build. | 8.9 |
| Business (15%) | **8.8** | Impact is now honest. But the free pilot (one intake, up to 10 hires) is too small to show any of the product's own outcome numbers. The agency view has no data behind it. Managers must still use Telegram. | 9.6 |
| ESG (10%) | **8.8** | Strong privacy design. New risks from the new scope: migrant-language replies and forced-labour reports that nobody can read or test, and a forced-labour channel that only reaches the employer. | 9.8 |
| Pitch, Demo, Teamwork (20%) | **8.9** | The script now shows review, help for the person, the pattern, the loop and the outcome. But beat 3 has too many steps for 25 s, and the beat-5 clock jump sends milestone nudges to Raj's phone on stage. | 9.6 |
| **Weighted total** | **≈ 89.0** | | **≈ 95.1** |

Arithmetic now: 14.55 + 17.4 + 17.2 + 13.2 + 8.8 + 17.8 = 88.95.
Arithmetic after: 14.85 + 19.0 + 17.8 + 14.4 + 9.8 + 19.2 = 95.05.

Review 3 predicted 95 after its fixes. The total is 89, not 95, because some fixes were applied in a way that opened new gaps. The biggest is G3 (eight language packs). The product now promises things to migrant workers that HR cannot check.

## 2. Check of the review-3 fixes

| Fix | Applied well? | New problem it created | See |
|---|---|---|---|
| G1 neutral recheck | Yes. R26 is neutral, linked to the action and compared with people outside the scope. | The question bank (dossier F4) has a 1–5 item only for ROLE_CLARITY and WORKLOAD. MANAGER_SUPPORT, BELONGING and ONBOARDING_TRAINING have yes/no items, so they have no "before" score. | H2 |
| G2 R43 fix evidence | Yes, and it is the best new innovation point. | It ranks fixes by the raw rise in scope. Teams that get a fix were picked for low scores, so they rise anyway (regression to the mean). R26 has the outside-scope number, but R43 does not use it. | H2 |
| G3 language packs, forced labour, export | Partly. The rules exist. | HR cannot read Nepali, Bengali, Burmese, Tamil or Mandarin evidence. No eval covers those languages. Notes and handbook pages must exist per language, which a two-person HR team cannot write. Six packs have no checker yet, but 05 Solution says all eight are live. | H1 |
| G4 R10 alert waits for snapshot | Yes. Clean rule, with a demo label. | None. | — |
| G5 R39 open to HR, shown in demo | Yes in the rules. | It made demo beat 3 too dense. | H4 |
| G6 R42 retention over everyone hired | Yes. Immune to DELETE, pooled, honest. | The agency view (R48) promises Impact figures per agency, but HR enters numbers per intake only. | H9 |
| G7 confirm before count moves | Yes. | The hold-new-tags setting is on only in demo mode, and the stage does not say so. | H7 |
| G8 R44 AI quality watch | Partly. | HR mostly reviews the tags the AI was unsure about. A change rate on those says little about the AI-confident tags that count without review. | H7 |
| G9 R45 manager milestones | Yes. Good prevention for quiet hires. | The beat-5 clock jump sends Day 30 nudges about synthetic hires to Raj's real phone. Nudges also continue after a hire leaves. | H5, K12 |
| G10 WhatsApp | For new hires, yes. | Managers stay on Telegram only. Module 10 says managers can bind WhatsApp; the data model says they cannot. | H12, K7 |
| G11 baselines and pass marks | Yes in 05 and deliverables 07, 09. | Dossier G still says 8–10 escalation cases. | K9 |
| G12 one review sentence | Yes, then broken again. | R50 sends the AI transcript of a voice note back to the new hire. The sentence still says only two kinds of AI words reach a new hire. | H11 |
| G13 agency role | Partly. | Its Impact figures have no source. With about 5 hires a month, an agency rarely has 5 placements in one intake, so its view is almost always empty. | H9 |
| G14 exit question | Yes. | HR's "left" flag does not say if the person resigned or was dismissed. A dismissed person gets "why did you leave?", and the leaver reasons mix both. | H14 |
| G15 pilot through Month 6 | Partly. | The pilot is one intake of up to 10 hires. R42 shows retention only from 30 people. R26 needs 5 in scope and 5 outside. The Month-7 report would say "Too few to tell yet". | H6 |
| G16 stop messages on "left" | Yes. | Manager nudges about that person are not stopped. | K12 |
| G17 demo ends on outcome | Yes. | The retention line is 84% against 80%, about one person, with "not proof". It is honest but weak as the last thing judges see. | H13 |
| G18 one generic block reason | Yes. | 06 Flow C still lists the old block reasons. | K14 |
| G20 `/myanswers` details | Yes. | None. | — |
| G21 voice notes | Yes, with a loud no-emotion rule. | R17 says text is masked before it leaves the app; audio cannot be masked. Voice accuracy is tested only in BM, English and Manglish. | H14 |
| G22 C1–C10 | Mostly. C1, C2, C4–C9 are fixed. | C3 is open again (H11). C10 is still open in the dossier. | K6, K9 |
| G23 no ranking | Yes (R51). | None. | — |

**Complexity.** The fixes added R43–R51, 14 modules and 159 stories. Most of the new parts are sound. The cost is clarity. The guide says "Build the smallest useful solution" and "judges should immediately understand what goes in, what AI does, what comes out". The pitching trainer said "narrow down and focus in one thing". 05 Solution now lists every part in one block. A judge who reads it, or asks "what is Sapa?", meets eight languages, two channels, voice, an agency role and an ESG export before the core loop is clear. See H10.

## 3. Gaps ranked by points

Each gap gives: points, what a judge says, where, and the fix.

### H1. Six language packs cannot be reviewed, tested or answered in (1.1 points: AI +0.5, ESG +0.5, Business +0.1)

**Judge.** "A Nepali worker writes that the agent holds her passport. Your HR officer reads Malay and English. Who reads her words? You say HR reviews the evidence. In Nepali, HR cannot. And your eval tests forced labour only in BM and English. The people who suffer it mostly write in other languages."

**Where.** 05 Solution ("in their own language (... eight languages, R46)"), R46, R28 (a note in each language in scope), R31 and R46 (no page in that language means "I don't know yet"), classifier `summary` and `evidence_quote` (reply language only), eval method ("each other pack with a test set"), Further Notes "Language packs" (checker names empty), story 102.

**Fix.**
- Classifier: for a reply that is not in BM or English, add `summary_hr` and `evidence_translation_hr` in HR's language. HR sees the original words and, beside them, the translation under the label "AI translation". This fits 06 commitment 7.
- R46 adds an AI gate per pack: a pack's tags count without HR review only after that pack has its own eval test set (at least 30 replies and 20 escalation cases, forced-labour cases among them) and passes the same marks as BM and English. Until then, every tag in that language goes to "needs review", and the R44 panel shows "Not evaluated".
- R28: each pack carries one checked fixed notice: "Update from HR: your team made a change after new hires' feedback. Ask HR if you want to know more." The bot uses it when HR has no checked note in that language. Action library entries can carry checker-approved notes per pack.
- R31: when no page exists in the person's language, the bot sends the BM or English answer under R31 as it is, with one fixed pack text: "This answer is in [English]. Ask HR if it is not clear." No new AI words reach the employee.
- Honest status: 05 Solution and the pitch say "Bahasa Malaysia and English are live. Six more packs are built and wait for their named checkers." Change it only when the checker slots are filled.

### H2. The recheck has no baseline for three drivers, and fix evidence counts a rise that would happen anyway (0.8 point: AI +0.3, Innovation +0.3, Business +0.2)

**Judge.** "Your belonging question is yes or no. So what is the 1–5 'before' score for a belonging fix? And you picked Raj's team because its scores were low. Low scores go up on their own. Your library says a fix 'worked' when it may have done nothing."

**Where.** Dossier F4 (1–5 items only for ROLE_CLARITY and WORKLOAD) against 05 R26 ("The bank holds one such item for each driver"). 05 R43 and story 135 (raw rise only). 06 Flow J.

**Fix.**
- F4: give each driver one 1–5 item. Replace the yes/no MANAGER_SUPPORT, BELONGING and ONBOARDING_TRAINING items with 1–5 versions, for example "How much useful help did you get from your supervisor this week? (1–5)". Ask each at the touchpoints where F4 already asks that driver, so check-ins do not get longer.
- R26 card: lead with the difference: "Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks". Add the fixed line "Teams picked for a fix often improve anyway. This compares them with other teams."
- R43: store and rank by the difference, not the raw rise. "Used 3 times here. Role clarity rose 1.0 more than in other teams (14 people)." If the outside group has fewer than 5, show "Not enough comparison yet".

### H3. Sapa never sends "the job is not what I was told" back to hiring (0.6 point: Problem +0.3, Innovation +0.2, Business +0.1)

**Judge** (CKM, recruitment): "Your own top statistic says 30% leave because the job did not match what they were told. That is set in the job ad and the interview, not by the supervisor. Does Sapa tell my recruiters which roles we oversell?"

**Where.** 05 Evidence (Enboarder 30.3%), dossier F4 item "does the job match what was described", F5 ROLE_CLARITY, F6 action library, `people` table (no role or job title).

**Fix.**
- Add `role` (job title) to `people`.
- Add a "Job matches what you were told" card per role, over the six-month group, at 5 or more people: "Production operator: 6 of 11 said 'not really' at Day 14".
- Add a library entry for that card: "Update the job ad and the interview script for this role", owned by HR or the recruiter, not a line manager.
- The agency view (R48) shows this card for its placements. This is the number an agency most wants.

### H4. Demo beat 3 has too many steps for 25 seconds (0.5 point: Pitch +0.5)

**Judge.** "I lost track. Somebody set a flag, a phone buzzed, a draft appeared, something was blocked, a label said Monday. What did HR actually decide?"

**Where.** 05 "Updated 2-minute demo" beat 3 (about 12 visible steps), 06 Flow H.

**Fix.**
- Move "needs follow-up" and "Offer a private chat" into beat 2. HR is already on Mei Ling's reply there, and 06 Flow B says this is one view. Beat 2: Confirm label → Mark follow-up → Offer. 30 s.
- Beat 3 is the pattern only: Draft action on the Role clarity card, the fix-evidence line, "Mei Ling only" blocked, pick "Raj's team", Assign. Cut "edits one line". The note comes pre-filled from the library entry. The teammate taps Yes on the offer while HR drafts. 20 s.
- Time each beat in rehearsal against the real clicks, not against the script.

### H5. The beat-5 clock jump sends milestone nudges to Raj's phone on stage (0.3 point: Pitch +0.3)

**Judge.** Nothing, because the judge sees Raj's phone buzz six times with "Agree a 30-60-90 plan" in the middle of your loop.

**Where.** 05 R45 (nudges for every new hire in the team, "whether or not the hire joined"), R23 (only protects messages *to* synthetic people), story 87 ("send to the live phone only"), demo setup (five synthetic October hires in Raj's team), beat 5 (clock moves from Day 14 to the next check-in, Day 30).

**Fix.**
- R23: no message *about* a synthetic person goes to anyone. This covers nudges and alerts.
- Demo mode sends no milestone nudge for the live hire during the script.
- Beat 5: say that the jump goes to the Day 30 check-in, and that the recheck item is its first question. The teammate taps 4; the rest of the check-in is not shown.
- Close the R39 contact task in beat 2 or 3, so it does not show as overdue after the jump.

### H6. The pilot is too small to show the product's own outcome numbers (0.4 point: Business +0.4)

**Judge.** "You offer one intake of up to 10 people. Your Impact view says 'Too few to tell yet' below 30, and your score change needs 5 people in scope and 5 outside. What will my Month-7 report actually show?"

**Where.** Dossier H2 Pilot, K slide 10, L10, deliverables/10 slide 10, 05 Further Notes "Pilot", against R42 (30-person floor) and R26 (5 and 5).

**Fix.**
- Pilot = every new hire in three monthly intakes, each through its own Month 6. Free.
- Set pass marks before the pilot starts, from leading measures the pilot can reach: response rate at least 60%, median days from reply to fix done at most 14, score change against other teams on done fixes, manager milestones done.
- The final report says for retention "Too few to tell yet (n of 30)" and gives the date when the pooled figure will be ready. Change the pilot question to match.

### H7. The AI quality watch measures the wrong sample, and the hold is a demo-only setting (0.4 point: AI +0.4)

**Judge.** "HR mostly corrects the tags the AI was unsure about. Of course more than 20% of those change. That tells you nothing about the confident tags that count without anyone reading them. And in the demo the count waits for HR. In real use, does it?"

**Where.** 05 R44, story 145–147, `quality_holds` (driver and language) against R44 text (per driver), demo setup ("Demo mode turns on the hold-new-tags setting").

**Fix.**
- R44 spot checks: each week the review queue gets a random sample of AI-confident tags per driver and language (at least 3), marked "Spot check". The changed share is computed on spot checks only.
- Calibration: for a new organisation or a new language, AI-confident tags of a driver count without review only after 20 spot checks with at most 10% changed. Until then, new tags wait for HR. This makes the hold a real default, not a stage trick.
- The hold is per driver and language, as the table already says.
- Demo: show the label "New labels wait for HR during calibration" on the card in beat 2.

### H8. The forced-labour channel reaches only the employer (0.4 point: ESG +0.3, AI +0.1)

**Judge** (RBA auditor): "If the employer or its agent holds the passport, the worker's report goes to that employer's HR, and HR sets the contact numbers in the reply. That is not a grievance channel. And your keyword 'wage deductions' fires on every EPF question."

**Where.** 05 R13 (keywords include wage deductions), R14 ("its own contacts that HR sets"), story 143, dossier F10.

**Fix.**
- R14: the forced-labour fixed text always includes one verified external contact (the official labour authority line). HR can add contacts but cannot remove that one. Do the same for sexual harassment with the Tribunal for Anti-Sexual Harassment.
- R13: the keyword list for `forced_labour_indicator` holds only clear phrases (passport held by the employer or agent, debt to the agent, not allowed to leave the hostel). Wage deductions alone go to the model, not the keyword path.
- Eval: the false-alarm set adds normal deductions (EPF, SOCSO, tax, lateness).

### H9. The agency view has no data behind its Impact figures and is almost always empty (0.3 point: Business +0.2, ESG +0.1)

**Judge** (CKM): "Which retention number do I see? You said HR enters numbers per intake, not per agency. And with five hires a month, I will never have five of mine in one intake."

**Where.** 05 R48, story 154, `intake_outcomes` (no agency field), `agency_grants` (per intake), dossier H2, L12.

**Fix.**
- `intake_outcomes` gets one row per intake and agency. HR enters hired and still-employed for each agency.
- The grant is per agency, for all its placements. The agency view pools all granted intakes: themes and H3's job-match card at 5 or more people, retention at 30 or more, as R42.
- R48 adds: "The agency sees only counts of 5 or more. It never sees personal data."
- If the team prefers fewer parts, cut R48 and give agencies the R47 export for their placements. Either choice recovers these points.

### H10. The core loop is hard to see under the extensions (0.3 point: Pitch +0.2, AI +0.1)

**Judge.** "What is Sapa, in one breath? I heard eight languages, WhatsApp, voice, agencies, ESG exports, exit questions and a quality panel."

**Where.** 05 Solution (one block lists every part), 01 §1, 06 §3.

**Fix.**
- 05 Solution and 01 §1 open with the core loop in four lines: check-in → AI label with evidence → HR reviews and assigns a fix → manager closes it → new hires hear and are rechecked.
- Then four short labelled layers: **Reach** (languages, WhatsApp, voice), **Care** (private-chat offer, serious concerns), **Proof** (score change, fix evidence, Impact, exit check), **Trust** (quality watch, `/myanswers`, export, agency).
- Mark which rules the demo shows. The rest stay ready for Q&A. Remove nothing for this fix.

### H11. The "only AI words" sentence is false again (0.2 point: AI +0.1, Pitch +0.1)

**Judge.** "Your voice-note read-back is AI text sent to a new hire. Your slide says only two kinds of AI words reach her."

**Where.** 05 Solution ("Apart from those checked answers and the own-reply view in R40, it never writes free text to an employee"), 01 §1, 02 principle 3, 06 §3 and commitments 3 and 6, dossier I, deliverables/06 (sentence and the task "Every AI word that reaches a new hire is a handbook answer").

**Fix.** Use one sentence everywhere: "The AI writes to a new hire only three things, each labelled and each about something they asked for: a handbook answer that quotes a page HR published, the transcript of their own voice note, and, with `/myanswers`, the AI's reading of their own replies." Name R50 in 06 commitment 6.

### H12. Managers must use Telegram (0.2 point: Business +0.2)

**Judge.** "You built WhatsApp because operators will not install Telegram. My supervisors are operators who got promoted."

**Where.** 05 stories 78–79, 149, R45, `managers` table (Telegram chat ID only), against module 10 ("Telegram and WhatsApp binding for ... managers").

**Fix.** Managers bind Telegram or WhatsApp. Alerts, Accept and Done buttons, and milestone nudges go through the same channel adapters, as templates outside the 24-hour window. Add the WhatsApp ID to `managers`.

### H13. The demo ends on its weakest number (0.3 point: Pitch +0.2, Innovation +0.1)

**Judge.** "26 of 31 against 4 of 5. That is about one person, and you told me it is not proof. Why end there?"

**Where.** 05 demo beat 6, 06 Flow H beat 6.

**Fix.** Beat 6 shows, in this order: the earlier fix's difference against other teams (H2), then the Impact line "Top reasons leavers gave: role clarity 2 of 5. Sapa found role clarity at Day 14." That shows the early signal matched the real exits. Retention stays on screen as one line with "a trend, not proof", and on slide 10.

### H14. Small privacy edges in voice notes and the exit question (0.1 point: ESG +0.1)

**Where.** 05 R17, R50, R49, R1.

**Fix.**
- R17: say that masking applies to text. Audio cannot be masked, so it goes only to the primary route, is never logged, and is deleted at once (as R50 already says).
- R50: voice is on for a pack only after its transcript accuracy is tested. Today that is BM, English and Manglish.
- R1: HR marks "left" as "resigned" or "ended by the company". R49 asks only people who resigned. Retention (R42) is unchanged.

### H15. Fix the contradictions in section 4 (0.2 point: AI +0.1, Pitch +0.1)

See K1–K17.

## 4. Remaining contradictions

| # | Topic | One doc | The other doc |
|---|---|---|---|
| K1 | Safety keywords | 05 module 5, 02 (lines 162, 202), dossier F8, deliverables/03 phase 3: "BM/English keyword list" | 05 R13, R46: keywords per pack |
| K2 | Recheck items | 05 R26: "one such [1–5] item for each driver" | Dossier F4: 1–5 items only for ROLE_CLARITY and WORKLOAD (H2) |
| K3 | Agency Impact | 05 R48, story 154, dossier L12: Impact figures for the agency's placements | 05 R42, `intake_outcomes`: numbers per intake only (H9) |
| K4 | Pilot size | Dossier H2: one intake, up to 10 hires; 05 Further Notes: one intake | 05 R42: retention only from 30; R26: 5 in scope and 5 outside (H6) |
| K5 | Live phone only | 05 story 87: the clock sends to the live phone only | 05 R45 and R23: nudges about synthetic hires reach Raj's real phone (H5) |
| K6 | AI words to a new hire | 05 Solution, 01, 02, 06 §3 and commitments 3 and 6, dossier I, deliverables/06 | 05 R11, R50: the voice transcript is AI text sent to the new hire. deliverables/06 task line also ignores R40 (H11) |
| K7 | Manager channel | 05 module 10: WhatsApp binding for managers | 05 `managers` table, stories 78–79, R45: Telegram only (H12) |
| K8 | New-hire identity | 05 story 34: "code name … without typing their real name" | 06 Flow F: "a display name" |
| K9 | Eval size | Dossier G Test 1: 50–100 replies, 8–10 escalation cases | 05 eval method, deliverables/07 and /09: at least 40 escalation cases |
| K10 | Escalation categories | Dossier F5 ESCALATE list and F10 protocol: no forced labour | 05 R13, R14, classifier: `forced_labour_indicator` |
| K11 | Seed count | 05 Demo setup: "Thirty synthetic hires" | Same paragraph: the October intake of 6 includes the live hire, so 29 synthetic plus 1 live |
| K12 | Nudges after leaving | 05 R45: nudges go "whether or not the hire joined, answered, stopped or deleted" | 05 R1: "left" cancels everything for the person, but not nudges about them |
| K13 | Quality hold scope | 05 R44: AI-confident tags "for that driver" stop counting | 05 `quality_holds` (driver and language), R44 panel per language (H7) |
| K14 | Closure block | 06 Flow C: blocked if the person "asked not to be contacted, stopped or deleted" | 05 R29, R41: also "left", with one generic reason |
| K15 | Notes per language | 05 R28, story 102: an approved note in every language in scope | HR cannot read 6 of the 8 packs (H1) |
| K16 | Live languages | 05 Solution, story 137, dossier H4: eight packs | 05 R46 and Further Notes: a pack goes live only with a named checker; six checker slots are empty (H1) |
| K17 | Masking | 05 R17: masked "before any text leaves the app" | 05 R50: audio goes to the model unmasked (H14) |

Stale but minor: 02 diagram ("Telegram, BM/English"), deliverables/04 ("BM/English"), deliverables/05 consent "in BM and English". Update them with K1.

## 5. Does the product keep new hires past six months?

The chain is now complete on paper: prevention (R45), early signal (check-ins, Q&A gaps), help for the person (R39), a fix for the pattern (R10, R26–R28), learning (R43) and an honest outcome (R42, R49). The weak links left are these:

1. **Reach without care.** The product now reaches migrant hires, but HR cannot read their words, and the AI is untested in their languages (H1). Reaching someone you cannot hear is worse than an honest "BM and English only".
2. **Proof that a fix helped.** The neutral recheck is right. It still needs a baseline for every driver and a comparison in R43 (H2).
3. **The cause before Day 1.** The top exit reason starts in the job ad and the interview. Sapa sees it at Day 14, but sends it only to the line manager (H3).

## 6. Does the 2-minute demo still land?

Yes, with two changes. The story is right: reply → human check → help for the person → fix for the pattern → manager closes → new hire hears → outcome. Two things break it today:

- **Density.** Beat 3 has about 12 visible steps in 25 seconds. Real clicks will take about 40 seconds. The total will run to about 130 seconds. H4 moves the offer into beat 2, where HR already is.
- **A stage hazard.** The beat-5 clock jump fires Day 30 nudges for six hires to Raj's phone (H5).

Recommended script after H2, H4, H5, H7, H13:

1. **(20 s) Check-in.** "Advance to Day 14". The phone gets the check-in. The teammate answers in Manglish. One fixed probe.
2. **(30 s) One reply, one person.** The reply shows the label, the quote and "New labels wait for HR during calibration". HR clicks "Confirm label". The card goes from 7 of 18 to 8 of 19. HR marks follow-up and clicks "Offer a private chat". The top-questions tile shows the motorbike question.
3. **(20 s) The pattern.** The teammate taps Yes on the phone. HR clicks "Draft action" on the Role clarity card. The draft shows the fix evidence. "Mei Ling only" is blocked. HR picks "Raj's team" and assigns. The screen shows "In real use this alert waits until Monday".
4. **(15 s) Manager.** Raj accepts and marks done in Telegram.
5. **(15 s) Loop closes.** "Update from HR" arrives. The clock jumps to Day 30. The first question is the neutral 1–5 item. The teammate taps 4.
6. **(15 s) Outcome.** The earlier fix: "Role clarity, Raj's team +1.3, other teams +0.1". The Impact view: "Top reasons leavers gave: role clarity" beside "found at Day 14", and retention as one line with "a trend, not proof".

About 115 seconds.

## 7. Can the product reach 100?

**No. With every fix above, the product reaches about 95. The ceiling stays at about 95–96.** The reasons are the same as in review 3:

- **Innovation (about 1.1 short).** Sapa is still a very good version of the guide's own example builds ("new-employee check-in assistant", "manager follow-up dashboard"). R43, H3 and the exit check make it a system that learns. A top judge can still say "this is the suggested build". Only a different core idea removes that, and it would cost points in Problem and AI Solution.
- **AI Solution (about 0.5 short).** Some AI steps may lose to a plain template and become templates. That is honest, but it invites "why AI here?".
- **Business (about 0.4 short).** No product feature can prove that Sapa caused retention. The design can only show a trend against a baseline.
- **Demo (about 0.4 short).** Two minutes cannot show Q&A, `/myanswers`, escalation, languages and the quality watch as well.

## 8. Fix list (ranked)

| # | Fix | Main files | Points |
|---|---|---|---|
| H1 | HR translation beside non-BM/English replies; per-pack AI gate and eval; fixed per-pack notice; BM/English handbook fallback; honest "2 live, 6 waiting" | 05 Solution, R28, R31, R46, classifier, eval; dossier H4 | 1.1 |
| H2 | A 1–5 item per driver; R26 and R43 lead with the difference against other teams | Dossier F4; 05 R26, R43, story 135; 06 Flow J | 0.8 |
| H3 | Role field; "job matches what you were told" card per role; hiring-side fix; agency sees it | 05 data model, themes, library; dossier F6 | 0.6 |
| H4 | Demo: offer moves to beat 2; beat 3 is the pattern only; no line edit | 05 demo; 06 Flow H | 0.5 |
| H6 | Pilot = three intakes through Month 6; pass marks on leading measures; honest retention line | Dossier H2, K, L10; 05 Further Notes; deliverables/10 | 0.4 |
| H7 | R44 random spot checks; calibration hold as the real default; per driver and language | 05 R44, stories 145–147; demo setup | 0.4 |
| H8 | Fixed external contact in forced-labour and harassment texts; narrow forced-labour keywords; deduction false alarms in eval | 05 R13, R14, eval; dossier F10 | 0.4 |
| H5 | No message about a synthetic person; no nudges in the demo; beat 5 is the Day 30 check-in | 05 R23, R45, story 87, beat 5 | 0.3 |
| H9 | Agency numbers per agency, pooled across intakes, aggregates only (or cut R48) | 05 R48, `intake_outcomes`, `agency_grants`; dossier H2, L12 | 0.3 |
| H10 | Core loop first, then four labelled layers | 05 Solution; 01 §1; 06 §3 | 0.3 |
| H13 | Demo ends on fix difference and "leavers' reasons match early themes" | 05 beat 6; 06 Flow H | 0.3 |
| H11 | One sentence that names the voice transcript | 05, 01, 02, 06, dossier I, deliverables/06 | 0.2 |
| H12 | Managers on WhatsApp too | 05 stories 78–79, 149, `managers`, module 10 | 0.2 |
| H15 | Fix K1–K17 | See section 4 | 0.2 |
| H14 | R17 honest about audio; voice per tested pack; exit question only after resignation | 05 R1, R17, R49, R50 | 0.1 |
| | **Total** | | **≈ 6.1 (89.0 → ≈ 95.1)** |

**Is any fix still worth 0.3 points or more? Yes.** H1 to H10 and H13 are each worth 0.3 or more. H1 and H2 together are worth almost 2 points.
