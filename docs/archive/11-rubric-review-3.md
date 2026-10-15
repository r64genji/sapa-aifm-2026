# Sapa — Rubric review 3 (product only, skeptical judge)

*15 Oct 2026. A third review by an AI reviewer that acts as a hard industry judge. It checks the product design in 05 (R1–R42), 06, 01, 02, 03 and the deliverable READMEs against the official rubric (07, guide) and the workshop transcripts. It also checks the review-2 fixes (R39–R42, new evals, demo beats, the review sentence). Not yet acted on. The team decides which findings to accept.*

## 0. Scope and rules of this review

- **Product only.** This review gives full marks to everything that is not the product: primary research, HR interviews, statistics, market sizing, delivery, slides, teamwork, demo logistics and rehearsal. It does not deduct for them.
- **What it judges.** What the product does. How well it keeps new hires past six months. The AI design. Human review. Privacy and responsible AI. The HR dashboard and the bot. The business model built into the product (price, measured outcomes). Innovation. Whether the specified demo shows the product well. Contradictions between product docs.
- **Fixed constraints.** Build time and effort do not matter. The Q&A bot and the HR dashboard stay. The model route stays. This review does not recommend a pilot data path, a Vertex region or a provider change.
- **10 out of 10** means a top judge can find nothing more to ask of the product.

## 1. Scores

Scores are out of 10. "Points" are on the 100-point total.

| Criterion (weight) | Now | Main reason, one line | After all fixes |
|---|---|---|---|
| Problem (15%) | **9.5** | The product targets the guide's root causes well. It ignores two groups the problem names: untrained line managers (they get only reactive tasks) and non-BM/English frontline staff. | 10 |
| AI Solution (20%) | **8.0** | Strong, testable, reviewable. But the recheck asks a leading question, HR cannot offer help unless the AI flags the reply, unreviewed tags that count have no measured precision, and no AI step is compared with a plain template. | 9.5 |
| Innovation (20%) | **7.5** | The closing notice, consent-gated scope, gap signal from questions and `/myanswers` are good. The core is still the guide's own example list. The product does not learn which fixes work. | 8.7 |
| Business (15%) | **7.5** | The Impact view exists, but its numbers are biased (deleted leavers drop out, rechecks are leading, no uncertainty). The free pilot is 90 days, but the product's main outcome needs six months. Telegram reach and the agency channel are open. | 9.7 |
| ESG (10%) | **8.0** | Well above hackathon level. New leaks: the manager can tell who complained from timing; "blocked because she stopped" shows per-person status; leavers keep getting messages. No support for migrant-worker languages or forced-labour signals. | 10 |
| Pitch, Demo, Teamwork (20%) | **8.5** | Clear loop. But on stage the count moves before any human review, Raj gets a task 40 seconds after Mei Ling's reply (a visible privacy leak), the help for Mei Ling (R39) is not shown, and the outcome (Impact) is not shown. | 9.7 |
| **Weighted total** | **≈ 81.5** | | **≈ 95** |

Arithmetic now: 14.25 + 16.0 + 15.0 + 11.25 + 8.0 + 17.0 = 81.5.
Arithmetic after: 15.0 + 19.0 + 17.4 + 14.55 + 10.0 + 19.4 = 95.35.

## 2. Gaps ranked by points

Each gap gives: points, what a judge says, where, and the fix.

### G1. The recheck is a leading question, so "did the fix work" is not measured (1.75 points: AI +0.5, Business +0.75, Innovation +0.5)

**Judge.** "You tell her 'Update from HR: we fixed your priorities'. Then you ask 'Are your priorities clearer?'. Of course she says yes. That is not evidence."

**Where.** 05 story 28, story 70, R26, demo beat 5. 06 Flow A step 7, Flow E, §9 "Recheck". 05 story 130 and 06 Flow J ("share of rechecks that say clearer").

**Fix.**
- Change R26 to: "When an action becomes done, each consenting person in its scope gets, in their next check-in, the same neutral scale question for the action's driver that the bank asked before (for ROLE_CLARITY: 'How clear are you on what is expected of you this week? (1–5)'). The answer is linked to the action. The action card shows the median before and after for people in scope, and, when 5 or more answered, the same change for new hires outside the scope in the same weeks."
- Replace "3 of 4 say clearer" everywhere with "Role clarity score, Raj's team: 2.5 → 3.8 (5 people); other teams: 2.7 → 2.8".
- Story 28 and demo beat 5: the phone gets the neutral scale question, not "Are your priorities clearer this week?".
- Impact view (story 130, R42, 06 Flow J): "median change in the driver score after done actions" in place of "share of rechecks that say clearer".

