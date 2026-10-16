# PRD — Sapa dashboard (HR and manager web app)

*As of 14 Oct 2026. This is the **design PRD** for every screen of the Sapa web app. It is written to be pasted into Claude Design as the brief. It is self-contained: a designer needs no other doc. Behaviour, rules and data come from the [implementation spec](../05-implementation-spec.md); rule IDs (R1–R29) point there. Labels: `ready-for-design`.*

## How the work is split

| | Dashboard PRD (this doc) | Implementation spec (05) |
|---|---|---|
| Built in | Claude Design | Claude Code on the team's machines |
| Owns | Every web screen: layout, states, components, copy, visual tone, the demo's visual beats | Bot conversation, scheduler, AI pipeline, rules R1–R29, database, privacy, tests |
| Hands over | Designs for every screen and state, a component sheet mapped to shadcn/ui names, theme tokens as Tailwind/shadcn CSS variables | Server loaders that return the fields in each screen's **data contract** below, and one action call per button |
| Does not own | Any rule. If a design needs data not in a contract, change the contract here first, then tell the implementation owner | Any visual decision |

**The contract is the seam.** Each screen below lists the data it receives and the actions it can call. The design may only show that data and only call those actions. This lets design and code proceed at the same time.

**Not in this PRD:** the Telegram bot's messages and buttons. They are plain chat text constrained by Telegram, and they live in the implementation spec. This PRD only includes a **phone preview** component that shows those messages inside the dashboard (consent preview, question preview, notice preview).

---

## Problem Statement

HR at a company that hires every month learns why new hires struggled only at the exit interview. Sapa fixes the collection part: new hires answer short voluntary check-ins in Telegram, and AI tags each reply. But collection is worth nothing if HR cannot see the pattern, trust the AI, and turn it into a fix that a manager actually does. That is the dashboard's job.

The dashboard has three audiences with very different needs:

- **HR (Aishah).** One of two HR staff at a 300-person factory. Desktop, busy, not a data analyst. Needs to see in under a minute what new hires share, check the AI's reading against the real words, and get a fix assigned. Must never feel like she is spying on people.
- **Manager (Raj).** Production supervisor, promoted for technical skill. Opens the app from a Telegram link on his phone, on the shop floor. Needs one task, its reason, and two buttons.
- **Judges.** On pitch day they see the dashboard on a projector for about 90 seconds, then may ask to see more. The guide says: "The judges should immediately understand what goes in, what AI does, what comes out, and what a person does next" (p.2). They score with the rubric below.

## Solution

A calm, evidence-first web app where every AI output sits beside its source and every decision has a visible human owner.

- HR lands on an **Overview** that tells the week's story as the loop: replies in → themes found → items to review → actions in progress → issues resolved.
- **Themes** show "N of M who answered", always with the denominator, and an honest "not enough people yet" state.
- **Every reply** is shown as the new hire's own words with the AI's evidence quote highlighted inside them, the AI's tags marked as suggestions, and HR's confirm-or-correct controls.
- **Actions** run on a board from draft to done. The composer makes privacy visible: it shows who will see the action, blocks choices that would expose someone, and previews the "resolved" message new hires will get in Telegram.
- **Escalations** are a separate, quiet, HR-only area with a protocol checklist and a clock.
- **Insights** prove impact and AI quality with numbers for slides 8 and 10.
- **How Sapa works** is a page any judge can read in 30 seconds: what AI does, what people decide, who sees what, what Sapa never does.
- **Managers** get a phone-first view: my actions, accept, mark done, and a weekly team snapshot.
- **Demo mode** adds a small control panel and a live pipeline log so the 90-second demo is legible from the back of the room.

## Rubric → design goals

The design is judged as part of the product. Every screen must earn points on at least one row.

| Criterion (weight) | What judges look for (guide p.9) | What the UI must make obvious | Screens |
|---|---|---|---|
| AI Solution & Functionality (20%) | Working, useful; clear role for AI; meaningful improvement; decisions understandable and reviewable by people | Where AI acted, with an "AI suggested" marker. The evidence quote inside the real reply. A human confirm/correct control next to every AI output. The model and prompt version on request | Reply detail, Inbox, Themes, Action composer, Pipeline log |
| Innovation & Creativity (20%) | Original idea; creative AI use; better than manual; **strong user experience** | The closed loop: feedback → theme → action → "resolved" message → recheck, visible on one action timeline. Bilingual and Manglish replies shown as written. Phone previews of what new hires see | Overview, Action detail, Composer, Phone preview |
| Pitch, Live Demo & Teamwork (20%) | Clear story in time; convincing live demo | Each demo beat readable on a projector at 1280×720: big numbers, a visible count change from 3 to 4, a highlighted new row, a toast when the manager closes the action | Overview, Reply detail, Composer, Action detail, Demo panel |
| Problem Identification (15%) | Clear problem; who; what happens today; why it matters | The five problem areas named in plain words and tied to real early-exit causes. Themes by touchpoint show *when* problems start (for example week 2) | Themes, How Sapa works |
| Business & Economic Impact (15%) | Saves time or cost; improves retention or decisions; feasible; scalable | Time from reply to action, share of actions done in 7 days, response and opt-out rates, recheck improvement. Works for a 2-person HR team | Insights → Impact |
| ESG (10%) | Fairness, privacy, inclusion, accessibility, wellbeing, governance | "Who can see this" on every reply. The 5-person minimum shown, not hidden. No person-level scores anywhere. Audit log. Escalations handled with care. Accessible design | How Sapa works, Audit log, Settings → Privacy, every reply |

