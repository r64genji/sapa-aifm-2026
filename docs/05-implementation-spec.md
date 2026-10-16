# Spec — Sapa: voluntary new-hire check-ins, from reply to tracked action

*As of 15 Oct 2026. This is the **implementation spec**: behaviour, rules, data, AI and tests. The dashboard's screens and visual design live in the separate [dashboard PRD](06-dashboard-prd.md), which is designed in Claude Design. Built from [01 rundown](01-product-rundown-and-deliverables.md), [02 architecture](02-prototype-architecture.md), [03 dossier](03-research-dossier.md) and the fixes in [04 adversarial review](archive/04-adversarial-review.md), [11 rubric review 3](archive/11-rubric-review-3.md) and [12 rubric review 4](archive/12-rubric-review-4.md). Where this spec and 02 disagree, this spec wins. Labels: `ready-for-agent`.*

**Contents**

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [User Stories](#user-stories)
- [Implementation Decisions](#implementation-decisions)
- [Testing Decisions](#testing-decisions)
- [Out of Scope](#out-of-scope)
- [Further Notes](#further-notes)

## Problem Statement

HR teams at companies that hire every month lose many new hires in the first six months. They find out why only at the exit interview. By then the person has gone, the reasons are softened, and each interview is read alone, so no pattern shows.

The causes are usually ordinary and fixable: unclear priorities, weak onboarding, little support from the supervisor, feeling left out, and too much or too little work. New hires do not raise these early. They fear it will hurt their probation, and nobody asks them in a way that feels safe.

HR is a handful of people for hundreds of staff, and often only one of them works on new hires. They cannot call every new hire. When they do collect feedback (a form, a chat message), nobody reads it in a structured way, nothing links it to an action, and nobody checks if the action helped.

Line managers want new hires productive fast. They do not know what their new hires struggle with, and they are rarely trained in onboarding.

New hires, whether on a shop floor, in an outlet or on a shared services floor where company email and system access arrive days after they start, have no private, low-effort way to say "I don't know what my priorities are" before it turns into a resignation.

### Evidence

- Business leaders at Malaysian and Singapore companies of 200–500 staff expect to lose 23% of new hires within six months (Employment Hero survey of 515 leaders, Malay Mail, 2023). This is an expectation, not a measured rate.
- Malaysian attrition was 18.2% in 2025 (Aon Salary Increase and Turnover Study).
- The top reasons for exits in the first 90 days: job expectations not matching reality (30.3%), lack of connection (19.5%) and poor onboarding (17.4%) (Enboarder 2025; HR leaders in the US, UK and Australia, not Malaysia). These map to Sapa's problem areas ROLE_CLARITY, BELONGING and ONBOARDING_TRAINING.
- **Practitioner evidence (to be filled by the team from real interviews; never invented).** 3–5 quotes from Malaysian HR practitioners, each with their own early-leaver number if they give one, and their answer to "Would you let Sapa run for three monthly intakes, each until Month 6?". Interview guide: `deliverables/09-testing-evidence`. If no interview is done, the pitch says "desk research only".

Sources and caveats: `docs/03-research-dossier.md` section B. The reference customer and its numbers: `docs/09-client-story.md`.

## Solution

Sapa is a chat bot plus a web app.

**The core loop.**

1. A new hire answers a short check-in in chat. The AI labels the reply and quotes the words it relied on.
2. HR checks the evidence and assigns a fix.
3. The manager does the fix and marks it done.
4. New hires hear what changed, and the next check-in asks the same 1–5 question again.

**Four layers around the loop.** Each adds to the loop. None replaces it.

- **Reach.** Three language packs (Bahasa Malaysia, English and Chinese, with Manglish accepted in the BM and English packs, R46), Telegram and handbook Q&A between check-ins (R30–R35).
- **Care.** A fixed offer of a private chat for one person (R39), serious concerns that go to HR only (R7, R13, R14), and manager milestone nudges (R45).
- **Proof.** Score change against other teams (R26), fix evidence (R43), the job-match card (R52), the Impact view and the exit check (R42, R49).
- **Trust.** The AI quality watch (R44), `/myanswers` (R40), the worker-voice export (R47) and the agency view (R48).

The demo shows the core loop with R10, R26, R28, R39, R42–R44 and R49. The other rules stay ready for Q&A. The detail follows, by person.

**For the new hire.** HR shows one QR code to the whole intake on Day 1 (R27). The new hire opens the bot in Telegram, reads a short consent message in Bahasa Malaysia, English or Chinese (R46), picks their team, and chooses who may see their words: HR only (the default) or HR and their manager. They may also tick that HR may ask them one question if they resign (R49). Over six months the bot sends seven short check-ins (Day 3, 7, 14, 30, 60, 90 and Month 6). Each takes about a minute: a few button questions and one open question, typed. Sometimes the bot asks one neutral follow-up from a fixed list. The commands (`/skip`, `/stop`, `/delete`, `/privacy`, …) show in the new hire's language, in Telegram's `/` menu, and they always work, even if the AI is down. Between check-ins the new hire can also ask the bot questions about the company ("how do I claim OT?"). The bot answers only from the HR handbook, labels the answer as AI, shows the handbook sentence it relied on, and points to HR for anything important. When no page exists in their language, it uses the English or Bahasa Malaysia page and says so (R31). Questions many new hires ask, and the handbook cannot answer, go to HR without names, so HR can fix the gap in onboarding.

**For HR.** A dashboard shows the problems new hires share: "Role clarity at Day 14: 24 of 65 who answered", over everyone hired in the last six months. SQL counts. The AI suggests labels. Labels the AI is unsure about wait for HR. A new organisation, language or driver starts in calibration: new labels wait for HR until spot checks show the AI is right (R44). HR reviews the evidence before any action. Each card shows how many of its labels HR reviewed. Counts appear only when at least 5 people answered. HR sees each reply with the AI's tag, a one-line summary and the exact sentence used as evidence, and can correct any tag. For one person who needs help, HR can mark the reply as needing follow-up and send a fixed offer of a private chat (R39). Serious disclosures (harassment, bullying, self-harm, safety, wage or legal violations, and signs of forced labour such as a held passport or debt to an agent) go to a red queue for HR only. The fixed reply for forced labour and sexual harassment always names an outside authority (R14). HR clicks "Draft action", the AI proposes a fix from a library and says which entries worked here before, compared with other teams (R43), HR edits it and assigns it to a manager. When writing the action, HR also approves a short note for new hires. When the manager marks the action done, the bot sends that note to the new hires it affects ("Update from HR: …"), so they see that speaking up led to a change. At their next check-in the bot asks the same 1–5 question as before, so HR sees the score change after the fix beside the change in other teams (R26). An Impact view shows score changes, manager milestones done and, across all completed intakes, whether new hires stay past six months against the company's own baseline. It shows a trend, not proof (R42). A job-match card shows, for each role, how many new hires said the job is not what they were told, so HR can fix the job ad (R52). A panel shows how often HR changes the AI's labels on random spot checks (R44). HR can export worker-voice themes for an RBA or ESG report (R47). An agency sees themes, the job-match card and retention for its own placements only, pooled and at 5 or more people (R48).

**For the manager.** Managers use only Telegram; they have no web pages. The manager gets a Telegram alert for each action, with Accept and Mark done buttons. They accept it, do it, and mark it done with a one-line outcome. They never see a new hire's words unless that person agreed. The bot sends them their team's themes only as weekly snapshots, never live, so they cannot work out who said what. An alert for a fix that rests on replies from people who did not share waits for the snapshot day (R10). They also get fixed milestone nudges for each new hire in their team: assign a buddy on Day 1, book a priorities chat by Day 7, agree a 30-60-90 plan by Day 30 (R45). Nobody ranks managers or teams (R51).

**What the AI does, and only this.** It tags each reply to a fixed list of problem areas with an evidence quote. It decides if a reply needs follow-up and which fixed probe to send. It writes a short narrative over counts that SQL already computed. It drafts an action that a human edits. It answers new hires' questions only from the HR handbook, and only when code finds its supporting quote word for word in the cited page. Apart from the two things named below, it never writes free text to an employee. It never counts, never scores emotions or quit risk, and never decides anything about a person's job. The AI writes to a new hire only two things, each labelled and each about something they asked for: a handbook answer that quotes a page HR published and, with `/myanswers`, the AI's reading of their own replies. They can say that reading is wrong (R40).

**For the pitch.** A demo clock lets the team jump the whole loop forward on stage: a judge-visible phone receives the Day 14 check-in, the reply appears tagged on the HR dashboard within seconds, HR confirms the label and the count moves, HR sees the top unanswered question beside it, offers the person a private chat, drafts and assigns an action from the theme card that the app keeps from naming the person, the manager closes it from Telegram, the "Update from HR" note arrives, the neutral recheck question follows at the Day 30 check-in, and the stage ends on the earlier fix's score change against other teams and on the Impact view, where the leavers' reasons match what Sapa found early.

## User Stories

### New hire — joining and consent

1. As a new hire, I want to join by scanning a QR code or tapping a link, so that I do not need a company email or an app login.
2. As a new hire, I want the bot to greet me with my company's name, so that I know it is the real company programme and not spam.
3. As a new hire, I want to choose my language (Bahasa Malaysia, English or Chinese, R46) before I read anything else, so that I understand the consent message fully.
4. As a new hire, I want the consent message to say what is collected, who sees it, how long it is kept, and how to stop or delete, so that I can make an informed choice. It also says the bot can answer questions from the HR handbook, that answers are AI, and that questions reach HR only without my name.
5. As a new hire, I want the consent message to say clearly that saying no or stopping has no effect on my job or probation, so that I do not feel forced.
6. As a new hire, I want the consent message to say that HR cannot see who I am unless I choose to tell them, and that Sapa and Telegram can still see my chat, so that I am not misled.
7. As a new hire, I want to tap "I agree" or "No thanks", so that joining is a deliberate act.
8. As a new hire who taps "No thanks", I want the bot to confirm and never message me again, so that my choice is respected.
9. As a new hire, I want to choose "HR only" or "HR and my manager" with HR only selected by default, so that I control who reads my words.
10. As a new hire, I want to change my visibility choice later with a command, so that I can share more or less as trust changes.
11. As a new hire, I want a link that only works once, so that nobody else can join as me.
12. As a new hire who opens an expired or used link, I want a plain message telling me to ask HR for a new one, so that I am not stuck.

### New hire — check-ins

13. As a new hire, I want check-ins only at set points (Day 3, 7, 14, 30, 60, 90, Month 6), so that I am not pestered.
14. As a new hire, I want check-ins only in working hours on working days, so that work does not follow me home.
15. As a new hire, I want most questions as buttons, so that I can answer on a phone in seconds.
16. As a new hire, I want one open question each time, so that I can say what the buttons miss.
17. As a new hire, I want to answer in Manglish or mixed language, so that I can write how I talk.
18. As a new hire, I want at most one or two follow-up questions, and only neutral ones, so that the bot never feels like an interrogation.
19. As a new hire, I want no follow-up at all when I mention something serious, so that I am not probed about a painful matter by a bot.
20. As a new hire, I want one reminder after 24 hours and then silence, so that missing a check-in is fine.
21. As a new hire, I want to use `/skip` (`/langkau`) to skip a question or a check-in, so that I answer only what I want.
22. As a new hire, I want to use `/stop` (`/berhenti`), or just type STOP, to end all check-ins, so that I can leave at any time.
23. As a new hire, I want to use `/delete` (`/padam`), or just type DELETE, to remove everything I said, so that my words do not stay with the company.
24. As a new hire, I want DELETE to ask me once to confirm, so that a typo does not wipe my answers.
25. As a new hire, I want commands to work even when the AI is down, so that opting out never depends on a model.
26. As a new hire, I want a short thank-you after each check-in, so that I know it was received.
27. As a new hire, I want the bot to tell me when an issue I or others raised has been resolved ("Update from HR: your team now has a weekly priorities chat every Monday"), so that I see that answering matters.
28. As a new hire, I want the recheck after a fix to be the same plain 1–5 question I was asked before (for example "How clear are you on what is expected of you this week? (1–5)"), so that I can say honestly whether things changed and the question does not hint at the answer.
29. As a new hire, I want to type HELP (BANTUAN) to see the commands and who sees my answers, so that I can check at any time.

### New hire — serious disclosures

30. As a new hire who reports harassment, bullying, a safety risk or a crisis, I want a fixed caring reply with emergency and helpline numbers, so that I get real help at once.
31. As a new hire who reports something serious, I want to know that HR, not my manager, will see it, so that I feel safe if my manager is involved.
32. As a new hire who reports something serious, I want to ask HR not to contact me now, and to be told honestly that for some matters HR may still need to follow up, so that I am not misled.

### HR — setup

33. As an HR user, I want to sign in with email, so that only staff with an account can see data.
34. As an HR user, I want to create an intake with a start date and its teams, so that the bot knows the schedule and the teams without anyone typing a real name into the system.
35. As an HR user, I want one QR code and link per intake, so that I can show it once on Day 1 and nobody can link a chat to a name.
36. As an HR user, I want to see per intake how many joined, declined, stopped or skipped (shown only at 5 or more), so that I know coverage without singling out quiet people (R41).
37. As an HR user, I want to invite managers and link them to their new hires, so that actions reach the right person.
38. As an HR user, I want to set the minimum group size (default 5, never below 5), so that I can be stricter but not weaker.
39. As an HR user, I want to set the retention period for raw text (default 6 months after the last check-in), so that we keep words no longer than needed.
40. As an HR user, I want to set the escalation contacts and helpline text shown to employees, so that the safe reply has correct numbers.
41. As an HR user, I want to set the organisation time zone and public holidays, so that check-ins land in working hours.
42. As an HR user, I want to view and edit the question bank in each active language, so that wording fits our workplace.

### HR — reviewing replies

43. As an HR user, I want a flag queue of replies that need follow-up, newest first, so that I see what needs me.
44. As an HR user, I want escalations pinned at the top in red with the fixed protocol steps, so that serious matters are never buried.
45. As an HR user, I want each reply shown with the AI summary, tags and evidence quote beside the original text, with the quote highlighted, so that I can check the AI's reading in seconds.
46. As an HR user, I want to correct any tag, and to set or clear the "needs follow-up" flag on a reply, with an audit row, so that the record reflects my judgement, not the model's, and I can help a person even when the AI missed it.
47. As an HR user, I want to mark a reply as reviewed, so that the queue empties as I work.
48. As an HR user, I want replies the AI could not read ("awaiting AI" or "needs review") to show clearly, so that nothing is silently lost.
49. As an HR user, I want to retry the AI on a reply, so that a temporary outage does not leave it untagged.
50. As an HR user, I want new replies to appear on my open dashboard within seconds, so that I can act on urgent items without refreshing.
51. As an HR user, I want to acknowledge an escalation and record that I made contact, so that there is a record of the duty of care.
52. As an HR user, I want the escalation list to show how long each has waited against the 1-working-day target, so that none goes stale.

### HR — themes

53. As an HR user, I want theme cards showing each problem area as "N of M who answered" for one touchpoint (Day 14 by default, switchable), where M is the people in the group who answered that touchpoint and N is those of them with that label, so that I see what is shared, not what one person said.
54. As an HR user, I want themes over everyone still in their first six months (hired in the last six months, so each person leaves the group on their own Month 6) by default, so that a small monthly intake still gives a signal and the group matches the six-month problem.
55. As an HR user, I want to drill into a single intake or a single touchpoint when it has enough people, so that I can see when problems start.
56. As an HR user, I want a clear "Not enough people yet (3 of 5 needed)" message instead of a blank card, so that I understand why nothing shows.
57. As an HR user, I want a short narrative of what is going well and what is not, written from the counts, so that I can paste it into a management update.
58. As an HR user, I want themes counted only from tags that HR reviewed or that the AI was confident about, and each card to show the split ("24 of 65: 17 reviewed, 7 AI-confident"), so that the counts are trustworthy and I see how much rests on the AI.
59. As an HR user, I want a weekly trend per theme, so that I see if a problem grows or shrinks.
60. As an HR user, I want pay, growth and commute concerns shown as context for HR only, so that issues outside a manager's control are not sent as manager tasks.

### HR — actions

61. As an HR user, I want to click "Draft action" on a theme, or on a reply from someone who agreed to share (R10), so that I start from a concrete suggestion.
62. As an HR user, I want the draft to come from the action library for that problem area, so that suggestions are proven and consistent, and I see how each entry has worked here against other teams (R43).
63. As an HR user, I want to edit the draft freely before anyone sees it, so that the final text is mine.
64. As an HR user, I want the system to stop me assigning an action that would expose a person who did not consent, so that I cannot break our promise by accident.
65. As an HR user, I want to choose the action scope (one consenting person, a manager's team, or a whole intake), so that the action matches the problem.
66. As an HR user, I want to assign the action to a manager with a due date, so that someone owns it.
67. As an HR user, I want to own an action myself, so that I can handle cases where the manager is the problem.
68. As an HR user, I want an actions board with columns for draft, assigned, accepted, done and dismissed, so that I see progress at a glance.
69. As an HR user, I want overdue actions highlighted, so that I can nudge managers.
70. As an HR user, I want to see the score change on each done action beside the change for new hires outside its scope ("Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks"), so that I know if the fix worked and not only if the score rose.
71. As an HR user, I want to dismiss an action with a reason, so that the board reflects real decisions.

### HR — privacy and governance

72. As an HR admin, I want an audit log of every view of reply text and every change, with who and when, so that misuse is visible.
73. As an HR admin, I want to remove a manager's access at once, so that I can act on misuse.
74. As an HR admin, I want to send one person's data to that person on request, with a reason recorded and an audit row, so that we can meet a data access request and HR holds no export of it.
75. As an HR admin, I want raw text deleted automatically after the retention period, so that we do not keep words longer than promised.
76. As an HR admin, I want to see which consent text version each person agreed to, so that we can prove what they were told.

### Manager

77. As a manager, I want to do everything in Telegram, with no web app to sign in to, so that I have one place for actions.
78. As a manager, I want to link my Telegram with a one-time link, so that I get alerts where I already am.
79. As a manager, I want an alert in Telegram when an action is assigned to me, with Accept and Mark done buttons, so that I can act without opening a laptop.
80. As a manager, I want each action to show theme-level context from the last weekly snapshot ("4 new hires in your team named priorities in the last snapshot") and no names unless consented, and to say "several" only when that count is 3 or more, so that I know why without breaking trust.
81. As a manager, I want to see a new hire's own words only when that person chose to share with me, so that I can help them directly when invited.
82. As a manager, I want to accept an action, so that HR knows I own it.
83. As a manager, I want to mark an action done with a one-line outcome, so that HR sees what I did.
84. As a manager, I want the bot to send me my team's themes as a weekly snapshot, so that I understand the bigger picture.
85. As a manager, I want no access to escalations, flags, individual tags or individual history, so that nobody can say I used this against them.

### Demo team

86. As the demo driver, I want an "Advance to Day N" control, so that I can show a Day 14 check-in on stage now.
87. As the demo driver, I want advancing the clock to send to the live phone only, and no message about a synthetic person to anyone, so that nothing goes to a stranger and Raj's phone stays quiet on stage.
88. As the demo driver, I want a seeded group of 100 hires across six monthly intakes (99 synthetic and the live hire), where 64 have answered Day 14, so that the live reply, once HR confirms its label, makes the count go from 23 of 64 to 24 of 65.
89. As the demo driver, I want a one-click reset to the seeded state, so that we can rehearse again and again.
90. As the demo driver, I want the bot reply and the dashboard update to take under 5 seconds each, so that the 2-minute demo fits.
91. As the demo driver, I want the seeded themes and actions to show even if the model is down, so that the demo still makes sense.

### Evidence team

92. As the data teammate, I want a synthetic cohort generator with planted themes, so that the demo and the timing test use realistic data.
93. As the data teammate, I want an eval command that runs the classifier on the labelled set and reports κ per driver and per language, the precision of the tags that count without review, follow-up recall, escalation recall with a confidence interval, and each AI step against a plain template, so that slide 8 has honest numbers.
94. As the data teammate, I want separate dev and test splits, so that tuning the prompt does not inflate the reported score.
95. As the data teammate, I want a reliability run with injection, gibberish, empty and emoji-only replies, so that we can report safe handling.
96. As a judge, I want to see the consent screen and the "what Sapa never does" list in the demo, so that I can trust the responsible-AI claim.

### New hire and HR — resolution notices

97. As a new hire, I want the resolution message in my chosen language, so that I understand it.
98. As a new hire, I want the message to say what changed in plain words and not name anyone, so that nobody is singled out.
99. As a new hire, I want the message only in working hours, so that it does not arrive at night.
100. As a new hire who stopped or deleted, I want no resolution message, so that STOP means stop.
101. As a new hire who raised a serious matter, I want HR to be able to tell me my report is closed, unless I asked not to be contacted, so that I am not left wondering.
102. As an HR user, I want to write and approve the employee note in English, Bahasa Malaysia and Chinese when I assign the action, with an AI draft to start from, so that the note goes out the moment the manager is done without another step from me.
103. As an HR user, I want to edit or cancel the note until it is sent, so that I can fix it if the outcome changed.
104. As an HR user, I want the action card to show "Notice sent to N new hires" with the time, so that I know the loop closed.
105. As an HR user, I want no notice sent for a dismissed action, so that we never claim a fix that did not happen.
106. As a manager, I want my outcome note to stay internal and never be sent to new hires, so that I can write it plainly.

### New hire — commands and questions (Q&A)

107. As a new hire, I want Telegram's `/` menu to list Sapa's commands in my language, so that I never have to remember them.
108. As a new hire, I want commands in either language to work for me, so that a BM word typed by habit still works.
109. As a new hire, I want to ask a question about the company at any time between check-ins, so that I do not have to bother my supervisor with small things.
110. As a new hire, I want to just type my question, or use `/ask` (`/tanya`), so that asking is easy.
111. As a new hire, I want each answer clearly marked as an AI answer, with the handbook page and the exact handbook sentence it is based on, so that I can judge it myself.
112. As a new hire, I want every answer to tell me how to reach HR, so that I can check anything important with a person.
113. As a new hire, I want a follow-up question within a few minutes to be understood in context, so that I do not have to repeat myself.
114. As a new hire who asks about something serious or personal (harassment, safety, crisis, a pay problem, probation or resignation, health, legal), I want to be pointed straight to the right person, not given an AI answer, so that important matters are handled by people.
115. As a new hire who asks something the handbook does not cover, I want an honest "I don't know yet" and to know my question was logged for HR without my name, so that I am not given a made-up answer.
116. As a new hire, I want my questions never shown to my manager, and never shown to HR with my name, so that I can ask freely.
117. As a new hire, I want DELETE to remove my questions too, so that deletion means everything.
118. As an HR user, I want a list of the questions new hires ask, grouped by meaning, with how many different people asked each, so that I see where onboarding leaves people guessing.
119. As an HR user, I want a group brought to my attention when 3 different new hires ask it within 30 days, so that I act on patterns, not one-offs.
120. As an HR user, I want to see whether the handbook already answers each group, so that I know which gaps to fill.
121. As an HR user, I want to write and publish handbook pages in English and Bahasa Malaysia in the dashboard, organised as a folder of pages, so that the next new hire who asks gets an answer.
122. As an HR user, I want draft pages to stay invisible to the bot until I publish them, so that half-written policy is never quoted.
123. As an HR user, I want a top-questions tile on my Overview, so that onboarding gaps sit beside the themes.

### One person's help, own-data view and impact

124. As an HR user, I want to send one fixed offer of a private chat to a new hire whose reply is flagged for follow-up, by the AI or by me, even if they chose "HR only", so that the person who spoke up gets help and not only a team fix weeks later.
125. As a new hire, I want to answer that offer with "Yes" or "No thanks", so that I choose whether HR contacts me.
126. As an HR user, I want a "Yes" to become a contact task with a due date, so that the offer is followed through.
127. As a new hire, I want `/myanswers` (`/jawapansaya`) to show my stored replies with the AI summary (in my reply's language) and the tags HR sees, marked "Changed by HR" where HR changed a label, so that I know what the AI and HR said about me.
128. As a new hire, I want to mark an AI reading of my reply as wrong, so that HR checks it and it stops counting until then, and I get a short fixed reply when HR has checked it.
129. As an HR user, I want to mark that a new hire has left the company, as resigned or ended by the company, so that Sapa stops all messages to them and nudges about them (R1).
130. As an HR user, I want an Impact view (response rate and median days from reply to action done per intake, the average score change after done actions against other teams, manager milestones done, and six-month retention across all completed intakes against our baseline), so that I can show management whether Sapa helps.
131. As an HR admin, I want to enter our usual six-month retention once as the baseline, so that the Impact view compares with our own history.
132. As an HR user, I want to enter, for each intake that has passed Month 6 and each agency (or no agency), how many people we hired and how many were still employed at Month 6, from our own records, so that the retention figure counts everyone hired and does not change when someone deletes their data.
133. As an HR user, I want the Impact view to say "Too few to tell yet" below 30 people and "This shows a trend, not proof that Sapa caused it", so that nobody reads more into it than it holds.
134. As an HR user, I want to see the three fixes with the largest change against other teams in the Impact view, so that I know what keeps new hires at this company.

### Reach, learning and care

135. As an HR user, I want the draft screen to show how each library entry has worked here ("Used 3 times here. Role clarity rose 1.0 more than in other teams (41 people)"), or "Not enough comparison yet" or "Not enough evidence here yet", so that I pick fixes that worked and not fixes that only looked good because low scores rise on their own.
136. As an HR admin, I want a language pack's AI to count without review only after the pack's own test has passed (R46), so that no tag in a language we have not tested moves a count.
137. *Removed. Other languages are out of scope.*
138. *Removed. WhatsApp is out of scope.*
139. *Removed. Voice notes are out of scope.*
140. *Removed. Voice notes are out of scope.*
141. As a new hire, I want to tick at consent that HR may ask me one question if I resign, so that I choose whether to give a reason later.
142. As a new hire who has left the company, I want all check-ins and reminders to stop, and one fixed message to tell me my answers are kept until a date and that I can type DELETE, so that I am not messaged after I leave.
143. As an HR user, I want a red-queue flag for signs of forced labour (passport or ID held, debt to an agent or a recruitment fee, restricted movement, and wage deductions only together with another sign), in Bahasa Malaysia and English, going to HR only, so that these signs are never buried or shown to a manager, and a normal EPF or tax deduction does not set it off.
144. As an HR user, I want to export worker-voice themes by intake, at 5 or more people, for our RBA or ESG report, with no replies, names or escalation details, so that I can show an auditor how we listen.
145. As an HR user, I want a panel with the share of random spot checks HR changed and the number of challenges, per driver and per language, over the last 30 days, so that I see if the AI gets worse.
146. As an HR user, I want AI-confident tags for a driver and language to stop counting when HR changed more than 20% of its spot checks (at 10 or more), with the reason on the card, so that a drifting AI cannot move the counts.
147. As an HR admin, I want new tags held until HR reviews them, always for a new driver and language until calibration passes and by a setting at any time (R44), so that no count moves before a person has checked.
148. As an HR admin, I want to approve the manager milestone nudges (Day 1, 7 and 30) in each language, so that managers get help to onboard well before anyone complains.
149. As a manager, I want a fixed nudge in Telegram at Day 1, 7 and 30 for each new hire in my team who is still with the company, each with a Done button, so that I know what good onboarding looks like.
150. As an HR user, I want the share of milestones done per intake (5 or more hires) and never per manager, so that I see whether managers are helped and nobody is ranked.
151. As a manager, I want a note that says nobody compares teams or managers side by side, so that I trust the tool.
152. As a manager, I want an alert about a team-level fix that rests on replies from people who did not share to arrive on the weekly snapshot day, so that its timing does not show me who spoke up.
153. As an HR admin, I want to give an agency access to its own placements, so that the agency that placed the people can see how they settle in.
154. As an agency user, I want themes, the job-match card and retention for my placements, pooled over all my placements and shown only at 5 or more people (retention at 30 or more), and no replies, questions, escalations, names or personal data, so that I can improve my placements without reading anyone's words.
155. As an HR user, I want exit-question answers shown only as "Top reasons leavers gave", beside "Top themes Sapa found earlier", at 5 or more over 12 months, so that I can check if the early themes match the real reasons.
156. As an HR user who cannot send an offer or a closure message, I want one generic reason ("This person is not receiving messages from Sapa now"), so that I cannot tell who stopped.
157. As the demo driver, I want HR to click "Confirm label" before the count moves, so that the stage shows a person checking the AI and does not depend on the model's confidence.
158. As the demo driver, I want the demo action to start from the Role clarity theme card and to show "In real use this alert waits until Monday", so that the stage shows the privacy rule and not a leak.
159. As the demo driver, I want the demo to end on a seeded earlier fix's score change against other teams, then on the leavers' reasons beside Sapa's early theme, with retention as one line marked "a trend, not proof", so that judges see an outcome that does not rest on one person.
160. As an HR user who does not read Chinese, I want an AI translation, labelled as one, beside each reply written in Chinese, with the original kept as written, so that I can check the evidence myself (R53).
161. *Removed. It was only for the other language packs, which are out of scope.*
162. As a new hire whose language has no published handbook page, I want the English or Bahasa Malaysia answer with a fixed note that says so, so that I get an answer and know what language it is in (R31).
163. *Removed. The fixed notice was only for the other language packs, which are out of scope.*
164. As an HR user, I want a "Job matches what you were told" card for each role, at 5 or more people, so that I see which roles our job ads and interviews oversell (R52).
165. As an HR user, I want to draft a hiring-side action from that card, owned by HR or the recruiter and never given to a line manager, so that the fix goes where the cause is (R52).
166. As an HR user, I want each week's random spot checks of AI-confident tags in my review queue, marked "Spot check", so that I can see if the tags that count without review are right (R44).
167. As an HR admin, I want AI-confident tags in a new organisation, driver or language to count without review only after 20 spot checks with at most 10% changed, so that the hold is a real default and not a stage trick (R44).
168. As a new hire who reports forced labour or sexual harassment, I want the fixed reply to include an outside authority that HR cannot remove, so that I can reach help even if my employer or its agent is the problem (R14).
169. As the demo driver, I want the card to show "New labels wait for HR during calibration" in the review beat, so that the stage says plainly why the count waits for HR (R44).

## Implementation Decisions

### Rules (the source of truth for tests)

Each rule has an ID. Tests cite the ID. A rule changes only with team approval.

- **R1 Consent gate.** No check-in, reminder or recheck is sent to a person without an active, non-withdrawn consent. HR marks a person who left the company as "resigned" or "ended by the company". When HR does, all scheduled check-ins, reminders, rechecks, notices and offers for that person, and manager milestone nudges about that person (R45), are cancelled. The bot sends one fixed message: "Your check-ins have ended. Your answers are kept until [date]. Type DELETE to remove them now." ([date] is the R24 retention date.) Only the R49 exit question may follow, and only if the person resigned and ticked it at consent.
- **R2 Commands first.** Every command in R36 is matched before any AI call or safety check, in the language of any active pack (R46), case-insensitive. They work when the model is unreachable.
- **R3 STOP.** After STOP, no further messages are sent to that person except the STOP confirmation.
- **R4 DELETE.** After a confirmed DELETE, the person's replies, tags, follow-up records, chat state and chat ID are gone. Their contribution disappears from all live counts. Published weekly snapshots are not changed. One anonymous audit row records that a deletion happened.
- **R5 Default visibility.** A new consent has scope "HR only".
- **R6 Manager read rule.** A manager can read a reply's text only if the author's current consent scope is "share with manager" and the manager is that author's manager.
- **R7 Escalation isolation.** Escalations are readable only by HR. Managers can never read or count them. Escalated replies are excluded from themes and narratives.
- **R8 Minimum group.** A theme count is returned only when respondents in the window are at least the organisation's minimum group size. The minimum can never be set below 5.
- **R9 Manager snapshots.** Managers see theme counts only from weekly snapshots, never live. Any count under 3 in a manager view shows as "fewer than 3".
- **R10 Action exposure.** An action derived from a reply whose author has not consented to share must have team or intake scope and name no person. Such an action cannot be assigned to a manager who has fewer than 3 in-scope new hires. It must start from a theme card, not from the reply: "Draft action" on that reply is blocked, with the reason and a link to the theme card. A theme card counts as resting on non-consenting replies unless every contributing author consented. The manager alert for any action that rests on a non-consenting author's reply waits until the next weekly snapshot day (R9), so the clock cannot show who spoke. Its context quotes only that snapshot, and says "several" only when the snapshot count is 3 or more. The due date counts from the alert. Demo mode skips the wait and shows the label "In real use this alert waits until Monday".
- **R11 Employee-facing text.** Every message the bot sends is fixed question or probe bank text, fixed system text, a resolution note that HR approved, a Q&A answer that passes R31, the person's own stored AI summary and tags shown under R40 (labelled as AI), the R39 offer and R29 closure texts that HR approved in settings, the R1 end-of-check-ins text, the R49 exit question, or the R40 reply after a challenge. Nothing else the AI writes reaches an employee.
- **R12 Follow-up caps.** At most the touchpoint's cap of probes (1 or 2). No probe after a reply that triggers escalation.
- **R13 Escalation triggers.** A reply escalates if the keyword detector matches OR the model sets escalate. Either alone is enough. The keyword detector runs even when the model fails. The categories include `forced_labour_indicator` (passport or ID held by someone else, debt to an agent or a recruitment fee, restricted movement; wage deductions count only together with another sign). BM and English keywords ship with the app. Its keyword list holds only clear phrases, such as a passport held by the employer or agent, debt to the agent, or not being allowed to leave the hostel. Wage deductions alone are not a keyword: they go to the model, which weighs them with the rest of the reply. It goes to HR only, like every escalation (R7).
- **R14 Escalation reply.** On escalation the bot sends the fixed safe message with the organisation's configured contacts, and HR is alerted. `forced_labour_indicator` has its own fixed text and its own contacts that HR sets. That text always also holds one verified outside contact, the official labour authority line [SLOT: contact, verified before launch]. The text for `sexual_harassment` always holds the Tribunal for Anti-Sexual Harassment [SLOT: contact, verified before launch]. HR can add contacts but cannot remove these. The safe message ends by asking if the person wants HR to contact them, with Yes and No buttons. Yes asks how: "Call me", which shows Telegram's share-phone button so they send their own number, or "Meet me in person". No sets "don't contact me" (R29). HR sees the case only after the person finishes these questions: No, "Meet me in person", or "Call me" plus a shared number. A case left unfinished never reaches HR. HR sees the choice and the number on the case page, with the person's code name, team and start date, and nothing else that names them. Managers never see them.
- **R15 Evidence.** A tag is stored as "ok" only if its evidence quote is an exact substring of the masked reply after whitespace and Unicode normalisation. Otherwise retry once, then store as "needs review".
- **R16 No forbidden fields.** No stored AI output has an emotion, personality, sentiment score or quit-risk field. No tone or emotion feature is stored or computed from anything.
- **R17 Masking.** Malaysian NRIC numbers, phone numbers and email addresses in text are replaced with placeholders before any text leaves the app.
- **R18 Counts from SQL.** Every number shown in a theme card or narrative comes from SQL. A narrative that contains a number not present in its input is rejected.
- **R19 Schedule.** Touchpoints are at Day 3, 7, 14, 30, 60, 90 and 182 from the start date, moved forward to the next working-hours slot on a working day in the organisation's time zone. Demo mode ignores working hours, for touchpoints and for R28 notices and R39 offers.
- **R20 Reminders.** One reminder 24 hours after an unanswered check-in. 24 hours after the reminder the check-in becomes skipped.
- **R21 Exactly-once delivery.** A scheduled check-in is sent at most once, even under concurrent dispatcher calls.
- **R22 Exactly-once processing.** An inbound chat update is processed at most once, even if the platform resends it.
- **R23 Synthetic people.** People marked synthetic are never sent real messages. No message about a synthetic person goes to anyone. This covers manager nudges (R45) and alerts.
- **R24 Retention.** Raw reply text older than the retention period after a person's last check-in is deleted by a nightly job.
- **R25 Audit.** Every server read of reply text and every change to tags, actions, consents, settings and roles writes an audit row with actor, time, and target.
- **R26 Recheck.** When an action becomes done, each consenting person in its scope gets, in their next check-in and as its first question, the same neutral 1–5 scale question for the action's driver that the question bank asked before (for ROLE_CLARITY: "How clear are you on what is expected of you this week? (1–5)"). The bank holds one such 1–5 item for each driver, so every driver has an earlier score. HR may translate it but may not make it hint at the fix. The answer is linked to the action. The action card leads with the difference: the average change of the people in scope who gave both answers, beside the average change of new hires outside the scope who gave both in the same weeks ("Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks", with "2.5 → 3.8, 6 people" under it). The card always carries the fixed line "Teams picked for a fix often improve anyway. This compares them with other teams." With fewer than 5 people in scope who gave both, the card says "Not enough answers yet (N of 5)". With fewer than 5 outside the scope, it says "Not enough comparison yet (N of 5)".
- **R27 Intake link.** HR gives one join link per intake, not per person (docs/00, "Privacy"). The token works for anyone until the intake's expiry date. Each `/start <token>` from a new chat creates a new person with a random code name, the intake's start date and no team. The bot then asks language, consent, and team (from the intake's team list, which sets team and manager). The bot never stores the Telegram name or username. A chat that has already joined gets the invalid-invite text. HR cannot link a person to a real name; a person shares their name or phone only by choice (R14). HR can no longer mark one person as left, so R1's left flow and R49 apply only to seeded data. The per-person `addHire` API stays only as a test fixture; no screen uses it.
- **R28 Resolution notice.** When an action becomes done and has an HR-approved note, the bot sends the note, inside a fixed wrapper, to every person in the action's scope who has active consent and has not stopped, deleted or left. It is sent in each person's language, in the next working-hours slot, once per person. The note for a language is the HR-approved note. The manager's outcome note is never sent. A dismissed action sends nothing. A hiring-side action (R52) sends nothing. An action cannot be assigned without an HR-approved note in English and in Bahasa Malaysia, unless HR ticks "no notice" with a reason.
- **R29 Escalation closure.** When HR closes an escalation, HR may send one fixed closure message to that person. It is blocked if the person chose "don't contact me", stopped, deleted or left; HR sees the one generic reason in R41. It names no one and says how to reach HR.
- **R30 One Q&A call.** A text that arrives when no check-in is open, or after `/ask` (`/tanya`), goes through commands (R2) and the keyword safety check (R13) first. Then one structured model call receives the published handbook (placed first, for prompt caching), the Q&A memory (R33) and the masked message (R17). It returns the fields in "Q&A output" below. `/ask` forces `kind = question`. If `kind = feedback`, the text is stored as an unprompted reply and goes through the normal classify step, then is thanked with fixed text. If the model is unreachable, the text is stored as an unprompted reply marked "awaiting AI" and the bot sends a fixed "got it" text.
- **R31 Grounded answer.** An answer is sent only if `cited_path` is a published handbook page in the asker's language, or in English or Bahasa Malaysia when the asker's language has no published page, and `supporting_quote` is an exact substring of that page's text after markdown formatting is removed and whitespace and Unicode are normalised. The sent message has the "AI answer" label, the answer, the supporting quote shown as "From the handbook: …", the page path and the HR contact line. When the page is not in the asker's language, the model answers in the page's language and the bot adds that pack's fixed text: "This answer is in [English]. Ask HR if it is not clear." No new AI words reach the employee. Otherwise the bot sends the fixed "I don't know yet" text, which says the question was logged for HR without the person's name, and the question is stored with outcome *unknown*.
- **R32 Important matters.** If `important_topic` is set, or the keyword check matches, the bot sends that topic's fixed channel message (HR contact, and helplines where relevant) and no AI answer. The topics are: harassment, bullying or discrimination; safety hazards; self-harm or crisis; pay problems (pay that is missing, wrong or disputed; questions about how pay or overtime normally works are answerable); probation, warnings, dismissal or resignation; medical or health matters; legal questions. Those that also match R13 open an escalation. The others are logged with outcome *important*, without the person's name, and are never escalated.
- **R33 Q&A memory.** The model sees at most the last 6 Q&A messages from the last 10 minutes for that person. Check-in replies are never included.
- **R34 Grouping and anonymity.** Each question joins the group the call returned (an existing group ID or a new group with neutral text). A group is marked forwarded when it reaches 3 distinct askers in 30 days. HR sees a group's neutral text, its distinct askers in the last 30 days and its outcomes once it has been forwarded, or at once when the handbook could not answer it (so HR can fill the gap and draft a fix from it). Smaller answered groups show only as one total ("5 other questions from fewer than 3 people"). Questions on an R32 important topic are never grouped by text; HR sees only a count per topic, at 3 or more. HR never sees who asked or the asker's own words. Managers never see questions.
- **R35 Questions and privacy.** Questions follow DELETE (R4) and retention (R24). A deleted person stops counting toward any group.
- **R36 Commands.** The commands are `/start`, `/ask`, `/skip`, `/privacy`, `/language`, `/stop`, `/delete`, `/myanswers`, `/help` and their BM forms `/tanya`, `/langkau`, `/privasi`, `/bahasa`, `/berhenti`, `/padam`, `/jawapansaya`, `/bantuan` (`/start` is shared, for the QR deep link). Each Telegram chat's menu is set to its person's language with chat-scoped `setMyCommands`; Every command in every active pack language is accepted from everyone. Typed STOP, BERHENTI, DELETE and PADAM, without the slash, act like their commands. A Telegram "bot was blocked" error when sending counts as `/stop`.
- **R37 Fallback model spend cap.** Every model call records the model, tokens and estimated cost. When the fallback model's total estimated cost passes $1.50, the fallback is skipped and the request goes straight to "awaiting AI". The primary route has no cap in code.
- **R38 One model per eval.** Eval and reliability runs name exactly one model and run with the fallback switched off. A call that fails is recorded as failed, never answered by another model.
- **R39 HR offer.** On a reply that the AI or HR marked as needing follow-up (`concern_level = needs_follow_up`; HR can set or clear it, with an audit row, R25) and that is not an escalation, HR may send one fixed offer in the person's language: "HR would like to help with what you shared. Would you like a short private chat? [Yes] [No thanks]". The text is HR-approved in settings, not AI-written. A person has at most one open offer. At most one offer per reply, and no new offer for 30 days after "No thanks". The offer is sent in the next working-hours slot (R19). It is blocked if the person stopped, deleted or left, and HR then sees only the generic reason in R41. "Yes" creates an HR contact task due in 2 working days; "No thanks" closes it. No answer in 7 days closes it. Managers never see offers. The offer is allowed under "HR only" consent, because only HR acts.
- **R40 Own answers.** `/myanswers` sends the person their last 10 stored replies, each with its date, the AI summary and the problem-area labels in the person's language, under an "AI reading" label. The classifier writes `summary` in the reply's language, and R40 shows that one. Where HR changed a label, the label shows "Changed by HR" in place of "AI reading". Each has a "This is wrong" button. A press marks that reply's tags `needs_review` with source "challenged by new hire" and takes them out of counts until HR reviews them. When HR resolves the challenge, the bot sends the fixed text "HR checked your note. The label now reads: …". Escalated replies are listed with date and text only. Escalation details and HR notes are never shown. It works only for the person's own chat.
- **R41 Participation visibility.** HR sees the replies people wrote, so HR knows a person answered. HR never sees a list of who missed, skipped, declined or stopped, and no per-person timeline. Joined, declined, stopped and skipped are shown only as intake or six-month-group counts of 5 or more. Per-person send and answer times are used only by the scheduler and are never shown. Every blocked HR action to a person who stopped, declined, deleted or left (R29, R39) shows the same one reason: "This person is not receiving messages from Sapa now." It never says stopped, declined or left. A person's data export goes to the person, needs a reason from HR, and is audited.
- **R42 Retention and impact.** Six-month retention for an intake is the people still employed at Month 6 divided by everyone hired in that intake, whether or not they joined Sapa. After the intake passes Month 6, HR enters both numbers from its own records, for each agency that placed people in it and for hires with no agency. Sapa stores no per-person leaver date for this figure, so DELETE (R4) does not change it. The Impact view pools all completed intakes and shows "k of n" against the baseline. Below 30 people it says "Too few to tell yet (n of 30)". It always says "This shows a trend, not proof that Sapa caused it". The per-person left flag (R1) never feeds this figure. Other Impact figures (response rate, days from reply to done, score change against other teams after done actions) are shown per intake and only for 5 or more people. They count live data, so R4 removes a deleted person from them and never from retention.
- **R43 Fix evidence.** Each action library entry stores the score difference (R26) of every done action that used it in this organisation: the change of the people in scope minus the change of new hires outside the scope in the same weeks. The draft screen shows "Used 3 times here. Role clarity rose 1.0 more than in other teams (41 people)." It shows the difference only when, counted across the entry's done actions, 5 or more people in scope and 5 or more outside gave both answers. With fewer than 5 outside it says "Not enough comparison yet". With fewer than 5 in scope it says "Not enough evidence here yet". The draft (AI step C) receives the entries ranked by the difference, not by the raw rise, and names the entry it used and why. The Impact view lists the three fixes with the largest difference, with the line "a trend, not proof".
- **R44 AI quality watch.** Each week the review queue gets a random sample of AI-confident tags per driver and language (3, or all there are), marked "Spot check". HR mostly reviews tags the AI was unsure about, so the changed share is computed on spot checks only. A dashboard panel shows, for the last 30 days, the share of spot checks HR changed and the number of `/myanswers` challenges, per driver and per language. Calibration: in a new organisation, and for a new driver and language, AI-confident tags count without review only after 20 spot checks with at most 10% changed. Until then new tags wait for HR, the card says "New labels wait for HR during calibration", and each review of a waiting AI-confident tag counts as a spot check. Tags that already count stay counted. After calibration, if HR changed more than 20% of the spot checks for a driver in a language (at 10 or more), AI-confident tags for that driver and language stop counting until HR reviews them. The card says why. The hold-new-tags setting (HR admin) holds all new tags in the same way at any time. The panel also shows escalation false alarms and the share sent to review, per language, and "Not evaluated" for a pack whose test has not passed (R46).
- **R45 Manager milestones.** For every new hire in a manager's team who is still with the company, the manager gets fixed nudges in Telegram from an HR-approved library at set days: Day 1 "Assign a buddy", Day 7 "Book a 15-minute priorities chat", Day 30 "Agree a 30-60-90 plan". Each has a Done button. A nudge contains no feedback and no reply data. It is sent whether or not the hire joined, answered, stopped or deleted, so a nudge never shows who took part. It stops when HR marks the hire as left (R1) and is never sent about a synthetic hire (R23). It follows R19 working hours. Demo mode skips working hours but sends no milestone nudge, so a clock jump does not fill the phone on stage. HR sees the share done per intake (5 or more hires), never per manager. The Impact view shows it beside retention.
- **R46 Language packs.** A language is a pack: consent text, question bank, probes, commands, fixed texts (including the R31 note) and safety keywords. Three packs are built: Bahasa Malaysia, English and Chinese (Simplified). Manglish (mixed BM and English) is not a pack: the BM and English packs both take it. Telegram commands can use only Latin letters, so the Chinese menu lists the English commands with Chinese descriptions. All three packs are on for every organisation from creation, with no setting to turn one on or off. A pack's tags count without HR review only after the pack has its own test set (at least 30 replies and at least 20 escalation cases, forced-labour cases among them) and passes the marks in "Evaluation method". Until then every tag in that language goes to "needs review", and the R44 panel shows "Not evaluated". HR writes handbook pages (R31) in BM and English, and Chinese where HR chooses; a Chinese asker without a Chinese page gets the R31 fallback. Employee notes (R28) are written in all three languages; the AI draft gives all three for HR to approve.
- **R47 Worker-voice export.** HR can export, per intake, the theme counts and top question topics as "worker-voice themes for your RBA or ESG report". It holds counts with their base, only at 5 or more people. It also holds the number of serious concerns received and acknowledged within 1 working day, shown as "fewer than 5" below 5. It never holds replies, names or escalation details. Each export writes an audit row (R25).
- **R48 Agency view.** The role `agency` is granted by the employer per agency, for all that agency's placements. An agency user sees themes, the job-match card (R52) and retention (R42) for the people that agency placed, pooled across all its placements. It sees only counts of 5 or more (retention from 30, as in R42) and never personal data. It never sees replies, questions, escalations, names or actions.
- **R49 Exit question.** At consent, the new hire may tick "If I resign, you may ask me one question". When HR marks the person as left, as "resigned" (R1), and the tick is still in force, the bot sends one fixed question with driver buttons and one open line. The answer goes through the safety check (R13) and is tagged like a reply, with source "exit". It never counts in check-in themes and never goes to a manager. The Impact view shows, at 5 or more answers over 12 months, "Top reasons leavers gave" beside "Top themes Sapa found earlier" for the same intakes (all hires, not only leavers). A person marked "ended by the company" is not asked. STOP, DELETE and R4 apply as always. Retention (R42) does not use this mark.
- **R50 Voice notes.** *Removed. Voice notes are out of scope. A voice note, image or file gets a fixed text that asks the person to type, and nothing from it is stored.*
- **R51 No ranking.** No screen, export or message ranks or compares teams or managers side by side. A team's themes show only for one chosen team, at 5 or more people. Managers are told this in their "What I can see" note.
- **R52 Job match.** The `people` table holds each person's `role` (job title). The question bank holds the item "does the job match what was described when you were hired" (dossier F4). For each role, over the six-month group, HR sees a "Job matches what you were told" card, for example "Accounts payable analyst: 12 of 26 said 'not really' at Day 14". A role with fewer than 5 people shows "Not enough people yet (N of 5 needed)" (R8). Managers never see the card. Its library entry is "Update the job ad and the interview script for this role". Its action is hiring-side: HR owns it and may name the recruiter in its text, it is never assigned to a line manager, it names no person, and it sends no notice (R28) and no recheck (R26). The agency view shows this card for its placements (R48).
- **R53 HR translation.** A reply, question or challenge written in Chinese is shown to HR as written, with an AI translation into the HR working language beside it, labelled "AI translation". The evidence quote is highlighted in the original. The translation is made when HR opens the item, is never stored, never shown to a manager or a new hire, and never counted or classified. Classification always runs on the original text.

### Architecture

- One Next.js 16 App Router app on Vercel (Fluid Compute, Node.js 24). One Supabase project (Postgres, Auth, Row-Level Security, Realtime, Cron). One chat bot built with Vercel Chat SDK and its Telegram adapter, living in the same app.
- **Model route.** Primary: Gemini 3.8 Flash (`gemini-3.8-flash`), called through the AI SDK's OpenAI-compatible provider to OmniRoute on the team's home server. Fallback: DeepSeek V4.1 Flash, called directly with its own key. The app is model-agnostic: every call goes through one provider module that holds the model IDs, the per-provider settings and the order. Swapping a model is a config change.
  - Classify stays on Gemini after a bake-off against Cloudflare's Clef decision models ([13](13-classifier-bakeoff.md)): Gemini was more accurate in BM, English and Manglish, and caught a self-harm signal Clef missed. Its p95 latency through OmniRoute was about 21 seconds, a risk for the 5-second bot reply in story 90; 13 proposes a fix.
  - OmniRoute is exposed through a **Cloudflare named tunnel** (`cloudflared`, run as a system service so it restarts on its own) at a fixed HTTPS hostname. Not a quick tunnel, because its URL changes.
  - Every request needs an OmniRoute API key issued only to this app. The Gemini keys stay on the home server.
  - The model is pinned by its exact ID, never `auto` or a combo. Model and prompt version are stored on every tag row.
  - OmniRoute request and response logging is turned off for this key, so the home server keeps no employee text.
  - Fallback chain: OmniRoute to Gemini with an 8-second timeout → DeepSeek V4.1 Flash direct, 8-second timeout, unless R37's cap is reached → save as "awaiting AI". The keyword safety check runs in every case. The bot accepts text only; a voice note, image or file gets a fixed text that asks the person to type.
  - Per-provider settings live in the provider module. Gemini runs at the lowest thinking setting the model allows for classify and Q&A, and a medium setting for narrative and draft (check the model page on day 1). DeepSeek runs in non-thinking mode, because thinking tokens bill as output.
  - Gemini follows a JSON schema; DeepSeek only promises valid JSON. Every output, from either model, is parsed with the same Zod schema and retried once on failure.
  - Prompts put the fixed text first (instructions, examples, the handbook) and the variable text last, so both providers' automatic prompt caching applies.
  - The DeepSeek key has only $2 of credit. R37 and R38 protect it. Automated tests never hold a real model key.
  - The demo bar at the top of every HR page shows a live status for each link (OmniRoute, DeepSeek), so the driver knows before going on stage.
  - Day 1 checks: OmniRoute passes JSON-schema requests intact (else JSON mode plus Zod), and Cloudflare bot or WAF settings do not block calls from Vercel.
- **Channel.** Telegram only. The conversation engine runs consent and commands.
- **No Langfuse in the competition build.** Each tag row stores model ID, prompt version, latency and token counts. The eval writes its own results files. No reply text is sent to any trace or log store.
- **Trust boundary.** Reply text is encrypted in the app (AES-256-GCM, key in Vercel environment variables) before it reaches Postgres. All reads of reply text go through server code that checks the role, decrypts and writes an audit row. The browser never queries text tables. RLS is still on for every table as a second wall. Server jobs (webhook, dispatcher, AI pipeline) use the service role and are audited. The docs and pitch say this plainly.
- **Realtime as signal.** Realtime listens only on a change-signal table that holds an organisation ID, a scope (cohort, queue, action) and a time, no text. On a signal, the dashboard re-fetches through the server. Only HR pages subscribe.

### Modules

Each module is deep: a small interface hiding a lot of behaviour. Route handlers, server actions and the Telegram adapter are thin shells over these.

1. **Conversation engine.** Interface: handle one platform-neutral inbound event (text or button press, from a chat ID, with an update ID) and return the outbound messages to send. Also: start a check-in for a person. Hides the onboarding flow, consent flow, command matching (R36), check-in state machine, probe caps, routing text outside a check-in to Q&A (R30), the important-matter messages (R32), the end-of-check-ins and exit messages (R1, R49), and handing replies to the pipeline. Knows nothing about Telegram.
2. **Channel adapters.** The Chat SDK Telegram adapter, wired to the conversation engine. The Telegram adapter sets each chat's command menu (R36) and reports "bot was blocked" errors as `/stop`. Verifies the webhook secret, records the update ID (R22), returns 200 at once, and does the work after the response. Button data is a short ID plus a verb, within Telegram's 64-byte limit. A channel is added by touching only this module.
3. **Scheduler.** Interface: write a person's schedule from a start date; dispatch everything due at a given "now". Hides working-hours rules, holidays, reminders, lapse to skipped, the demo offset, row locking with skip-locked (R21), the synthetic-person skip (R23), cancelling everything for a person who left (R1), including nudges about them, and the manager milestone nudges (R45). Called every minute by Supabase Cron with a shared secret, and directly by the demo control.
4. **Clock.** One source of "now" for the whole app: real time plus the organisation's demo offset. Tests freeze it as described in "Clock in tests".
5. **Safety.** Interface: check a text, return escalate yes/no plus category. A keyword and phrase list for each language pack (R46; BM, English and Chinese) with simple normalisation (case, repeated letters, common spellings). Pure and deterministic. Also owns the fixed safe message.
6. **AI pipeline.** Interfaces: classify a reply; answer a question (R30–R33); write a theme narrative from counts; draft an action. Hides masking (R17), the provider order and spend cap (R37), the prompt templates and their versions, schema validation, the evidence check (R15), the retry policy, the number check on narratives (R18), the supporting-quote check (R31), the timeout and the "awaiting AI" fallback. The provider base URLs come from environment variables, so tests point them at a local fake model server.
7. **Themes.** Interface: get theme counts for a window and scope as a given role; take a weekly snapshot. Hides the SQL views, the minimum-group rule (R8), the under-3 masking for managers (R9), which tags count (reviewed, or AI-confident, not overridden and not challenged), the reviewed versus AI-confident split, and escalation exclusion (R7). Also: get intake impact figures (R42), the score change per action (R26), fix evidence per library entry (R43), the job-match card per role (R52), the AI quality watch with its weekly spot checks, calibration and holds (R44), the hold-new-tags setting, and the pooled views for the agency role (R48).
8. **Actions.** Interface: draft, edit, assign, accept, complete, dismiss; list for a role. Hides the state machine, the exposure rule (R10), the employee note and notice sending (R28), escalation closure messages (R29), the HR offer and its contact task (R39), recheck queuing (R26), fix evidence per library entry (R43), overdue logic, manager alerts, and the hold of an alert until the snapshot day (R10), and hiring-side actions (R52).
9. **Privacy.** Interface: delete a person (R4, R35), export a person, run retention (R24, R35), revoke a manager; show a person their own answers and record a challenge (R40); mark a person as left, as resigned or ended by the company (R1). Also owns encryption, audit writing (R25) and the participation-visibility rule (R41).
10. **Directory.** Organisations, intakes and their join tokens (R27), people, managers, roles, Telegram binding for new hires and managers, each person's role (R52), the left flag and its reason, hired and still-employed numbers per intake and agency and the retention baseline (R42), and agency grants (R48).
11. **Dashboard UI.** Built from the [dashboard design spec](06-dashboard-prd.md) once its screens are agreed, with shadcn/ui on the `with-supabase` template. Modules 1–10 and 14 do not wait for the design: their interfaces are the seam. Each screen gets a thin server loader, written with the screen, that asks the modules for what it shows and calls one module per user action. The UI holds no business rules; it shows what the modules return. Only HR, HR admin and agency users have pages; managers use only Telegram.
12. **Seed and eval tools.** Demo seed and reset, eval runner, Q&A eval runner and reliability runner. Command-line only, never deployed as routes except the demo reset. The synthetic cohort, labelled replies, handbook pages, question groups and seed tags are written by the coding agents as data files; no model call is used to make seed or test data.
13. **Handbook and questions.** Interface: list, save, publish and unpublish handbook pages; get the published handbook for a language; record a question with its outcome and group; list groups for HR. Hides page paths, draft versus published, distinct-asker counting over 30 days, the forwarding threshold (R34) and deletion (R35).
14. **Packs and exports.** Interface: list language packs and get a pack's texts; gate a pack's AI on its passed tests (R46); build the worker-voice export (R47); get the intake-level views an agency may see (R48). Hides pack status, the per-language fallbacks, the 5-person floor and the audit rows.

### Check-in state machine (conversation engine)

Per person, one of: `invited` → `language_chosen` → `consent_shown` → (`declined` end) or `choosing_team` → `visibility_chosen` → `active`. From `active`: `in_checkin` (with question index and probes used) → back to `active`. `stopped` and `deleted` are final. `left` (set by HR as resigned or ended by the company, R1) sends nothing except the R1 end text and, for a person who resigned and ticked it, the R49 exit question; DELETE still works. A command can arrive in any state and is handled first. An inbound text when no check-in is open goes to Q&A (R30), which either answers it as a question or stores it as an unprompted reply. A short Q&A window (R33) is kept per person; it is not a separate state.

### Action state machine

`draft` → `assigned` → `accepted` → `done`. `dismissed` is reachable from `draft`, `assigned` and `accepted` and needs a reason. An action under the R10 hold stays `assigned`; its manager alert is released on the snapshot day. Only HR moves `draft` → `assigned` and anything → `dismissed`. Only the owner moves `assigned` → `accepted` → `done`; `done` needs an outcome note. When the owner is HR, HR does all steps.

### Classifier output (AI step A)

A Zod schema, shared by prompt, storage and UI. Fields:

- `drivers`: zero or more of ROLE_CLARITY, MANAGER_SUPPORT, BELONGING, ONBOARDING_TRAINING, WORKLOAD.
- `context_tags`: zero or more of PAY_BENEFITS, GROWTH, COMMUTE_LOGISTICS.
- `positive`: yes/no, for what is going well.
- `concern_level`: none, low or needs_follow_up, from the written text only.
- `escalate`: yes/no, with `escalate_category` of harassment, sexual_harassment, discrimination, bullying_threats, self_harm_crisis, safety_hazard, wage_legal, forced_labour_indicator, or none.
- `evidence_quote`: an exact span of the masked reply, in the reply's own language.
- `summary`: one neutral sentence, third person, no names, at most 25 words, in the reply's language (R40 shows it to the person).
- `confidence`: low, medium or high. `uncertain`: yes/no.
- `probe_id`: one ID from the fixed probe bank, or none.

Low confidence or uncertain sends the tag to "needs review" and keeps it out of counts until HR reviews it. A tag counts without review only at medium or high confidence and not uncertain, in a pack whose test has passed (R46) and past calibration (R44); the eval sets that cut-off on the dev split (see "Evaluation method"). Thinking settings are in the Architecture section. The reply is passed as delimited data, the model has no tools, and the prompt has 2–3 examples per driver in BM, English, Chinese and Manglish.

### Q&A output (AI step D)

A Zod schema, shared by prompt and storage. One call per message (R30). Fields:

- `kind`: question or feedback.
- `important_topic`: one of harassment_bullying_discrimination, safety, self_harm_crisis, pay_problem, probation_dismissal_resignation, medical_health, legal, or none.
- `answer`: at most 80 words, in the asker's language (or in the cited page's language when R31 falls back), or empty when the handbook does not cover it.
- `cited_path`: the handbook page path used, or empty.
- `supporting_quote`: one sentence copied word for word from that page, or empty.
- `group`: either an existing group ID from the list in the prompt, or `new` with a neutral one-line question text and no names.

The prompt sends: the published handbook pages with their paths, the current group list (neutral text and ID only), the R33 memory and the masked message as delimited data. The model has no tools.

### Narrative and draft (AI steps B and C)

- **Narrative.** Input: the SQL counts for one window and scope, plus a sample of non-escalated summaries from that scope (never raw text). Output: up to 3 sentences on issues and 1 on what is going well. Rejected and retried once if it contains a number not in the input (R18).
- **Draft action.** Input: driver, theme counts, the action library entries for that driver ranked by their measured evidence here (R43), and the scope. Output: the library entry it used and why, a title of at most 10 words, steps of at most 60 words written as the message to the manager (the Telegram alert body), and a draft employee note of at most 40 words in each language the scope uses (English and Bahasa Malaysia at least), all naming no person. HR edits and approves the note; nothing is sent unapproved. The library from dossier F6 is data, editable by HR.

### Data model

Supabase CLI migrations. Every table has `organisation_id` and RLS by organisation and role. Roles (`hr`, `hr_admin`, `manager`, `agency`) live in the user's app metadata, set by seed or by an HR admin.

- `organisations`: name, time zone, holidays, HR working language (Bahasa Malaysia or English; R53 translates Chinese into it), minimum group size (≥5, default 5), retention days (default 182), demo offset days, demo mode flag, escalation contacts, helpline text per language.
- `managers`: link to an auth user, display name, encrypted Telegram chat ID, bind token.
- `intakes`: label, start date, join token and expiry, teams (team name and manager).
- `people`: random code name, team and manager (null until picked), intake, start date, language, encrypted chat ID, invite token and expiry, conversation state, synthetic flag, role (job title, R52), stopped and deleted times, left flag with its reason (resigned or ended by the company) and the time HR set it (R1; never shown per person, never used in a count), exit-question tick (R49), agency (nullable, R48).
- `consents`: person, text version, granted time, scope (hr_only or share_with_manager), withdrawn time. A scope change is a new row.
- `checkin_schedule`: person, touchpoint, due time, status (scheduled, sent, answered, reminded, skipped), sent time, reminder time.
- `questions` and `probes`: bank entries with ID, driver, text per language, answer type (scale, yes/no, open), touchpoints. Recheck questions are linked to a driver.
- `responses`: person, schedule row (nullable for unprompted), question or probe or recheck ID, scale value, encrypted text, masked-text hash, language, kind (check-in, unprompted or exit), linked action (for rechecks), created time.
- `ai_tags`: response, the classifier fields above (including `summary` language), status (ok, awaiting_ai, needs_review, reviewed), model, prompt version, latency, tokens, spot-check flag (R44), overrides by HR with reviewer and time, challenged by the new hire time (R40).
- `escalations`: response, source (keyword, model, both), category, HR acknowledged time, contact recorded time, "don't contact me" flag, notes, closed time, closure message sent time. HR-only RLS.
- `theme_snapshots`: week, scope (organisation, team, intake), driver counts, respondents, suppressed flag, narrative.
- `actions`: driver, library entry and the reason the draft gave, scope type (person, team, intake or role for a hiring-side action) and target, source (theme or reply), draft text, final text, owner (manager or HR), due date, manager alert due and sent times (R10), status, outcome note (internal), dismiss reason, score change (R26), employee note per language, note approved by and time, "no notice" reason, notice status (none, pending, sent, cancelled).
- `notices`: action or escalation, person, language, queued time, sent time. One row per person, unique per action and person (R28).
- `inbound_updates`: platform, update ID (unique), received time. Purged after 7 days.
- `change_signals`: organisation, scope, time. No text.
- `audit_log`: actor, action, target table and ID, time, detail without reply text.
- `handbook_pages`: path (for example `pay/overtime.md`), language, markdown body, status (draft, published), updated by and time. Unique per path and language.
- `question_groups`: neutral text, created time, forwarded time, handbook path that answers it (nullable). HR-only RLS.
- `asked_questions`: person, group (null for important topics), important topic, encrypted text, language, outcome (answered, unknown, important), cited path, created time. Readable by server code only; HR reads only group-level and topic-level counts (R34). Named so it does not clash with the `questions` bank table.
- `follow_up_offers`: response, sent by and time, answer (yes, no_thanks, none), closed time, contact task due and done times. HR-only RLS (R39).
- `organisations` also holds the six-month retention baseline, the R39 offer text per language, the hold-new-tags setting and the R49 exit question text.
- `intake_outcomes`: intake label, agency (null for hires with no agency), number hired, number still employed at Month 6, entered by and time (R42). One row per intake and agency. Aggregates only.
- `language_packs`: language, texts (including the R31 note), AI test status (not evaluated, passed, with date and test-set size).
- `action_library`: driver, entry text per language, type (normal or hiring-side, R52), edited by HR. Evidence per entry (R43) is computed from `actions`.
- `quality_holds`: driver, language, state (calibrating, trusted, held), spot checks done and changed, started time, reason (R44).
- `milestone_library` and `milestone_nudges`: day, text per language, HR approval; per nudge the manager, the new hire, due, sent and done times. No reply data (R45).
- `agency_grants`: agency user, agency, granted by and time (R48). The grant covers all that agency's placements.
- `ai_usage`: model, call type (classify, answer, narrative, draft), input tokens, cached input tokens, output tokens, estimated cost, eval run ID (nullable), time. Feeds R37.
- Chat SDK state tables in the same database, cleared per person on DELETE.

### API surface

- Telegram webhook route: Chat SDK handler, secret-checked.
- Dispatch route: called by Supabase Cron every minute with a shared secret; also called by the demo control.
- Nightly job route: weekly snapshot (on the configured day), release of held manager alerts (R10), retention purge, inbound-update purge, the R44 quality check.
- Everything else is server actions or server-side data loaders inside the app, each calling one module.

### Demo setup

- Seed: one organisation, Contoh GBS ("Contoh Global Business Services (Penang) Sdn Bhd", fictional, 650 staff, about 200 hires a year; the story is in [09](09-client-story.md)). One hundred hires, 99 synthetic and the live hire, across the last six monthly intakes (May 16, June 15, July 17, August 18, September 16, October 18), because the dashboard's default group is everyone hired in the last six months. The 82 hires from May to September are past Day 14 and 55 of them answered it. In the October intake, 17 synthetic people started 1–3 days before the live hire; 9 of them answered Day 14. So 64 have answered Day 14, and 23 of those 64 are tagged ROLE_CLARITY: 16 reviewed and 7 AI-confident. The live hire is bound to the demo phone and is at Day 13. The seed holds ROLE_CLARITY in the live hire's language in calibration (3 of 20 spot checks done, R44), so the live reply waits for HR to confirm its label. The 7 AI-confident seed tags were counted before calibration began. After HR confirms it, the card reads 24 of 65 who answered (17 reviewed, 7 AI-confident). The Korean desk has only 4 answers at Day 14, so its team view reads "Not enough people yet (4 of 5 needed)". One team lead (Raj, Accounts Payable Asia) bound to a second phone or the same phone in a second Telegram account. His team's last weekly snapshot, taken before the live reply, says 5 of 9 who answered named role clarity. Every person has a role. The card "Job matches what you were told" reads "Accounts payable analyst: 12 of 26 said 'not really' at Day 14" (fictional); no other role has 5 answers yet. The live hire's role is Mandarin-speaking AP analyst (role "AP analyst (Mandarin)"), so her reply does not move that card. Demo mode sends no milestone nudge and nothing about the synthetic hires in Raj's team (R23, R45).
- "Advance to Day 14" raises the offset by 1 and calls the dispatcher at once. Only the live hire receives a message (R23).
- The seed also has about 12 handbook pages in both languages (pay, leave, onboarding, facilities; no parking page) and question groups with history: "How do I claim overtime?" answered (11 askers), "Where can I park my motorbike?" forwarded (7 askers), "When is my first payday?" unknown (2 askers; HR sees it at once because the handbook could not answer it). Six completed intakes (November 2025 to April 2026: 16, 15, 17, 18, 16 and 17 hired) have hired and still-employed numbers entered, one row each with no agency: 80 of 99 still employed at Month 6, against a usual 73 in 100 (Contoh's 2024–25 intakes). Of the 19 who left, 17 resigned and 2 were ended by the company. 12 of the 17 ticked the exit question and answered it (role clarity 5, onboarding and training 4, workload 2, belonging 1). In the seed, role clarity is the top Day 14 theme for those six intakes. Manager milestones show 231 of 297 done. The seed has earlier done actions, so the outcome view has numbers: "Share the written job scope" in Raj's team, done 8 September, with Role clarity 2.5 → 3.8 for the 6 people in scope who gave both answers, and 2.7 → 2.8 for 44 new hires outside it (+1.3 against +0.1); and three done uses of "Priorities chat and written top-3 list" in other teams, where role clarity rose 1.1 for the 41 people in scope and 0.1 for 60 new hires outside it in the same weeks, so 1.0 more. All numbers are fictional. The live hire uses Telegram.
- The seed is a future year, not a pilot result. Demo mode shows a fixed banner on every HR screen: "This is a future year: what HR would see one year into Sapa. These numbers are fictional." The pitch says the same before the demo ([09](09-client-story.md#the-demo-is-a-future-year)).
- Reset restores the seed in under 10 seconds.
- Fallbacks: if the model is down, the reply shows as "awaiting AI", HR sets the label by hand (which counts as reviewed), and the seeded cards still tell the story. A screen recording of the full loop is on the laptop. Phone and laptop use a mobile hotspot.

### Updated 2-minute demo

Three design choices keep the product rules honest and the stage working. (1) Raj's alert normally waits for the weekly snapshot day (R10). Demo mode skips the wait and shows the label "In real use this alert waits until Monday". The action starts from the Role clarity theme card, which already existed before the live reply, and not from Mei Ling's reply. Raj's alert quotes the last weekly snapshot ("5 of 9 who answered in your team"), taken before the live reply, so the live reply is not in it. (2) The count moves only after HR confirms the label, because the seed holds that driver in calibration (R44). A reviewed tag counts at any model confidence, so the beat does not depend on the model. (3) Demo mode sends no milestone nudge and nothing about synthetic hires (R23, R45), so the jump to Day 30 leaves Raj's phone quiet. HR also closes the R39 contact task in beat 3, so it does not show as overdue after the jump.

1. **(20 s) Check-in.** HR presses "Advance to Day 14". The phone gets the check-in. The teammate answers "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu". The bot sends one fixed probe.
2. **(30 s) One reply, one person.** The dashboard refreshes. The reply shows ROLE_CLARITY with the quote highlighted, the AI label and the note "New labels wait for HR during calibration". The card still reads "Role clarity at Day 14: 23 of 64: 16 reviewed, 7 AI-confident". HR clicks "Confirm label". The card moves to "24 of 65 who answered: 17 reviewed, 7 AI-confident". On the same reply, HR sets "needs follow-up" and clicks "Offer a private chat". Beside it, the top-questions tile reads "Where can I park my motorbike? 7 asked, not in the handbook".
3. **(20 s) The pattern.** The teammate taps Yes on the phone. HR sees "Contact task, due in 2 working days" and marks it done. HR clicks "Draft action" on the Role clarity card. The draft shows "Used 3 times here. Role clarity rose 1.0 more than in other teams (41 people)", with the note pre-filled from the library entry. The scope choice "Mei Ling only" is blocked with the reason "She chose HR only". HR picks "Raj's team", approves the note and assigns to Raj. The screen shows "In real use this alert waits until Monday".
4. **(15 s) Manager acts.** Raj's Telegram shows the alert. He taps Accept, then Mark done with "Weekly priority list every Monday".
5. **(15 s) Loop closes.** The phone at once gets "Update from HR: your team now has a weekly priority list every Monday." The demo clock jumps to the Day 30 check-in. Its first question is the neutral "How clear are you on what is expected of you this week? (1–5)". The teammate taps 4. The rest of the check-in is not shown.
6. **(15 s) Outcome.** The seeded earlier action shows "Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks" (2.5 → 3.8 for 6 people; 2.7 → 2.8 for 44). The live action shows "Not enough answers yet (1 of 5)". The Impact view shows "Top reasons leavers gave: role clarity 5 of 12" beside "Sapa found role clarity at Day 14". Retention is one line: "80 of 99 still employed at Month 6, against a usual 73 in 100. This shows a trend, not proof that Sapa caused it." It is also on slide 10.

The total is about 115 seconds, inside the guide's 1–2 minutes. Time each beat in rehearsal against the real clicks, not against this script. Q&A, `/myanswers`, an escalation and the AI quality panel are not in the script. They stay ready for questions.

### Build order

Same 8-day frame as 02 section 7.2, with `cloudflared` in place of Tailscale Funnel and no Langfuse work. Q&A (step D, module 13, the two HR screens) is built after the check-in loop and the action loop work end to end. Then come the score-change recheck, fix evidence, language packs with their tests, milestones, the quality watch with spot checks, the exit question, the job-match card, the agency role and the export (R26, R43–R53). Day 1 done-when: the bot answers on a phone, one schema-valid classify call runs from Vercel through OmniRoute and the tunnel, the DeepSeek fallback answers when the tunnel is stopped, `ai_usage` records both calls, and the R22 dedupe works. Feature freeze on day 8 holds.

## Testing Decisions

**What a good test is here.** Every test is an end-to-end test of a real user action on real sample data. It acts as a new hire on Telegram, as HR or a manager on the API, or as Supabase Cron. It sends the same HTTP request that user's client sends, to the running app. It checks only what that user, or the next user, sees: the messages the bot sends, the HTTP status and body, the rows in the database, the count on a card. Tests exist only for the rules R1–R53 above and for bug fixes. Expected values come from this spec's rules, the seed numbers below and the dossier, never from reading the code. Any test that uses time freezes the clock (see "Clock in tests").

**Not allowed.** These are fake tests and are deleted on sight:
- Calling a module function, server action or route handler directly from the test, instead of over HTTP.
- Faking, stubbing or spying on any part of our own code: the database, Supabase Auth, the clock module, the AI pipeline, the safety check or the Chat SDK adapter.
- Checking that an internal function ran, or how many times.
- Data made up inside the test file. Tests use the seed and the data files.
- A test that still passes when the handler under test returns an empty 200 and writes nothing.
- A real model key or a real Telegram token in the test run.

**The test stack.** One command runs it, from a clean state:
1. A local Supabase stack (cut-down, as in the overnight brief) with every migration applied.
2. The demo seed loaded from the data files (module 12): Contoh GBS, the 100 hires, the handbook, the question groups and the seed tags. Each test file resets to the seed first, with the same reset the demo uses.
3. The app as a real Next.js production build (`next build` then `next start`), with the same routes, middleware and server actions that deploy to Vercel.
4. Two fake outside services, each a small local HTTP server. Only these two are faked:
   - **Fake model server.** Speaks the OpenAI-compatible chat API. `OMNIROUTE_BASE_URL` and the DeepSeek base URL point at it. Each test scripts its answers: valid JSON, invalid JSON, a timeout, a wrong evidence quote, a made-up number. The app's real provider code, Zod parsing, retry, fallback chain and `ai_usage` writes all run.
   - **Fake Telegram Bot API.** The Chat SDK Telegram adapter's API base URL points at it. It records every `sendMessage`, `setMyCommands` and `answerCallbackQuery` call, and can return "bot was blocked" (R36). On day 1, check that the Chat SDK adapter accepts a custom API base URL. If it does not, log it in the report and pick the smallest way to send its calls to the fake server in the test environment only.
   When the test environment flag is set, the app refuses to start if any base URL is not on localhost.

**How each user acts in a test.**
- **New hire.** The test posts a Telegram update JSON (text, command or button press, with a new update ID) to the real webhook route, with the webhook secret header. It reads what the bot said from the fake Telegram server. The update bodies are copies of real Telegram updates, stored as data files.
- **HR, HR admin and manager.** The test signs in through Supabase Auth as the seeded user and calls the real API routes and server actions with that session cookie, the way the dashboard will.
- **Supabase Cron.** The test calls the dispatch route and the nightly job route over HTTP with the shared secret.

**Clock in tests.** The app runs as a separate process, so the test cannot inject a clock object. When the test environment flag is set, the clock module reads a frozen "now" from one row that the test writes before each step. That code path does not exist outside the test environment. The demo offset still works on top of it, as in production.

**Seams.** Three. Almost all tests use seam 1.
1. **User journeys through the running app (main seam).** As above. Covers R1–R5, R10–R15, R17–R37, R39–R53.
2. **Database as a signed-in role.** Tests sign in as an HR user, an HR admin and a manager, and query tables directly with that session through the Supabase client, the way a browser could. They prove the second wall holds even if server code is wrong. Covers R6, R7, R8, R9 at the database level.
3. **Eval harness with the real model.** Not part of the test run. Runs the classifier on the labelled set, the Q&A answerer on the Q&A set, and the reliability set, and writes results files. Each run names one model, with the fallback off (R38). Covers the quality claims, R16 and R31–R32 in practice.

**Required journeys.** At least these, each as one test file named by its rule IDs. Each step is a real user action from the list above.
1. **Join and consent** (R1, R5, R27, R36). A new hire opens the intake deep link (`/start <token>`), picks a language, consents and picks a team. The bot menu is set in that language. Consent scope is "HR only". A second chat on the same link becomes a second person. The same chat a second time is refused. A token after the intake's expiry date is refused.
2. **Day 14 check-in, the demo loop** (R11, R12, R15, R17, R18, R19, R21, R22, R26, R28, R44). The live hire is at Day 13. The test moves the clock to Day 14 and calls dispatch twice at the same time: one check-in is sent. The hire replies with a role-clarity reply from the labelled set, which includes a phone number. The fake model server receives the masked text. The test resends the same update ID: nothing new happens. With the seeded calibration (R44), the card stays at 23 of 64 until HR confirms the label, then goes to 24 of 65 who answered. The Korean desk's team view says "Not enough people yet (4 of 5 needed)". HR drafts the action from the theme card, approves the note in English and Bahasa Malaysia, assigns and completes the action. Every in-scope consenting hire gets the notice once; the next check-in has the neutral 1–5 question as its first question (R26).
3. **Escalation** (R7, R13, R14). A hire sends a crisis reply while the fake model server times out. The keyword check still escalates, the bot sends the safe message with the configured contacts, and HR is alerted. The manager sees nothing, and the reply is not in any theme count. A hire who writes that the agent holds her passport escalates by keyword, and the fixed reply holds the outside labour-authority contact, which HR cannot remove in settings. A hire who writes only that EPF and SOCSO were taken from the pay does not escalate by keyword.
4. **Model down** (R2, R30, R37). The fake model server fails for both providers. Commands still work. A reply is stored as "awaiting AI" and the bot sends the fixed "got it" text. With seeded fallback spend over $1.50, the fake DeepSeek endpoint gets no call.
5. **Q&A** (R30–R34). Using the handbook seed: "How do I claim overtime?" gets a grounded answer with the quote and page. A question with a quote not in the page gets "I don't know yet". A pay dispute gets the important-matter message and no AI answer. A third distinct asker forwards a group, and HR then sees it, without names.
6. **Stop, delete, own answers** (R3, R4, R35, R40). After STOP, dispatch sends nothing to that hire. After a confirmed DELETE, the hire's rows are gone, live counts drop by one, published snapshots do not change, and one anonymous audit row exists. `/myanswers` shows the hire's own replies; "This is wrong" takes them out of HR counts.
7. **Manager view** (R6, R8, R9, R10). The seeded supervisor sees only weekly snapshot counts, "fewer than 3" for small counts, and reply text only for hires who chose "share with manager".
8. **Manager alert timing** (R9, R10, R39). With demo mode off, HR tries "Draft action" on a reply by a "HR only" hire: it is blocked and points to the theme card. HR assigns an action from the theme card: the manager gets no Telegram alert until the snapshot day, and the alert quotes the snapshot count only. With a snapshot count of 2, the text does not say "several". HR sets "needs follow-up" on the reply and sends the offer: it goes out in the next working-hours slot, a second offer to the same person is refused, and after "No thanks" a new offer within 30 days is refused.
9. **Recheck and fix evidence** (R26, R43). A done action sends the neutral 1–5 question as the first question of the next check-in. The card shows "Not enough answers yet (1 of 5)". The seeded earlier action shows "Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks", "2.5 → 3.8, 6 people" and the fixed line about teams picked for a fix. The draft screen for "Priorities chat and written top-3 list" shows "Used 3 times here. Role clarity rose 1.0 more than in other teams (41 people)". An entry with fewer than 5 people in scope shows "Not enough evidence here yet"; one with fewer than 5 outside shows "Not enough comparison yet". Every driver has a 1–5 item in the question bank.
10. **Left the company and exit question** (R1, R41, R49). HR marks a hire as resigned: dispatch sends nothing but the fixed end text with a retention date, and the supervisor gets no more nudges about that hire. A hire who ticked the exit question gets one fixed question, and its answer is not in any check-in theme and not visible to the manager. A hire who did not tick gets none. A hire marked "ended by the company" gets none, even with the tick. HR then tries an offer to that hire and sees only "This person is not receiving messages from Sapa now". The same text shows for a hire who stopped.
11. **Impact and AI quality watch** (R42, R44). HR enters hired and still-employed numbers for an intake and an agency. Below 30 people pooled, the Impact view says "Too few to tell yet (n of 30)"; the seed shows "80 of 99". A hire confirms DELETE: the retention figure does not change. The nightly job puts 3 AI-confident tags per driver and language in the review queue, marked "Spot check". HR changes 3 of 10 spot checks of ROLE_CLARITY in one language: AI-confident ROLE_CLARITY tags in that language stop counting, the card says why, and the same driver in another language is not affected. In a new language, AI-confident tags wait for HR until 20 spot checks with at most 10% changed.
12. **Manager milestones** (R1, R23, R45). The supervisor gets the Day 1, 7 and 30 nudges for every non-synthetic hire in his team (the test seed adds some, bound to the fake chats), including a hire who stopped,, with the same text, on Telegram. He gets none for the five synthetic hires and none for a hire HR marked as left. In demo mode he gets none. Nothing in a nudge contains reply data. HR sees the share done per intake and no per-manager figure.
13. **Languages** (R36, R46, R53). A hire in a new organisation is offered all three languages. A hire who picks Chinese gets the consent text in Chinese and a menu of English commands with Chinese descriptions. HR opening that hire's Chinese reply sees the original and a labelled AI translation; no translation row is stored (R53). A voice note gets the fixed "please type" text and nothing is stored.
14. **Agency, export and no ranking** (R47, R48, R51). An agency user sees themes, the job-match card and retention only for that agency's placements, pooled over its intakes. A pool of 4 people shows "Not enough people yet", and retention below 30 shows "Too few to tell yet". Another agency's people never appear. The agency user gets a refusal on a reply, a question or an escalation. The worker-voice export holds counts only and writes an audit row. No endpoint returns teams or managers side by side.
15. **Job match and fallbacks** (R31, R52). The seeded Accounts payable analyst card reads "12 of 26 said 'not really' at Day 14". A role with fewer than 5 people shows "Not enough people yet", and a manager gets a refusal on the card. HR drafts the hiring-side action from the card: it cannot be assigned to a line manager, and completing it sends no notice. A hire who asks in English about a topic that has only a Bahasa Malaysia page (test seed) gets the answer from that page with the fixed note "This answer is in Bahasa Malaysia. Ask HR if it is not clear."

**Proof each test is real.** Before a test counts as done, break the rule it checks by hand (for example, remove the dedupe on update ID) and rerun it. It must fail. Then restore the code. Record this once per test file in the morning report.

One end-to-end rehearsal script runs journey 2 against the deployed app, with a scripted Telegram update to the real webhook, and checks the final action state and the recheck message. It runs before each rehearsal, not on every commit.

**What is not covered.** The dashboard pages (Abraham builds them; they call the same routes the tests call). Real Telegram delivery and the real model, which the phone test and the eval cover.

**Prior art.** None. The repo has no code yet. The first tests set the pattern: one test file per journey, named by rule ID.

**Evaluation method (slide 8).**
- Replies written by one teammate are labelled by the other two, who did not write them. Gold labels are agreed after.
- Split 30% dev for prompt tuning, 70% test for the reported numbers. The test split is run once per prompt version.
- κ per driver as yes/no, then the mean; per language (BM, English, Chinese and Manglish).
- A pack counts without HR review only after its own test set (at least 30 replies and at least 20 escalation cases, forced-labour cases among them) passes the marks in this list (R46). Until then it reports "Not evaluated".
- Precision per driver and per language for the tags that count without review (medium or high confidence, not uncertain). The cut-off is set on the dev split. The share sent to review is reported with it.
- Follow-up recall, and escalation recall as "k of n" with a 95% interval, over at least 40 escalation cases (8–10 give an interval too wide to support "tuned to miss nothing"). The set includes forced-labour cases in BM and English, and a false-alarm set of normal deductions (EPF, SOCSO, tax, lateness) that must not escalate.
- Reliability: share of first-try valid outputs over 100 runs; safe handling of injection, empty, gibberish and emoji-only replies.
- Time to insight: the tester did not plant the themes.
- Q&A: 30 synthetic questions (15 answerable from the seed handbook, 8 not covered, 7 important matters, some in Manglish). Targets: 0 answers on important matters; correct page and a passing quote on at least 90% of answerable questions; "I don't know yet" on at least 90% of uncovered questions.
- Escalation false alarms and needs-review rates are reported beside recall, per language. A Manglish writer should not get more red flags than an English writer. The test split includes 10–15 Manglish and BM hyperbole cases ("OT everyday, mati la") that must not escalate.
- Probe choice: agreement of `probe_id` with a human choice on the labelled set. Baseline: always send the generic probe. Pass if humans prefer the AI's probe in at least 60% of pairs.
- Narrative: share that passes the R18 number check on the first try, and human-rated faithfulness (every sentence is supported by the input counts) on 20 runs. Baseline: a template sentence built from the counts. Pass if HR raters prefer the AI text in at least 60% of pairs and at least 95% of its sentences are faithful.
- Draft action: in Test 4, how much HR changes each draft (unchanged, light edit, rewrite). Target: at least 70% unchanged or light edit. Baseline: the raw library text. Pass if fewer AI drafts need a rewrite than raw library texts.
- Q&A faithfulness: on the 15 answerable questions, a human checks that the answer says what its quote says. The quote check alone cannot catch a wrong rate beside a real quote.
- Recheck, score change, fix evidence, spot checks and the job-match card use no AI. They are tested as rules (R26, R43, R44, R52).
- An AI step that cannot show value on its baseline and pass mark above is replaced by a template.
- The classify test split and the Q&A set are each run once on the fallback model too, so its quality on stage is known.

**Model budget (fallback key, $2).** Estimates at DeepSeek V4.1 Flash list prices of about $0.30 per million input tokens, $1.20 per million output tokens and about $0.01 per million cached input tokens (third-party listings; check the DeepSeek console). Gemini calls go through the team's OmniRoute accounts and are not counted here.

| Use of the fallback key | Calls | Estimate |
|---|---|---|
| Classify test split and Q&A set, once each on DeepSeek | about 135 | about $0.15 |
| Fallback during development and the day-1 check | about 100 | about $0.10 |
| Fallback during rehearsals and the demo, if Gemini fails | about 100 | about $0.15 |
| **Total** | | **about $0.40**, under the $1.50 cap in R37 |

## Out of Scope

- Any channel other than Telegram.
- WhatsApp. Telegram only.
- Voice notes, images and files from employees. The bot takes typed text only.
- HRIS or payroll sync, single sign-on, multi-company billing.
- Calendar booking for 1:1s, email notifications.
- Languages other than Bahasa Malaysia, English, Chinese and Manglish (for example Tamil).
- Langfuse or any trace store that holds reply text.
- Any self-hosted part on the production path other than OmniRoute and its tunnel.
- Topic clustering, embeddings, and agent frameworks.
- A search index, embeddings or AI tool use over the handbook. The whole published handbook is sent with each question.
- Q&A answers from the model's general knowledge, PDF or Word uploads for the handbook, and re-notifying earlier askers when HR adds a page.
- Any emotion, sentiment, personality or quit-risk scoring, now or later.
- Any use of Sapa data in performance, probation, discipline or hiring.
- Real employee data of any kind. The competition build uses synthetic data only.
- A formal PDPA data protection impact assessment and encryption key rotation. Both are named next steps for a pilot.

## Further Notes

- **Open questions for the team.**
  1. Model route: decided 15 Oct. Gemini 3.8 Flash through OmniRoute behind a `cloudflared` named tunnel, with DeepSeek V4.1 Flash as the direct fallback.
  2. Whether a chat disclosure counts as a complaint under Employment Act s.81B. Ask the HR judges or a lawyer; until then the bot text does not promise that HR will stay silent.
  3. Which chat app the target frontline workers use most. Decided: Telegram only.
  5. Fixed by the team on 15 Oct: the Q&A bot and the HR dashboard stay. The model route in item 1 stays for the competition. The team rejected review-2 fix 8 and review-3 G19, so the spec makes no pilot-data-path, region or provider-disclosure change.
  4. Organiser questions in `admin/organiser-questions.md` (dates, submission, demo fallback, equipment).
- **Pitch wording fixes from the review.** Say "HR cannot see who you are unless you choose to tell them". Never say "fully anonymous". Say "24 of 65 who answered". Lead ROI with break-even. Say pay is out of scope. Say the AI writes to a new hire only two labelled things.
- **Gemini pricing.** $0.75 / $3.75 per million tokens is an introductory price that a third-party source says ends 31 Dec 2026. Check before using the cost line in the pitch.
- **DeepSeek data location.** The DeepSeek API processes data in China. That is acceptable for synthetic data only. A real pilot needs a provider and region that fit PDPA cross-border rules.
- **Pilot.** Every new hire in three monthly intakes, each through its own Month 6, free. One intake is too small for the Impact view (R42 needs 30 people, R26 needs 5 in scope and 5 outside). Pass marks are set before the pilot starts, from measures the pilot can reach: response rate at least 60%; median days from reply to fix done at most 14; score change against other teams on done fixes [SLOT: pass mark agreed with the pilot company]; manager milestones done [SLOT: pass mark agreed with the pilot company]. Day-90 report: these four measures. Final report, after the last intake passes Month 6: retention says "Too few to tell yet (n of 30)" and gives the date when the pooled figure will be ready, as a trend and not proof. The pilot question to HR is "Would you let Sapa run for three monthly intakes, each until Month 6?".
- **Language packs.** Each pack needs a passed test before its AI counts without review (R46). Say: "Bahasa Malaysia, English and Chinese. Manglish works too."
- **Small-company honesty.** Below about 5 hires a month, themes come from the six-month group. The flag queue is the main value there. Say so in Q&A.