### G2. The action library does not learn which fixes work (1.2 points: Innovation +1.0, Business +0.2)

**Judge.** "Every engagement tool has a list of suggested actions. Does yours know which ones worked at *this* company?"

**Where.** 05 "Draft action (AI step C)", dossier F6, 05 story 62.

**Fix.** Add R43 and change step C:
- **R43 Fix evidence.** Each action library entry stores the before-and-after change (G1) of every done action that used it in this organisation. The draft screen shows "Used 3 times here. Role clarity rose by a median 1.1 points (14 people)." It shows this only when 5 or more people gave both answers. Otherwise it says "Not enough evidence here yet".
- Step C input adds the library entries ranked by that evidence. The draft names which entry it used and why.
- The Impact view lists the three fixes with the largest measured change.
- This turns Sapa from a survey with tasks into a system that learns what keeps new hires at this company. Say it in the innovation slide.

### G3. Migrant and non-BM workers are out, and forced-labour signals are missing (1.0 point: Problem +0.4, Business +0.3, ESG +0.3)

**Judge** (Penang E&E or glove-maker HR): "A third of my monthly intake is from Nepal, Bangladesh and Myanmar. Our customers audit us under the RBA code for worker grievance channels. Can they use this?"

**Where.** 05 Out of Scope ("Mandarin and Tamil"), story 3, R13 categories, classifier `escalate_category`, dossier H4.

**Fix.**
- Make language a data item. HR adds a language pack (consent, question bank, probes, commands, fixed texts). Each pack needs a named human checker before it goes live. Ship BM, English, Mandarin and Tamil. Add Bahasa Indonesia, Nepali, Bengali and Burmese as packs.
- The classifier keeps the evidence quote in the original language. Eval κ is reported per language (05 eval method already does this per language).
- Add escalation category `forced_labour_indicator`: passport or ID held, recruitment-fee debt, wage deductions, restricted movement. Add BM and English keywords. It goes to HR only, like R7.
- Add an intake-level export (k ≥ 5) "worker-voice themes for your RBA or ESG report". It never contains replies or names.

### G4. The manager can tell who complained from timing (0.9 point: ESG +0.3, Pitch +0.6)

**Judge.** "Raj knows Mei Ling had her Day 14 check-in today. Forty seconds later he gets a role-clarity task. R10 hid her name. The clock gave it away. I just watched it happen on your demo."

**Where.** 05 R10, story 80 ("several new hires in your team say…"), demo beats 3–4, 06 Flow H beat 3.

**Fix.** Extend R10:
- "An action that reaches a manager and comes from a reply whose author did not consent must start from a theme card, not from the reply. Its manager alert waits until the next weekly snapshot day. Its context quotes only that snapshot. It never says 'several' unless the snapshot count is 3 or more. Demo mode skips the wait and shows the label 'In real use this alert waits until Monday'."
- Demo beat 3: HR clicks "Draft action" on the Role clarity card, not on Mei Ling's reply.

### G5. HR can help one person only if the AI flags the reply, and the demo does not show this help (0.9 point: AI +0.5, Pitch +0.4)

**Judge.** "So the AI decides whom HR may help? And you told me the person comes first, but I did not see Mei Ling get anything except a team memo."

**Where.** 05 R39 ("On a reply with `concern_level = needs_follow_up`"), story 46 (HR corrects tags, not concern level), demo beats 1–5.

**Fix.**
- R39 trigger: "a reply that the AI or HR marked as needing follow-up". Story 46: HR can set or clear `concern_level`, with audit (R25).
- Add to demo beat 3: HR clicks "Offer a private chat". The phone shows the offer. The teammate taps Yes. HR sees "Contact task, due in 2 working days". About 8 seconds.
- Also fix the small R39 limits: at most one open offer per person; no new offer for 30 days after "No thanks"; sent in the next working-hours slot (R19), waived in demo mode; R11 names the R39 offer and the R29 closure as allowed fixed texts.

### G6. The Impact numbers are biased and have no uncertainty (0.85 point: Business +0.75, ESG +0.1)

