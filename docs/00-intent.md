# Sapa intent

*Owner: Abraham. Agreed 16 Oct 2026.*

This doc wins over every other doc, ticket, review and spec. If they disagree with it, they are wrong. Change this doc first, then the others.

## Goal

Win the AIFM 2026 pitch on 23 Oct. The live demo is the only thing that matters.

Sapa is a demo, not a real product. It has no real users. Do not build for production.

## What Sapa is

A chat bot that checks in with new employees during their first six months, plus a dashboard that shows HR the problems those employees share, so HR and managers can fix them before people resign.

## Show-off list

This list is the scope. We build and demo what is on it. We build nothing new for what is not on it.

**In**

- Check-in on Telegram. The AI labels the reply and quotes the words it used.
- HR confirms the AI label.
- HR drafts a fix and assigns it to a manager.
- The manager accepts the fix and marks it done in Telegram.
- New hires get "Update from HR". The next check-in asks the same 1–5 question again.
- Outcome: the score change against other teams, and the Impact view.
- AI quality watch.
- "What new hires mean": the AI groups replies inside one problem area.
- Fix library, only as the `DraftFix` board in the Fixes design shows it.
- `/ask` in Telegram: answers from the handbook. Questions the handbook cannot answer go to HR. This is not finished yet. Finish it.
- Serious concerns go straight to HR, with a case page.
- Bahasa Malaysia, English and Chinese. All are always on. No toggle.

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
