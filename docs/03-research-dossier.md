# Sapa — AIFM 2026 Challenge 4 (RETAIN): Research & Product Dossier

*As of 14 Oct 2026 · Live version: [Claude Doc](https://claude.ai/code/artifact/8cef3335-cecc-4bce-812e-b8fd6617111e)*

**Sapa is a voluntary chat check-in assistant that helps HR and line managers spot new-hire difficulties in the first six months and act on them before they become resignations.** It follows the guide's Challenge 4 brief: one employee group (new hires), voluntary feedback, AI-found themes, human review and a tracked support action.

**One-sentence pitch (guide template):** We are building **Sapa**, a voluntary chat check-in assistant, **for HR teams and line managers at companies that hire continuously**, so they can **understand new-hire difficulties earlier and act on them more clearly**, before disengagement becomes resignation.

**Minimum output chain, as the guide requires:** EMPLOYEE FEEDBACK (short voluntary check-ins) → AI FINDS THEMES (tags each reply, summarises themes across the intake) → HR / MANAGER REVIEWS (flag queue with consent-aware visibility) → SUPPORT ACTION (AI drafts it, a human edits, approves and tracks it to done).

**Key decisions in this version:**

- **Target:** organisations of roughly 100–1,000 staff that hire new people every month in high-turnover sectors and have a small HR team. A second segment is MNC plants and operations sites, for the frontline new hires their corporate engagement tools do not reach. Very small companies are out of scope: they hire too few people for themes to mean anything.
- **Employee group:** new hires from Day 1 to Month 6, matching the guide's scenario of new employees leaving within six months. The densest check-ins fall in the first 90 days.
- **Visibility:** replies go to HR only by default. The manager sees an individual's words only if that employee agrees. Team themes appear only when at least 5 people have responded.
- **What Sapa never does:** no hidden monitoring, no emotion detection, no prediction of who will quit, no use in performance or probation decisions. This follows the guide's rule against secret monitoring and emotion inference.

"Sapa" comes from the Malay *tegur sapa*, to greet or check in. It is a working name.

## A. Target and scope

Sapa targets companies that hire new people continuously but have only one to three HR staff, because that is where early resignations are frequent, costly and invisible until the exit interview.

The guide's scenario sets the frame: "Several new employees leave within six months. Exit interviews mention unclear priorities, weak onboarding and lack of feedback. HR wants to understand problems earlier." That describes a company with an HR function and a steady flow of new hires.

| Segment | Fit | Why |
| --- | --- | --- |
| 100–1,000 staff, high-turnover sectors, monthly intakes, lean HR | **Primary target** | Enough new hires for themes to be meaningful; HR exists but is overstretched; no budget for enterprise tools; buys quickly |
| MNC manufacturing and operations sites (frontline new hires) | **Second segment** | Large operator and technician intakes; local site HR is small relative to headcount; corporate tools reach staff through email or Teams, which many operators do not have |
| Recruitment agencies placing candidates into these companies | **Channel partner** | Agencies commonly carry 1–3 month replacement guarantees, so early exits cost them directly |
| Large enterprises' office staff | Later | Usually already covered by Culture Amp, Qualtrics, Viva Glint or Workday Peakon |
| Small firms (under ~50 staff) | Out of scope | Too few hires per year for intake themes; owner usually talks to every hire directly |

**How Sapa fits MNCs:** as an add-on, not a replacement. The corporate engagement tool stays; Sapa covers frontline new hires it misses and exports anonymised intake themes into the company's existing HR reporting. Selling to local site HR as a single-site pilot avoids a months-long global procurement cycle at the start.

**Sectors with the clearest need** (Aon 2025 attrition, Malaysia):

- Retail, F&B and hospitality chains: the highest attrition at 22.2%, with outlets hiring every month.
- Manufacturing and electrical & electronics: 17.7% attrition, with regular intakes of operators, technicians and graduate engineers.
- Technology, shared-services centres and call centres: 17.1% in technology, with large graduate intakes.

**Employee group (guide step 1, "choose one employee group"):** all new hires from Day 1 to Month 6. Sapa works for both frontline and professional hires. Because it runs in chat apps, it also reaches shop-floor and outlet staff who have no company email, a group most engagement tools miss.

**Primary user (guide step 3):** the HR executive. **Secondary user:** the line manager or supervisor. **Feedback provider:** the new hire.

**Demo scenario used throughout this document:** a 300-staff manufacturer hires about 60 people a year in monthly intakes (operators, technicians, fresh-graduate executives). Its HR team is two people. Last year about 15 new hires left within six months, and exit interviews cited unclear priorities, weak onboarding and little feedback.

## B. The problem in plain language

New hires usually show signs of difficulty weeks before they resign, but HR has no structured way to hear them, so the reasons only surface at the exit interview.

**The situation.** The demo manufacturer takes on 5 operations executives in January. By June, 2 have resigned. Their exit interviews say: "I was never sure what my priorities were," "My supervisor was always busy," "Nobody showed me the system properly." HR heard none of this while it was happening, because nobody asked in a way that felt safe. Hiring starts again.

**Who is affected:**

- **New hires.** They struggle silently; many are fresh graduates unsure whether raising problems will hurt their probation.
- **Line managers.** Usually promoted for technical skill, not trained in onboarding. They lose output and must restart training.
- **HR.** One to three people covering hundreds of staff. They pay for repeated hiring and cannot explain it with data.
- **Recruitment agencies.** If a placed candidate leaves inside the guarantee period, the agency must find a free replacement.

**Why it matters.** Malaysia's attrition is among the highest in Southeast Asia, engagement is low, and the reasons people give for leaving are mostly things a manager could fix early.

### Root causes, mapped to the guide's list

| Guide's cause | What the research says | Sapa driver tag |
| --- | --- | --- |
| Unclear expectations | Top reason new hires leave within 90 days: job expectations not matching reality, 30.3% (Enboarder 2025) | `ROLE_CLARITY` |
| Weak onboarding | Poor onboarding cited in 17.4% of 90-day exits (Enboarder 2025); only 12% of employees strongly agree their organisation onboards well (Gallup) | `ONBOARDING_TRAINING` |
| Lack of support | 61% of Malaysians would quit if they did not feel they belonged; Gen Z 65% (Randstad 2025 Malaysia). Lack of connection cited in 19.5% of 90-day exits (Enboarder) | `BELONGING` |
| Workload issues | 41% leave because of poor work-life balance (Randstad 2026 Malaysia retention research) | `WORKLOAD` |
| Poor manager communication | 57% would quit if their manager did not support their development (Randstad 2025 Malaysia). Employees are 3.4× as likely to rate onboarding exceptional when managers take an active role (Gallup) | `MANAGER_SUPPORT` |

Pay is the most common overall reason for leaving (53% cite low pay, Randstad). Sapa does not claim to fix pay; it tags pay concerns and routes them to HR as context.

### Statistics

| Statistic | Source (year) | Geography / sample | Reliability |
| --- | --- | --- | --- |
| Malaysia attrition 18.2% in 2025; retail & hospitality 22.2%, manufacturing 17.7%, technology 17.1% | [Aon Salary Increase & Turnover Study](https://www.aon.com/apac/in-the-press/asia-newsroom/2025/aon-survey-projects-4-8-percent-salary-growth-for-malaysia-in-2026) (Dec 2025) | Malaysia; 700+ businesses across 6 SEA countries | Strong. Quote 2025 only; prior-year figures differ between Aon releases |
| Malaysia among the top 3 for attrition in SEA (Philippines 20.0%, Singapore 19.3%) | [Aon SEA release](https://treasurytoday.com/press-releases/press-release-aon-survey-projects-moderate-salary-growth-of-5-3-for-southeast-asia-in-2026/) (Oct 2025) | 6 SEA countries | Strong |
| 25% of Malaysian employees engaged, 66% not engaged, 9% actively disengaged | [Gallup State of the Global Workplace 2026](https://www.gallup.com/workplace/706178/state-global-workplace-malaysia-country-level-data.aspx) | Malaysia, 2025 data | Strong |
| 62% of Malaysian employees say it is a good time to find a job | Gallup 2026 (same) | Malaysia | Strong; shows how easily unhappy staff can leave |
| Top 90-day exit reasons: expectations 30.3%, connection 19.5%, onboarding 17.4% | [Enboarder HR leader survey](https://enboarder.com/blog/employee-engagement-onboarding-stats/) (2025) | 1,000 HR leaders, US/UK/Australia | Medium: vendor survey, not Malaysian |
| 86% of new hires decide how long to stay within 6 months | Enboarder (same) | Same | Medium |
| 57% would quit over an unsupportive manager; 61% over not belonging | [Randstad Workmonitor 2025 Malaysia](https://www.randstad.com.my/workforce-trends/2025-malaysia-upskilling-reskilling/) | 503 Malaysian respondents | Strong-medium (stated intention) |
| 73% feel more connected to their manager than to the company | [Randstad Workmonitor 2026 Malaysia](https://www.randstad.com.my/hr-trends/employer-brand/managers-are-key-source-of-workplace-stability-randstad-workmonitor-2026/) | 750 respondents | Strong-medium; the manager is the key lever |
| Gen Z average job stint 1.1 years; 22% left a job within a year | [Randstad Gen Z Workplace Blueprint](https://www.randstad.com/press/2025/genz-workplace-blueprint/) (2025) | 11,250 respondents, 15 markets | Medium (global) |
| 74.3% of workers aged 15–24 in roles below their qualification (Q3 2025) | [PNB Research Institute](https://www.klsescreener.com/v2/news/view/1729373/job-hopping-among-malaysian-gen-z-driven-by-poor-job-quality-not-work-ethic-pnb-research-institute) | Malaysia | Medium-strong; fuels expectation gaps |
| Replacing an employee costs 0.5× to 2× annual salary | [Gallup](https://www.gallup.com/workplace/247391/fixable-problem-costs-businesses-trillion.aspx) | US | Medium; method unpublished, so use the low end |

The two most defensible Malaysian figures are Aon's 18.2% attrition and Gallup's 25% engagement. Enboarder explains *why* people leave early, but it surveys Western HR leaders; say so if asked.

## C. Current process and where it breaks (slide 3)

Today HR learns why new hires struggled only at the exit interview: one person at a time, too late, and with no pattern across hires.

| Step | What happens today | What is lost |
| --- | --- | --- |
| 1. Offer and Day 1 | Offer letter, paperwork, EPF/SOCSO forms, equipment | Expectations set at interview are not written down. **Clarity** |
| 2. Weeks 1–4 | New hire learns on the job from a busy supervisor; usually no 30-60-90 plan | Onboarding quality depends on the supervisor. **Quality** |
| 3. Informal "how's it going?" | Supervisor or HR asks in passing or on WhatsApp | Polite answers to someone with power over probation; nothing recorded; no pattern across hires. **Honesty, memory** |
| 4. Probation review (commonly 3–6 months) | Manager rates the employee's performance | One-way; judges the person, not the onboarding; too late for early fixes. **Time** |
| 5. Annual engagement survey (if any) | Company-wide form once a year | New hires may already have left; open-text answers are rarely read or coded. **Time, quality** |
| 6. Resignation and exit interview | HR asks why they are leaving | Too late; people give "safe" reasons; each interview read in isolation. **Clarity** |
| 7. Re-hire | Job ads or agency, 1–3 months, onboarding restarts | The full cost repeats |

**What to add before the pitch:** 3–5 short quotes from HR practitioners or recruiters on how they check on new hires today, how many early leavers they had last year, and how they find out why. Real quotes are worth more on this slide than any global statistic.

## D. Answers to the guide's 7 required questions

1. **The HR problem.** New hires disengage in their first months over unclear priorities, weak onboarding, little feedback and low belonging. HR finds out only at the exit interview: late, one person at a time, unstructured, and with no follow-up.
2. **The user.** The HR executive (primary) and the line manager (secondary). New hires in their first six months are the voluntary feedback providers.
3. **Current process.** Informal check-ins, a probation review at 3–6 months, an occasional annual survey and an exit interview. None gives early, structured, comparable signals (Section C).
4. **Our solution.** A consent-based chat check-in bot with short scheduled check-ins in Bahasa Malaysia or English, plus a web dashboard showing HR and managers:
    - per-reply driver tags and follow-up flags,
    - themes across each intake,
    - an action tracker where AI drafts a support action and a human edits, approves and completes it.
5. **How AI is used.**
    - *Input:* short voluntary answers (rating scales plus free text, including Manglish).
    - *AI step A:* tags each reply to the 5 drivers, sets a needs-follow-up flag and writes a neutral one-line summary with an evidence quote.
    - *AI step B:* summarises themes across an intake ("3 of 5 operations hires mention unclear priorities in week 2").
    - *AI step C:* drafts a concrete action from a library (priorities 1:1, buddy introduction, training session).
    - *Output:* a prioritised flag queue and theme summary HR reads in minutes, plus editable action drafts.
6. **Human action.** HR reviews every flag and decides whether to act; HR can correct any AI tag. The manager edits, approves and carries out the action, then marks it done. HR alone handles serious disclosures; the bot only sends a fixed safe message. No automated decision about anyone's employment is ever made.
7. **Testing.** We measure AI-vs-human tag agreement on labelled Bahasa Malaysia, English and Manglish replies; time to find the main issues manually vs with Sapa on a synthetic intake; and HR practitioners' ratings and quotes on clarity and usefulness (Section G).

## E. Competitive landscape and differentiation

Existing engagement tools are company-wide, email or web based, English-first and stop at insights; Sapa is new-hire-only, chat-first, multilingual and ends in a tracked action.

| Product | What it offers for early retention | Price level (2026, mostly third-party estimates) | Gap Sapa targets |
| --- | --- | --- | --- |
| Culture Amp | Lifecycle surveys (onboarding, exit), benchmarks, comment analysis | No public price; estimates around US$5–9 per employee per month, ~US$4,500/yr minimum ([PeopleOps Club](https://peopleopsclub.com/software/culture-amp/pricing)) | Web/email surveys; built for people-analytics teams |
| Qualtrics EX, Microsoft Viva Glint, Workday Peakon | Enterprise surveys, text analytics, AI comment summaries | Enterprise pricing, often bundled | Needs a large HR stack and budget |
| Workleap Officevibe | Pulse surveys, anonymous feedback | Flat plans reported from US$4,999/yr ([Pulsewise](https://pulsewise.io/blog/employee-engagement-software-pricing/)) | English-centric; no chat-app delivery |
| Lattice, 15Five | Performance plus engagement, 1:1 tools | Reported US$4–15 per employee per month | Desk-worker focus |
| Malaysian HRIS and payroll suites | Payroll, leave, onboarding checklists, some basic surveys | Mid-market pricing | Admin-focused; no theme-to-action loop (not verified in depth) |
| Google Forms + WhatsApp (today's default) | Free | Free | No themes, no confidentiality rules, no follow-up tracking |

**Differentiation (Innovation & Creativity, 20%):**

1. **Chat-first in apps people already use.** No login, no company email needed, so it reaches frontline and outlet staff that email surveys miss. In MNCs it complements the corporate engagement tool instead of competing with it.
2. **Bahasa Malaysia, English and Manglish** understanding, which global vendors do not prioritise.
3. **Closed action loop.** Competitors stop at a dashboard; Sapa produces a drafted, approved and tracked action, which is the guide's "trigger useful follow-up".
4. **Consent-tiered visibility** built for real teams, where a supervisor may have only a few new hires.
5. **Narrow by design:** only the first six months, which makes it cheaper, simpler and easier to trust than a full engagement suite.
6. **Priced per new hire,** not per employee, so cost scales with hiring volume.

## F. Product specification inputs

The product has three parts: a chat check-in bot for new hires, an AI pipeline with three steps, and a dashboard for HR and managers.

### F1. Personas

| Persona | Profile | Goal | Pain today | What Sapa gives them |
| --- | --- | --- | --- | --- |
| **Aishah, HR Executive** | One of 2 HR staff at a 300-staff manufacturer; hires ~5 people a month | Fewer early resignations; evidence to show management | Cannot call every new hire; exit interviews arrive too late | Weekly theme summary, flag queue, action tracker |
| **Raj, Production Supervisor** | Leads 25 people; promoted for technical skill | New hires productive fast | Does not know what new hires struggle with | 2–3 concrete suggested actions a month, ready to use |
| **Hafiz, new operator** | 20, first factory job, phone only, prefers BM | Know what is expected; someone to ask | Afraid complaining will affect his probation | 1–2 minute check-ins in BM, private to HR by default |
| **Mei Ling, new graduate executive** | 23, first job, writes in Manglish | Learn and be noticed | Unclear priorities, little feedback | Same check-ins; option to share with her manager |

### F2. User journeys

- **New hire:** On Day 1, HR shares a QR code to the bot. The bot shows a plain-language consent message: what is collected, who sees it, that it is voluntary, that stopping has no effect on employment, how long data is kept, and how to delete it. The hire picks a language and taps "Setuju / I agree". Each check-in takes about 60–90 seconds plus at most one or two follow-ups. The hire chooses "HR only" (default) or "OK to share with my manager", and can type LANGKAU/SKIP, BERHENTI/STOP or PADAM/DELETE at any time.
- **HR:** On Monday the dashboard shows "October intake: 6 hires, 5 responded" and the theme "Role clarity: 3 of 5 mention unclear priorities in week 2". The flag queue shows routine items, and any escalation in red with its fixed protocol. HR reads the AI summary next to the original text, corrects a tag if needed, clicks "Draft action" and assigns it to the supervisor.
- **Manager:** Sees the assigned action with theme-level context (an individual's words only if that person consented), edits and approves it, carries it out, and marks it done with a one-line outcome.
- **Closing the loop:** The next check-in asks "Are your priorities clearer this week?", so HR can see whether the action worked.

### F3. Check-in schedule

Check-ins are densest early, because 86% of new hires decide how long to stay within 6 months (Enboarder) and the guide's scenario is exits within six months.

| Touchpoint | Focus | Core questions | Max AI follow-ups |
| --- | --- | --- | --- |
| Day 3 | Setup, first impressions, who to ask | 3 | 1 |
| Day 7 | Role clarity, tools and access | 3 | 1 |
| Day 14 | Priorities, manager feedback, workload | 3 | 2 |
| Day 30 | Belonging, training, expectation match | 4 | 2 |
| Day 60 | Workload, feedback, growth | 3 | 2 |
| Day 90 | Overall fit, "what would make you stay?" | 4 | 2 |
| Month 6 | Short pulse before the usual exit window closes | 3 | 1 |

Rules: each check-in takes 2 minutes or less; sent in working hours, never on public holidays; one reminder after 24 hours, then it lapses quietly.

### F4. Question bank (BM / English)

Scales are 1–5 unless noted. Native speakers should review the wording and test it.

| Driver | English | Bahasa Malaysia | When |
| --- | --- | --- | --- |
| ROLE_CLARITY | How clear are you on what is expected of you this week? (1–5) | Sejauh mana anda jelas tentang apa yang dijangka daripada anda minggu ini? (1–5) | D7, D14, D30 |
| ROLE_CLARITY | So far, does the job match what was described when you were hired? | Setakat ini, adakah kerja ini sama seperti yang diterangkan semasa anda diambil bekerja? | D14, D30, D90 |
| MANAGER_SUPPORT | In the past week, did you have a useful conversation with your supervisor about your work? (Yes / Not really) | Dalam seminggu lepas, adakah anda berbincang dengan penyelia tentang kerja anda dengan cara yang membantu? (Ya / Tidak sangat) | D7, D14, D60 |
| MANAGER_SUPPORT | Do you know who to ask when you are stuck? | Adakah anda tahu siapa yang boleh ditanya apabila anda tersekat? | D3 |
| BELONGING | Is there someone at work you feel comfortable going to for help? | Adakah ada seseorang di tempat kerja yang anda selesa untuk minta bantuan? | D3, D30 |
| ONBOARDING_TRAINING | Do you have the tools, system access and training you need? | Adakah anda mempunyai peralatan, akses sistem dan latihan yang diperlukan? | D3, D7, D30 |
| WORKLOAD | How manageable has your workload been this week? (1–5) | Sejauh mana beban kerja anda minggu ini boleh diurus? (1–5) | D14, D60, M6 |
| GROWTH (context) | Can you see how you could learn and grow here over the next year? | Adakah anda nampak peluang untuk belajar dan berkembang di sini dalam setahun akan datang? | D60, D90, M6 |
| OPEN | What is one thing that would make next week easier? | Apakah satu perkara yang boleh menjadikan minggu depan lebih mudah? | Every check-in |
| OPEN (stay) | What would make you want to stay here longer? | Apa yang akan membuatkan anda mahu kekal lebih lama di sini? | D90, M6 |

**Rules for AI follow-ups:** neutral and open ("Could you tell me a bit more?"); never leading; nothing about health, family, religion or colleagues' pay; never ask about intent to resign; no follow-up at all if a reply touches an escalation topic.

### F5. Theme taxonomy (AI step A)

- **ROLE_CLARITY:** unclear priorities, job differs from description, conflicting instructions, unclear success criteria.
- **MANAGER_SUPPORT:** little feedback, manager unavailable, unclear communication, no recognition.
- **BELONGING:** isolated, no buddy, cliques, left out of team communication.
- **ONBOARDING_TRAINING:** missing tools or access, no training, information overload, unclear processes.
- **WORKLOAD:** too much, too little, long hours or shifts, unclear deadlines.
- **Context tags (to HR only, not manager actions):** PAY_BENEFITS, GROWTH, COMMUTE_LOGISTICS.
- **POSITIVE:** what is working, so summaries are balanced.
- **ESCALATE (bypasses the normal flow):** harassment or sexual harassment, discrimination, bullying or threats, self-harm or crisis, safety hazards, wage or legal violations.
- **Per-reply `concern_level`:** none / low / needs_follow_up, based only on what was written. No emotion labels and no individual "attrition risk" scores.

### F6. Action library (AI drafts from these; a human approves)

| Driver | Suggested actions |
| --- | --- |
| ROLE_CLARITY | 15-minute priorities 1:1 with a written "top 3 this week" list; share the written job scope or probation KPIs; agree a 30-60-90 plan |
| MANAGER_SUPPORT | Weekly 10-minute check-in slot for 8 weeks; feedback template (one strength, one improvement); name a backup contact when the manager is away |
| BELONGING | Assign a buddy; team lunch or kopi introduction; add to team chat groups; introductions to 3 key colleagues |
| ONBOARDING_TRAINING | System-access checklist; a shadowing session; a short SOP or video; training plan review |
| WORKLOAD | Workload review in a 1:1; re-prioritise or remove tasks; clarify shift and overtime expectations |
| Context (pay, growth) | HR explains pay structure, probation confirmation and increment timeline; career conversation at Day 90 |
| ESCALATE | **No AI action.** Fixed protocol (F10) |

### F7. Data model

- `organisations`: settings such as minimum group size (default 5) and retention period.
- `people`: pseudonymous code, team, manager, start date, language, channel, encrypted chat ID.
- `consents`: version, granted time, scope (`hr_only` or `share_with_manager`), withdrawn time.
- `checkin_schedule` and `responses`: encrypted raw text, scale value, detected language, visibility.
- `ai_tags`: drivers, concern level, escalate flag, summary, evidence quote, confidence, model and prompt version, human override, reviewer.
- `cohort_summaries`: themes, number of respondents, suppressed flag.
- `actions`: driver, draft text, final text, owner, status (draft → assigned → approved → done or dismissed), outcome note.
- `escalations`: restricted, never visible to managers. `audit_log`: every view and change.

Use row-level security so managers see only their own assigned actions and aggregated summaries, and see individual replies only where the employee chose `share_with_manager`.

### F8. AI pipeline design

- **Step A (tag each reply).** Prompt defines the drivers, context tags and ESCALATE, with 2–3 examples each in BM, English and Manglish. The model must quote evidence, must not infer emotion or personality, and returns only schema-valid JSON, using "uncertain" when unsure. Run at temperature 0 with structured output; on invalid output, retry once and then send to human review.
- **Step B (intake themes).** Uses only tags and summaries, not raw text, and only for groups of 5 or more respondents. Outputs counted themes ("3 of 5") plus what is going well.
- **Step C (draft action).** Uses the driver, the theme and the action library. Produces a short editable draft that names no individual unless consent allows.
- **Safety layer.** A BM/English keyword list (for example *ganggu, gangguan seksual, buli, bunuh diri, harassment*) runs alongside the AI ESCALATE flag; either one triggers escalation. Employee text is treated as data, never as instructions.
- **Why this is credible:** published studies report strong agreement between LLM-assisted coding and human coders: Cohen's κ 0.87 and 0.81 in [Dai et al. 2023](https://arxiv.org/pdf/2310.15100); κ 0.72 in the [LATA pilot](https://www.eecis.udel.edu/~mlm/docs/2025-Wang-CSCW-LATA-Paper.pdf). But a [2025 study](https://arxiv.org/pdf/2501.08167) found LLMs overrate their own summaries, and [Malaysian code-mixed text](https://ieeexplore.ieee.org/abstract/document/11256062/) lowers model accuracy. So humans review every flag, and accuracy is reported separately for BM, English and Manglish.

### F9. Privacy, consent and group-size rules

- **Voluntary:** explicit, versioned consent. Declining or stopping has no effect on employment, and the employer commits to this in writing.
- **Purpose limit:** onboarding support only, never performance appraisal, probation or discipline.
- **Data minimisation:** no IC numbers, no health questions, no response-time or activity tracking.
- **Retention:** raw text deleted or anonymised 6 months after the last check-in; aggregates kept.
- **Rights:** delete command in chat; export on request.
- **Security:** encryption at rest, access controls, audit log, an AI provider that does not train on the data. Competition demos use synthetic data only, as the guide requires.
- **Minimum group size:** themes shown only when at least 5 people responded, the common industry default ([Culture Amp](https://support.cultureamp.com/en/articles/7048339-attributed-and-unattributed-survey-formats), [Qualtrics](https://www.qualtrics.com/support/confidentiality-overview-ex/), [Viva Glint](https://learn.microsoft.com/en-us/viva/glint/reports/confidentiality-suppression-reports)). Below 5, data is pooled across intakes or shown only to HR.
- **Honesty:** with very small intakes, true anonymity is impossible. Sapa promises confidentiality with consent, not anonymity.

### F10. Escalation protocol (serious disclosures)

1. **Detect:** keyword list or AI ESCALATE flag; either is enough.
2. **Bot reply:** fixed text, never AI-generated. It thanks the employee, says a named HR contact will reach out within 1 working day if they agree, gives emergency and verified helpline numbers (for example 999 and Talian Kasih 15999; verify before launch), and offers "Don't contact me".
3. **Route:** to the designated HR contact only, never to the manager.
4. **Sexual harassment:** under the Employment Act 1955 (s.81B), an employer receiving a complaint must inquire or give written reasons for refusing within 30 days; failure can mean a fine of up to RM50,000. Victims can also go to the [Tribunal for Anti-Sexual Harassment](https://www.richardweechambers.com/an-overview-of-the-anti-sexual-harassment-tribunal/). Sapa only routes; HR runs the process.
5. **Log** in the restricted table and exclude from AI summaries.

### F11. Product success metrics

- Response rate of at least 60% per check-in; opt-out under 10%.
- Median time from flag to HR acknowledgement of 2 working days or less; escalations within 1.
- At least 70% of AI-drafted actions approved with light edits; at least 80% of approved actions completed within 7 days.
- Tagging agreement with humans κ ≥ 0.6; follow-up flag recall ≥ 0.9; escalation recall 100% on the test set.
- Long term: 6-month retention of each intake compared with the company's previous baseline.

## G. Testing plan (slide 8)

The guide asks whether the prototype made the process faster, clearer, more consistent or more useful; these five tests answer each of those with a number or a quote.

| Test | Method | Metric | Target |
| --- | --- | --- | --- |
| 1. AI tagging accuracy | 50–100 synthetic replies, about one-third each BM, English and Manglish, including 8–10 escalation cases. Two teammates label independently, agree gold labels, then compare Sapa | Cohen's κ per driver; precision and recall on follow-up flags; escalation recall; all split by language | κ ≥ 0.6 overall (≥ 0.5 for Manglish, disclosed); follow-up recall ≥ 0.9; escalation recall 100% |
| 2. Reliability | 100 runs, plus prompt-injection, gibberish, empty and emoji-only replies | % valid JSON on first try; safe handling rate | ≥ 98% valid; 100% safe |
| 3. Time to insight | Synthetic intake of 20 hires × 3 check-ins. One person finds the top issues manually in a spreadsheet; another uses Sapa | Minutes to top 3 themes and who needs follow-up; accuracy against an answer key | ≥ 70% faster with equal or better accuracy |
| 4. HR user value | 3–5 HR practitioners or recruiters complete tasks: find the top issue, approve an action, check consent settings | Task success; 1–5 ratings for clarity, usefulness, trust; quotes | Average ≥ 4/5; at least 2 quotable statements |
| 5. New-hire experience | 5–10 volunteers role-play new hires on the real bot | Time per check-in; "I'd answer honestly" rating; can they explain who sees their answers? | ≤ 2 minutes; ≥ 4/5; 100% correct |

**Presenting results:** one chart of κ by language, one before-and-after time bar, two practitioner quotes, and an honest limitation line: "Synthetic data and a small sample; next step is a 90-day pilot with one company."

## H. Business and economic impact

For the demo company, early resignations cost about RM225,000 a year, so preventing even one pays for Sapa almost three times over.

### H1. Worked ROI example (illustrative, state the assumptions on the slide)

**Assumptions:**

- 300 staff; 60 new hires a year; mixed intake of operators and executives averaging RM2,500 a month (RM30,000 a year).
- 25% leave within six months, so about 15 early leavers a year. This is consistent with Malaysia's 18.2% overall attrition being concentrated in early tenure; replace it with real figures from interviews.
- Cost per early leaver = 0.5× annual salary = **RM15,000**, the low end of [Gallup's](https://www.gallup.com/workplace/247391/fixable-problem-costs-businesses-trillion.aspx) 0.5–2× range. It covers re-recruitment (agency fees are often around 15% of annual salary), training the replacement, the vacancy period and the replacement's slower first months.

**Annual cost of early resignations:** 15 × RM15,000 = **RM225,000**.

**Sapa cost (proposed):** RM90 per new hire, covering their first six months, so 60 hires = **RM5,400 a year**.

| Scenario | Early exits prevented per year | Saving | Return on RM5,400 |
| --- | --- | --- | --- |
| Break-even | 0.36 | RM5,400 | 1× |
| Conservative | 1 of 15 | RM15,000 | ~2.8× |
| Base | 3 of 15 (20%) | RM45,000 | ~8.3× |
| Optimistic | 5 of 15 | RM75,000 | ~13.9× |

**HR time:** 60 hires × 7 check-ins × about 4 answers is roughly 1,700 answers a year. Reading, grouping and writing them up by hand would take days of HR time, which is why companies stop doing it. Measure the actual saving in Test 3 instead of claiming a number.

### H2. Pricing model (proposed)

- **Pilot:** free for one intake (up to 10 new hires) for 90 days, to build evidence.
- **Standard:** RM90 per new hire for six months of coverage. Companies pay for hiring volume, not total headcount, which is far cheaper than per-employee engagement tools.
- **Agency plan:** a per-placement fee for agencies to offer "placement care" to their client companies.
- **Cost to run:** AI cost is a few sen per answer; the main costs are chat messaging fees and support.

### H3. Go-to-market

1. **Direct to HR in high-turnover sectors:** manufacturing and E&E, retail and F&B chains, hospitality, shared-services and call centres. Reach them through HR associations and industry events. For MNC plants, sell to local site HR as a frontline add-on, starting with a single-site pilot that exports anonymised themes into their existing HR reporting.
2. **Recruitment agencies as a channel.** Malaysian agencies commonly offer a 1–3 month free-replacement guarantee ([example](https://eternity-recruitment.com/how-much-does-a-recruitment-agency-charge-in-malaysia/)). Every early leaver means an unpaid re-search, so early warning protects their margin and gives client companies a reason to choose them.
3. **HR software partners:** integrate with payroll or HR systems so new hires are enrolled automatically from their start date.

### H4. Scalability

- **Technology:** cloud-hosted; AI cost grows in line with usage and stays small per hire.
- **Configurable:** question bank and action library adjustable by sector (shift work, outlets, offices).
- **Language:** BM and English first; Mandarin and Tamil next.
- **Product path:** new hires → internally transferred staff and newly promoted managers → consent-based input to probation conversations.

## I. ESG and Responsible AI (slide 9)

Sapa's responsible-AI case rests on four commitments: voluntary input, human decisions, consent-based visibility and no surveillance.

**Wellbeing (S).** Earlier support for new hires links to SDG 8 (decent work) and SDG 3 (wellbeing). Malaysia's DOSH psychosocial risk guidelines ([PRisMA 2024](https://advancedhsesolutions.com/psychosocial-risk-assessment-prisma-malaysia/)) treat unclear roles, workload, low support and poor relationships as workplace risk factors, which map closely to Sapa's drivers. Positioning: Sapa is not a mental-health tool or a PRisMA assessment; it is an early-support channel that can inform risk management.

**Governance (G).** Bursa Malaysia's sustainability reporting asks listed companies to report employee turnover by category ([indicator C6(c)](https://velesto.com/clients/asset_06BCF24A-3658-437A-AC25-8E9DF29B0D49/contentms/img/Sustainability/pdf/Bursa-Malaysia-Content-Index.pdf)), so companies increasingly need turnover data and evidence of action.

**Privacy and law.** The PDPA 2010, as amended in 2024 and phased in during 2025 ([Baker McKenzie](https://www.bakermckenzie.com/-/media/files/insight/publications/alerts/08/malaysia-public-consultation-on-the-personal-data-protection-regulations/malaysia-personal-data-protection-amendment-act-2024-to-come-into-force--ba.pdf?sc_lang=en&rev=8447c31f6f2c4689a91136a64e860979&hash=8F2471D0FD4605717B390D3A750F630B)), brings:

- fines of up to RM1 million and/or 3 years' jail;
- data processors directly bound by the security principle;
- mandatory data protection officers, breach notification to the Commissioner within 72 hours, and a data portability right.

Sapa as a vendor is a data processor; each employer is the data controller.

**AI ethics.** Malaysia's [National Guidelines on AI Governance & Ethics](https://aipolicytracker.org/policies/malaysia-the-national-guidelines-on-ai-governance-ethics) (MOSTI, 2024) set 7 principles:

| Principle | How Sapa meets it |
| --- | --- |
| Fairness | No individual risk scores; same questions for all; accuracy checked per language |
| Reliability, safety & control | Tested tagging; validated outputs; human approval of every action |
| Privacy & security | Consent tiers, access controls, encryption, retention limits, synthetic demo data |
| Inclusiveness | BM, English and Manglish; works on any phone; no company email needed |
| Transparency | Employees see exactly who sees what; AI summaries show the evidence quote |
| Accountability | Audit log; a named HR owner for escalations |
| Human benefit | Purpose is support, never discipline; data barred from performance or probation decisions |

**What humans review:** every flag, every tag override, every action and every escalation.

**What Sapa never does:** no cameras, keystrokes, message metadata or activity tracking; no emotion inference; no prediction of who will quit; no use in hiring, firing or probation decisions. This follows the guide's rule: "Do not secretly monitor employees or infer emotions from cameras or a single behaviour."

## J. Rubric checklist

Each judging criterion maps to specific evidence or a feature the team must have ready by the pitch.

| Criterion (weight) | What satisfies it | Ready? |
| --- | --- | --- |
| Problem identification (15%) | Aon 18.2%, Gallup 25% engaged, Randstad manager and belonging figures; the six-month exit scenario; current-process table (Section C); 3–5 real practitioner quotes | [ ] |
| AI solution & functionality (20%) | Working bot and dashboard; the three AI steps visible (tag with evidence quote, intake themes, drafted action); human approval; action tracker; tag overrides | [ ] |
| Innovation & creativity (20%) | Chat-first in BM and Manglish; reaches staff without company email; consent-tiered visibility; closed action loop; per-new-hire pricing; recruitment-agency channel | [ ] |
| Business & economic impact (15%) | RM ROI table; measured time-to-insight saving; agency use case; pricing and go-to-market | [ ] |
| ESG impact (10%) | PDPA 2024 alignment; AI ethics principle mapping; minimum group size of 5; escalation protocol; PRisMA link; no-surveillance commitments | [ ] |
| Pitch, demo & teamwork (20%) | 90-second end-to-end demo; each member owns an area and can answer cross-questions; Q&A rehearsed (Section L) | [ ] |

## K. 10-slide outline and 90-second demo

The pitch follows the guide's suggested structure: 8–10 minutes in total including Q&A, so about 5–6 minutes of slides, 1–2 minutes of demo and 1–2 minutes of questions.

1. **Team & challenge.** "Challenge 4 · RETAIN", the one-sentence pitch, team members and roles.
2. **The real HR problem.** The six-month exit scenario. "18.2% of Malaysian employees left their jobs in 2025 (Aon). Only 25% are engaged (Gallup 2026)." Close on: "When does HR find out? At the exit interview."
3. **Evidence and current process.** The 7-step process with what is lost at each step; 2 practitioner quotes; the top early-exit reasons (expectations 30.3%, connection 19.5%, onboarding 17.4%); Randstad Malaysia's 57% and 61%.
4. **Our solution.** Sapa: voluntary chat check-ins from Day 3 to Month 6, plus an HR and manager dashboard. Check-in → themes → action.
5. **How it works.** Input (voluntary replies) → AI (tag 5 drivers, intake themes, draft action) → output (flag queue, theme card, editable action) → human (HR reviews, manager approves and acts, marks done). Show consent tiers and the 5-person minimum.
6. **How AI adds value.** Manual vs Sapa: minutes to insight (Test 3), consistent coding across BM, English and Manglish, patterns across hires, and an action instead of just data. Accuracy: published κ and the team's own.
7. **Demo** (script below).
8. **Testing and results.** κ by language, time-saved bar, practitioner ratings and quotes, limitations.
9. **Responsible AI.** "What Sapa never does"; consent tiers; minimum 5; escalations go to HR, never handled by AI; PDPA 2024 and Malaysia's AI ethics principles; synthetic data only.
10. **Impact and next step.** RM225,000 a year lost by the demo company; RM15,000–75,000 saved for RM5,400; ask for a 90-day pilot with one company and one agency.

### Demo script (90 seconds)

- **0:00–0:20, phone.** "This is Mei Ling, a fictional new executive, on Day 14." The bot asks 3 questions. She types: *"Boss always busy, I tak sure which task priority first, everyday change."* One follow-up question; she leaves visibility on "HR only".
- **0:20–0:45, HR dashboard.** Theme card: *Role clarity: 3 of 5 October hires mention unclear priorities in week 2.* Open the flag: AI summary, evidence quote, tags. "HR can correct any tag."
- **0:45–1:05, action.** "Draft action" proposes a 15-minute priorities 1:1 with an agenda. HR edits one line and assigns it to the supervisor.
- **1:05–1:20, manager view.** The supervisor sees theme-level context only (no name, because there was no consent to share), approves it, then marks it done: "Agreed top 3 weekly priorities."
- **1:20–1:30, close the loop.** The tracker shows Done, and the next check-in asks "Are your priorities clearer this week?" "From silent struggle to a completed action in one week."
- **Backup:** a screen recording in case the network fails.

## L. Likely judge questions

These are the questions HR and recruitment judges are most likely to ask, each with a short answer any team member can give.

1. **"Isn't this surveillance?"** No. It is opt-in and every answer is a deliberate reply. There is no passive data, activity tracking, emotion detection or quit prediction, and stopping has no consequences. That is exactly the guide's "transparent, voluntary information" rule.
2. **"Why would new hires answer honestly?"** Answers go to HR only by default; the manager sees individual words only with consent. Chat also draws fuller answers than forms: one study of 582 completed surveys found chatbot surveys collected 39% more information than standard web surveys (Xiao et al. 2020). We tested "I'd answer honestly" with role-play users (Test 5).
3. **"What if the manager is the problem?"** That is why the default is HR-only. Manager-related flags go to HR, never to the manager by name, and HR can choose a skip-level action. Escalations never reach the manager.
4. **"How is this anonymous in a small team?"** It isn't, and we say so. We promise confidentiality with consent. Themes appear only when at least 5 people have responded, the default used by Culture Amp, Qualtrics and Viva Glint; below that, data is pooled or shown only to HR.
5. **"Won't people get survey fatigue?"** Seven short check-ins over six months, each 2 minutes or less, with at most 2 follow-ups and one reminder. We track response and opt-out rates.
6. **"Why not use Culture Amp or Officevibe?"** They are company-wide, priced per employee or at several thousand US dollars a year, mostly English web surveys, and they stop at insights. Sapa covers only new hires, runs in chat in BM and Manglish, reaches staff without company email, and ends in a tracked action. For an MNC that already uses Glint or Qualtrics, Sapa is an add-on for the frontline new hires those tools don't reach, and its themes can feed into the existing reports.
7. **"How accurate is the AI, especially with Manglish?"** On our labelled set of [N] replies, agreement with human labels was κ = [x] overall and [y] for Manglish, with follow-up recall of [z]. *(Fill in from Test 1.)* Published studies report κ of 0.72–0.87, but code-mixed text is harder, so a human reviews every flag.
8. **"What if the AI misses a harassment report?"** Two independent detectors (keyword list and AI), tuned for 100% recall on our test cases even at the cost of false alarms. The bot gives a fixed safe message and HR follows up within one working day. The employer's legal duty to inquire stays with HR.
9. **"Is this PDPA-compliant?"** It is designed for it: explicit consent, purpose limits, retention limits, deletion and export, encryption and an audit log. As a vendor we are a data processor; the employer is the controller. We would get a legal review before commercial use.
10. **"How do you know it reduces turnover?"** Not yet proven. The prototype shows earlier detection and faster action. The next step is a 90-day pilot measuring response rate, time to action, action completion and six-month retention against the company's previous intakes.
11. **"What does it cost and who pays?"** RM90 per new hire for six months of coverage, paid by the employer, or per placement through an agency. One prevented early leaver (about RM15,000) covers almost three years of hiring at the demo company's volume.
12. **"Why would a recruitment agency care?"** Agencies commonly guarantee a free replacement for 1–3 months. Early warning inside that window protects their margin and gives clients a reason to choose them.
13. **"Could managers use this to punish people?"** Managers never see individual answers without consent, the terms forbid disciplinary use, every view is logged, and HR can remove a manager's access.

## M. Risks, caveats and open questions

The biggest risks are low participation and managers not following through, and several statistics come from vendor or non-Malaysian sources that must be presented honestly.

**Product risks:**

- **Low participation.** No replies means no signal. Mitigation: HR introduces the bot in person on Day 1, check-ins stay short, and hires see follow-through.
- **Managers not acting.** Drafts approved but never done. Mitigation: one-click approval, reminders, HR visibility of overdue actions.
- **Over-trusting the AI.** Tags are suggestions; the interface always shows the original text and evidence quote.
- **Pay-driven exits** are largely outside Sapa's reach. Say so.
- **Scope creep.** Emotion scoring, attrition prediction or a chatbot that probes feelings would weaken the ethics case. Keep the conversation bounded.

**Legal (not legal advice):**

- PDPA obligations are summarised from law-firm commentary; get a formal review before commercial use.
- The Employment Act's sexual-harassment provisions apply to Peninsular Malaysia and Labuan; Sabah and Sarawak have their own laws.
- PRisMA is official guidance supporting a legal risk-assessment duty; consultants describe how mandatory it is differently.

**Data reliability:**

- Use only Aon's 2025 figure (18.2%); its releases disagree on earlier years.
- Enboarder (vendor; Western HR leaders) and Insight Global (US) are not Malaysian employee data.
- Gallup's 0.5–2× replacement cost has no published method; we use the low end.
- Competitor prices are mostly third-party estimates.
- The 25% early-leaver rate and RM2,500 average salary in the ROI example are assumptions; replace them with interview data.
- The 3–6 month probation period is common practice, not a legal requirement.

**Open questions before the final:**

- [ ] What early-leaver rate and cost do interviewed HR practitioners actually report?
- [ ] Would the co-host recruitment agency share typical guarantee-claim rates?
- [ ] What agreement (κ) does the AI reach on Manglish, and do more examples in the prompt improve it?
- [ ] What does WhatsApp Business messaging cost per conversation at this volume?
- [ ] Which chat app do target frontline workers actually use most?
