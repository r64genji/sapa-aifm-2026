# Spec — Sapa: voluntary new-hire check-ins, from reply to tracked action

*As of 14 Oct 2026. Built from [01 rundown](01-product-rundown-and-deliverables.md), [02 architecture](02-prototype-architecture.md), [03 dossier](03-research-dossier.md) and the fixes in [04 adversarial review](04-adversarial-review.md). Where this spec and 02 disagree, this spec wins. Labels: `ready-for-agent`.*

## Problem Statement

HR teams at companies that hire every month lose many new hires in the first six months. They find out why only at the exit interview. By then the person has gone, the reasons are softened, and each interview is read alone, so no pattern shows.

The causes are usually ordinary and fixable: unclear priorities, weak onboarding, little support from the supervisor, feeling left out, and too much or too little work. New hires do not raise these early. They fear it will hurt their probation, and nobody asks them in a way that feels safe.

HR is one to three people for hundreds of staff. They cannot call every new hire. When they do collect feedback (a form, a WhatsApp message), nobody reads it in a structured way, nothing links it to an action, and nobody checks if the action helped.

Line managers want new hires productive fast. They do not know what their new hires struggle with, and they are rarely trained in onboarding.

New hires, many on shop floors or in outlets with no company email, have no private, low-effort way to say "I don't know what my priorities are" before it turns into a resignation.

## Solution

Sapa is a chat bot plus a web app.

**For the new hire.** HR shows a QR code on Day 1. The new hire opens the bot in Telegram, reads a short consent message in Bahasa Malaysia or English, and chooses who may see their words: HR only (the default) or HR and their manager. Over six months the bot sends seven short check-ins (Day 3, 7, 14, 30, 60, 90 and Month 6). Each takes about a minute: a few button questions and one open question. Sometimes the bot asks one neutral follow-up from a fixed list. The new hire can type SKIP, STOP or DELETE at any time, and these always work, even if the AI is down.

**For HR.** A dashboard shows the problems new hires share, counted from reviewed AI tags: "Role clarity: 4 of 6 who answered". Counts appear only when at least 5 people answered. HR sees each reply with the AI's tag, a one-line summary and the exact sentence used as evidence, and can correct any tag. Serious disclosures (harassment, bullying, self-harm, safety, wage or legal violations) go to a red queue for HR only. HR clicks "Draft action", the AI proposes a fix from a library, HR edits it and assigns it to a manager. When the action is done, the bot asks the affected new hires one recheck question, so HR can see if the fix helped.

**For the manager.** The manager gets a Telegram alert and a web card for each action. They accept it, do it, and mark it done with a one-line outcome. They never see a new hire's words unless that person agreed. They see shared themes only as weekly snapshots, never live, so they cannot work out who said what.

**What the AI does, and only this.** It tags each reply to a fixed list of problem areas with an evidence quote. It decides if a reply needs follow-up and which fixed probe to send. It writes a short narrative over counts that SQL already computed. It drafts an action that a human edits. It never writes free text to an employee, never counts, never scores emotions or quit risk, and never decides anything about a person's job.

**For the pitch.** A demo clock lets the team jump the whole loop forward on stage: a judge-visible phone receives the Day 14 check-in, the reply appears tagged on the HR dashboard within seconds, HR drafts and assigns an action, the manager closes it from Telegram, and the recheck question arrives.

## User Stories

### New hire — joining and consent

