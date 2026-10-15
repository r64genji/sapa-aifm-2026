# Design spec — Sapa web app (HR)

*As of 15 Oct 2026. This is the high-level design brief for the Sapa web app. It explains the situation, the problem, the goal, the people who use the app and the main user flows. It does not fix screens, layouts or components. Those are worked out later in conversation between Abraham and the design agent, and section 8 only gives a starting point for that conversation. Behaviour and data rules come from the [implementation spec](05-implementation-spec.md); rule IDs (R1–R53) point there. The earlier screen-by-screen draft is kept in [archive/06-dashboard-prd-detailed-v1.md](archive/06-dashboard-prd-detailed-v1.md) as a source of ideas, not as a requirement.*

**Contents**

- [How to read this spec](#how-to-read-this-spec)
- [1. The situation](#1-the-situation)
- [2. The HR problem](#2-the-hr-problem)
- [3. What Sapa is, and where the web app fits](#3-what-sapa-is-and-where-the-web-app-fits)
- [4. The problem the web app has to solve](#4-the-problem-the-web-app-has-to-solve)
- [5. The people](#5-the-people)
- [6. Commitments](#6-commitments)
- [7. User flows (recommended)](#7-user-flows-recommended)
- [8. Starting points for the design discussion](#8-starting-points-for-the-design-discussion)
- [9. Sample data (fictional)](#9-sample-data-fictional)
- [10. Out of scope](#10-out-of-scope)
- [11. Open questions for the design discussion](#11-open-questions-for-the-design-discussion)

## How to read this spec

The spec has three kinds of content, and they carry different weight:

- **Context** (sections 1–5): the situation, the problem and the people. Use it to make good calls where the spec says nothing.
- **Commitments** (section 6): promises the product makes to new hires, HR and the judges. Each comes with its reason. They hold whatever the design looks like. If a design idea seems to need one of them bent, raise it rather than work around it.
- **Recommendations** (sections 7–8): the current best thinking on flows and screens. Treat them as a draft. Merge steps, split them, reorder them or replace them when a better design serves the goal and keeps the commitments. When you depart from them, say what you changed and why.

Where something is unclear or two goals pull against each other, ask. Detail is meant to be settled in the design conversation, not guessed here.

## 1. The situation

**The competition.** Sapa is a student team's entry to the AIFM 2026 Student Challenge, Challenge 4. The guide asks for a working prototype that shows one loop: employee feedback → AI finds themes → HR or a manager reviews → a support action. Teams present in 8–10 minutes, with about 1–2 minutes of live demo, to judges who score six criteria:

| Weight | Criterion | What it means for the web app |
|---|---|---|
| 20% | AI solution and functionality | AI's role is clear, useful and checkable by a person |
| 20% | Innovation and creativity | Better than the obvious manual approach; strong user experience |
| 20% | Pitch, live demo and teamwork | The demo tells the story clearly and works live |
| 15% | Problem understanding | The HR problem, who it affects and when it starts are visible |
| 15% | Business and economic impact | The app shows time saved and fixes that worked |
| 10% | ESG | Privacy, fairness, wellbeing and governance are visible, not just claimed |

The guide's success question for Challenge 4 is: *"Can HR understand emerging employee problems earlier and take a useful action before the issue becomes more serious?"* The guide also says judges should immediately understand what goes in, what AI does, what comes out and what a person does next.

**The real-world setting.** The prototype is built as if for a real Malaysian company: Contoh GBS, a fictional 650-staff shared services centre in Bayan Lepas, Penang ([09](09-client-story.md)). It hires 15–18 people every month, and more than 1 in 4 leave before Month 6. Site HR is five people, and only one works on new hires. New hires get company email and system access only on Day 3–5, and about 40% work the Europe shift while HR works days. They write in English, Bahasa Malaysia, Manglish and Chinese. Team leads were promoted for being good at the work and are rarely trained to onboard.

## 2. The HR problem

Companies like this lose many new hires in the first six months, and HR learns why only at the exit interview. By then the person has gone, the reasons are softened, and each interview is read alone, so no pattern shows.

The causes are usually ordinary and fixable: unclear priorities, weak onboarding, little support from the supervisor, feeling left out, and too much or too little work. New hires do not raise these early. They fear it will hurt their probation, and nobody asks them in a way that feels safe.

HR cannot call every new hire. When they do collect feedback, nobody reads it in a structured way, nothing links it to an action, and nobody checks whether the action helped.

## 3. What Sapa is, and where the web app fits

Sapa is a chat bot (Telegram) plus a web app. The core loop is: *check-in → AI label with evidence → HR reviews and assigns a fix → manager closes it → new hires hear and are rechecked.* Four layers sit around it: reach (languages, handbook Q&A), care (private-chat offer, serious concerns), proof (score change, fix evidence, Impact, exit check) and trust (quality watch, `/myanswers`, export, agency).

- **The bot (not part of this spec).** A new hire scans a QR code on Day 1, agrees to take part, and chooses who may read their words: HR only (the default) or HR and their manager. Over six months the bot sends seven short check-ins. Each takes about a minute. The new hire can skip, stop or delete everything at any time, from Telegram's `/` command menu. Between check-ins the new hire can ask the bot questions about the company.
- **The AI.** It reads each reply and labels the problem area it is about (role clarity, manager support, belonging, onboarding and training, workload), with the exact words it used as evidence. It spots serious matters (harassment, bullying, safety, self-harm, signs of forced labour) and sends them to HR. It writes short summaries over counts the database already made, and drafts suggested fixes. It answers new hires' questions only from the HR handbook, labelled as AI and with the handbook sentence it used; for important matters it gives only the right contact. It never scores people, reads emotions, predicts who will quit, or writes any other words to an employee. It writes to a new hire only two things, each labelled and each about something they asked for: a handbook answer that quotes a page HR published and, with `/myanswers`, the AI's reading of their own replies (R31, R40).
- **The web app (this spec).** It is where people turn replies into action. HR uses it to see what new hires share, check the AI's reading, decide a fix and follow it through. Managers and new hires never use it. Managers receive and complete fixes in Telegram. New hires see its results only as messages from the bot.

The full loop, from the new hire's side: *I answer a check-in → later the bot tells me "Update from HR: your team now agrees a priority list every Monday" → at my next check-in it asks the same 1–5 question as before, and HR sees whether the score moved.* That closing message and recheck are what make Sapa different from a survey tool, and the web app is what makes them happen.

## 4. The problem the web app has to solve

Collecting replies is worth nothing unless HR can see the pattern, trust it, act on it and learn whether the action worked. The web app has to do that inside several tensions:

- **Speed against trust.** HR has minutes a week. But AI output is only useful if HR can check it against the person's real words, quickly.
- **Patterns against people.** The app has to show shared problems while protecting individuals. In a small team, a count of 1 or a quoted sentence can reveal who said it.
- **Action against exposure.** Most fixes go through a manager. Asking a manager to fix something must not tell them who complained, unless that person chose to share.
- **Calm against urgent.** Most replies are routine. A few are serious and need fast, careful handling. The two must not blur.
- **Real product against stage demo.** The app must suit a real HR team where one person handles every new hire, and also tell its story to judges on a projector in about 2 minutes.

## 5. The people

**HR (sample persona: Aishah, HR executive).** Desktop, busy, not a data analyst. Onboards 15–18 people a month and does every exit interview. Comes to the app to find out what needs her, not to explore data. Needs to understand the state of new hires in under a minute, trust what the AI says, and get a fix assigned without a separate privacy checklist. Must never feel she is spying on people. Her manager, Kavitha (site HR manager), uses the Impact view to show the Group a trend.

**Manager (sample persona: Raj, team lead, Accounts Payable Asia).** Promoted from senior analyst; his team doubled to 22 with new Vietnam and Thailand work; on calls with country controllers much of the day, phone in hand, already in Telegram. Needs to know what to do, why, and by when, and to close it in seconds. Should not be able to work out who said what. Needs to trust that Sapa is not a tool to judge him.

**New hire (sample persona: Mei Ling, Mandarin-speaking AP analyst).** Never opens the web app, but is the person the app most affects. Every message she gets from Sapa passes through HR in the web app, and her privacy choices decide what everyone else can see.

**Judges.** See the app on a projector for about 2 minutes, then may ask to see more during Q&A. They are checking whether the AI is useful, whether people stay in charge, and whether the privacy claims are real.

**Demo driver (a teammate).** Runs the live demo. Needs to move time forward ("jump to Day 14"), reset, and know before going on stage that the AI and Telegram links are working.

## 6. Commitments

These hold regardless of layout or flow. Each reflects a promise made to new hires or a judging criterion.

1. **Shared problems, not people.** No per-person score, mood, risk, rank or colour-coding anywhere. No side-by-side ranking of teams or managers. A team's themes show only for one chosen team at 5 or more people (R51), and managers are told this in their "What I can see" note. *Why:* the moment the app can rank people, it becomes a watch list, new hires stop answering honestly, and the responsible-AI case collapses.
2. **Numbers carry their base.** A count always shows how many people it is out of and over what period ("24 of 65 who answered, hired in the last 6 months"). Groups below the minimum size (5, R8) show an honest "not enough people yet" instead of a number. Managers see weekly snapshots only, with small counts shown as "fewer than 3" (R9). Impact figures say "Too few to tell yet" below 30 people and "a trend, not proof" (R42). *Why:* a bare number overclaims, and a small one identifies people.
3. **AI output is always recognisable as AI, sits next to its evidence, and has a human control beside it.** HR can confirm or correct any label, and the record shows who decided. Each count shows how much of it HR reviewed ("24 of 65: 17 reviewed, 7 AI-confident"). The one sentence to use everywhere: SQL counts; the AI suggests labels; labels the AI is unsure about wait for HR; HR reviews the evidence before any action. The AI writes to a new hire only two things, each labelled and each about something they asked for: a handbook answer that quotes a page HR published and, with `/myanswers`, the AI's reading of their own replies. *Why:* this is the core of the "AI solution" and "human review" criteria, and it is how HR learns how far to trust the AI. A panel shows how often HR changed the AI's labels, so HR sees if it gets worse (R44).
4. **Who can see what is visible where it matters.** A manager reads a new hire's words only if that person chose to share (R6). An action that came from someone who did not share must not reveal them, and the app prevents it rather than relying on HR to notice (R10). The manager's alert also waits for the weekly snapshot day, so its timing cannot point to one person (R10). *Why:* this is the promise that makes new hires willing to answer.
5. **Serious concerns are HR-only and kept apart from routine work** (R7). They never reach managers, never count in themes, and get a calm, careful treatment with a clear response clock. *Why:* someone reporting harassment by their supervisor must be able to trust that the supervisor will not see it.
6. **Every message a new hire receives is approved by HR, or is a fixed text a named checker approved with its language pack (R46), and HR sees exactly what it will look like** (R11, R28). There are two exceptions, each labelled as AI and each about something the person asked for: a handbook answer, which quotes a page HR published (R31); and the AI's reading of a person's own replies, which only that person sees, on request (R40). *Why:* the AI never speaks to employees in words HR has not stood behind.
7. **New hires' words are shown as written.** No silent translation or tidying. A reply in Chinese also shows an AI translation beside it, labelled as one, with the evidence highlighted in the original (R53). *Why:* the evidence has to be the person's real words.
8. **Every blocked or disabled choice says why.** One exception: a block that would show a person stopped, declined or left gives the single generic reason "This person is not receiving messages from Sapa now" (R41). *Why:* privacy rules should feel like help, not a mystery, and the reason must not reveal who stopped.
9. **Legible and accessible.** Meets WCAG 2.1 AA. Colour is never the only signal. The demo moments are readable on a 1280×720 projector from the back of a room.
10. **Fictional data only.** No real companies, people or real-looking ID numbers, in mocks or in the demo.

**Words.** Prefer "new hire", "who answered", "problem area" and "serious concern". Avoid words that suggest surveillance or judgement of people: risk, score, sentiment, mood, at-risk, monitor, track (for people).

## 7. User flows (recommended)

These flows describe what each person is trying to get done, and in roughly what order. They are the current best thinking, not a screen plan. One flow might be one screen or several; several flows might share a screen.

### Principles behind the flows

- **Lead with what needs a person.** HR does not open Sapa to browse charts. They open it to learn what needs them. The natural starting point is a short, ordered view: serious concerns first, then shared problems that are new or growing, then replies the AI was unsure about, then fixes that are stuck. Overall numbers and trends support this view; they do not replace it.
- **Review serves decisions, not inbox zero.** Two HR staff cannot read and approve every reply. They should check the evidence behind a pattern when they are about to act on it, and handle the cases the AI flagged as uncertain. Everything else can stay as an AI suggestion until it matters.
- **Pattern to fix is one continuous path.** Seeing a problem, checking it, drafting a fix, choosing who does it, and approving what new hires will hear should feel like one motion. Privacy checks happen inside that motion, not as a separate step.
- **The end of the loop comes to HR.** HR should not have to go looking to learn that a manager finished a fix, that new hires were told, or that the recheck shows improvement.
- **Managers live in chat (Telegram).** They have no web pages. Everything a manager needs comes to them in Telegram.

### Flow A — HR's regular check (the core loop)

1. **Arrive.** HR sees what needs them and a one-glance sense of how the current new hires are doing.
2. **Notice a shared problem.** For example: role clarity at Day 14, 24 of 65 who answered (65 people in the group answered Day 14; 24 of them were labelled role clarity), rising.
3. **Check it is real.** HR looks at the replies behind the count, with the AI's evidence highlighted in each person's own words. They correct any label that is wrong, and the count reflects the correction.
4. **Decide a fix.** HR starts from an AI draft based on a library of actions that shows how each worked here against other teams (R43), edits it, and chooses how wide it goes (one person who agreed to share, a manager's team, or a whole intake) and who owns it. The app shows who will see what, and stops choices that would reveal someone.
5. **Approve what new hires will hear.** HR approves a short note, in Bahasa Malaysia, English and Chinese, that new hires will receive when the fix is done, and sees it as they will. Or HR chooses no note and records why.
6. **Assign and move on.**
7. **Hear back.** HR is told when the manager accepts and completes the fix and when the note goes out. The score change builds up over the following check-ins ("Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks"), so HR sees if the fix beat what would have happened anyway.

Branches to handle: not enough people yet to show a pattern; the AI is unavailable (HR starts from the library); the manager is part of the problem, so HR owns the fix; HR dismisses a fix with a reason.

### Flow B — One reply that needs a look

The AI was unsure, could not find clear evidence, or flagged a reply for follow-up, or HR itself marks the reply as needing follow-up. HR reads the person's words next to the AI's suggestion, confirms or corrects it, and either marks it done or starts a fix. A fix aimed at that one person is only possible if they agreed to share. A fix for the pattern starts from the theme card, not from this reply (R10). HR can always offer the person help directly: one fixed "Would you like a short private chat with HR?" message, which the person answers Yes or No thanks (R39). It does not depend on the AI's flag. If the offer is blocked, HR sees one generic reason and cannot tell why (R41). A Yes becomes a contact task for HR. The manager never sees it. This is how the person who spoke up gets help now, while the team fix helps everyone later. Replies a new hire marked "this is wrong" from the bot's `/myanswers` command (R40) also land here, out of the counts until HR reviews them. This flow is also the clearest single picture of the whole product (input, AI, output, human decision), so it matters for the demo.

### Flow C — A serious concern

A reply mentions harassment, bullying, a safety risk, self-harm, or a sign of forced labour (a held passport or ID, debt to an agent, restricted movement; wage deductions only with another sign). The bot has already sent the person a fixed caring message with helpline numbers. For forced labour and sexual harassment it also names an outside authority that HR cannot remove (R14). HR is alerted at once. HR sees the full reply, what the bot already said, a short set of steps to follow (read, acknowledge, contact or record that the person asked not to be contacted, record the outcome, close), and how long it has waited against a one-working-day target. For sexual harassment, HR sees a reminder of the legal duty to act within 30 days. When closing, HR may send one fixed closure message, unless the person asked not to be contacted, stopped, deleted or left (R29). HR then sees one generic reason (R41). The tone throughout is quiet and serious, not alarming.

### Flow D — The manager carries out a fix

1. Raj gets an alert in Telegram: what to do, why (at team level, with no names unless someone chose to share), and by when. When the fix rests on replies from people who did not share, the alert arrives with the weekly snapshot and quotes only that snapshot (R10). Raj also gets fixed nudges at Day 1, 7 and 30 for each new hire in his team who is still with the company, whether or not they joined (R45).
2. He accepts.
3. He does the work.
4. He marks it done with one line on what he did. He is told that only HR sees that line.

Raj does all of this in Telegram. The bot also sends him a weekly team snapshot and a plain note on what he can and cannot see. He has no web pages.

### Flow E — The loop closes for new hires

This flow is mostly automatic, but HR must be able to see it. When a fix is marked done, the bot sends the HR-approved note to the new hires it covers who are still taking part. At each person's next check-in, the bot asks the same plain 1–5 question as before, with no hint of the fix. HR sees on the fix that the note went out, to how many people, and the score change as a difference against new hires outside the scope ("+1.3 against +0.1"). With fewer than 5 in scope it says "Not enough answers yet"; with fewer than 5 outside it says "Not enough comparison yet".

### Flow F — Setting up

Low frequency, but must be easy. HR adds a new hire (a code name, not their real name, plus role, team, manager, start date and language) and gets a QR code and link to hand over on Day 1. Per person, HR sees only whether the invite was used. How many joined, declined, stopped or skipped is shown per intake, and only at 5 or more (R41), so quiet people are never singled out. HR invites managers, who link their Telegram. HR can adjust check-in questions, the consent text and the action library in both languages, with a preview of what new hires will see, and set safe limits such as the minimum group size (never below 5). HR turns on a language pack only after a named person has checked it, and its AI counts without review only after the pack's own test has passed (R46). HR approves the manager milestone nudges and can hold new labels for review (always on during calibration, R44). At consent, a new hire may tick that HR may ask one question if they resign (R49).

### Flow G — Accountability

Low frequency, but visible to judges as proof of governance. HR can answer "who looked at this reply?", export or delete one person's data on request, and remove a manager's access at once. HR can also mark that a person has left the company, as resigned or ended by the company, which stops all messages to them and nudges about them (R1). HR enters hired and still-employed numbers per intake and agency separately (R42), so no per-person leaver date feeds the Impact figures.

### Flow I — Questions new hires ask

New hires ask the bot things like "how do I claim OT?". The bot answers from the handbook HR wrote, or says "I don't know yet" and logs the question. HR never sees who asked or their exact words. Once 3 different new hires ask the same thing within 30 days, HR sees it as a neutral line, with how many asked and whether the handbook answered it. Smaller groups show only as one total ("5 other questions from fewer than 3 people"). Questions on important matters are counted only by topic (R34). The privacy story: 5 people for themes, 3 for questions, because a question is not about the asker.

1. **Notice a gap.** A group reaches 3 different askers in 30 days and comes to HR's attention, for example "Where can I park my motorbike? 7 asked, not in the handbook". Groups the handbook already answers are shown too, as proof the handbook is working.
2. **Fill it.** HR writes or edits a handbook page in English and Bahasa Malaysia, sees it as a draft the bot cannot use, and publishes it. The next new hire who asks gets an answer.
3. **Keep it tidy.** HR sees the handbook as a short folder of pages (pay, leave, onboarding, facilities), and which pages answer which groups.

Branches to handle: a question about an important matter (pay problem, harassment, health and so on) is counted by topic but never answered by the AI; a group with only 1–2 askers stays inside the total; a deleted new hire stops counting. Managers never see questions.

### Flow J — Does it help people stay?

HR (and HR's boss) want to know if Sapa is worth it. An Impact view shows:

- Per intake, at 5 or more people: how many answered, and the median days from a reply to a fix being done.
- The score change after done fixes, as a difference against new hires outside the fix's scope (R26).
- The share of manager milestones done, per intake and never per manager (R45).
- The three fixes with the largest difference against other teams here (R43).
- Per role, at 5 or more people, "Job matches what you were told" (R52): which roles our job ads and interviews oversell. HR can draft a hiring-side fix for it. Managers never see this card.
- Across all completed intakes together, how many are still with the company at Month 6 against the company's usual rate (R42). HR enters hired and still-employed numbers per intake and agency, from its own records, once the intake passes Month 6. Sapa keeps no per-person leaver list, and a deleted person does not change this figure.
- At 5 or more answers over 12 months, "Top reasons leavers gave" (from the optional exit question, R49) beside "Top themes Sapa found earlier".

Below 30 people the retention figure says "Too few to tell yet (n of 30)". The view always says "This shows a trend, not proof that Sapa caused it". The trend over several intakes is the point. This view also feeds pitch slides 8 and 10.

### Flow K — Is the AI still right?

A panel shows, over the last 30 days and per driver and per language, the share of random spot checks HR changed and the number of challenges from `/myanswers`. It also shows false alarms and the share sent to review, per language, so a Manglish writer does not get more red flags than an English writer. A new organisation, driver or language starts in calibration: new labels wait for HR until 20 spot checks show at most 10% changed. After that, if HR changes more than 20% of the spot checks for a driver in a language, AI-confident labels for that driver and language stop counting until HR reviews them, and the card says why (R44). A pack whose own test has not passed shows "Not evaluated", and all its labels wait for HR (R46).

### Flow L — Agencies and reports

A recruitment agency that the employer has granted access to its placements sees only themes, the job-match card and retention for its own placements, pooled across them and at 5 or more people (retention from 30), and never personal data (R48). It never sees replies, questions, serious concerns or names. HR can also export worker-voice themes for an RBA or ESG report (R47). The export holds counts with their base and nothing else.

### Flow H — The pitch demo

The demo should be the real flows A, B, D, E and J, compressed, not a separate scripted path. The source of truth is the implementation spec, "Updated 2-minute demo". Three rules shape it. Raj's alert normally waits for the weekly snapshot day, so the demo starts the fix from the existing Role clarity card and not from Mei Ling's reply, and shows "In real use this alert waits until Monday" (R10). The count moves only after HR confirms the label, because the seed holds that driver in calibration (R44). Demo mode sends no milestone nudge and nothing about synthetic hires, so the jump to Day 30 leaves Raj's phone quiet (R23, R45).

| Beat | About | What judges must see |
| --- | --- | --- |
| 1. Check-in | 20 s | The driver jumps to Day 14; the phone gets the check-in; a teammate answers in Manglish |
| 2. One reply, one person | 30 s | The reply appears on HR's screen within seconds with its evidence highlighted, the AI label and the note "New labels wait for HR during calibration". HR clicks "Confirm label", and role clarity at Day 14 moves from 23 of 64 (16 reviewed, 7 AI-confident) to 24 of 65 (17 reviewed, 7 AI-confident). On the same reply HR marks follow-up and offers Mei Ling a private chat; beside it, the top unanswered question ("Where can I park my motorbike? 7 asked") |
| 3. The pattern | 20 s | She taps Yes on the phone; HR sees a contact task and closes it. HR drafts a fix from the Role clarity card, which shows how the fix worked against other teams. "Mei Ling only" is blocked because she chose HR only, so HR picks "Raj's team", approves the pre-filled note and assigns it to Raj |
| 4. Manager acts | 15 s | Raj accepts and marks it done; HR's screen shows it happen |
| 5. Loop closes | 15 s | The "Update from HR" note arrives on the phone; the clock jumps to the Day 30 check-in, whose first question is the neutral 1–5 one; the teammate taps 4 |
| 6. Outcome | 15 s | An earlier fix shows "Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks". The Impact view shows "Top reasons leavers gave: role clarity 5 of 12" beside "Sapa found role clarity at Day 14", and pooled retention as one line, "a trend, not proof" |

Demo controls (move the clock, reset, link status lights, a live log of the AI steps) exist only in demo mode. A short "How Sapa works" explanation (the loop, what AI does versus what people decide, who sees what, what Sapa never does) helps judges during Q&A.

## 8. Starting points for the design discussion

None of this is decided. It is here so the first conversation does not start from nothing.

- **Possible areas of the HR app:** a home that leads with what needs attention; shared problems (themes) with their evidence; replies; serious concerns; fixes and their progress; people and invites; impact, job match per role, manager milestones and AI-quality numbers (useful for pitch slides 8 and 10); questions new hires ask; the handbook; language packs; agency access and the worker-voice export; how Sapa works; settings; audit log. Some of these could merge. For example, replies might live inside themes rather than in a separate inbox.
- **The moment that probably matters most:** a single reply shown with the person's words, the AI's reading and evidence, and HR's decision, all in one view. It answers the judges' "what goes in, what AI does, what comes out, what a person does" in one look.
- **Tone:** calm, warm and trustworthy, a support tool rather than a security console. Red could be reserved for serious concerns only. AI output could carry one consistent marker that changes once a person has reviewed it.
- **Devices:** HR on a laptop (about 1280–1440 px). Managers see only Telegram on a phone. The demo on a 1280×720 projector.
- **Build context:** the app is planned on Next.js with shadcn/ui and Tailwind, so designs that map to standard shadcn components are fastest to build. This is a build convenience, not a limit on design thinking.
- **If time runs short:** design the moments in the demo first (flows A, B, D and E), then serious concerns, then the rest.

## 9. Sample data (fictional)

The company and its people are in [09](09-client-story.md). The demo numbers are in [05 "Demo setup"](05-implementation-spec.md#demo-setup); the points below are the ones the screens show.

- **Future year:** the demo shows a year that has not happened yet. Every HR screen in demo mode carries the banner "This is a future year: what HR would see one year into Sapa. These numbers are fictional."
- **Organisation:** Contoh GBS (Contoh Global Business Services (Penang) Sdn Bhd), 650 staff, Kuala Lumpur time.
- **People:** HR: Kavitha (site HR manager), Aishah (HR executive, the only one on new hires), Daniel (HR admin), Farah (recruiter), Jason (HR business partner). Managers: Raj (Accounts Payable Asia), Siti (Order-to-Cash Asia). New hires in the October intake: Mei Ling (the live demo hire, Mandarin-speaking AP analyst in Raj's team, writes Manglish), Hafiz (IT service desk, Europe shift, writes BM), Arif, Priya, Nurul, Kumar.
- **Demo starting point:** 100 hires (99 synthetic and the live hire) from the last six monthly intakes; 64 have answered Day 14; role clarity is 23 of 64 (16 reviewed, 7 AI-confident). After Mei Ling replies (her label waits for HR during calibration) and HR confirms it, the card becomes 24 of 65 (17 reviewed, 7 AI-confident). Raj's team has a weekly snapshot, taken before her reply, of 5 of 9 who answered naming role clarity. The Korean desk has only 3 answers, so its team view shows "Not enough people yet (3 of 5 needed)".
- **Mei Ling's reply:** "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu." Evidence: "tak tahu mana nak buat dulu". AI summary: "Has several urgent tasks and is unsure which to do first." (Three country controllers each marked their invoices urgent.)
- **Other replies:** "Saya belum dapat akses sistem SAP lagi." (onboarding). "My buddy has been really helpful this week." (going well). "Month-end close, OT until 11pm every day, very tired lah." (workload). "Europe shift, I never see my team lead free." (manager support).
- **The fix:** "Weekly priority list every Monday", owned by Raj, for Raj's team. HR starts it from the Role clarity card and not from Mei Ling's reply. The library shows "Used 3 times here. Role clarity rose 1.0 more than in other teams (41 people)". Note to new hires (EN): "Your team now agrees a top-3 priority list with your team lead every Monday." (BM): "Pasukan anda kini menetapkan 3 keutamaan utama bersama ketua pasukan setiap Isnin."
- **Recheck:** "How clear are you on what is expected of you this week? (1–5)" Mei Ling taps 4. The live fix shows "Not enough answers yet (1 of 5)". An earlier fix, "Share the written job scope" (Raj's team, done 8 September), shows Role clarity 2.5 → 3.8 for 6 people in scope and 2.7 → 2.8 for 44 new hires outside it (+1.3 against +0.1).
- **Job match:** Accounts payable analyst, 12 of 26 said "not really" at Day 14 (the agency advert said "Finance Analyst"). Other roles have fewer than 5 answers, so they show "Not enough people yet". Mei Ling's role is "AP analyst (Mandarin)", a different role.
- **Questions:** "How do I claim overtime?" 11 asked, answered by `pay/overtime.md`. "Where can I park my motorbike?" 7 asked, not in the handbook, brought to HR's attention. "When is my first payday?" 2 asked, so it shows only inside the "fewer than 3" total.
- **Impact:** six completed intakes, November 2025 to April 2026 (99 hired in all): 80 of 99 still employed at Month 6, against a usual 73 in 100, shown as "a trend, not proof". The Group's target is 85. Median 9 days from reply to fix done. Manager milestones done: 231 of 297. Top reasons leavers gave (12 answers): role clarity 5, onboarding and training 4, workload 2, belonging 1, beside role clarity as the top Day 14 theme Sapa found. Numbers are fictional.

## 10. Out of scope

- The Telegram bot's own messages, buttons and commands (they live in the implementation spec; the web app may preview them).
- Uploading handbook files (PDF, Word). Pages are written in the app as text.
- A web app for new hires.
- Any per-person analytics, prediction, sentiment or ranking, now or later.
- Multi-company admin, billing and HR-system integrations.
- Pitch slide design.

## 11. Open questions for the design discussion

1. How much must HR review before a theme counts? The implementation spec counts labels that HR reviewed or that the AI was confident about. The design should make that difference visible without making HR review everything.
2. Should the HR home lead with "what needs you", with the loop numbers as support (recommended above), or lead with the loop numbers?
3. How live should HR's view be outside the demo: instant updates, or a calmer daily summary?
4. Do managers see the full "How Sapa works" explanation or a shorter version?