**Judge.** "People who leave are the ones most likely to type DELETE. R4 removes them from impact figures. So your retention goes up when people quit. And who is in the intake: everyone hired, or only those who joined Sapa? Your baseline is everyone."

**Where.** 05 R42 ("Deletion (R4) removes the person from impact figures"), story 129–131, `people.left_company_on`, 06 Flow J, §9 Impact sample.

**Fix.** Rewrite R42:
- "Six-month retention per intake = people still employed at Month 6 ÷ everyone hired in that intake, whether or not they joined Sapa. HR enters both numbers per intake from its own records after the intake passes Month 6. Sapa stores no per-person leaver date for this figure. DELETE does not change it."
- "The Impact view pools all completed intakes and shows 'k of n' against the baseline. Below 30 people it says 'Too few to tell yet'. It always says 'This shows a trend, not proof that Sapa caused it'."
- Keep a per-person "left the company" flag only for G8.
- This also removes a privacy question: Sapa no longer holds a per-person leaver list.

### G7. On stage the count moves before any person checks it (0.8 point: AI +0.2, Pitch +0.6)

**Judge.** "You said HR reviews the evidence. The number changed before anyone looked. And what if the model says 'low confidence' on stage? Then your card stays at 7 of 18."

**Where.** 05 demo beat 2, story 58, the seed ("7 of 18" → "8 of 19").

**Fix.** Demo beat 2: the reply appears with the AI label. HR clicks "Confirm label". The card moves from "7 of 18: 5 reviewed, 2 AI-confident" to "8 of 19: 6 reviewed, 2 AI-confident". Seed the split. A reviewed tag counts whatever confidence the model gave, so the beat no longer depends on the model's confidence.

### G8. Unreviewed tags count, but nobody measures them in use (0.7 point: AI +0.6, ESG +0.1)

**Judge.** "Two of the 19 were never read by a person. How accurate are exactly those? And how would HR know if the AI gets worse next month?"

**Where.** 05 eval method (κ over all tags), story 58, module 7. 06 §8 mentions "AI-quality numbers" with no rule behind them.

**Fix.**
- Eval: report precision per driver and per language for the tags that count without review (confidence medium or high, not uncertain). Set that cut-off on the dev split. Report the share sent to review.
- Add R44 **AI quality watch.** A dashboard panel shows, for the last 30 days, the share of tags HR changed and the number of `/myanswers` challenges, per driver and per language. If HR changed more than 20% of a driver's reviewed tags (at 10 or more reviews), AI-confident tags for that driver stop counting until HR reviews them. The card says why.
- Report escalation false alarms and needs-review rates per language. A Manglish writer should not get more red flags than an English writer.

### G9. Managers get no help to onboard well, only tasks after problems (0.6 point: Problem +0.4, Innovation +0.2)

**Judge.** "Your own problem statement says supervisors are rarely trained in onboarding. Why does Sapa wait for a complaint before it helps them?"

**Where.** 05 Problem Statement paragraph 4, stories 77–85, dossier F6.

**Fix.** Add R45 **Manager milestones.** For each new hire, the manager gets fixed Telegram nudges from an HR-approved library at set days: Day 1 "Assign a buddy", Day 7 "Book a 15-minute priorities chat", Day 30 "Agree a 30-60-90 plan". Each has a Done button. The nudges contain no feedback and no reply data, so no privacy rule changes. HR sees the share done per intake (k ≥ 5). The Impact view shows it beside retention.

### G10. Telegram may not reach the target workers (0.55 point: Business +0.45, ESG +0.1)

**Judge.** "My operators use WhatsApp. Nobody installs Telegram for HR."

**Where.** 05 Out of Scope ("WhatsApp … Pitch only"), Further Notes Q3, module 2.

**Fix.** Build a second channel adapter for the WhatsApp Cloud API (a Meta test number is enough to demo it). Check-ins, reminders, notices and the R39 offer are approved utility templates. Commands and consent are the same. Put the WhatsApp message fee into the RM90 price in dossier H2. Show it in Q&A on a second phone. Module 2 already isolates the channel, so no rule changes.

### G11. No AI step is compared with a plain template (0.5 point: AI +0.5)

**Judge.** "The guide says use AI only where it creates measurable value. Measured against what?"

**Where.** 05 eval method: narrative, probe choice and draft lines have no baseline and no pass mark, but the rule "An AI step that cannot show value … is replaced by a template" needs both.