Also from the guide: the Challenge 4 **success question** is "Can HR understand emerging employee problems earlier and take a useful action before the issue becomes more serious?" The Overview must answer it at a glance.

## User Stories

### HR — first look

1. As an HR user, I want the Overview to show this week's loop as five numbers (replies in, themes found, to review, actions open, issues resolved), so that I know the state of things in five seconds.
2. As an HR user, I want the top themes on the Overview, each as "N of M who answered", so that I see shared problems without clicking.
3. As an HR user, I want escalations waiting for me shown on the Overview in a separate, clearly marked block, so that I never miss one.
4. As an HR user, I want a new reply to appear on my open screen within seconds with a gentle highlight, so that I notice it without refreshing.
5. As an HR user, I want the time window (rolling 90 days, or one intake) visible and changeable at the top, so that I know what the numbers cover.

### HR — themes

6. As an HR user, I want each theme card to show the problem area in plain words, the count with its denominator, and the change since last week, so that I can read it like a sentence.
7. As an HR user, I want a theme with too few people to show "Not enough people yet — 3 of 5 needed", so that I understand why there is no number.
8. As an HR user, I want a theme page with a weekly trend, a breakdown by touchpoint (Day 3 … Month 6) and by intake, so that I see when the problem starts.
9. As an HR user, I want the theme page to show a short AI narrative clearly labelled as AI-written, so that I can reuse it but know its source.
10. As an HR user, I want the theme page to list the replies behind the count, each with its evidence quote, so that I can check the number is real.
11. As an HR user, I want "what is going well" shown beside the problems, so that the picture is balanced.
12. As an HR user, I want pay, growth and commute concerns in a separate "For HR only — context" area, so that I do not turn them into manager tasks.
13. As an HR user, I want a "Draft action" button on every theme, so that I go from pattern to fix in one click.

### HR — inbox and replies

14. As an HR user, I want an Inbox of replies needing my review, newest first, so that I can work through them.
15. As an HR user, I want filters for status (needs follow-up, needs review, awaiting AI, reviewed), problem area, team and touchpoint, so that I can focus.
16. As an HR user, I want each row to show the new hire's display name, team, touchpoint, the AI summary, problem-area chips and a visibility badge, so that I can triage without opening it.
17. As an HR user, I want the reply page to show the original words large, with the evidence quote highlighted inside them, so that I can check the AI's reading at a glance.
18. As an HR user, I want the AI's tags and summary in a panel marked "AI suggestion", with its confidence in words (low, medium, high), so that I know it is a suggestion.
19. As an HR user, I want to confirm the tags or change them with chips, so that the record shows my judgement.
20. As an HR user, I want to see when a tag was changed by me or a colleague, so that the record is honest.
21. As an HR user, I want a "Why did the AI say this?" disclosure showing the evidence rule, model and prompt version, so that I can explain the AI to anyone.
22. As an HR user, I want a clear "Who can see this reply" badge (HR only, or HR and Raj), so that I never share by mistake.
23. As an HR user, I want "awaiting AI" and "needs review" replies to show a plain explanation and a retry button, so that nothing is lost.
24. As an HR user, I want the person's earlier replies on the reply page, collapsed, so that I have context without a profile of the person.
25. As an HR user, I want "Mark reviewed" and "Draft action" as the two main buttons, so that the next step is obvious.

### HR — escalations

26. As an HR user, I want escalations in their own page, never mixed with routine replies, so that serious matters get the right attention.
27. As an HR user, I want each escalation to show how long it has waited against the 1-working-day target, so that I act in time.
28. As an HR user, I want a protocol checklist (read, decide, contact or record "don't contact", log outcome), so that I follow the same steps every time.
29. As an HR user, I want a short legal reminder for sexual harassment reports (inquiry duty within 30 days), so that I do not miss a legal duty.
30. As an HR user, I want to see what the bot already told the person, so that I do not repeat or contradict it.
31. As an HR user, I want to close an escalation and choose to send the fixed closure message, with the button disabled and explained when the person asked not to be contacted, so that I respect their wish.

### HR — actions

