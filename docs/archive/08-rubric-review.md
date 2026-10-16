# Sapa — Rubric review (adversarial, judge's view)

*15 Oct 2026. Written by an Opus reviewer agent playing a harsh judge, from the guide PDF, docs 01–07 and the Q&A and command additions in the [visual plan](https://plan.agent-native.com/plans/plan-783110400a214341). Not yet acted on: the team decides which findings to accept.*

## 1. Predicted score

| Criterion (weight) | Now | Why | After top 5 fixes |
|---|---|---|---|
| Problem (15%) | 7 | The desk research is strong (dossier B and C). But there is no primary evidence: dossier C still says "What to add before the pitch: 3–5 short quotes", and none exist. | 8.5 |
| AI Solution (20%) | 6 | The design is sound. But one builder has 106 user stories, 29 rules and 12 modules, plus Q&A, and `app/` has only a README. Most likely outcome: half-built. Q&A also breaks R11, the rule that people stay in control of what employees are told. | 8 |
| Innovation (20%) | 5.5 | Guide p.6 lists "New-employee check-in assistant" as an example build, so the core idea is the obvious one. What would set it apart (the closing notice, actions gated by consent, Manglish) gets lost in feature volume. | 7 |
| Business (15%) | 6 | The ROI rests on two unsourced assumptions (25% early leaving, 0.5× salary cost). There is no willingness-to-pay data, and the real competitor is free (Google Forms + WhatsApp). | 7 |
| ESG (10%) | 7.5 | Above hackathon level. Weakened by Q&A sending free AI text to employees, routing "resignation" questions to HR, and HR seeing each person's opt-out status and timeline. | 9 |
| Pitch/Demo (20%) | 5.5 | The demo needs two Telegram accounts, a dashboard, a home server and a tunnel. Round 1 is online screen-share (07 §2). There is too much to explain in 8–10 min, and one person can explain the system. | 8 |
| **Weighted total** | **~62/100** | | **~78/100** |

## 2. Requirement compliance

| Requirement (page) | Status | Evidence / gap |
|---|---|---|
| Choose ONE challenge (p.1) | Met | deliverables/01 |
| Choose ONE pain point and ONE user (p.2, steps 2–3) | At risk | Q&A adds a second pain point (new hires lacking onboarding information) and a second main user (the new hire as a help-desk user) |
| Smallest useful solution; show exactly where AI adds value (p.2, step 5) | **Not met** | 05 is a product spec (106 stories, R1–R29), not a smallest prototype |
| Keep decisions reviewable by people (p.2 step 6; p.8 Q6; p.9) | **At risk** | Q&A sends AI-written answers with no human review. That contradicts R11, 06 commitment 6 and deliverables/06 ("Nothing is sent to an employee … without a human click") |
| Test whether the prototype improves the process (p.2 step 7; p.8 Q7) | At risk | All 5 tests in dossier G are "Not started". Tests 4–5 need outside people, and none are booked |
| Minimum output: feedback → AI themes → HR/manager review → action (p.6) | Met in design | 05 demo beats 1–4. Depends on the build |
| No secret monitoring or emotion inference; voluntary, transparent info (p.6) | At risk | R16 and the schema are good. But archived PRD S11/S12 show per-person Declined/Stopped status and an answered/skipped timeline, and Q&A forwards "resignation" questions to HR |
| AI only where it creates measurable value (p.8) | At risk | Only classify is measured (κ). Narrative (step B), draft action, probe choice and Q&A are not |
| Judges grasp input → AI → output → human (p.2, p.11) | At risk | Three AI steps, plus Q&A, plus probes, plus a recheck: too many to grasp in seconds |
| Safe sample data (p.11) | Met | 05 Out of Scope says synthetic only. Quotes from HR practitioners need permission (deliverables/09 already notes this) |
| Slides AND working demo (p.10) | Met (plan) | deliverables/10, 11 |
| 8–10 min including Q&A (p.10) | At risk | The run of show in deliverables/12 leaves 1.5 min for Q&A with no slack, and Q&A adds more to explain |
| ≤10 slides (p.10, recommended) | Met (plan) | deliverables/10 |
| Demo shows one complete user journey (p.10) | Met (plan) | It runs across two personas and three screens. Fragile |

## 3. Findings, ranked by points at stake

**F1 (S1, AI Solution / Pitch). Scope cannot be built and tested by one person in about 7 days.**
A judge sees a half-working demo, or a demo that works only on seeded paths. Build ends 22 Oct, with Round 1 online on 23–25 Oct (07 §2). 02 §7.2 gives every gateway, database and prompt task to Abraham. On top of the loop, 05 includes app-level AES, an audit on every read, retention jobs, export, holidays and working hours, reminders and lapses, weekly snapshots, a manager web app (M1–M4), escalation closure (R29), the R18 number check, and question-bank and consent-version editing. Q&A adds handbook storage, grouping, two screens and a second AI contract. Guide p.2: "Your prototype can be small." **Fix:** freeze to the demo-path list in section 5. Everything else becomes a settings screenshot or a "pilot" line.

**F2 (S1, ESG / AI Solution). The Q&A bot breaks the product's own responsible-AI contract.**
- R11 says "the AI only selects IDs or drafts text that HR must approve." 06 commitment 6 says "the AI never speaks to employees in its own words." Q&A does exactly that. The 04 review removed generated follow-ups (P5) for this reason.
- The substring check proves that the quote exists. It does not prove that the answer follows from it. The model can quote a real line about overtime and still get the rate wrong. Markdown in pages (`**`, tables) will also make exact matches fail often.
- The fixed fallback text, "I sent this to HR", is false for the first two askers, because forwarding needs 3 distinct askers in 30 days. Earlier askers are never re-notified. That is a broken promise to new hires, the people Sapa says it builds trust with.
- The "important matter" list includes probation, dismissal and *resignation*. If "how much notice do I give?" escalates to HR, Sapa is a quit detector. That contradicts "no prediction of who will quit" (01 §1; dossier I).
- "Pay disputes" is an important matter, while `pay/overtime.md` is a handbook page. Whether "how is OT calculated?" counts as a dispute is left to an LLM.
- Q&A uses a forwarding threshold of 3 while R8 uses 5. Questions are anonymous to HR while check-ins are "confidential, not anonymous". Two privacy models in one bot make the consent text harder to write honestly.
- The dossier itself warns (M, Scope creep): "a chatbot that probes feelings would weaken the ethics case. Keep the conversation bounded."
- The 07 §10.5 workshop praised a demo bot that *refused* a salary question.

**Verdict: cut Q&A from the build and the demo.** It is a different HR pain point, and it adds an unreviewed AI channel to vulnerable users. The upside is speculative (higher response rates from giving new hires something back), and the closing notice already gives them something back. Keep one line on slide 10, "Next: handbook answers, quote-only", and keep Telegram's built-in `/` command menu, which is cheap. If the team refuses to cut it, ship only quote-only retrieval: return the cited paragraph word for word, with no generated answer and no forwarding.

**F3 (S1, Pitch). Live dependencies on the demo path.**
OmniRoute runs on a home server behind a tunnel. 04 A1 called it "the biggest risk", and the team overrode that for a "keys off Vercel" benefit that doesn't hold, since the fallback Gemini key sits in Vercel anyway. Round 1 is screen-share, so two physical phones held up to a webcam will be unreadable and laggy. The deliverables are stale too: deliverables/11's morning checklist says "Check OmniRoute and the Funnel", and deliverables/03 still lists Tailscale and Langfuse. **Fix:**
- Call Gemini directly (or through AI Gateway) on the production path.
- Run both Telegram accounts in Telegram Desktop or Web windows next to the dashboard, so all three panes are on one screen.
- Make "Reset" and a pre-recorded fallback one keystroke away.

**F4 (S1, Problem / Testing). There is no primary evidence, and that is the cheapest gap to close.**
Q3 and Q7 on p.8 need "what you learned from users" and "what users said". Today the plan has zero practitioner quotes, no early-leaver rate from a real company, and Tests 4–5 are unbooked. The co-host CKM is a recruitment agency (07 §1), and the judges are from industry ("not from our teachers", 07 §6). **Fix:**
- Talk to 3–5 HR people this week, including CKM mentors if possible.
- Ask: how many early leavers did you have, how do you find out why, would you run a 90-day pilot, would you pay RM90 per hire?
- One "yes, we'd pilot" beats every global statistic in the deck.

**F5 (S2, Problem / Business). Is the causal story credible, or is this a survey tool with extra steps?**
Judges will say: "This is a pulse survey, a tagger and a to-do list." The parts that make it more than a survey are the **resolution notice and the recheck** (06 §3 says so itself). Retention impact cannot be shown in time, and dossier L Q10 admits "Not yet proven". **Fix:** claim only what can be measured now.
- **Time to signal:** the Day 14 check-in versus an exit interview at month 3–6.
- **Time from signal to action**, in the demo itself.
- **The share of fixes rechecked as "clearer".**

Retention becomes the pilot's success metric, stated on slide 10.

**F6 (S2, AI Solution). Some AI is for show.**
- Step B narrative: 05 has to police its numbers (R18) because SQL already did the counting.
- Draft action: a library lookup by driver does the same job without AI.
- AI probe selection: "probe if needs_follow_up" is a rule.

Only the classifier creates measurable value: Manglish free text becomes a tag plus a verbatim quote, scored by κ. **Fix:** cut the narrative and make the draft a deterministic template pick. Pitch one AI step that judges can see in 3 seconds: the raw Manglish, with the highlighted quote and the tag.

**F7 (S2, ESG). Surveillance optics inside the dashboard.**
- Archived PRD S11/S12 and 05 story 36 let HR see *who* declined or stopped, plus a per-person answered/skipped/reminded timeline. That undermines "stopping has no effect" and is close to the activity tracking that dossier F9 rules out. The 07 §9 trainer's test is "does it label quiet people as a problem?"
- **Fix:** show HR only "invite used / not used". Show declined, stopped and skip rates as intake-level counts. Remove the per-person timeline.
- The escalation keyword list (dossier F8: *bunuh diri*, *buli*) will fire on Manglish hyperbole ("OT everyday, mati la"). That sends a crisis helpline message to someone who was joking.
- **Fix:** report escalation *precision* as well as recall, and add hyperbole cases to the eval set.

**F8 (S2, internal inconsistency that the demo will expose). The "4 of 6" window.**
05 story 54 makes a rolling 90-day window the default, and the seed adds "earlier intakes … so the 90-day window has history". So the default card will not read "4 of 6". **Fix:** in demo mode, open on the October-intake view, and say "intake view" out loud.

**F9 (S2, Business). The ROI does not survive an HR judge.**
- The 25% six-month leaving rate is an assumption (dossier M).
- 0.5× salary for RM2,500/month operators is generous. The CAP review behind turnover-cost estimates puts the median at ~21% of salary for all but executives and physicians ([Boushey & Glynn 2012](https://www.americanprogress.org/wp-content/uploads/2012/11/CostofTurnover.pdf)). That gives ~RM6,000 per exit, so break-even is ~1 exit a year. That is still a fine story, and it is safer.
- "Prevented exit" cannot be attributed to Sapa. Say so.
- Pricing per new hire is good. Lead with the agency angle: CKM's own replacement guarantees (dossier H3) make the co-host the natural buyer. Note the controller problem, though: an agency cannot see employer-held replies.
- WhatsApp will come up. Secondary sources put WhatsApp near 90% monthly use in Malaysia ([malaysia4u](https://malaysia4u.com/marketing-guide), unverified against [DataReportal](https://datareportal.com/reports/digital-2025-malaysia)). Keep the 04 P9 answer ready.

**F10 (S2, ESG / legal).**
- PDPA treats physical and mental health as sensitive personal data (explicit consent). Self-harm disclosures fall under this, so the consent text must cover it.
- Sending text to Gemini is a cross-border transfer.
- A student's home server would be an extra data processor in any pilot. That alone kills OmniRoute in production.
- Employment Act s.81B: 04 P7 says the bot must not promise HR silence. Check that the escalation text in dossier F10 ("reach out … if they agree") was actually rewritten. As of the dossier, it was not.

**F11 (S2, Teamwork 20%).** Guide p.9 says "team members understand and can explain the project". Abraham owns all the technical work, and Teammates A and B are still unnamed placeholders in deliverables/README. **Fix:** every member does one full rehearsal in the demo-driver seat, and answers the "how does the AI work / what if it's wrong" questions.

**F12 (S3, document drift).** Each of these will confuse a teammate or a judge:
- The manager "approves/edits" (dossier D6, F7; deliverables/04, 06, 11) versus "accepts" with no edit (05).
- "AI follow-up questions" (dossier F3; deliverables/03 phase 3) versus a fixed probe bank (05 R11).
- Dossier K's demo script (3 of 5, manager approves) versus 05.
- deliverables/11 calls "architecture 7.1" current, but 05 supersedes it.
- app/README and deliverables/03 list Langfuse keys.
- Dossier F9 says "pooled across intakes" versus 05's rolling window.
- 06 has dropped screen numbers, yet the additions cite S19/S20, which exist only by extension of the archived v1.
- In 05, an inbound message outside a check-in is "stored as an unprompted reply, classified … and thanked". The Q&A addition replaces this, and never says where "kind: feedback" goes. It needs either a second AI call or the feedback is lost.

**Pitch fit.** About 75 s of demo, 9 slides and 2 min of Q&A fits only if Q&A, settings, insights and escalation flows stay off stage. The most memorable moment is Mei Ling's phone buzzing: *"Update from HR: your team now agrees a top-3 priority list every Monday."* Build the story toward that line. Show the escalation flow as a single slide-9 screenshot, not live.

## 4. Top 5 changes by points per hour

1. **Cut Q&A, OmniRoute and every off-path feature (section 5); freeze the demo path** (−30 h or more). Lifts AI Solution, ESG and Pitch.
2. **Talk to 3–5 HR practitioners and CKM mentors**: quotes, early-leaver numbers, "would you pilot at RM90/hire?" (4 h). Lifts Problem, Business, and the Q7 testing answer.
3. **Rebuild the demo on one screen** (Telegram Desktop ×2 + dashboard, intake view preset), climaxing on the resolution notice; record the fallback; rehearse to 75 s (4 h + rehearsals). Lifts Pitch and Innovation.
4. **Run Test 1 on about 60 replies** split by language, including hyperbole cases; report κ and escalation k-of-n with precision (6 h). Lifts AI Solution and the testing answer.
5. **Rewrite slide 10 and the ROI**: CAP ~21% cost, break-even at about 1 exit, time-to-signal metric, CKM agency angle, retention as the pilot metric. Drop the per-person opt-out view (2 h). Lifts Business and ESG.

## 5. Kill list (hours are my estimates)

| Cut or defer | Hours saved |
|---|---|
| Q&A bot, handbook store, grouping, S19/S20, prompt caching | 20–28 |
| OmniRoute + cloudflared on the production path (call Gemini directly) | 4–6, plus the largest demo risk |
| App-level AES and decrypt-on-read (state "Postgres encryption at rest + RLS + server-only reads") | 5–7 |
| Manager web app M1–M4 and weekly snapshots (the manager uses Telegram; show one mock) | 6–8 |
| Step B narrative and R18 | 3–4 |
| Settings editors: question bank, consent versions, action library, holidays | 5–7 |
| Retention job, export, R29 closure messages, reminders and lapse, working hours | 5–7 |
| Live Insights page S14 (make slide-8 charts from eval files instead) | 3–4 |
| Per-person timeline and declined/stopped list | 1, and an ESG gain |

**Keep:** consent and commands, Day 14 check-in, keyword safety with the fixed message, the classifier with its evidence quote, the theme card with the minimum of 5, reply detail with tag override, the action composer with the R10 exposure gate and the note, manager accept/done in Telegram, the resolution notice, the recheck, demo clock and reset, the "How Sapa works" page, and a minimal audit log.