**Fix.** Add a baseline and a pass mark to each line:
- Probe choice: compare with "always send the generic probe". Pass if humans prefer the AI's probe in at least 60% of pairs.
- Narrative: compare with a template sentence built from the counts. Pass if HR raters prefer it in at least 60% of pairs and faithfulness is at least 95% of sentences.
- Draft action: compare edit level with the raw library text. Pass if fewer drafts need a rewrite.
- Escalation: use at least 40 escalation cases, so the 95% interval is useful. 8–10 cases give an interval too wide to support "tuned to miss nothing".

### G12. The "one sentence" is now false, and the roadmap breaks the purpose limit (0.5 point: AI +0.2, ESG +0.1, Pitch +0.2)

**Judge.** "Your sentence says handbook answers are the only AI words a new hire sees. Then `/myanswers` shows her an AI summary. And your dossier plans 'input to probation conversations'. Your slide 9 says never."

**Where.** 05 Solution, "What the AI does" paragraph (two sentences next to each other disagree). 01 §1. 02 principle 3. deliverables/06. 06 commitment 6 ("the one exception is a handbook answer"). Dossier H4 "consent-based input to probation conversations" against 05 Out of Scope and 01 "no use in … probation".

**Fix.**
- New sentence everywhere: "SQL counts. The AI suggests labels. Labels the AI is unsure about wait for HR. HR reviews the evidence before any action. The only AI words a new hire sees are handbook answers that quote a page HR published, and, if they ask with `/myanswers`, the AI's reading of their own replies."
- 06 commitment 6: name two exceptions, R31 and R40.
- Dossier H4: delete "consent-based input to probation conversations". Use "internally transferred staff and newly promoted managers".

### G13. There is no agency role, but the co-host is an agency (0.5 point: Business +0.3, Innovation +0.2)

**Judge** (CKM): "We place people every week and we lose our fee when they leave in month two. Where do I log in?"

**Where.** 05 roles (`hr`, `hr_admin`, `manager`), dossier H2 "Agency plan", L12.

**Fix.** Add role `agency`. An employer can grant it per intake. It sees only intake-level themes and Impact figures at k ≥ 5 for its placements. It never sees replies, questions, escalations or names. Price: per placement, as in H2.

### G14. Nothing tests whether early themes match the real reasons people leave (0.45 point: Innovation +0.3, Business +0.15)

**Judge.** "Your Day 14 themes say role clarity. Do the people who left say the same?"

**Where.** 05 R42, Impact view.

**Fix.** Add an optional exit question. At consent, the new hire may tick "If I leave, you may ask me one question". When HR sets the "left" flag (G8), the bot sends one fixed question with driver buttons and one open line. The answer is tagged like a reply. The Impact view shows, at k ≥ 5 over 12 months, "Top reasons leavers gave" beside "Top themes Sapa found earlier". Nothing goes to the manager.

### G15. The free pilot cannot measure the product's main outcome (0.4 point: Business +0.4)

**Judge.** "Your pilot is 90 days. Your retention number needs six months. What will I see at day 90?"

**Where.** Dossier H2 ("free for one intake … for 90 days"), K slide 10, L10, deliverables/10 slide 10, 05 Evidence ("for 90 days"), deliverables/09.

**Fix.** Pilot = one intake through Month 6, free. Day-90 report: response rate, days from reply to fix, score change after fixes (G1), manager milestones done (G9). Month-7 report: six-month retention against baseline (G6). Change the pilot question to "Would you run one intake through Sapa until Month 6?".

### G16. People who left keep getting messages (0.4 point: AI +0.2, ESG +0.2)

**Judge.** "A worker resigned last week. Today your bot asks how her Day 30 is going?"

**Where.** 05 R1 (consent only), R26, R28, R39, R42.

**Fix.** Add to R1: "When HR marks a person as left the company, all scheduled check-ins, reminders, rechecks, notices and offers are cancelled. The bot sends one fixed message: 'Your check-ins have ended. Your answers are kept until [date]. Type DELETE to remove them now.' Only the G14 exit question may follow, and only with consent."

### G17. The demo does not show the outcome (0.4 point: Pitch +0.4)

**Judge.** "You showed a task closed. You did not show me that anything got better."

**Where.** 05 "Updated 90-second demo", 06 Flow H.

