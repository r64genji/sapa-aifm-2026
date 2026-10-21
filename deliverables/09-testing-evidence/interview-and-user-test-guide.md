# HR interviews and user tests: how to run them

Our plan, not an organiser rule. The AIFM guide only asks for evidence (slide 3) and testing (slide 8). Neither needs a specific method.

**Deadlines:** build ends 22 Oct. Round 1 pitching is 23–25 Oct (online). Finish interviews and tests by **21 Oct**.

## Why do this

- Slide 3, "Evidence / Current Process": "Show what you learned from users, research or the existing workflow."
- Slide 8, "Testing / Result": "What did you test? What improved? What did users say?"
- Judging, Problem criterion (15%): "evidence or root cause behind the problem."
- Our client story uses made-up company numbers (27% early leavers, RM3,500 average salary; see `docs/09-client-story.md`). Replace them with what interviewees tell us.

## Part 1. HR interviews

**How many:** 3–4 people, 30 minutes each: 15 on the problem (A), 15 on the app (B). If they give only 15 minutes, do A only.

**Who:** HR staff at companies that hire new people every month. Small HR teams (1–3 people) are the best match for Sapa. Sources:
1. Our AIFM mentor group (WhatsApp).
2. The organisers' industry contacts (josephine@penangdigitalisation.com).
3. Friends and family in HR, and LinkedIn. Keep the message short and ask for 30 minutes.

**If nobody replies:** use published research and say so on slide 3. A real quote is stronger.

**Before you start:** say what we are building, say we will quote them only with permission, and never ask about named employees.

### How to ask

- Do not show or describe Sapa until part B. Once they have seen it, they talk about the app, not their problem.
- Ask what they did last time, not what they would do. "Would you…" answers are guesses.
- After each answer, ask "Why?" or "Can you give me an example?", then stay quiet.
- Do not defend the app. Write down the criticism and say thank you.

### Part A. The problem (before you show anything)

Must-ask questions are marked ★.

How they do it today:

1. ★ Walk me through a new hire's first 3 months. Who checks on them, when, and how?
2. What tools do you use for that: HR system, forms, WhatsApp, spreadsheets?

The pain:

3. ★ Tell me about the last new hire who left in the first 6 months. When and how did you find out they were unhappy?
4. Looking back, were there early signs? Why did nobody catch them?
5. What do exit interviews say? Do the same reasons come up again and again?
6. ★ How many new hires leave in the first 6 months? What does one early leaver cost you: rehiring, training, agency fees, lost work?
7. What is the most annoying part of checking on new hires?

What they have tried, and whether they plan to fix it:

8. ★ What have you tried to fix this? What happened? Why did you stop?
9. Have you paid for a tool, survey or consultant for this? How much?
10. ★ Where does early turnover rank on your HR list this year? What is above it?
11. Is anyone planning to fix it? Who decides, and whose budget pays?

For HR consultancies, swap 8–11 for:

- How often do clients ask you about early turnover? What do you sell them?
- Where does your current method break or cost the most time?
- What do clients do after your report? How do you know if it worked?

Close: "Who else should I talk to about this?"

### Part B. The app (after part A)

Show the dashboard with fake data. Do not explain it first.

12. ★ After 10 seconds: "In your own words, what does this do?"
13. Give the three tasks from Test 4 below. Ask them to think out loud. Note where they pause.
14. ★ Which problem from earlier would this solve? Which would it not?
15. What here looks like a tool you already use? What felt unfamiliar or confusing?
16. Who do you think can see a new hire's answers? (Checks trust and whether the privacy screen works.)
17. Would new hires answer honestly on Telegram? What would worry you, or them?
18. What would make you not trust the weekly summary?
19. How would this fit your week and your HR system? Who else must say yes?
20. Rate 1–5: clarity, ease of use, usefulness, trust.
21. What one thing would you change first?
22. ★ Would you let Sapa run for three monthly intakes, each until Month 6? Who would need to approve it?

### Write down

- Exact quotes. Ask: "Can we use this on a slide, with or without your name?"
- Numbers: early-leaver rate, cost per leaver, check-in frequency.
- The sentence "we find out when ___".
- How they handle it today, and whether fixing it is on this year's plan.

Save quotes in `quotes.md` with the person's role, company type and the permission they gave.

## Part 2. User tests

All tests use **fake data**. Never use a real person's feedback or a real CV. The dossier's full plan is section G of `docs/03-research-dossier.md`. The five tests and targets are in this folder's `README.md`.

### Test 4: HR user value (3–5 people)

1. Load the dashboard with fake data for 20 hires. Do not explain it.
2. Give three tasks:
   - "Find the top problem new hires have."
   - "Draft a fix and assign it to a manager."
   - "Check who can see a new hire's answers."
3. Watch. Note success or failure, and where they get stuck.
4. Ask for 1–5 ratings: clarity, usefulness, trust.
5. Ask: "Would you use this? What is missing?"

Target: average ≥ 4/5, and at least 2 quotable statements.

### Test 5: new-hire experience (5–10 volunteers)

1. Each friend role-plays a new hire and chats with the real bot.
2. Time each check-in. Target: ≤ 2 minutes.
3. Ask: "Would you answer honestly?" (1–5, target ≥ 4). Ask: "Who sees your answers?" (target: everyone answers correctly).
4. Tell them first that the bot is voluntary and what happens to their answers. This is the Challenge 4 rule: "transparent, voluntary information."

### Test 3: time to insight

1. Make a fake intake: 20 hires × 3 check-ins.
2. One teammate finds the top 3 problems and who needs follow-up by hand in a spreadsheet. Another uses Sapa.
3. Record minutes and accuracy against an answer key.

Target: ≥ 70% faster with equal or better accuracy.

### Tests 1 and 2

Run by Abraham with the eval script. See the README in this folder.

## Part 3. What to record

| Where | What |
| --- | --- |
| `results.md` | Numbers for every test, with date and sample size |
| `quotes.md` | HR and volunteer quotes, with permission |
| `charts/` | κ by language chart, before/after time bar |
| `limitations.md` | "Synthetic data and a small sample; next step is a pilot with one company: three monthly intakes, each through Month 6." |

## Part 4. 7-day plan

| Days | Do |
| --- | --- |
| 15–16 Oct | Send interview requests. Ask the mentor group. |
| 16–19 Oct | Run interviews. Update slide 3 and the ROI numbers. |
| 19–21 Oct | Run tests 3, 4 and 5. Test 4 needs the working dashboard. |
| 21–22 Oct | Fill in `results.md`, make the charts, draft slide 8. |

## Optional tool

The workshop 4 trainer used **Maze** to run user tests from a shared link. It is optional. A WhatsApp message and a call also work.
