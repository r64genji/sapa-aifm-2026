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

## Privacy: anonymous to the company

Agreed 16 Oct 2026. Raised to "anonymous to the company" on 17 Oct 2026.

- HR gives one join link (QR code) per team in each intake. There is no personal invite link. HR hands the team QRs out, for example on each team's Day 1 welcome sheet. A team lead never hands them out, because the lead would see who joins.
- The team QR sets the new hire's team. The new hire does not pick a team in the bot.
- Sapa never asks for or keeps a new hire's real name or Telegram name.
- HR sees what a new hire wrote, never who wrote it. A manager never sees what a new hire wrote, only weekly counts. HR sees no code name and no ID that links one person's replies. A reply shows only its team and day, for example "A new hire · AP Asia · Day 14".
- Phone numbers, emails and ID numbers in a reply are masked in what HR sees, not only in what the AI sees.
- A fix goes to a team, several teams or an intake, never to one person.
- Sapa never asks for a name or phone, not even on a serious concern.
- Sapa still keeps the Telegram chat ID so it can send check-ins. Telegram can read bot chats. A person's own words can still show who they are.
- Each check-in starts with: "Sapa does not know your name. Your company sees what you write, never who wrote it. Leave out names and details if you want to stay anonymous."
- Say "anonymous to your company". Never say "fully anonymous" or "100% anonymous": the chat ID, Telegram and a person's own words make that untrue.

## Show-off list

This list is the scope. We build and demo what is on it. We build nothing new for what is not on it.

**In**

- Check-in on Telegram as a short chat (agreed 17 Oct 2026). Scale questions show words that fit each question, not numbers, and Sapa stores 1–5. After the taps, a fixed first question asks about the lowest tap, then the AI asks up to 2 follow-up questions and stops at a natural point. There is no "what I will tell HR" step. The AI labels the reply and quotes the words it used.
- HR confirms the AI label.
- HR drafts a fix and assigns it to a manager.
- The manager accepts the fix and marks it done in Telegram.
- New hires get "Update from HR". The next check-in asks the same scale question again, first and with no hint of the fix. Later in that check-in it asks "Since the last Update from HR about <topic>, how has it changed for you?" (Much worse … Much better; <topic> names the fixed driver, such as "your workload"), and the chat asks what changed or what still does not work. HR sees the answers and quotes on the fix.
- Outcome: the score change against other teams, and the Impact view.
- AI quality watch.
- "What new hires mean": the AI groups replies inside one problem area.
- Fix library, only as the `DraftFix` board in the Fixes design shows it.
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