**Fix.** Use the 2-minute script in section 6 of this review. It ends on the action card ("2.5 → 3.8, 5 people") and the Impact view for 10 seconds.

### G18. Participation is still visible per person, despite R41 (0.3 point: ESG +0.3)

**Judge.** "R41 says HR never sees who stopped. But your commitment 8 says every blocked choice says why. So HR clicks 'Offer a chat' and reads 'Blocked: she stopped'."

**Where.** 05 R41 against R39 and R29 block reasons and 06 commitment 8. Also HR sees each person's replies, so missing touchpoints show.

**Fix.**
- One generic reason for all such blocks: "This person is not receiving messages from Sapa now." It never says stopped, declined or left.
- Make R41 honest: "HR sees replies that people wrote, so HR knows a person answered. HR never sees a list of who missed, skipped or stopped, and no per-person timeline."
- Person export (story 74) goes to the person, needs a reason, and is audited.

### G19. Consent does not say who processes the words (0.2 point: ESG +0.2)

**Judge.** "Does the new hire know an AI company outside Malaysia reads her message? Does she know her Telegram chat keeps a copy after DELETE?"

**Where.** 05 story 4. This was part of review-2 fix 8, which the team rejected. This review does not ask for a route change. It asks only for disclosure.

**Fix.** Story 4 adds: "Your words are read by an AI service (Google Gemini) outside Malaysia. Do not share health details unless you want HR to know them. DELETE removes your answers from Sapa. Your own Telegram chat keeps its copy until you delete the chat."

### G20. `/myanswers` details are open (0.2 point: AI +0.1, ESG +0.1)

**Where.** 05 R40, classifier `summary`.

**Fix.**
- The classifier writes `summary` in the reply's language (BM or English). R40 shows that one.
- If HR changed a label, show "Changed by HR" in place of "AI reading".
- When HR resolves a challenge, the bot sends a fixed text: "HR checked your note. The label now reads: …".
- Escalated replies are listed with date and text only.

### G21. Shop-floor staff cannot send voice notes (0.2 point: Innovation +0.2)

**Judge.** "My operators send voice notes, not paragraphs."

**Where.** 05 Out of Scope ("Voice notes").

**Fix.** Accept voice notes up to 60 seconds. The model transcribes only. The audio is deleted at once. The bot shows the text back: "Is this what you said? [Yes] [Fix]". The text then goes through the normal path. Add to R16: "No tone, voice or emotion feature is stored or computed." Keep this rule loud, because the guide forbids emotion inference.

### G22. Small spec contradictions in the demo and seed (0.2 point: Pitch +0.2)

See section 4, items C1–C4.

### G23. Team or manager ranking is not ruled out (0.1 point: ESG +0.1)

**Judge** (workshop 2 on stigma): "Will HR compare supervisors with this? Then supervisors will fight it."

**Fix.** 06 commitment 1 adds: "No side-by-side ranking of teams or managers. A team's themes show only for one chosen team at k ≥ 5." Tell managers this in their "What I can see" note.

## 3. Check of the review-2 fixes

| Fix | Sound? | New problem it created | Fix |
|---|---|---|---|
| R39 HR offer | Mostly. It closes the "what about Mei Ling?" gap. | (a) Only AI-flagged replies qualify, so the AI gates human help. (b) No limit across replies: HR can send an offer per reply, even after "No thanks". (c) No working-hours rule. (d) R11 does not list it. (e) The block reason reveals "stopped" (against R41). | G5, G18 |
| R40 `/myanswers` | Yes. It answers "can an employee challenge it?". | (a) It breaks the "only AI words" sentence (G12). (b) Summary language is not set. (c) HR overrides show as "AI reading". (d) No reply after a challenge. | G12, G20 |
| R41 participation visibility | Good intent. | Not true as written: block reasons and per-person reply views leak who stopped or skipped. | G18 |
| R42 leaver date and Impact | Right idea. | (a) Deletion bias raises retention. (b) Denominator not defined (joined vs hired). (c) No uncertainty. (d) Leavers still get messages. (e) The Impact sample in 06 shows "3 of 4 rechecks", below the 5-person floor in R42. | G6, G16, C1 |
| New evals | Good. They cover narrative, draft, probe, Q&A faithfulness and false alarms. | No baseline and no pass mark, so the "replace with a template" rule cannot fire. Escalation set (8–10) is too small for a useful interval. No precision for the unreviewed tags that count. | G8, G11 |
| Demo beats (questions tile, R10 block) | Yes, they show two new parts. | Beat 3 drafts from the reply and beat 4 alerts Raj at once. This shows the timing leak on stage. The count still moves before review. | G4, G7 |
| Review sentence | Correct for 05 and 06 before R40. | Now false because of R40. 06 commitment 6 still names one exception. | G12 |

