# AIFM 2026 — Sapa Product Rundown & Deliverables Checklist

*As of 14 Oct 2026 · Live version: [Claude Doc](https://claude.ai/code/artifact/db43d8dd-2495-4e94-a72b-93be99a5fb42). The working checklist with owners and statuses lives in [`/deliverables`](../deliverables/README.md).*

## 1. What Sapa does

Sapa is a chat bot that checks in with new employees during their first six months, plus a dashboard that shows HR the problems those employees share, so HR and managers can fix them before people resign.

**The problem it solves.** Today most companies only learn why a new hire was unhappy at the exit interview, when it is too late. The causes are usually ordinary and fixable: unclear priorities, weak onboarding, little feedback.

**Who uses it**

| Person | What they do in Sapa | Time it takes |
| --- | --- | --- |
| New hire | Answers 3–4 short questions on Telegram at Day 3, 7, 14, 30, 60, 90 and Month 6. Voluntary; can skip, stop or delete at any time | About a minute each time |
| HR | Sees shared problems across the intake, checks the AI's reading, drafts and assigns a fix | Minutes a week |
| Manager | Receives the fix, carries it out, marks it done | One task at a time |

**What the AI does, and only this**

1. Reads each answer and labels the problem area it is about: role clarity, manager support, belonging, onboarding and training, or workload. It attaches the exact sentence as proof.
2. Counts those labels across the intake to show themes, such as "Role clarity: 4 of 6 new hires". Themes appear only when at least 5 people have answered.
3. Drafts a suggested fix that HR edits before anyone sees it.
4. Spots serious issues (harassment, bullying, safety, self-harm) and sends them straight to HR.

**What a person still decides.** HR checks every label and chooses the action. The manager carries it out. Nothing happens automatically to an employee.

**What Sapa never does.** No secret monitoring, no reading of emotions, no prediction of who will quit, and no use in performance reviews or probation.

### One example, start to finish

1. Aisyah (a fictional new hire) gets her Day 14 check-in: "Are your priorities for this week clear?"
2. She types: "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu."
3. The AI labels it **role clarity** and quotes her sentence as the evidence.
4. HR's dashboard now reads "Role clarity: 4 of 6 new hires in the October intake".
5. HR clicks "Draft action" and gets "Agree a weekly priority list with each new hire every Monday", edits it, and assigns it to the supervisor.
6. The supervisor does it and marks it done.
7. Next check-in, the bot asks "Are your priorities clearer this week?", so HR can see whether the fix worked.

That loop of **feedback, AI themes, human review, support action** is exactly the minimum output the AIFM guide asks for in Challenge 4.

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
| 2. The user | Who uses your solution? | HR staff, plus line managers who carry out actions; new hires give the feedback |
| 3. Current process | What happens today before your solution exists? | Problems surface in exit interviews, matching the guide's own Challenge 4 scenario |
| 4. Your solution | What exact function did you build? | Telegram check-ins at set milestones, an HR dashboard of shared themes, and action tracking |
| 5. How AI is used | What information goes in, what does AI do, and what useful output comes out? | In: check-in answers. AI: labels each answer's problem area with a quote, counts themes, drafts an action. Out: themes such as "Role clarity: 4 of 6" and an editable action |
| 6. Human action | What must a person still review, decide or do? | HR checks labels and chooses the action; the manager carries it out and records the outcome |
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

The guide says nothing about dates, submission mechanics or eligibility, and the official site (aifm.asia) could not be opened when this was written. Nothing below is assumed; each item is a question to settle. The live list is in [`admin/organiser-questions.md`](../admin/organiser-questions.md).

- [ ] Dates: registration close, build period, pitch day, and whether there is more than one judging round
- [ ] Submission: whether slides, a prototype link, source code, a video or a written report must be uploaded, where, in what format and by when
- [ ] Demo format: whether a recorded demo is accepted as a fallback (the criteria say "convincing live demo")
- [ ] Equipment: whether a screen, projector or phone mirroring is provided at the venue
- [ ] Team and eligibility rules: team size, student status, one entry per person
- [ ] Topic-selection form: its fields and deadline (the guide does not cover it)

**Sources**

- AIFM 2026 Student Challenge Guide, all challenges ([organisers' PDF](reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf)): every requirement in sections 2 and 3
- [Sapa research and product dossier](03-research-dossier.md): the product description in section 1
- [Prototype architecture](02-prototype-architecture.md): how the product is built