1. As a new hire, I want to join by scanning a QR code or tapping a link, so that I do not need a company email or an app login.
2. As a new hire, I want the bot to greet me with my company's name, so that I know it is the real company programme and not spam.
3. As a new hire, I want to choose Bahasa Malaysia or English before I read anything else, so that I understand the consent message fully.
4. As a new hire, I want the consent message to say what is collected, who sees it, how long it is kept, and how to stop or delete, so that I can make an informed choice.
5. As a new hire, I want the consent message to say clearly that saying no or stopping has no effect on my job or probation, so that I do not feel forced.
6. As a new hire, I want the consent message to say this is confidential, not anonymous, so that I am not misled in a small team.
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
21. As a new hire, I want to type SKIP (LANGKAU) to skip a question or a check-in, so that I answer only what I want.
22. As a new hire, I want to type STOP (BERHENTI) to end all check-ins, so that I can leave at any time.
23. As a new hire, I want to type DELETE (PADAM) to remove everything I said, so that my words do not stay with the company.
24. As a new hire, I want DELETE to ask me once to confirm, so that a typo does not wipe my answers.
25. As a new hire, I want commands to work even when the AI is down, so that opting out never depends on a model.
26. As a new hire, I want a short thank-you after each check-in, so that I know it was received.
27. As a new hire, I want the bot to tell me when something changed because of feedback ("Your team now has a weekly priorities chat"), so that I see that answering matters.
28. As a new hire, I want a recheck question after a fix ("Are your priorities clearer this week?"), so that I can say whether it helped.
29. As a new hire, I want to type HELP (BANTUAN) to see the commands and who sees my answers, so that I can check at any time.

### New hire — serious disclosures

30. As a new hire who reports harassment, bullying, a safety risk or a crisis, I want a fixed caring reply with emergency and helpline numbers, so that I get real help at once.
31. As a new hire who reports something serious, I want to know that HR, not my manager, will see it, so that I feel safe if my manager is involved.
32. As a new hire who reports something serious, I want to ask HR not to contact me now, and to be told honestly that for some matters HR may still need to follow up, so that I am not misled.

### HR — setup

33. As an HR user, I want to sign in with email, so that only staff with an account can see data.
34. As an HR user, I want to add a new hire with a code name, team, manager, start date and language, so that the bot knows their schedule without me typing their real name into the system.
35. As an HR user, I want to generate a QR code and link per new hire, so that I can hand it over on Day 1.
36. As an HR user, I want to see who has joined, who declined and who stopped, so that I know the coverage of each intake.
37. As an HR user, I want to invite managers and link them to their new hires, so that actions reach the right person.
38. As an HR user, I want to set the minimum group size (default 5, never below 5), so that I can be stricter but not weaker.
39. As an HR user, I want to set the retention period for raw text (default 6 months after the last check-in), so that we keep words no longer than needed.
40. As an HR user, I want to set the escalation contacts and helpline text shown to employees, so that the safe reply has correct numbers.
41. As an HR user, I want to set the organisation time zone and public holidays, so that check-ins land in working hours.
42. As an HR user, I want to view and edit the question bank in both languages, so that wording fits our workplace.

### HR — reviewing replies

43. As an HR user, I want a flag queue of replies that need follow-up, newest first, so that I see what needs me.
44. As an HR user, I want escalations pinned at the top in red with the fixed protocol steps, so that serious matters are never buried.
45. As an HR user, I want each reply shown with the AI summary, tags and evidence quote beside the original text, with the quote highlighted, so that I can check the AI's reading in seconds.
46. As an HR user, I want to correct any tag, so that the record reflects my judgement, not the model's.
47. As an HR user, I want to mark a reply as reviewed, so that the queue empties as I work.
48. As an HR user, I want replies the AI could not read ("awaiting AI" or "needs review") to show clearly, so that nothing is silently lost.
49. As an HR user, I want to retry the AI on a reply, so that a temporary outage does not leave it untagged.
50. As an HR user, I want new replies to appear on my open dashboard within seconds, so that I can act on urgent items without refreshing.
51. As an HR user, I want to acknowledge an escalation and record that I made contact, so that there is a record of the duty of care.
52. As an HR user, I want the escalation list to show how long each has waited against the 1-working-day target, so that none goes stale.

### HR — themes