No review-2 fix created a new emotion, scoring or surveillance feature. The new problems are leaks and measurement bias, and all have text fixes.

## 4. Remaining contradictions between product docs

| # | Topic | One doc | The other doc |
|---|---|---|---|
| C1 | Impact floor | 06 §9: "3 of 4 rechecks clearer" in the Impact view | 05 R42: impact figures only at 5 or more |
| C2 | Seed intakes | 05 Demo setup: 30 hires in May–Oct, plus "two seeded intakes past Month 6" (not named, not counted) | 06 §9: "March intake (6 people)". Name both intakes (March, April) and their sizes in 05. |
| C3 | Only AI words to a new hire | 05 Solution, 01 §1, 02 principle 3, deliverables/06, 06 commitment 6: handbook answers only | 05 R11, R40: own AI summary and tags too (G12) |
| C4 | Manager context | 05 story 80: "several new hires in your team say…" | 05 R10: an action may come from one reply (G4) |
| C5 | Probation use | Dossier H4: "consent-based input to probation conversations" | 05 Out of Scope, 01 §1, dossier F9, L13 (G12) |
| C6 | Pilot length | Dossier H2, K10, L10, deliverables/09, /10, 05 Evidence: 90 days | 05 R42: retention shown only after Month 6 (G15) |
| C7 | Retention of raw text | Dossier F9: "deleted or anonymised" | 05 R24: deleted |
| C8 | Build checklist | deliverables/03 phases list no Q&A, R39, R40, R41 or R42 work | 05 modules 8, 9, 10, 13 and build order |
| C9 | Recheck wording | 05 story 28, 06 §9: "Are your priorities clearer?" | Dossier F4 rule: probes "never leading" (G1) |
| C10 | Eval size | deliverables/07: about 150 replies with 8–10 escalations | 05 eval: escalation recall with a useful 95% interval (G11) |

## 5. Does the product keep new hires past six months?

The chain now has a path for the person (R39) and a path for the pattern (themes, actions, notice). The weak links left are these:

1. **Proof that a fix helped.** The recheck is leading (G1). Fix it, and Sapa can show a before-and-after change per fix. Add G2, and Sapa learns which fixes work here.
2. **Prevention before complaints.** Untrained supervisors get no help until someone complains (G9). Milestone nudges act on every hire, including the quiet ones who never answer.
3. **Reach.** Telegram only and two languages leave out many frontline and migrant hires (G3, G10). The people most likely to leave early are the ones the product cannot reach.
4. **Measurement.** The Impact view must count everyone hired and survive deletion (G6). Otherwise a CFO cannot trust it.

## 6. Recommended demo script (2 minutes, within the guide's 1–2 minutes)

1. **(20 s) Check-in.** "Advance to Day 14". The phone gets the check-in. The teammate answers in Manglish. One fixed probe.
2. **(20 s) Review.** The reply appears with the label and quote. HR clicks "Confirm label". The card goes from "7 of 18: 5 reviewed" to "8 of 19: 6 reviewed". The top-questions tile shows the motorbike question.
3. **(25 s) Help the person, then the pattern.** HR clicks "Offer a private chat". The phone shows the offer; the teammate taps Yes; HR sees a contact task. HR clicks "Draft action" on the Role clarity card. "Mei Ling only" is blocked ("She chose HR only"). HR picks "Raj's team". The screen shows "In real use this alert waits until Monday".
4. **(20 s) Manager.** Raj accepts and marks done in Telegram.
5. **(15 s) Loop closes.** "Update from HR" arrives. The clock advances. The phone gets the neutral clarity question; the teammate taps 4.
6. **(10 s) Outcome.** The action card shows "Role clarity, Raj's team: 2.5 → 3.8 (5 people)". The Impact view shows pooled retention against the baseline, with "a trend, not proof".

## 7. Can the product reach 100?

**No. With every fix above, the product reaches about 95–96.** What stops it:

