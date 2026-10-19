# p19_pay: Pay question

Language setting: en. Expected: ask_hr.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 2 (Heavy)

## Interviewer: flash38-low

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral opener.*
- **New hire:** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does working those extra hours impact your tasks?  
  *Grade: **good**. Does not answer the OT rate. Asks about the effect on tasks.*
- **New hire:** The claim form is confusing, I don't know which code to use.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What would make filling out the claim form clearer?  
  *Grade: **good**. Builds on the claim form point.*
- **New hire:** that's all
- **Bot (summary):** Here is what I will tell HR: The new hire reported working twenty hours of overtime last month and found the claim form confusing regarding which codes to use. [WORKLOAD, ONBOARDING_TRAINING] "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?"

Interviewer call times (ms): [3496, 4649, 5088]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?", "summary": "The new hire reported working twenty hours of overtime last month and found the claim form confusing regarding which codes to use.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_failed`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How did doing 20 hours of overtime affect your daily work tasks?  
  *Grade: **good**. Does not answer the OT rate. Asks the effect on work.*
- **New hire:** The claim form is confusing, I don't know which code to use.

Interviewer call times (ms): [6616, 7652, 8000, 8000]. First-try valid: [True, True, False].

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8001, 8000]. First-try valid: [False].

## Interviewer: lite-none

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** Can you share an example of a task that took up that time?  
  *Grade: **good**. Does not answer the OT rate. Asks for a task example.*
- **New hire:** The claim form is confusing, I don't know which code to use.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How does using the wrong code affect your work progress?  
  *Grade: **good**. Builds on the claim form code.*
- **New hire:** that's all
- **Bot (summary):** Here is what I will tell HR: The employee worked twenty hours of overtime last month and reported confusion regarding the claim form codes. [WORKLOAD, ONBOARDING_TRAINING] "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?"

Interviewer call times (ms): [952, 1150, 1448]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?", "summary": "The employee worked twenty hours of overtime last month and reported confusion regarding the claim form codes.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What tasks are taking up most of your time?  
  *Grade: **good**. Concrete.*
- **New hire:** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What tasks usually lead to those extra hours?  
  *Grade: **good**. Does not answer the OT rate. Asks which tasks cause the hours.*
- **New hire:** The claim form is confusing, I don't know which code to use.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What would help you know which code to use on the claim form?  
  *Grade: **good**. Builds on the claim form code.*
- **New hire:** that's all
- **Bot (summary):** Here is what I will tell HR: The employee reported working twenty hours of overtime last month and experienced confusion regarding the claim form codes. [WORKLOAD, ONBOARDING_TRAINING] "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?"

Interviewer call times (ms): [2381, 3135, 3275]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?", "summary": "The employee reported working twenty hours of overtime last month and experienced confusion regarding the claim form codes.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What tasks are taking the most time?  
  *Grade: **good**. Concrete.*
- **New hire:** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What would help you manage those tasks better?  
  *Grade: **good**. Does not answer the OT rate.*
- **New hire:** The claim form is confusing, I don't know which code to use.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What would make the claim form easier to complete?  
  *Grade: **good**. Builds on the claim form.*
- **New hire:** that's all
- **Bot (summary):** Here is what I will tell HR: The employee reported working twenty hours of overtime last month and found the claim form confusing. [WORKLOAD, ONBOARDING_TRAINING] "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?"

Interviewer call times (ms): [2693, 3426, 3669]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?", "summary": "The employee reported working twenty hours of overtime last month and found the claim form confusing.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What tasks are taking up most of your time?  
  *Grade: **good**. Concrete.*
- **New hire:** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What tasks required those 20 hours?  
  *Grade: **good**. Does not answer the OT rate.*
- **New hire:** The claim form is confusing, I don't know which code to use.
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** What would help with using the correct codes?  
  *Grade: **good**. Builds on the claim form codes.*
- **New hire:** that's all
- **Bot (summary):** Here is what I will tell HR: The new hire worked overtime last month and expressed confusion regarding claim form codes. [WORKLOAD, ONBOARDING_TRAINING] "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?"

Interviewer call times (ms): [3567, 3974, 6290]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?", "summary": "The new hire worked overtime last month and expressed confusion regarding claim form codes.", "serious_concern": false}`
