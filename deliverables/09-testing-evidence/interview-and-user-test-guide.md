# HR interviews and user tests: how to run them

Our plan, not an organiser rule. The AIFM guide only asks for evidence (slide 3) and testing (slide 8). Neither needs a specific method.

**Deadlines:** build ends 22 Oct. Round 1 pitching is 23–25 Oct (online). Finish interviews and tests by **21 Oct**.

## Why do this

- Slide 3, "Evidence / Current Process": "Show what you learned from users, research or the existing workflow."
- Slide 8, "Testing / Result": "What did you test? What improved? What did users say?"
- Judging, Problem criterion (15%): "evidence or root cause behind the problem."
- Our client story uses made-up company numbers (27% early leavers, RM3,850 average salary; see `docs/09-client-story.md`). Replace them with what interviewees tell us.

## Part 1. HR interviews

**How many:** 3–4 people, 15 minutes each.

**Who:** HR staff at companies that hire new people every month. Small HR teams (1–3 people) are the best match for Sapa. Sources:
1. Our AIFM mentor group (WhatsApp).
2. The organisers' industry contacts (josephine@penangdigitalisation.com).
3. Friends and family in HR, and LinkedIn. Keep the message short and ask for 15 minutes.

**If nobody replies:** use published research and say so on slide 3. A real quote is stronger.

**Before you start:** say what we are building, say we will quote them only with permission, and never ask about named employees.

### Questions

1. Tell me about the last new hire who left in the first 6 months. When did you find out they were unhappy?
2. What do you do today to check on new hires? Who does it, and how often?
3. What do they say in the exit interview? Do the same reasons come up again and again?
4. How many new hires leave in the first 6 months? What does one early leaver cost you?
5. Would new hires answer honestly on Telegram? What would worry you, or them?
6. If a tool gave you a weekly summary of common problems, what would you do with it?
7. What would make you not trust it?
8. Would you let Sapa run for three monthly intakes, each until Month 6?

### Write down

- Exact quotes. Ask: "Can we use this on a slide, with or without your name?"
- Numbers: early-leaver rate, cost per leaver, check-in frequency.
- The sentence "we find out when ___".

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