- **Innovation (about 1.3 points short).** The guide lists "new-employee check-in assistant", "feedback-theme summariser" and "manager follow-up dashboard" as example builds. Sapa is a strong version of those. G1, G2, G9 and G14 make it a learning system, which is new. But a top judge can still say "this is the suggested build, done very well". Only a different core idea removes that. A different core idea would lose the close fit to the brief, which earns points in Problem and AI Solution. So this is a real ceiling, not a missing spec line.
- **AI Solution (about 0.5 short).** Each AI step adds modest value over a template. Even with baselines (G11), some steps may lose and become templates. That is honest, but a judge may then ask "why AI?" for those steps. The classifier and Q&A carry the case.
- **Business (about 0.3 short).** No product feature can prove that Sapa caused better retention. The design can only measure a trend against a baseline. A controlled trial would mean holding back support from some new hires, which conflicts with the product's purpose. That is a fair limit, not a fixable gap.
- **Demo (about 0.3 short).** Two minutes cannot show Q&A, `/myanswers`, escalation and the AI-quality watch as well. They stay for Q&A.

So the remaining 4–5 points come from judge taste and from limits that a real product cannot honestly remove. They do not come from missing work.

## 8. Fix list (ranked)

| # | Fix | Main files | Points |
|---|---|---|---|
| G1 | Neutral scale recheck; before-and-after per action; compare with out-of-scope hires | 05 R26, stories 28, 70, 130, beat 5; 06 Flows A, E, J, §9 | 1.75 |
| G2 | R43: action library learns which fixes worked here | 05 step C, story 62; dossier F6 | 1.2 |
| G3 | Language packs incl. migrant languages; forced-labour escalation; RBA/ESG export | 05 Out of Scope, R13, classifier; dossier H4 | 1.0 |
| G4 | R10: manager actions start from themes; alert waits for the weekly snapshot; no "several" | 05 R10, story 80, beats 3–4; 06 Flow H | 0.9 |
| G5 | R39 open to HR's own judgement; one open offer per person; working hours; show it in the demo | 05 R39, R11, story 46, beat 3 | 0.9 |
| G6 | R42: retention over everyone hired, entered per intake; immune to DELETE; pooled with "too few to tell" | 05 R42, stories 129–131; 06 Flow J, §9 | 0.85 |
| G7 | Demo: HR confirms the label before the count moves | 05 beat 2, seed; 06 Flow H | 0.8 |
| G8 | Precision of unreviewed tags; R44 AI quality watch; per-language false alarms | 05 eval method, module 7; 06 §8 | 0.7 |
| G9 | R45: manager milestone nudges for every hire | 05 stories 77–85, Actions module | 0.6 |
| G10 | WhatsApp Cloud API adapter; fee in price | 05 Out of Scope, module 2; dossier H2 | 0.55 |
| G11 | Template baselines and pass marks for every AI step; 40+ escalation cases | 05 eval method; deliverables/07, /09 | 0.5 |
| G12 | Fix the review sentence for R40; delete "probation conversations" from the roadmap | 05 Solution; 01; 02; 06 commitment 6; deliverables/06; dossier H4 | 0.5 |
| G13 | `agency` role with intake-level views only | 05 roles, data model; dossier H2 | 0.5 |
| G14 | Optional exit question; "leavers' reasons vs early themes" at k ≥ 5 | 05 R42, Impact view, consent | 0.45 |
| G15 | Pilot runs to Month 6; Day-90 and Month-7 reports | Dossier H2, K, L; deliverables/09, /10; 05 Evidence | 0.4 |
| G16 | Marking "left" stops all messages, with one fixed closing text | 05 R1 | 0.4 |
| G17 | Demo ends on the score change and the Impact view | 05 demo; 06 Flow H | 0.4 |
| G18 | One generic block reason; honest R41; export to the person only | 05 R41, story 74; 06 commitment 8 | 0.3 |
| G19 | Consent names the AI service, health caution and Telegram copy (disclosure only) | 05 story 4 | 0.2 |
| G20 | `/myanswers`: summary language, "Changed by HR", reply after a challenge | 05 R40, classifier | 0.2 |
| G21 | Voice notes, transcribe only, audio deleted, no tone features | 05 Out of Scope, R16 | 0.2 |
| G22 | Fix C1–C10 | See section 4 | 0.2 |
| G23 | No ranking of teams or managers | 06 commitment 1 | 0.1 |
| | **Total** | | **≈ 13.6 (81.5 → ≈ 95)** |
