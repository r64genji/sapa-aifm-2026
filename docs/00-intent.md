# Sapa intent

*Owner: Abraham. Agreed 16 Oct 2026.*

This doc wins over every other doc, ticket, review and spec. If they disagree with it, they are wrong. Change this doc first, then the others.

The spec (docs/05) is never the source of truth. It records how we build what this doc asks for. My intent here always takes precedence over it. If the spec says something this doc does not want, change the spec.

## Goal

Win the AIFM 2026 pitch on 23 Oct. The live demo is the only thing that matters.

Sapa is a demo, not a real product. It has no real users. Do not build for production.

## Official rules come first

We must not miss anything the organisers require. A missed requirement can lose the win.

- Every task must follow the official rules, requirements and Challenge 4 brief. Use them as the reference.
- Sources: [docs/07](07-official-rules-and-requirements.md), the challenge guide in [reference/AIFM_2026_Student_Challenge_Guide.md](reference/AIFM_2026_Student_Challenge_Guide.md), and the briefing transcripts in `reference/transcripts/`.
- Before you call a task done, check it against the deliverables, judging criteria, pitch rules and Responsible AI rules in docs/07.
- If an official requirement is not on the show-off list below, tell Abraham at once. Do not skip it in silence.

## What Sapa is

A chat bot that checks in with new employees during their first six months, and after that with longer-serving employees on a lighter schedule (agreed 19 Oct 2026, to help with retention and workload; HR sets the days and questions of each track in the dashboard), plus a dashboard that shows HR the problems those employees share, so HR and managers can fix them before people resign.

## Privacy: HR knows who, managers never do

Agreed 16 Oct 2026 as anonymous. Changed on 21 Oct 2026 to named to HR, after three HR professionals (docs/16, 17, 18) said a new hire cannot hide from HR. Managers never see a name, except in a fix HR sends from one hire's reply (R10). On 23 Oct 2026 each new hire got the choice at join, after Gary Teh (docs/19) said some will only speak up if anonymous (R62).

- HR gives one join link (QR code) per team in each intake. There is no personal invite link. The team QR sets the new hire's team.
- After consent, the new hire picks "Share my name" or "Stay anonymous" and can change it with /privacy (R62).
- Named: Sapa asks the name once. HR sees it with every reply, for example "Aina Rahman · AP Asia · Day 14", and can send a fix about that hire, by name, to their manager.
- Anonymous: HR sees a reply only when 5 or more people in that team (named and anonymous) raised the same problem area. A fix from it never names the hire. HR cannot send an anonymous hire a private-chat offer, because HR could not contact them. Counts include anonymous hires.
- A manager never sees a name, a reply or a dashboard. A manager's whole interface is Telegram messages from Sapa. Nothing a manager receives carries a new hire's words. A manager receives a hire's name only in a fix HR sends from that hire's reply, so the manager can act for that person.
- There is no minimum group size for counts. HR sees every count, even for one person. A team count can therefore show that a lone anonymous hire named a problem area; the promise to them covers their words and name, not counts.
- HR can send a fix from one reply to that hire's own manager (R10). HR can still send a fix to a team, several teams or an intake.
- Phone numbers, emails and ID numbers in a reply are masked in what HR sees, not only in what the AI sees.
- The AI never sees a name.
- Serious concerns still go to the company's speak-up channel, which is a separate and anonymous system.
- Sapa keeps the Telegram chat ID so it can send check-ins. Telegram can read bot chats.
- The consent text says the manager never sees answers and HR and the manager never see the chat ID. It does not say that Telegram can read bot chats: the owner chose to leave that out (23 Oct 2026). Do not add it back without the owner.

## Show-off list

This list is the scope. We build and demo what is on it. We build nothing new for what is not on it.

**In**