32. As an HR user, I want the Action composer to open with an AI draft from the action library, labelled as AI-drafted, so that I start from something good.
33. As an HR user, I want to see other library options for the same problem area, so that I can pick a better fit.
34. As an HR user, I want to choose the scope (one person who agreed to share, a manager's team, or an intake), so that the action fits the problem.
35. As an HR user, I want the composer to show who will see this action and what they will see, so that privacy is visible before I commit.
36. As an HR user, I want a scope or owner choice that would expose someone to be disabled with a plain reason ("Raj has only 1 new hire in scope; this would reveal who said it"), so that I cannot make that mistake.
37. As an HR user, I want to pick the owner (a manager or me) and a due date, so that someone is responsible.
38. As an HR user, I want to write the "resolved" note for new hires in English and Bahasa Malaysia, starting from an AI draft, so that the note is ready to go out when the work is done.
39. As an HR user, I want a phone preview of the resolved message as the new hire will see it in Telegram, so that I know exactly what they get.
40. As an HR user, I want to tick "No notice" with a reason instead, so that sensitive actions can stay quiet.
41. As an HR user, I want an Actions board with columns Draft, Assigned, Accepted, Done and a Dismissed filter, so that I see progress at a glance.
42. As an HR user, I want overdue cards marked and sorted first, so that I can nudge managers.
43. As an HR user, I want each done card to show "Notice sent to N" and the recheck result ("3 of 4 say clearer"), so that I know the loop closed and whether it worked.
44. As an HR user, I want an action page with a timeline (drafted by AI, edited by Aishah, assigned to Raj, accepted, done, notice sent, recheck results), so that the whole story is on one page.
45. As an HR user, I want to edit or cancel the pending notice until it is sent, so that I can fix it if the outcome changed.
46. As an HR user, I want to dismiss an action with a reason, so that the board reflects real decisions.

### HR — people and setup

47. As an HR user, I want a People list with display name, team, manager, start date, "Day N", consent status, visibility choice and next check-in, so that I see coverage.
48. As an HR user, I want no score, mood, risk or rank column anywhere in People, so that the list can never become a watch list.
49. As an HR user, I want to add a new hire and get a printable QR code and link, so that I can hand it over on Day 1.
50. As an HR user, I want a person page with their consent history (version, scope, time), check-in timeline and replies, so that I can answer their questions.
51. As an HR admin, I want to export a person's data from their page, so that I can meet a data access request.
52. As an HR user, I want a Managers list with Telegram link status and a "Remove access" button, so that I can manage who sees what.
53. As an HR user, I want Settings for time zone, holidays, minimum group size (5 or more, with the reason shown), retention, escalation contacts and helplines, so that I can configure Sapa safely.
54. As an HR user, I want to edit questions, probes, the action library and the consent text in both languages with a live phone preview, so that I see exactly what new hires get.
55. As an HR admin, I want an Audit log I can filter by person, actor and action, so that I can answer "who looked at this?".

### HR — insights

56. As an HR user, I want an Impact tab with response rate per touchpoint, opt-out rate, median time from reply to review, median time from reply to action, share of actions done within 7 days, and recheck improvement, so that I can show management that it works.
57. As an HR user, I want an AI quality tab with the eval results (agreement by language, escalation catch rate as "k of n") and the live override rate, so that I can show how far to trust the AI.
58. As an HR user, I want each number to carry its sample size and date, so that I never overclaim.
59. As an HR user, I want to copy any chart as an image, so that it can go straight onto a slide.

### Manager

60. As a manager, I want to open the app from the link in my Telegram alert and land on that action, so that I do not hunt for it.
61. As a manager, I want My actions as a simple list on my phone, newest and overdue first, so that I know what to do.
62. As a manager, I want each action to show what to do, why (theme-level reason with no names unless consented), due date, and two big buttons (Accept, Mark done), so that I can act in seconds.
63. As a manager, I want "Mark done" to ask for one line of outcome and tell me it stays internal, so that I write it plainly.
64. As a manager, I want to see a new hire's own words only when they chose to share with me, labelled "Shared with you by Mei Ling", so that I know it was their choice.
65. As a manager, I want a weekly Team snapshot with "fewer than 3" in place of small numbers, so that I see the picture without identifying anyone.
66. As a manager, I want to know nothing about escalations, scores or individual tags, and to see a short "What you can and cannot see" note, so that the rules are clear.
67. As a manager, I want a one-screen page to link my Telegram, so that I get alerts.

### Judge and demo team

68. As a judge, I want the reply page to show input, AI step, output and human action in one view, so that I understand the product in one look.
69. As a judge, I want a "How Sapa works" page with the loop, who sees what, and what Sapa never does, so that I can test the responsible-AI claim during Q&A.
70. As a judge, I want the numbers on screen large enough to read from the back of the room, so that I can follow the demo.
71. As the demo driver, I want a Demo panel with "Advance to Day N", "Reset demo", and status lights for the AI route and Telegram, so that I control the demo and know it will work.
72. As the demo driver, I want a live pipeline log ("reply received → personal details masked → AI tagged Role clarity → evidence checked ✓ → counted 4 of 6"), so that judges see the AI process happen.
73. As the demo driver, I want the demo panel hidden outside demo mode, so that it never appears in a real company's app.
74. As the demo driver, I want a toast on the HR screen when the manager marks an action done and when the notice is sent, so that the loop's end is visible on the projector.

## Implementation Decisions

### Platform and design system

- **Component system:** shadcn/ui (new-york style), Tailwind CSS v4, lucide icons, Recharts for charts. The design must use shadcn component names (Card, Badge, Table, Tabs, Sheet, Dialog, Command, Toast/Sonner, Sidebar, Chart) so the build maps one-to-one.
- **Theme:** delivered as shadcn CSS variables (background, foreground, primary, muted, accent, destructive, border, ring, chart-1…5) plus Sapa's own semantic tokens below. Light theme only.
- **Layout:** HR uses a left sidebar shell at 1280–1440 px wide. Manager screens are phone-first at 375 px and also work on desktop.
- **Fonts:** one sans-serif with clear digits (for example Inter or Geist). Tabular figures for all counts.

### Visual tone

- Calm, warm and trustworthy. This is a support tool, not a security console.
- **No surveillance cues:** no heatmaps of people, no red/amber/green per person, no "risk" or "score" anywhere, no avatars-in-a-grid watch walls.
- **Red is reserved for escalations only.** Overdue uses amber. Problem areas use the five chart colours, never red.
- **AI is visibly marked.** A small consistent "AI" marker (sparkle icon plus "AI suggestion" or "AI-drafted") on every AI output. When HR confirms, it changes to "Reviewed by Aishah".
- Numbers always appear with their denominator and window ("4 of 6 who answered · October intake").

### Semantic tokens and chips

| Token | Use |
|---|---|
| `driver-role-clarity`, `driver-manager-support`, `driver-belonging`, `driver-onboarding`, `driver-workload` | Problem-area chips, theme cards, charts. Five distinct, colour-blind-safe hues, none red |
| `context` (neutral grey) | Pay & benefits, Growth, Commute & logistics |
| `positive` (soft green) | "Going well" |
| `escalation` (red) | Escalation badge and page accent only |
| `ai` (violet-ish accent) | AI markers |
| `overdue` (amber) | Overdue actions and timers past target |
| `visibility-hr`, `visibility-shared` | "HR only" and "Shared with manager" badges |

Plain names (always these words, never codes): **Role clarity, Manager support, Belonging, Onboarding & training, Workload, Pay & benefits, Growth, Commute & logistics, Going well, Serious concern.**

### Shared components

1. **Theme card.** Problem area name, big "N of M who answered", window label, change since last week (arrow plus number), small sparkline, "Draft action" button. Variants: normal, suppressed ("Not enough people yet — 3 of 5 needed"), manager snapshot ("fewer than 3").
2. **Count with denominator.** Big number, "of M who answered", window. Animates when it changes (demo beat).
3. **AI marker.** Icon plus label; states: AI suggestion, AI-drafted, Reviewed by {name}, Changed by {name}.
4. **Evidence highlight.** The reply text with the evidence quote highlighted; tooltip "AI used these words as evidence".
5. **Problem-area chip.** Colour plus plain name. Editable variant for tag correction (toggle on and off).
6. **Visibility badge.** "HR only" (lock icon) or "Shared with Raj" (people icon). Tooltip explains who can see it.
7. **Pipeline strip.** Four steps — Reply → AI tagged → HR reviewed → Action — each ticked or pending, with time. Appears on reply and action pages; it is the guide's "input → AI → output → human action" made visible.
8. **Phone preview.** A Telegram-like chat bubble frame showing bot messages and buttons in BM or EN. Used in the composer (resolved note), settings (questions, consent) and How Sapa works.
9. **Status pill.** Action states (Draft, Assigned, Accepted, Done, Dismissed), reply states (Needs follow-up, Needs review, Awaiting AI, Reviewed), notice states (Pending, Sent to N, Cancelled, No notice).
10. **Timeline.** Vertical list of events with actor (AI, HR name, manager name, new hires) and time.
11. **Protocol checklist.** Steps with ticks and times, for escalations.
12. **Live toast.** Bottom-right toast for live events (new reply, action done, notice sent).
13. **Route status light.** Green, amber, red dot with label (AI route, backup AI, Telegram), for the demo panel.
14. **Empty state.** Short sentence plus one next step. Never a blank area.
15. **Metric tile.** Number, label, sample size and date, small info icon with the definition.

### Information architecture

**HR sidebar:** Overview · Themes · Inbox (badge count) · Escalations (red badge count) · Actions · People · Insights · How Sapa works · Settings · Audit log (HR admin only). Footer: organisation name, user, demo mode toggle (demo only).

**Manager nav (bottom tabs on phone, top tabs on desktop):** My actions · Team snapshot · About my access.

**Top bar on HR screens:** window selector (Rolling 90 days ▾ / intake list), search people, live indicator ("Live" dot when Realtime is connected).

### Screen inventory and contracts

Notation: **Data** = fields the server loader returns. **Actions** = calls the screen may make. **States** = every state the design must show.

---

#### S0 · Sign in
- **Who:** HR, manager. **Rubric:** —.
- **Content:** Sapa wordmark, one-line purpose, email field, "Send sign-in link". Small line: "Sapa is for onboarding support only. It is never used for performance or probation."
- **Actions:** request magic link.
- **States:** default, link sent, error (unknown email), expired link.

#### S1 · Overview (HR home)
- **Who:** HR. **Rubric:** AI Solution, Pitch, Business. **Demo:** beat 2.
- **Purpose:** answer the success question in five seconds.
- **Content, top to bottom:**
  1. Loop strip: five metric tiles in a row joined by arrows — Replies in (this week) → Themes found → To review → Actions open → Issues resolved (with "notices sent").
  2. Escalations block (only if any are open): red-accented card "1 serious concern waiting · 3 h of 1 working day", button "Open". Never shows content on the Overview.
  3. Top themes: up to five theme cards for the selected window, sorted by count; suppressed cards shown greyed with their reason.
  4. "Going well" strip: one or two positive themes.
  5. Recent activity: last 8 events (reply tagged, action assigned, action done, notice sent), each linking to its page.
- **Data:** window label, respondents, hires in window; counts for the five tiles; open escalation count and oldest wait; theme list (area, count, denominator, delta, sparkline points, suppressed, reason); positive themes; recent events (type, time, actor, link).
- **Actions:** change window, open theme, draft action from theme, open escalations, open event.
- **States:** loading skeleton; empty (no replies yet: "No replies yet. New hires get their first check-in on Day 3."); all suppressed; live update (count animates, toast "New reply from Production · Day 14").

#### S2 · Themes (list) and S3 · Theme detail
- **Who:** HR. **Rubric:** AI Solution, Problem, Innovation.
- **S2 content:** grid of theme cards for all problem areas plus a "For HR only — context" row (pay, growth, commute) and "Going well". A switch: by window or by touchpoint (Day 3 … Month 6 as columns, areas as rows, counts in cells, suppressed cells shown as "—" with tooltip).
- **S3 content:**
  1. Header: area name, big count with denominator, window, delta, "Draft action".
  2. Weekly trend chart (12 weeks).
  3. By touchpoint bar chart ("most mentions at Day 14").
  4. By intake table (suppressed rows marked).
  5. AI narrative card with AI marker and "Written from the counts above; numbers checked".
  6. Evidence list: the replies behind the count — display name, team, touchpoint, evidence quote highlighted, visibility badge, reviewed state. Click opens S5.
  7. Linked actions for this area with status and recheck results.
- **Data:** area, count, denominator, window, delta; weekly series; per-touchpoint counts; per-intake rows with suppressed flag; narrative text and generated time; evidence list rows; linked actions.
- **Actions:** change window, draft action, open reply, open action.
- **States:** suppressed (whole page shows the reason and the evidence list stays visible to HR), no data, narrative pending ("AI summary is being written"), narrative failed (hidden, with "Summary not available; counts are correct").

#### S4 · Inbox
- **Who:** HR. **Rubric:** AI Solution.
- **Content:** table with columns: status pill, display name and team, touchpoint ("Day 14"), AI summary (one line), problem-area chips, visibility badge, received time. Escalated replies never appear here; a slim banner at the top links to Escalations if any are open. Filters as chips above the table. Bulk "Mark reviewed" for confirmed rows.
- **Data:** rows (reply ID, status, person display name, team, touchpoint, summary, areas, concern level, visibility, time, AI confidence); filter counts.
- **Actions:** filter, open reply, mark reviewed (single or bulk), retry AI.
- **States:** empty ("Inbox zero. New replies appear here."), awaiting AI rows (grey, with "AI unavailable — keyword safety check done"), new row highlight on live update.

#### S5 · Reply detail
- **Who:** HR. **Rubric:** AI Solution, Innovation, ESG. **Demo:** beats 2–3. **This is the most important screen.**
- **Layout:** two columns.
  - **Left — "What they said":** person display name, team, touchpoint and day, language, visibility badge. The question asked (in the language asked). The reply text large, evidence quote highlighted. Probe question and answer below, if any. Collapsed "Earlier replies from Mei Ling (2)".
  - **Right — "What AI suggested" then "Your decision":** AI marker; summary sentence; problem-area chips; concern level in words; confidence in words; "Why did the AI say this?" disclosure (evidence rule, masked text note, model, prompt version, time). Then the decision area: editable chips, "Mark reviewed", "Draft action". After review the AI marker becomes "Reviewed by Aishah".
  - **Top:** pipeline strip (Reply 09:41 → AI tagged 09:41 → HR reviewed — → Action —).
- **Data:** reply (text, language, question text, probe Q&A, time, touchpoint, day), person (display name, team, manager name), visibility, AI tag (areas, context tags, positive, concern level, summary, evidence span offsets, confidence, model, prompt version, status), override history, earlier replies (summary, time, areas), linked actions.
- **Actions:** change tags, mark reviewed, draft action, retry AI, open person, open linked action.
- **States:** AI ok; needs review (banner: "The AI could not show exact evidence. Please read and tag this reply."); awaiting AI; reviewed; changed by a colleague; reply deleted by the person (page shows "This person deleted their replies" and nothing else); shared-with-manager badge state.

#### S6 · Escalations list and S7 · Escalation detail
- **Who:** HR only. Never in any manager view. **Rubric:** ESG, AI Solution.
- **Tone:** quiet and serious. Red accent only on the page header and badge, white space, no alarm animations.
- **S6 content:** table: category in plain words (for example "Harassment"), detected by (Keyword, AI, Both), received, waiting time vs 1 working day (amber when past), status (New, Acknowledged, Contact made, Closed), "don't contact" flag.
- **S7 content:**
  1. Reply text in full, question asked, time.
  2. What the bot already said (fixed safe message shown in a phone preview).
  3. Protocol checklist: Read · Acknowledge · Contact person or record "asked not to be contacted" · Record outcome · Close. Each with time and actor.
  4. Legal reminder card for sexual harassment: "Employment Act s.81B: inquire or give written reasons within 30 days. Sapa only routes; HR runs the process." Shown only for that category.
  5. Close dialog: outcome note (internal), option "Send closure message" with phone preview; disabled with reason if the person asked not to be contacted, stopped or deleted (R29).
- **Data:** escalation fields; reply text; bot message sent; checklist events; person display name and HR contact; don't-contact flag; closure eligibility and reason.
- **Actions:** acknowledge, record contact, record outcome, close, send closure message.
- **States:** new, acknowledged, overdue, closed, closure blocked.

#### S8 · Action composer (sheet from right, over any screen)
- **Who:** HR. **Rubric:** AI Solution, Innovation, ESG. **Demo:** beat 3.
- **Sections:**
  1. **Source:** theme or reply that started it, with its count or quote.
  2. **Action:** AI-drafted title and steps (AI marker), editable. "Other ideas from the library" as selectable chips.
  3. **Scope:** radio — One person (only if they agreed to share) · A manager's team · An intake. Disabled options show their reason inline (R10).
  4. **Who will see this:** a plain list ("Raj will see: the action and 'several new hires in your team mention unclear priorities'. Raj will not see: who said it or their words.").
  5. **Owner and due date:** manager picker (with Telegram link status) or "HR (me)"; date picker defaulting to 7 days.
  6. **Resolved message to new hires:** EN and BM tabs with AI-drafted text (AI marker), editable, character counter (≤ 40 words), live phone preview showing the fixed wrapper "Update from HR: … Thank you for telling us." Recipients line: "Will be sent to 6 new hires in Raj's team who are still taking part, when Raj marks this done." Checkbox "No notice for this action" with a reason field.
  7. Footer: "Save draft" and "Assign to Raj".
- **Data:** source; AI draft (title, steps, note EN, note BM); library options; scope options with enabled flag and reason; visibility explanation text per scope; managers (name, team, in-scope count, Telegram linked); recipient count per scope.
- **Actions:** regenerate draft, pick library option, set scope, set owner, set due date, edit note, set no-notice, save draft, assign.
- **States:** drafting (AI loading skeleton), AI unavailable (start from library entry instead), scope blocked, note missing (Assign disabled with reason), saved.

#### S9 · Actions board
- **Who:** HR. **Rubric:** AI Solution, Business.
- **Content:** kanban with columns Draft · Assigned · Accepted · Done; Dismissed behind a filter. Card: problem-area chip, title, scope ("Raj's team · 6 new hires"), owner, due date (amber when overdue), notice status pill, recheck result on done cards ("3 of 4 say clearer"). Filters: area, owner, overdue.
- **Data:** cards with those fields; column counts.
- **Actions:** open action, filter. (No drag between columns: state changes follow the rules and happen on the action page or by the owner.)
- **States:** empty column messages, overdue sort, live card move with toast when a manager accepts or completes.

#### S10 · Action detail
- **Who:** HR (full), manager (see M2). **Rubric:** Innovation, Pitch. **Demo:** beats 4–5.
- **Content:** header (title, area chip, status, owner, due); pipeline strip; steps; source link; scope and visibility explanation; resolved-message card (EN/BM, phone preview, status: Pending / Sent to 6 at 10:02 / Cancelled / No notice); outcome note (internal); recheck results (bar: clearer / same / less clear, with n); timeline of every event.
- **Data:** action fields; notice fields (text EN/BM, status, sent count, sent time); outcome note; recheck counts; timeline events.
- **Actions:** edit (draft only), assign, dismiss with reason, edit or cancel pending notice, reassign owner.
- **States:** each action state; notice pending vs sent; recheck pending ("Recheck goes out at each new hire's next check-in").

#### S11 · People and S12 · Person detail
- **Who:** HR. **Rubric:** ESG, AI Solution.
- **S11 content:** table: display name, team, manager, intake, start date, "Day N", consent (Agreed, Declined, Stopped, Deleted, Invited), visibility (HR only / Shared), next check-in. "Add new hire" button. **No score, mood, risk or rank column. No sorting by "problems".**
- **Add new hire dialog:** display name, team, manager, start date, language; on save shows a QR code, the link, its expiry (14 days) and "Print handout" (A5 handout with the QR, what Sapa is, and the privacy promise in BM and EN).
- **S12 content:** header; consent history (version, scope, time); check-in timeline (seven touchpoints with status: scheduled, sent, answered, reminded, skipped); replies list (summary, areas, link); notices received; buttons "New invite link" and "Export data" (HR admin).
- **Data:** people rows; person detail fields; invite (link, QR payload, expiry).
- **Actions:** add person, generate new invite, print handout, export data.
- **States:** invited but not joined, declined, stopped, deleted (row stays as "Deleted on {date}" with no content), synthetic (demo mode only, marked "Demo").

#### S13 · Managers
- **Who:** HR. **Content:** table of managers: name, team, new hires in scope, Telegram linked (yes/no), open actions, "Remove access". Invite manager dialog (email, team).
- **Actions:** invite, remove access, resend Telegram link.
- **States:** pending invite, linked, access removed.

#### S14 · Insights (tabs: Impact · AI quality)
- **Who:** HR. **Rubric:** Business, AI Solution, Pitch (slide 8 and 10 charts).
- **Impact tab:** metric tiles — response rate per touchpoint (bar), opt-out rate, median reply-to-review time, median reply-to-action time, share of actions done in 7 days, share of AI drafts approved with light edits, recheck improvement (share saying "clearer"). Each tile shows n and date range.
- **AI quality tab:** eval card (date, n, split) — agreement with human labels by language (BM, English, Manglish) as a bar chart with the 0.6 target line; follow-up catch rate; escalation catch rate as "10 of 10" with its range; reliability (valid first try). Live card — HR changed the AI's tags on X% of reviewed replies this month, by area.
- **Data:** metric values, n, ranges, series; eval results; override rates.
- **Actions:** change date range, copy chart as image.
- **States:** not enough data (tile shows "Needs 20+ replies"), eval not yet run.

#### S15 · How Sapa works
- **Who:** HR, manager (reduced), judges. **Rubric:** ESG, AI Solution, Problem, Pitch (Q&A).
- **Content, one scrolling page:**
  1. The loop as a diagram: New hire answers in Telegram → AI tags with evidence → HR reviews → Manager acts → New hire hears it's resolved → Recheck.
  2. "What AI does" (four short lines) vs "What people decide" (four short lines), side by side.
  3. "Who can see what" matrix: rows = reply text, problem tags, themes, escalations, actions; columns = HR, Manager, New hire. Cells: ✓, "only if shared", "weekly, 5+ people", ✗.
  4. "What Sapa never does": no hidden monitoring, no emotion reading, no quit prediction, no performance or probation use, no scores on people.
  5. The consent message in a phone preview, BM/EN toggle.
  6. "Why 5 people": one sentence and the industry practice.
- **Data:** consent text EN/BM and version; minimum group size; retention days.
- **Actions:** toggle language.
- **States:** static.

#### S16 · Settings (tabs)
- **Who:** HR (HR admin for privacy). **Tabs:**
  1. **Organisation:** name, time zone, working hours, public holidays list.
  2. **Privacy:** minimum group size (number input, min 5, helper text explaining why it cannot go lower), retention period, data export instructions.
  3. **Safety:** escalation HR contacts, helpline numbers and text per language, with the safe-message phone preview.
  4. **Check-in content:** questions and probes per touchpoint, EN/BM side by side, phone preview of a full check-in; consent text with version (editing creates a new version).
  5. **Action library:** entries per problem area, EN/BM.
- **Actions:** save each tab.
- **States:** saved, validation error (for example minimum below 5), unsaved changes warning.

#### S17 · Audit log
- **Who:** HR admin. **Rubric:** ESG.
- **Content:** table: time, actor, action (Viewed reply, Changed tags, Assigned action, Exported data, Removed access, Deleted by person …), target (link), detail. Filters: actor, person, action type, date.
- **Data:** audit rows. **Actions:** filter, export CSV.
- **States:** empty filter result.

#### S18 · Demo panel (floating drawer, demo mode only)
- **Who:** demo driver. **Rubric:** Pitch. **Demo:** beats 1 and 5.
- **Content:** demo clock ("Demo day: Day 13 for Mei Ling"); buttons "Advance 1 day", "Advance to Day 14", "Reset demo"; route lights (AI route, backup AI, Telegram); live pipeline log (last 10 steps with times).
- **Actions:** advance, reset, open/close drawer.
- **States:** collapsed (small pill bottom-left), expanded, resetting, a route down (amber or red with "Backup in use").

#### M1 · My actions (manager)
- **Who:** manager. Phone-first. **Demo:** beat 4 (if shown on web instead of Telegram).
- **Content:** list of cards: title, area chip, due date, status, "New" dot. Overdue first.
- **Data:** manager's actions only. **Actions:** open action.
- **States:** empty ("No actions for you right now.").

#### M2 · Action (manager)
- **Content:** title; what to do (steps); why — theme-level reason only, or the person's words when shared ("Shared with you by Mei Ling"); due date; big buttons **Accept** then **Mark done**. Mark done opens a one-line outcome field with the note "Only HR sees this. New hires get HR's message, not yours."
- **Data:** action title, steps, reason text, shared quotes (if any), due, status. **Never:** names without consent, tags, escalations.
- **Actions:** accept, mark done with outcome.
- **States:** assigned, accepted, done (shows "Thank you. HR will let the new hires know."), overdue.

#### M3 · Team snapshot (manager)
- **Content:** "Week of 13 Oct" snapshot cards per area: "fewer than 3", or a count with denominator, or "Not enough people yet". Note: "Updated weekly. Individual answers are not shown."
- **Data:** latest snapshot for the manager's team. **States:** no snapshot yet.

#### M4 · About my access (manager)
- **Content:** "What you can and cannot see" — short list; link to How Sapa works (reduced); "Link Telegram" card with a one-time link and status.
- **Actions:** generate Telegram link.

### Sample data for every mock (fictional only)

- **Organisation:** Contoh Manufacturing Sdn Bhd, 300 staff, Asia/Kuala_Lumpur.
- **People:** HR — Aishah (HR executive), Daniel (HR admin). Managers — Raj (Production), Siti (Quality). Live new hire — **Mei Ling**, graduate executive, Production, writes Manglish. Other October hires — Hafiz, Arif, Priya, Nurul, Kumar.
- **Demo seed:** October intake of 6 in Production. Before the demo: 5 answered Day 14; Role clarity 3 of 5. After Mei Ling replies: **Role clarity 4 of 6 who answered**.
- **Mei Ling's reply:** "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu." Evidence quote: "tak tahu mana nak buat dulu". AI summary: "Has several urgent tasks and is unsure which to do first."
- **Other sample replies:** BM — "Saya belum dapat akses sistem SAP lagi." (Onboarding & training). English — "My buddy has been really helpful this week." (Going well). Manglish — "Every day OT until 9pm, very tired lah." (Workload).
- **Action:** "Weekly priority list every Monday" — owner Raj, scope Raj's team (6 new hires). Resolved note EN: "Your team now agrees a top-3 priority list with your supervisor every Monday." BM: "Pasukan anda kini menetapkan 3 keutamaan utama bersama penyelia setiap Isnin."
- **Recheck:** "Are your priorities clearer this week?" — 3 of 4 say clearer.
- **Never** use real company names, real people, or real-looking IC numbers.

### The 90-second demo, screen by screen

| Beat | Time | Screen | What must be legible on the projector |
|---|---|---|---|
| 1 Check-in | 0:00–0:20 | S18 demo panel, then phone | "Advance to Day 14" pressed; pipeline log starts |
| 2 AI finds the theme | 0:20–0:40 | S1 Overview → S5 Reply detail | Toast "New reply"; Role clarity count animates 3 → **4 of 6**; on S5 the evidence quote highlighted inside Mei Ling's words; AI marker |
| 3 HR reviews and acts | 0:40–1:00 | S5 → S8 composer | "Mark reviewed"; composer with AI draft; scope "Raj's team"; "who will see this" list; resolved-message phone preview; "Assign to Raj" |
| 4 Manager acts | 1:00–1:20 | Raj's Telegram (or M2) | Accept, Mark done; on the HR screen a toast "Raj marked 'Weekly priority list' done" |
| 5 Loop closes | 1:20–1:30 | S10 action detail + phone | Notice status "Sent to 6"; phone shows "Update from HR: …"; timeline complete |

Design for this at 1280×720: body 16 px minimum on these screens, the theme count at least 48 px, toasts at least 16 px, and no essential detail in grey-on-grey.

### Copy rules

- Dashboard UI language: English. Employee words are always shown exactly as written; never auto-translated in the main view. A "Show English meaning" disclosure may appear on BM or Manglish replies, labelled as AI translation.
- Say "new hire", not "employee ID" or "subject". Say "serious concern", not "incident". Say "who answered", not "respondents". Say "problem area", not "driver".
- Never use: risk, score, sentiment, mood, flight risk, at-risk, red flag (for people), monitor, track (for people).
- Every AI output carries its marker. Every disabled button says why.

### Accessibility

- WCAG 2.1 AA: 4.5:1 text contrast, visible focus rings, full keyboard use, labelled form fields, charts with a table alternative.
- Colour is never the only signal: chips have text, status pills have text, the escalation badge has an icon and a word.
- Touch targets at least 44 px on manager screens.
- Respect reduced-motion: count animations become an instant change with a highlight.

## Testing Decisions

How a design is checked before it goes to code. Each check tests what a user sees, not how the design is built.

1. **Five-second test (rubric p.2).** Show S5 Reply detail to someone outside the team for five seconds. They must say what went in, what the AI did, what came out and what a person does next. Pass: 4 of 5 people.
2. **Rubric walk.** For each row of the rubric table above, point to the screen element that earns it. Any row without one is a gap.
3. **Privacy walk.** For each rule that touches the UI (R6, R7, R8, R9, R10, R28, R29), find the screen state that shows it: shared badge, no escalations in manager nav, suppressed card, "fewer than 3", blocked scope with reason, notice recipients line, closure message blocked with reason. Missing state = fail.
4. **No-score check.** Search every screen for a per-person number, colour or rank. Any found = fail.
5. **Projector check.** View the five demo screens at 1280×720 from 5 metres. Every item in the demo table must be readable.
6. **Manager phone check.** Raj's flow (M1 → M2 → Accept → Mark done) on a 375 px screen with one thumb, in under 20 seconds.
7. **Contract check.** Every field shown on a screen appears in that screen's data contract. Every button maps to a listed action. Mismatches are fixed in this doc first.
8. **Accessibility check.** Automated contrast check on tokens; keyboard walk of S5, S8 and S10.

## Out of Scope

- The Telegram bot's own interface (lives in the implementation spec; this doc only previews it).
- A new-hire web portal. New hires use only Telegram.
- Dark mode, native mobile apps, offline mode.
- Multi-company admin, billing, HRIS sync screens.
- Any per-person analytics, prediction, sentiment or ranking view, now or later.
- Bahasa Malaysia translation of the dashboard UI itself (content is bilingual; chrome is English).
- Pitch slides. The Insights charts are designed to be copied onto slides, but slide design is a separate deliverable.

## Further Notes

- **Name clash fixed.** Older docs use "Aishah" for HR and "Aisyah" for the new hire. Mocks use Aishah (HR) and Mei Ling (new hire) to avoid confusion on stage.
- **Priorities if time runs short.** Design in this order: S5, S1, S8, S10, M2, S18, S4, S3, S15, S14, then the rest. The first six cover the whole demo.
- **What Claude Design should hand back:** one design per screen with all listed states, a component sheet with shadcn names, theme tokens as CSS variables, and the sample data above in place. Exported in a form Claude Code can turn into Next.js pages.
- **Open questions for the team.**
  1. Does Raj close the action in Telegram (current demo) or on M2 in the web app? Design both; pick at rehearsal.
  2. Should managers see S15 How Sapa works in full or a reduced version? This PRD assumes reduced.
