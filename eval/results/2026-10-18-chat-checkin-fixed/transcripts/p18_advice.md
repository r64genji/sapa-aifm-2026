# p18_advice: Asks the bot for advice

Language setting: en. Expected: ask_hr.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 2 (Little support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## flash38-low-p18_advice

Mode: full. Stop: `ai_done:off_topic`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Little support". What is happening?
- **New hire (reply):** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does not getting replies from your manager affect your work tasks?  
  *Grade: **good**. No advice. Goes back to a work fact.*
- **New hire (reply):** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (summary):** Here is what I will tell HR: The new hire reports that their manager does not reply to their messages. [MANAGER_SUPPORT] "My manager never replies to my messages."

Interviewer call times (ms): [[2318], [2122]]. work_detail per reply: [True, False].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages.", "summary": "The new hire reports that their manager does not reply to their messages.", "serious_concern": false}`. Summary call (ms): [1991]. Feelings word in summary: None.

## lite-high-p18_advice

Mode: full. Stop: `ai_done:off_topic`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Little support". What is happening?
- **New hire (reply):** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does this affect your tasks for the week?  
  *Grade: **good**. No advice. Back to work.*
- **New hire (reply):** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (summary):** Here is what I will tell HR: The new hire reports that their manager never replies to messages and is unsure about work expectations. [ROLE_CLARITY, MANAGER_SUPPORT] "My manager never replies to my messages. What should I do? Should I complain to his boss?"

Interviewer call times (ms): [[4183], [4921]]. work_detail per reply: [True, False].

Summary JSON: `{"drivers": ["ROLE_CLARITY", "MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages. What should I do? Should I complain to his boss?", "summary": "The new hire reports that their manager never replies to messages and is unsure about work expectations.", "serious_concern": false}`. Summary call (ms): [8001, 7391]. Feelings word in summary: None.
