# AIFM 2026 — Sapa Product Rundown & Deliverables Checklist

*As of 14 Oct 2026 · Live version: [Claude Doc](https://claude.ai/code/artifact/db43d8dd-2495-4e94-a72b-93be99a5fb42). The working checklist with owners and statuses lives in [`/deliverables`](../deliverables/README.md).*

## 1. What Sapa does

Sapa is a chat bot that checks in with new employees during their first six months, plus a dashboard that shows HR the problems those employees share, so HR and managers can fix them before people resign.

**The core loop.**

1. A new hire answers a short check-in in chat. The AI labels the reply and quotes the words it relied on.
2. HR checks the evidence and assigns a fix.
3. The manager does the fix and marks it done.
4. New hires hear what changed, and the next check-in asks the same 1–5 question again.

**Four layers around the loop.** Each adds to the loop. None replaces it. The demo shows the loop and a few rules from each layer. The rest stay ready for Q&A.

- **Reach.** Three language packs (Bahasa Malaysia, English and Chinese, with Manglish accepted), Telegram and handbook Q&A between check-ins.
- **Care.** A fixed offer of a private chat for one person, serious concerns that go to HR only, and fixed milestone nudges for managers.
- **Proof.** Score change against other teams, fix evidence, the job-match card, the Impact view and the exit check.
- **Trust.** The AI quality watch, `/myanswers`, the worker-voice export and the agency view.

**The problem it solves.** Today most companies only learn why a new hire was unhappy at the exit interview, when it is too late. The causes are usually ordinary and fixable: unclear priorities, weak onboarding, little feedback.

**Two signals, one problem.** Sapa reads two kinds of new-hire input about the same pain point, onboarding gaps that make new hires leave:

- **Check-in replies.** Short scheduled check-ins show which problems new hires share.
- **Questions.** Between check-ins a new hire can ask the bot about the company ("how do I claim OT?"). The bot answers only from the HR handbook and shows the handbook sentence it used. Questions that 3 or more new hires ask, and the handbook cannot answer, go to HR without names. Each one shows HR a gap in onboarding.

Q&A is not a second product. It is a second source of signal for the same fix-the-onboarding loop.

**Who uses it**

| Person | What they do in Sapa | Time it takes |
| --- | --- | --- |
| New hire | Answers 3–4 short questions on Telegram, in Bahasa Malaysia or English, at Day 3, 7, 14, 30, 60, 90 and Month 6. Can ask the bot questions about the company at any time. Can see their own stored replies, with the AI summary and tags, with `/myanswers` (`/jawapansaya`), and flag "this is wrong" to HR. Voluntary; can skip, stop or delete at any time | About a minute each time |
| HR | Sees shared problems across the intake, reviews the evidence, drafts and assigns a fix, and approves a short "Update from HR" note for new hires. An Impact view shows response rate, days from reply to action done, the score change after fixes against other teams, manager milestones done and, across completed intakes, six-month retention as a trend and not proof | Minutes a week |
| Manager | Accepts the fix, carries it out, marks it done with a one-line note. Gets fixed Day 1, 7 and 30 nudges for each new hire, and alerts, in Telegram. Sees their own fixes and weekly team snapshots on the web | One task at a time |

**What the AI does, and only this**

1. Suggests a label for each answer: role clarity, manager support, belonging, onboarding and training, or workload. It attaches the exact sentence as proof.
2. Picks a follow-up question from a fixed probe bank, by ID. It never writes its own follow-up questions.
3. Writes a short narrative over theme counts. SQL does the counting, such as "Role clarity: 8 of 19 who answered". Themes appear only when at least 5 people have answered.
4. Drafts a suggested fix that HR edits before anyone sees it.
5. Answers new hires' questions only from the published HR handbook, with a quote that code checks word for word.
6. Spots serious issues (harassment, bullying, safety, self-harm, signs of forced labour) and sends them straight to HR.

**What a person still decides.** SQL counts. The AI suggests labels. Labels the AI is unsure about wait for HR. HR reviews the evidence before any action. The AI writes to a new hire only two things, each labelled and each about something they asked for: a handbook answer that quotes a page HR published and, with `/myanswers`, the AI's reading of their own replies. HR chooses the action. The manager accepts it and marks it done.

**When one person's reply needs follow-up.** HR may send that person one fixed, HR-approved offer: "Would you like a short private chat with HR?" The manager never sees it.

**What Sapa never does.** No secret monitoring, no reading of emotions, no prediction of who will quit, and no use in performance reviews or probation.

### One example, start to finish

1. Mei Ling (a fictional new hire) gets her Day 14 check-in: "How clear are you on what is expected of you this week? (1–5)"
2. She types: "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu."
3. The bot sends one fixed follow-up from the probe bank. The AI suggests the label **role clarity** and quotes her sentence as the evidence.
4. HR's dashboard now reads "Role clarity: 8 of 19 who answered, hired in the last 6 months".
5. HR (Aishah) clicks "Draft action" on the Role clarity card and gets "Agree a weekly priority list with each new hire every Monday". She edits it, sets the scope to the supervisor's team (Mei Ling chose "HR only", so the fix cannot name her), approves a short note for new hires, and assigns it to the supervisor.
6. The supervisor accepts it, does it and marks it done.
7. The bot sends Mei Ling the note: "Update from HR: your team now has a weekly priority list every Monday."
8. Next check-in, the bot asks the same 1–5 question again, with no hint of the fix, so HR can see whether the score moved more than in other teams.

That loop of **feedback, AI themes, human review, support action**, closed by the update and the recheck, is exactly the minimum output the AIFM guide asks for in Challenge 4.

## 2. Deliverables and their requirements

The guide asks for three things on pitch day: presentation slides, a working prototype shown live, and a pitch with Q&A of 8–10 minutes. The table lists every requirement behind those, taken only from the organisers' Student Challenge Guide ([PDF](reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf); page numbers refer to it). "Required" means the guide states it as a rule; "Recommended" means it labels it a suggestion.

| Deliverable | Requirement as stated in the guide | Type | Source |
| --- | --- | --- | --- |
| Challenge choice | Select ONE challenge option only, then follow that challenge's section | Required | p.1 |
| One-sentence idea | "We are building ___ for ___ so they can ___ faster / better / more clearly." Slide 1 carries this one-sentence project idea | Recommended | p.2, p.10 |
| Working prototype | Show the minimum output: employee feedback → AI finds themes → HR / manager reviews → support action | Required | p.6 |
| Challenge 4 build steps | Choose one employee group; decide what voluntary feedback to collect; use AI to summarise themes; highlight issues needing follow-up; show and track a clear HR or manager action | Recommended ("step by step") | p.6 |
| Responsible-AI rule | Do not secretly monitor employees or infer emotions from cameras or a single behaviour; use transparent, voluntary information | Required ("IMPORTANT") | p.6 |
| Human review | Keep important decisions reviewable by people; show what a person still reviews, decides or does | Required | p.2, p.8 |
| Sample data | Use fictional, anonymised or properly permitted sample data; never upload real confidential employee records or company personal data into public AI tools | Required ("IMPORTANT") | p.11 |
| Answers to the 7 questions | The final project must cover the HR problem, the user, the current process, the solution, how AI is used, the human action and testing (section 3) | Required | p.8 |
| Testing evidence | Test whether the prototype makes the process faster, clearer, more consistent or more useful; slide 8 shows what was tested, what improved and what users said | Required (item 7); slide content recommended | p.2, p.8, p.10 |
| Presentation slides | Each team presents with slides AND a working demo; no more than 10 slides recommended | Slides and demo required; slide count recommended | p.10 |
| Live demo | Show the working prototype and one complete user journey | Required (demo); journey on slide 7 recommended | p.9, p.10 |
| Pitch session | 8–10 minutes per team including judges' Q&A; suggested split 5–6 min presentation, 1–2 min demo, 1–2 min Q&A | Time limit required; split recommended | p.10 |

**The guide's suggested 10-slide structure (recommended, not required)**

1. Team & Challenge: team name, selected challenge, one-sentence project idea.
2. The Real HR Problem: what happens today, who experiences it, why it matters.
3. Evidence / Current Process: what you learned from users, research or the existing workflow.
4. Your Solution: what you built and who uses it.
5. How It Works: input → AI process → output → human action.
6. How AI Adds Value: what AI does and why it beats a normal manual process.
7. Demo: the working prototype and one complete user journey.
8. Testing / Result: what you tested, what improved, what users said.
9. Responsible AI: what humans review; how you reduce bias, errors, privacy or misuse risks.
10. Impact & Next Step: value for HR or the company, and what you would improve next.

## 3. What the judges score

Three criteria share the top weight of 20% each: the AI solution, innovation, and the pitch with its live demo. The guide also says teams are not judged by how many AI tools they use (p.11).

### The seven questions the final project must answer (p.8)

The second column is the guide's wording; the third is how Sapa answers it, so you can check the product against each one.

| # | What the guide asks | Sapa's answer |
| --- | --- | --- |
| 1. The HR problem | What is difficult, slow, unclear or inconsistent today? | HR learns why new hires struggle only at the exit interview, after they have resigned |
| 2. The user | Who uses your solution? | HR staff, plus line managers who carry out actions; new hires give the feedback and ask questions |
| 3. Current process | What happens today before your solution exists? | Problems surface in exit interviews, matching the guide's own Challenge 4 scenario |
| 4. Your solution | What exact function did you build? | Telegram check-ins at set milestones, handbook Q&A, an HR dashboard of shared themes and unanswered questions, action tracking, an "Update from HR" notice and a neutral recheck question |
| 5. How AI is used | What information goes in, what does AI do, and what useful output comes out? | In: check-in answers and questions. AI: suggests a label with a quote for each answer, picks a fixed follow-up, drafts an action, answers from the handbook. SQL counts the themes. Out: themes such as "Role clarity: 8 of 19" and an editable action |
| 6. Human action | What must a person still review, decide or do? | HR reviews the evidence and the labels the AI is unsure about, and chooses the action; the manager accepts it, carries it out and records the outcome |
| 7. Testing | Did your prototype make the process faster, clearer, more consistent or more useful? | AI accuracy measured on labelled sample replies; HR timed reading raw replies versus using the dashboard |

### Judging criteria (p.9, total 100%)

| Weight | Criterion | What judges look for |
| --- | --- | --- |
| 20% | AI Solution & Functionality | A working, useful solution; a clear role for AI; meaningful improvement to the process; important decisions stay understandable and reviewable by people |
| 20% | Innovation & Creativity | An original or thoughtful idea; creative use of AI; better than an obvious or purely manual solution; strong user experience |
| 20% | Pitch, Live Demo & Teamwork | A clear story within the time limit; a convincing live demo; strong Q&A; good teamwork; every member understands and can explain the project |
| 15% | Problem Identification & Understanding | A clear, specific HR problem; who is affected; what happens today; why it matters; evidence or root cause |
| 15% | Business & Economic Impact | Potential to save time or cost, or improve productivity, hiring quality, retention or decision-making; practical value, feasibility, scalability |
| 10% | ESG Impact | Responsible impact such as fairness, privacy, inclusion, accessibility, employee wellbeing, governance or efficient use of resources; not every ESG area is needed |

## 4. Not covered by the guide: confirm with the organisers

The guide says nothing about dates, submission mechanics or eligibility. The official site (aifm.asia) opens, and [07 official rules](07-official-rules-and-requirements.md) records what it says: build to 22 Oct, Round 1 online 23–25 Oct, Grand Final in Penang on 7 Nov, teams of 1 to 5, and no file upload (the submission is the live prototype and pitch). Items still open are below. The live list is in [`admin/organiser-questions.md`](../admin/organiser-questions.md) and 07 section 12.

- [x] Dates: build 5–22 Oct, Round 1 online 23–25 Oct, Final 7 Nov (07 section 2). Registration close still conflicts (16 Oct or 2 Oct)
- [ ] Submission: the site lists no upload step (07 section 5). Confirm that only the live demo and pitch count
- [ ] Demo format: whether a recorded demo is accepted as a fallback (the criteria say "convincing live demo")
- [ ] Equipment: whether a screen, projector or phone mirroring is provided at the venue
- [x] Team and eligibility rules: 1 to 5 per team, Malaysian university students (07 section 3). Edge cases still open
- [x] Topic-selection form: the problem is chosen on the registration form (07 section 3)

**Sources**

- AIFM 2026 Student Challenge Guide, all challenges ([organisers' PDF](reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf)): every requirement in sections 2 and 3
- [Sapa research and product dossier](03-research-dossier.md): the product description in section 1
- [Prototype architecture](02-prototype-architecture.md): how the product is built