53. As an HR user, I want theme cards showing each problem area as "N of M who answered", so that I see what is shared, not what one person said.
54. As an HR user, I want themes over a rolling 90-day window by default, so that a small monthly intake still gives a signal.
55. As an HR user, I want to drill into a single intake or a single touchpoint when it has enough people, so that I can see when problems start.
56. As an HR user, I want a clear "Not enough people yet (3 of 5 needed)" message instead of a blank card, so that I understand why nothing shows.
57. As an HR user, I want a short narrative of what is going well and what is not, written from the counts, so that I can paste it into a management update.
58. As an HR user, I want themes counted only from tags that HR reviewed or that the AI was confident about, so that the counts are trustworthy.
59. As an HR user, I want a weekly trend per theme, so that I see if a problem grows or shrinks.
60. As an HR user, I want pay, growth and commute concerns shown as context for HR only, so that issues outside a manager's control are not sent as manager tasks.

### HR — actions

61. As an HR user, I want to click "Draft action" on a theme or a reply, so that I start from a concrete suggestion.
62. As an HR user, I want the draft to come from the action library for that problem area, so that suggestions are proven and consistent.
63. As an HR user, I want to edit the draft freely before anyone sees it, so that the final text is mine.
64. As an HR user, I want the system to stop me assigning an action that would expose a person who did not consent, so that I cannot break our promise by accident.
65. As an HR user, I want to choose the action scope (one consenting person, a manager's team, or a whole intake), so that the action matches the problem.
66. As an HR user, I want to assign the action to a manager with a due date, so that someone owns it.
67. As an HR user, I want to own an action myself, so that I can handle cases where the manager is the problem.
68. As an HR user, I want an actions board with columns for draft, assigned, accepted, done and dismissed, so that I see progress at a glance.
69. As an HR user, I want overdue actions highlighted, so that I can nudge managers.
70. As an HR user, I want to see recheck results on each done action ("3 of 4 say clearer"), so that I know if the fix worked.
71. As an HR user, I want to dismiss an action with a reason, so that the board reflects real decisions.

### HR — privacy and governance

72. As an HR admin, I want an audit log of every view of reply text and every change, with who and when, so that misuse is visible.
73. As an HR admin, I want to remove a manager's access at once, so that I can act on misuse.
74. As an HR admin, I want to export one person's data on request, so that we can meet a data access request.
75. As an HR admin, I want raw text deleted automatically after the retention period, so that we do not keep words longer than promised.
76. As an HR admin, I want to see which consent text version each person agreed to, so that we can prove what they were told.

### Manager

77. As a manager, I want to sign in to the same web app with my own account, so that I have one place for actions.
78. As a manager, I want to link my Telegram with a one-time link, so that I get alerts where I already am.
79. As a manager, I want a Telegram alert when an action is assigned to me, with Accept and Mark done buttons, so that I can act without opening a laptop.
80. As a manager, I want each action to show theme-level context ("several new hires in your team say priorities change daily") and no names unless consented, so that I know why without breaking trust.
81. As a manager, I want to see a new hire's own words only when that person chose to share with me, so that I can help them directly when invited.
82. As a manager, I want to accept an action, so that HR knows I own it.
83. As a manager, I want to mark an action done with a one-line outcome, so that HR sees what I did.
84. As a manager, I want to see my team's themes as a weekly snapshot, so that I understand the bigger picture.
85. As a manager, I want no access to escalations, flags, individual tags or individual history, so that nobody can say I used this against them.

### Demo team

86. As the demo driver, I want an "Advance to Day N" control, so that I can show a Day 14 check-in on stage now.
87. As the demo driver, I want advancing the clock to send to the live phone only, never to synthetic people, so that nothing goes to a stranger.
88. As the demo driver, I want a seeded intake of 6 hires where 5 already answered Day 14, so that the live reply makes the count go from 3 to 4.
89. As the demo driver, I want a one-click reset to the seeded state, so that we can rehearse again and again.
90. As the demo driver, I want the bot reply and the dashboard update to take under 5 seconds each, so that the 90-second demo fits.
91. As the demo driver, I want the seeded themes and actions to show even if the model is down, so that the demo still makes sense.

### Evidence team

92. As the data teammate, I want a synthetic cohort generator with planted themes, so that the demo and the timing test use realistic data.
93. As the data teammate, I want an eval command that runs the classifier on the labelled set and reports κ per driver and per language, follow-up recall and escalation recall with a confidence interval, so that slide 8 has honest numbers.
94. As the data teammate, I want separate dev and test splits, so that tuning the prompt does not inflate the reported score.
95. As the data teammate, I want a reliability run with injection, gibberish, empty and emoji-only replies, so that we can report safe handling.
96. As a judge, I want to see the consent screen and the "what Sapa never does" list in the demo, so that I can trust the responsible-AI claim.

## Implementation Decisions

### Rules (the source of truth for tests)

Each rule has an ID. Tests cite the ID. A rule changes only with team approval.

- **R1 Consent gate.** No check-in, reminder or recheck is sent to a person without an active, non-withdrawn consent.
- **R2 Commands first.** SKIP, STOP, DELETE, HELP and the visibility command are matched in both languages, case-insensitive, before any AI call or safety check. They work when the model is unreachable.
- **R3 STOP.** After STOP, no further messages are sent to that person except the STOP confirmation.
- **R4 DELETE.** After a confirmed DELETE, the person's replies, tags, follow-up records, chat state and chat ID are gone. Their contribution disappears from all live counts. Published weekly snapshots are not changed. One anonymous audit row records that a deletion happened.
- **R5 Default visibility.** A new consent has scope "HR only".
- **R6 Manager read rule.** A manager can read a reply's text only if the author's current consent scope is "share with manager" and the manager is that author's manager.
- **R7 Escalation isolation.** Escalations are readable only by HR. Managers can never read or count them. Escalated replies are excluded from themes and narratives.
- **R8 Minimum group.** A theme count is returned only when respondents in the window are at least the organisation's minimum group size. The minimum can never be set below 5.
- **R9 Manager snapshots.** Managers see theme counts only from weekly snapshots, never live. Any count under 3 in a manager view shows as "fewer than 3".
- **R10 Action exposure.** An action derived from a reply whose author has not consented to share must have team or intake scope and name no person. Such an action cannot be assigned to a manager who has fewer than 3 in-scope new hires.
- **R11 No free AI text to employees.** Every message the bot sends is from the fixed question bank, the fixed probe bank, or fixed system text. The AI only selects IDs.
- **R12 Follow-up caps.** At most the touchpoint's cap of probes (1 or 2). No probe after a reply that triggers escalation.
- **R13 Escalation triggers.** A reply escalates if the keyword detector matches OR the model sets escalate. Either alone is enough. The keyword detector runs even when the model fails.
- **R14 Escalation reply.** On escalation the bot sends the fixed safe message with the organisation's configured contacts, and HR is alerted.
- **R15 Evidence.** A tag is stored as "ok" only if its evidence quote is an exact substring of the masked reply after whitespace and Unicode normalisation. Otherwise retry once, then store as "needs review".
- **R16 No forbidden fields.** No stored AI output has an emotion, personality, sentiment score or quit-risk field.
- **R17 Masking.** Malaysian NRIC numbers, phone numbers and email addresses are replaced with placeholders before any text leaves the app.
- **R18 Counts from SQL.** Every number shown in a theme card or narrative comes from SQL. A narrative that contains a number not present in its input is rejected.
- **R19 Schedule.** Touchpoints are at Day 3, 7, 14, 30, 60, 90 and 182 from the start date, moved forward to the next working-hours slot on a working day in the organisation's time zone. Demo mode ignores working hours.
- **R20 Reminders.** One reminder 24 hours after an unanswered check-in. 24 hours after the reminder the check-in becomes skipped.
- **R21 Exactly-once delivery.** A scheduled check-in is sent at most once, even under concurrent dispatcher calls.
- **R22 Exactly-once processing.** An inbound chat update is processed at most once, even if the platform resends it.
- **R23 Synthetic people.** People marked synthetic are never sent real messages.
- **R24 Retention.** Raw reply text older than the retention period after a person's last check-in is deleted by a nightly job.
- **R25 Audit.** Every server read of reply text and every change to tags, actions, consents, settings and roles writes an audit row with actor, time, and target.
- **R26 Recheck.** When an action becomes done, each consenting person in its scope gets one recheck question in their next check-in, linked to the action.
- **R27 Invite links.** An invite token works once and expires after 14 days.

### Architecture

- One Next.js 16 App Router app on Vercel (Fluid Compute, Node.js 24). One Supabase project (Postgres, Auth, Row-Level Security, Realtime, Cron). One chat bot built with Vercel Chat SDK and its Telegram adapter, living in the same app.
- **Model route.** Gemini 3.8 Flash (`gemini-3.8-flash`), called through the AI SDK's OpenAI-compatible provider to OmniRoute on the team's home server.
  - OmniRoute is exposed through a **Cloudflare named tunnel** (`cloudflared`, run as a system service so it restarts on its own) at a fixed HTTPS hostname. Not a quick tunnel, because its URL changes.
  - Every request needs an OmniRoute API key issued only to this app. The Gemini keys stay on the home server.
  - The model is pinned by its exact ID, never `auto` or a combo. Model and prompt version are stored on every tag row.
  - OmniRoute request and response logging is turned off for this key, so the home server keeps no employee text.
  - Fallback chain: OmniRoute with an 8-second timeout → direct Gemini through the AI SDK's Google provider, same model → save as "awaiting AI". The keyword safety check runs in every case.
  - The demo controls page shows a live status for each link (OmniRoute, direct Gemini), so the driver knows before going on stage.
  - Day 1 checks: OmniRoute passes JSON-schema requests intact (else JSON mode plus Zod), and Cloudflare bot or WAF settings do not block calls from Vercel.
- **No Langfuse in the competition build.** Each tag row stores model ID, prompt version, latency and token counts. The eval writes its own results files. No reply text is sent to any trace or log store.
- **Trust boundary.** Reply text is encrypted in the app (AES-256-GCM, key in Vercel environment variables) before it reaches Postgres. All reads of reply text go through server code that checks the role, decrypts and writes an audit row. The browser never queries text tables. RLS is still on for every table as a second wall. Server jobs (webhook, dispatcher, AI pipeline) use the service role and are audited. The docs and pitch say this plainly.
- **Realtime as signal.** Realtime listens only on a change-signal table that holds an organisation ID, a scope (cohort, queue, action) and a time, no text. On a signal, the dashboard re-fetches through the server. Only HR pages subscribe.

### Modules

Each module is deep: a small interface hiding a lot of behaviour. Route handlers, server actions and the Telegram adapter are thin shells over these.

1. **Conversation engine.** Interface: handle one platform-neutral inbound event (text or button press, from a chat ID, with an update ID) and return the outbound messages to send. Also: start a check-in for a person. Hides the onboarding flow, consent flow, command matching, check-in state machine, probe caps, and handing replies to the pipeline. Knows nothing about Telegram.
2. **Channel adapter.** The Chat SDK Telegram adapter, wired to the conversation engine. Verifies the webhook secret, records the update ID (R22), returns 200 at once, and does the work after the response. Button data is a short ID plus a verb, within Telegram's 64-byte limit. Swapping to WhatsApp touches only this module plus template approval.
3. **Scheduler.** Interface: write a person's schedule from a start date; dispatch everything due at a given "now". Hides working-hours rules, holidays, reminders, lapse to skipped, the demo offset, row locking with skip-locked (R21), and the synthetic-person skip (R23). Called every minute by Supabase Cron with a shared secret, and directly by the demo control.
4. **Clock.** One source of "now" for the whole app: real time plus the organisation's demo offset. Tests inject a frozen clock here.
5. **Safety.** Interface: check a text, return escalate yes/no plus category. A BM/English keyword and phrase list with simple normalisation (case, repeated letters, common spellings). Pure and deterministic. Also owns the fixed safe message.
6. **AI pipeline.** Interfaces: classify a reply; write a theme narrative from counts; draft an action. Hides masking (R17), the prompt templates and their versions, schema validation, the evidence check (R15), the retry policy, the number check on narratives (R18), the timeout and the "awaiting AI" fallback. The model provider is injected so tests can script it.
7. **Themes.** Interface: get theme counts for a window and scope as a given role; take a weekly snapshot. Hides the SQL views, the minimum-group rule (R8), the under-3 masking for managers (R9), which tags count (reviewed, or AI-confident and not overridden), and escalation exclusion (R7).
8. **Actions.** Interface: draft, edit, assign, accept, complete, dismiss; list for a role. Hides the state machine, the exposure rule (R10), recheck queuing (R26), overdue logic, and manager alerts.
9. **Privacy.** Interface: delete a person (R4), export a person, run retention (R24), revoke a manager. Also owns encryption and audit writing (R25).
10. **Directory.** Organisations, people, managers, roles, invite tokens (R27), Telegram binding for new hires and managers.
11. **Dashboard UI.** shadcn/ui on the `with-supabase` template. Pages: Themes, Flag queue, Reply detail, Escalations, Actions board, People, Settings, Audit log, Demo controls. Managers see Actions and Team snapshot only.
12. **Seed and eval tools.** Synthetic cohort generator, demo seed and reset, eval runner and reliability runner. Command-line only, never deployed as routes except the demo reset.

### Check-in state machine (conversation engine)

Per person, one of: `invited` → `language_chosen` → `consent_shown` → (`declined` end) or `visibility_chosen` → `active`. From `active`: `in_checkin` (with question index and probes used) → back to `active`. `stopped` and `deleted` are final. A command can arrive in any state and is handled first. An inbound text when no check-in is open is stored as an unprompted reply, classified the same way, and thanked.

### Action state machine

`draft` → `assigned` → `accepted` → `done`. `dismissed` is reachable from `draft`, `assigned` and `accepted` and needs a reason. Only HR moves `draft` → `assigned` and anything → `dismissed`. Only the owner moves `assigned` → `accepted` → `done`; `done` needs an outcome note. When the owner is HR, HR does all steps.

### Classifier output (AI step A)

A Zod schema, shared by prompt, storage and UI. Fields:

- `drivers`: zero or more of ROLE_CLARITY, MANAGER_SUPPORT, BELONGING, ONBOARDING_TRAINING, WORKLOAD.
- `context_tags`: zero or more of PAY_BENEFITS, GROWTH, COMMUTE_LOGISTICS.
- `positive`: yes/no, for what is going well.
- `concern_level`: none, low or needs_follow_up, from the written text only.
- `escalate`: yes/no, with `escalate_category` of harassment, sexual_harassment, discrimination, bullying_threats, self_harm_crisis, safety_hazard, wage_legal, or none.
- `evidence_quote`: an exact span of the masked reply.
- `summary`: one neutral sentence, third person, no names, at most 25 words.
- `confidence`: low, medium or high. `uncertain`: yes/no.
- `probe_id`: one ID from the fixed probe bank, or none.

Low confidence or uncertain sends the tag to "needs review" and keeps it out of counts until HR reviews it. Thinking level low for classify; medium for narrative and draft. The reply is passed as delimited data, the model has no tools, and the prompt has 2–3 examples per driver in BM, English and Manglish.

### Narrative and draft (AI steps B and C)

- **Narrative.** Input: the SQL counts for one window and scope, plus a sample of non-escalated summaries from that scope (never raw text). Output: up to 3 sentences on issues and 1 on what is going well. Rejected and retried once if it contains a number not in the input (R18).
- **Draft action.** Input: driver, theme counts, the action library entries for that driver, and the scope. Output: a title of at most 10 words and steps of at most 60 words, naming no person. The library from dossier F6 is data, editable by HR.

### Data model

Supabase CLI migrations. Every table has `organisation_id` and RLS by organisation and role. Roles (`hr`, `hr_admin`, `manager`) live in the user's app metadata, set by seed or by an HR admin.

- `organisations`: name, time zone, holidays, minimum group size (≥5, default 5), retention days (default 182), demo offset days, demo mode flag, escalation contacts, helpline text per language.
- `managers`: link to an auth user, display name, encrypted Telegram chat ID, Telegram bind token.
- `people`: code name, team, manager, intake label, start date, language, channel, encrypted chat ID, invite token and expiry, conversation state, synthetic flag, stopped and deleted times.
- `consents`: person, text version, granted time, scope (hr_only or share_with_manager), withdrawn time. A scope change is a new row.
- `checkin_schedule`: person, touchpoint, due time, status (scheduled, sent, answered, reminded, skipped), sent time, reminder time.
- `questions` and `probes`: bank entries with ID, driver, text per language, answer type (scale, yes/no, open), touchpoints. Recheck questions are linked to a driver.
- `responses`: person, schedule row (nullable for unprompted), question or probe or recheck ID, scale value, encrypted text, masked-text hash, language, linked action (for rechecks), created time.
- `ai_tags`: response, the classifier fields above, status (ok, awaiting_ai, needs_review, reviewed), model, prompt version, latency, tokens, overrides by HR with reviewer and time.
- `escalations`: response, source (keyword, model, both), category, HR acknowledged time, contact recorded time, "don't contact me" flag, notes. HR-only RLS.
- `theme_snapshots`: week, scope (organisation, team, intake), driver counts, respondents, suppressed flag, narrative.
- `actions`: driver, scope type and target, source (theme or reply), draft text, final text, owner (manager or HR), due date, status, outcome note, dismiss reason, recheck results.
- `inbound_updates`: platform, update ID (unique), received time. Purged after 7 days.
- `change_signals`: organisation, scope, time. No text.
- `audit_log`: actor, action, target table and ID, time, detail without reply text.
- Chat SDK state tables in the same database, cleared per person on DELETE.

### API surface

- Telegram webhook route: Chat SDK handler, secret-checked.
- Dispatch route: called by Supabase Cron every minute with a shared secret; also called by the demo control.
- Nightly job route: weekly snapshot (on the configured day), retention purge, inbound-update purge.
- Everything else is server actions or server-side data loaders inside the app, each calling one module.

### Demo setup

- Seed: one organisation ("Contoh Manufacturing Sdn Bhd", fictional), October intake of 6 people. Five synthetic people started 1–3 days before the live hire and have answered Day 3, 7 and 14, with 3 of 5 tagged ROLE_CLARITY at Day 14. The live hire is bound to the demo phone and is at Day 13. One supervisor bound to a second phone or the same phone in a second Telegram account. Earlier intakes seeded so the 90-day window has history.
- "Advance to Day 14" raises the offset by 1 and calls the dispatcher at once. Only the live hire receives a message (R23).
- Reset restores the seed in under 10 seconds.
- Fallbacks: if the model is down, the reply shows as "awaiting AI" and the seeded cards still tell the story. A screen recording of the full loop is on the laptop. Phone and laptop use a mobile hotspot.

### Updated 90-second demo

1. **(20 s) Check-in.** HR presses "Advance to Day 14". The phone gets the check-in. The teammate answers "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu". The bot sends one fixed probe.
2. **(20 s) Theme.** The dashboard refreshes. The reply shows ROLE_CLARITY with the quote highlighted. The card moves to "Role clarity: 4 of 6 who answered".
3. **(20 s) HR acts.** HR opens the reply beside the AI summary, clicks "Draft action", edits one line, sets scope "Raj's team", assigns to Raj.
4. **(20 s) Manager acts.** Raj's Telegram shows the alert. He taps Accept, then Mark done with "Weekly priority list every Monday".
5. **(10 s) Loop closes.** Demo clock advances. The phone gets "Are your priorities clearer this week?"

### Build order

Same 8-day frame as 02 section 7.2, with `cloudflared` in place of Tailscale Funnel and no Langfuse work. Day 1 done-when: the bot answers on a phone, one schema-valid classify call runs from Vercel through OmniRoute and the tunnel, the direct-Gemini fallback answers when the tunnel is stopped, and the R22 dedupe works. Feature freeze on day 8 holds.

## Testing Decisions

**What a good test is here.** A test calls a module the way its real caller does and checks a result a user would see: the messages the bot sends, the rows in the database, the count on a card, the error HR gets. It never checks which internal function ran. Tests exist only for the rules R1–R27 above and for bug fixes. Expected values come from this spec's rules and the dossier, never from reading the code. Any test that uses time freezes the clock through the clock module.

**Seams.** Three, from highest to lowest. The aim is that almost all tests use seam 1.

1. **Module interfaces with a real database (main seam).** Tests call the conversation engine, scheduler, actions, themes and privacy modules directly, against a real local Supabase Postgres with migrations applied and seed data. Two outside services are faked: the model provider (scripted responses, including timeouts and invalid JSON) and the Telegram API (records outbound messages). This seam covers R1–R5, R10–R15, R17–R27.
2. **Database as a signed-in role.** Tests sign in as an HR user, an HR admin and a manager, and query tables directly with that session. They prove the second wall holds even if server code is wrong. This seam covers R6, R7, R8, R9 at the database level.
3. **Eval harness with the real model.** Not part of the test run. Runs the classifier on the labelled set and the reliability set and writes results files. This seam covers the quality claims and R16 in practice.

One end-to-end rehearsal script drives the demo loop against the deployed app with a scripted Telegram update and checks the final action state and the recheck message. It runs before each rehearsal, not on every commit.

**Modules tested.** Conversation engine, scheduler, safety, AI pipeline (with scripted model), themes, actions, privacy. The dashboard UI and the channel adapter are not unit-tested; the rehearsal script covers them.

**Prior art.** None. The repo has no code yet. The first tests set the pattern: one test file per rule group, named by rule ID.

**Evaluation method (slide 8).**
- Replies written by one teammate are labelled by the other two, who did not write them. Gold labels are agreed after.
- Split 30% dev for prompt tuning, 70% test for the reported numbers. The test split is run once per prompt version.
- κ per driver as yes/no, then the mean; per language (BM, English, Manglish).
- Follow-up recall, and escalation recall as "k of n" with a 95% interval.
- Reliability: share of first-try valid outputs over 100 runs; safe handling of injection, empty, gibberish and emoji-only replies.
- Time to insight: the tester did not plant the themes.

## Out of Scope

- WhatsApp, and any channel other than Telegram. (Pitch only.)
- Voice notes, images and files from employees.
- HRIS or payroll sync, single sign-on, multi-company billing.
- Calendar booking for 1:1s, email notifications.
- Mandarin and Tamil.
- Langfuse or any trace store that holds reply text.
- Any self-hosted part on the production path other than OmniRoute and its tunnel.
- Topic clustering, embeddings, and agent frameworks.
- Any emotion, sentiment, personality or quit-risk scoring, now or later.
- Any use of Sapa data in performance, probation, discipline or hiring.
- Real employee data of any kind. The competition build uses synthetic data only.
- A formal PDPA data protection impact assessment and encryption key rotation. Both are named next steps for a pilot.

## Further Notes

- **Open questions for the team.**
  1. Model route: decided 14 Oct. OmniRoute behind a `cloudflared` named tunnel, with a direct Gemini fallback.
  2. Whether a chat disclosure counts as a complaint under Employment Act s.81B. Ask the HR judges or a lawyer; until then the bot text does not promise that HR will stay silent.
  3. Which chat app the target frontline workers use most. Ask in the HR interviews; it decides how hard the WhatsApp claim can be.
  4. Organiser questions in `admin/organiser-questions.md` (dates, submission, demo fallback, equipment).
- **Pitch wording fixes from the review.** Say "confidential, not anonymous". Say "4 of 6 who answered". Lead ROI with break-even. Say pay is out of scope. Say WhatsApp needs Meta templates.
- **Gemini pricing.** $0.75 / $3.75 per million tokens is an introductory price that a third-party source says ends 31 Dec 2026. Check before using the cost line in the pitch.
- **Small-company honesty.** Below about 5 hires a month, themes come from the rolling window. The flag queue is the main value there. Say so in Q&A.
