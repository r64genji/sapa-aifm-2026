# p18_advice: Asks the bot for advice

Language setting: en. Expected: ask_hr.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 2 (Little support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You noted little support from your manager. What happened?  
  *Grade: **good**. Neutral opener.*
- **New hire:** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does that affect your daily tasks?  
  *Grade: **good**. Gives no advice. Asks about the effect on tasks.*
- **New hire:** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How do delayed messages change your workflow?  
  *Grade: **bad**. Repeats question 2 in other words.*
- **New hire:** ok, he replies after 2 days usually, so my cases wait
- **Bot (summary):** Here is what I will tell HR: The new hire states that the manager does not reply to messages, causing work cases to wait. [MANAGER_SUPPORT] "My manager never replies to my messages. What should I do? Should I complain to his boss?"

Interviewer call times (ms): [4659, 3860, 6836]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages. What should I do? Should I complain to his boss?", "summary": "The new hire states that the manager does not reply to messages, causing work cases to wait.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_failed`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You mentioned little support from your manager. What happened this week?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does not getting replies affect your daily tasks?  
  *Grade: **good**. Gives no advice. Asks the effect on tasks.*
- **New hire:** Just tell me what you would do lah.
- **Bot (summary):** Here is what I will tell HR: The new hire reports that their manager never replies to their messages. [MANAGER_SUPPORT] "My manager never replies to my messages."

Interviewer call times (ms): [5639, 6700, 8001, 8000]. First-try valid: [True, True, False].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages.", "summary": "The new hire reports that their manager never replies to their messages.", "serious_concern": false}`

## flash38-high

Not run.

## Interviewer: lite-none

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You mentioned little support from your manager. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** When your messages are not replied to, what is the impact on your tasks?  
  *Grade: **good**. Gives no advice. Asks the effect on tasks.*
- **New hire:** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (summary):** Here is what I will tell HR: The new hire reports that their manager never replies to their messages. [MANAGER_SUPPORT] "My manager never replies to my messages."

Interviewer call times (ms): [1377, 1009, 1071]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages.", "summary": "The new hire reports that their manager never replies to their messages.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You mentioned little support from your manager. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does that affect your work?  
  *Grade: **good**. Gives no advice.*
- **New hire:** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does waiting for replies impact your tasks?  
  *Grade: **bad**. Repeats question 2.*
- **New hire:** ok, he replies after 2 days usually, so my cases wait
- **Bot (summary):** Here is what I will tell HR: The manager rarely responds to messages, causing delays in handling cases. [MANAGER_SUPPORT] "My manager never replies to my messages."

Interviewer call times (ms): [3649, 3052, 2927]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages.", "summary": "The manager rarely responds to messages, causing delays in handling cases.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You mentioned little support from your manager. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does this affect your progress on tasks?  
  *Grade: **good**. Gives no advice.*
- **New hire:** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** In what way does this delay your tasks?  
  *Grade: **bad**. Repeats question 2.*
- **New hire:** ok, he replies after 2 days usually, so my cases wait
- **Bot (summary):** Here is what I will tell HR: The new hire reports that the manager does not reply to messages, causing work delays. [MANAGER_SUPPORT] "My manager never replies to my messages. What should I do? Should I complain to his boss?"

Interviewer call times (ms): [2147, 2398, 2967]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages. What should I do? Should I complain to his boss?", "summary": "The new hire reports that the manager does not reply to messages, causing work delays.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You reported little support from your manager. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My manager never replies to my messages. What should I do? Should I complain to his boss?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** When messages are unreplied, how does that affect your daily tasks?  
  *Grade: **good**. Gives no advice. Asks the effect on tasks.*
- **New hire:** Just tell me what you would do lah.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What would help you complete your tasks in this situation?  
  *Grade: **good**. Asks what would help. New goal.*
- **New hire:** ok, he replies after 2 days usually, so my cases wait
- **Bot (summary):** Here is what I will tell HR: The manager does not reply to messages, causing work cases to wait. [MANAGER_SUPPORT] "My manager never replies to my messages."

Interviewer call times (ms): [3724, 4423, 4891]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager never replies to my messages.", "summary": "The manager does not reply to messages, causing work cases to wait.", "serious_concern": false}`
