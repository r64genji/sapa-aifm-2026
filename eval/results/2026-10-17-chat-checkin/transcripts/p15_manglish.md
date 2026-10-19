# p15_manglish: Manglish, workload

Language setting: en. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 2 (Heavy)

## Interviewer: flash38-low

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral opener. Person gave all 3 goals in one reply.*
- **New hire:** Haih, week 4 already but 80 invoices a day too heavy lah. Trainer said 50 for first month mah. Last week stayed till 9pm three times to hit it. Rush liao make more mistakes. Maybe can enforce proper ramp-up quota for the first 2 months?
- **Bot (summary):** Here is what I will tell HR: The employee reports processing eighty invoices daily is excessive, resulting in working late multiple times last week and increased errors. [WORKLOAD] "80 invoices a day too heavy lah"

Interviewer call times (ms): [3848, 3443]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "80 invoices a day too heavy lah", "summary": "The employee reports processing eighty invoices daily is excessive, resulting in working late multiple times last week and increased errors.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Aiya, week 4 in AP already mah. Quota 80 invoices a day, but trainer said 50 for the first month. Last week stayed till 9pm three times to hit it. Rush already make more mistakes lah. Better to ramp-up quota for the first 2 months.
- **Bot (summary):** Here is what I will tell HR: The employee reports working until 9pm to meet an 80-invoice daily quota that conflicts with the 50-invoice target stated by their trainer. [ROLE_CLARITY, WORKLOAD] "Last week stayed till 9pm three times to hit it."

Interviewer call times (ms): [5952, 6357]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY", "WORKLOAD"], "evidence_quote": "Last week stayed till 9pm three times to hit it.", "summary": "The employee reports working until 9pm to meet an 80-invoice daily quota that conflicts with the 50-invoice target stated by their trainer.", "serious_concern": false}`

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8000, 8001]. First-try valid: [False].

## Interviewer: lite-none

Stop: `ai_done:goals_met`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You mentioned your workload is heavy. What tasks are taking up most of your time?  
  *Grade: **good**. Asks which tasks take the time. Concrete.*
- **New hire:** Keying invoices lah. Trying to hit 80 a day even though trainer said 50 for the first month mah. Last week stayed till 9pm three times just to chase. When rush, confirm make more mistakes. Maybe can ramp-up quota for first 2 months?
- **Bot (question):** What tools or steps would help you with keying invoices?  
  *Grade: **bad**. Asks what would help after the person already said it, and suggests 'tools or steps'.*
- **New hire:** Just need to officially follow the 50 quota for first 2 months lah. When don't need to rush, confirm make less mistakes mah.
- **Bot (summary):** Here is what I will tell HR: The new hire reports excessive daily invoice quotas and late hours exceeding the initial training expectations, leading to increased errors. [WORKLOAD, ONBOARDING_TRAINING] "Trying to hit 80 a day even though trainer said 50 for the first month mah. Last week stayed till 9pm three times just to chase."

Interviewer call times (ms): [1135, 1190, 1121]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "Trying to hit 80 a day even though trainer said 50 for the first month mah. Last week stayed till 9pm three times just to chase.", "summary": "The new hire reports excessive daily invoice quotas and late hours exceeding the initial training expectations, leading to increased errors.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** AP week 4 already, quota 80 invoices a day mah. Trainer said 50 for the first month. Last week stayed till 9pm three times just to hit it, but rush-rush make more mistakes. Maybe can ramp-up quota for first 2 months?
- **Bot (summary):** Here is what I will tell HR: The new hire reported working late multiple times to meet a daily invoice quota that exceeds the initial training target. [WORKLOAD] "Last week stayed till 9pm three times just to hit it, but rush-rush make more mistakes."

Interviewer call times (ms): [2488, 3284]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Last week stayed till 9pm three times just to hit it, but rush-rush make more mistakes.", "summary": "The new hire reported working late multiple times to meet a daily invoice quota that exceeds the initial training target.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What tasks are taking up your time?  
  *Grade: **good**. Concrete: which tasks take the time.*
- **New hire:** Clearing invoices, lah. Trying to hit 80 a day, even though trainer said 50 for the first month. Last week stayed till 9pm three times already mah. When rushing, confirm make more mistakes. Honestly, better to ramp-up quota for first 2 months.
- **Bot (summary):** Here is what I will tell HR: The employee experienced a heavy workload and extended hours due to high daily invoice quotas. [WORKLOAD] "Trying to hit 80 a day, even though trainer said 50 for the first month. Last week stayed till 9pm three times already mah."

Interviewer call times (ms): [2518, 3431]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Trying to hit 80 a day, even though trainer said 50 for the first month. Last week stayed till 9pm three times already mah.", "summary": "The employee experienced a heavy workload and extended hours due to high daily invoice quotas.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Aiyo, quota 80 invoices heavy lah. Trainer said 50 for first month mah, but last week I stay till 9pm three times to hit it. Rush then tend to make more mistakes. Actually ramp-up quota should be for first 2 months lah.
- **Bot (summary):** Here is what I will tell HR: The new hire reports a heavy invoice quota that required working late multiple times in the first month. [WORKLOAD] "quota 80 invoices heavy lah"

Interviewer call times (ms): [3186, 3481]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "quota 80 invoices heavy lah", "summary": "The new hire reports a heavy invoice quota that required working late multiple times in the first month.", "serious_concern": false}`