- Check-in on Telegram as a short chat (agreed 17 Oct 2026). Scale questions show words that fit each question, not numbers, and Sapa stores 1–5. After the taps, one fixed question asks what happened behind the lowest tap (no AI, agreed 24 Oct 2026). Then one fixed last question asks if there is anything else HR should know (agreed 23 Oct 2026, after Gary Teh, docs/19). The bot only thanks the hire for it; it never sums it up in the chat. There is no "what I will tell HR" step. The AI labels the reply and quotes the words it used.
- HR confirms the AI label.
- HR drafts a fix and assigns it to a manager. A fix can start from one reply and go to that hire's own manager.
- The manager accepts the fix and marks it done in Telegram.
- New hires get "Update from HR". The next check-in asks the same scale question again, first and with no hint of the fix. Later in that check-in it asks "Since the last Update from HR about <topic>, how has it changed for you?" (Much worse … Much better; <topic> names the fixed driver, such as "your workload"), and the chat asks what changed or what still does not work. HR sees the answers and quotes on the fix.
- Outcome: the score change against other teams, and the Impact view.
- AI quality watch.
- "What new hires mean": the AI groups replies inside one problem area.
- Fix library, only as the `DraftFix` board in the Fixes design shows it.
- Fresher vs experienced split (agreed 21 Oct 2026). On join, Sapa asks one tap: "Is this your first full-time job?" Sapa stores the answer on the person and never shows it with a person. The problem page shows each problem area split by fresher and experienced, under the same minimum group size as every other split.
- Repeat flag (agreed 21 Oct 2026). When the same team shows the same problem area again within 6 months, the problem page says so, for example "2nd time in 6 months". It comes from SQL counts, not from the AI.
- `/ask` in Telegram: answers from the handbook. Plain text outside a check-in goes to `/ask`. Questions the handbook cannot answer go to HR.
- Serious concerns: Sapa tells the new hire, in one short message, to report it to HR through the company's speak-up channel (demo: Contoh Speak Up, with web form, email and 24-hour phone). It names only that channel: never 999, helplines, the tribunal or any outside authority. Official complaints are 100% anonymous and are a separate company system, not Sapa's problem to solve. HR sees the replies and a count, and nothing to act on in Sapa (agreed 16 Oct 2026).
- Check-in schedule screen: HR sets the days and questions of two tracks, New hire and Employee (R60). The join code stays the same. This is not the Settings page.
- Bahasa Malaysia, English and Chinese. All are always on. No toggle.
- HR sees which teams need a fix, and sends one fix to many team leads at once (R51, R54).
- `/say` in Telegram: a new hire writes a message for their lead in any language, and the AI gives it back as clear, polite English to send themselves. Sapa stores nothing.

**Out**

- Private chat offer.
- `/myanswers`.
- Job match card and the job-match question.
- Worker-voice export.
- Agency view.
- People page, Settings page, handbook editor.
- Fast browser test tooling and reliability runners.
- Extra 1–5 questions for every driver.

## Plan for the days left

Demo first. In this order of value:

1. Make every show-off feature work when someone goes off-script. A judge may type anything.
2. Test with 3–5 real people. Slide 8 needs what users said.
3. Rehearse. Record a backup video of the demo.
4. Prepare answers to hard judge questions. Features that are out become Q&A answers.
5. Spend about 1 hour on the GitHub README. No more.

## Rules for agents

1. Cuts apply to new work only. Leave built code that does no harm.
2. No production hardening. Write less edge-case code from now on.
3. Tests: one test for each show-off feature, and no others. Keep the AI accuracy test and the HR timing test; slide 8 uses them.
4. When a ticket leaves a gap, do the simplest thing that looks good in the demo. Add one short line to `../build-state/guesses.md` and to the run report. No essays.
5. Suggest cuts for anything that will not earn points. Cut nothing until Abraham says yes.
6. A review may only cut, fix or polish what is on the show-off list. A new feature needs Abraham's OK.
7. The demo script is not final. It is not a source of truth. Abraham and Mikael own it in its own file.
