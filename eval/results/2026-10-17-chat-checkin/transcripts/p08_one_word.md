# p08_one_word: One-word replies

Language setting: en. Expected: short.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 2 (Heavy)

## Interviewer: flash38-low

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral opener.*
- **New hire:** busy
- **Bot (question):** When you are busy, what tasks take up the most time?  
  *Grade: **good**. Turns 'busy' into a concrete open question about tasks.*
- **New hire:** yeah
- **Bot (summary):** Here is what I will tell HR: The new hire reported experiencing a busy workload. [WORKLOAD] "busy"

Interviewer call times (ms): [3042, 5135]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "busy", "summary": "The new hire reported experiencing a busy workload.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8000, 8002]. First-try valid: [False].

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8000, 8001]. First-try valid: [False].

## Interviewer: lite-none

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What tasks are taking the most time?  
  *Grade: **good**. Open and concrete.*
- **New hire:** busy
- **Bot (question):** Which specific tasks make it heavy?  
  *Grade: **bad**. Repeats question 1.*
- **New hire:** yeah
- **Bot (summary):** Here is what I will tell HR: The new hire reports a heavy workload. [WORKLOAD] "busy"

Interviewer call times (ms): [1227, 1148]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "busy", "summary": "The new hire reports a heavy workload.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You mentioned your workload is heavy. What tasks are taking up your time?  
  *Grade: **good**. Concrete and open.*
- **New hire:** busy
- **Bot (question):** What specific tasks are keeping you busy?  
  *Grade: **bad**. Repeats question 1.*
- **New hire:** yeah
- **Bot (summary):** Here is what I will tell HR: The employee reports having a busy workload. [WORKLOAD] "busy"

Interviewer call times (ms): [2878, 3152]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "busy", "summary": "The employee reports having a busy workload.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** busy
- **Bot (question):** You mentioned being busy. What specific tasks take up most of your time?  
  *Grade: **good**. Turns 'busy' into a concrete question.*
- **New hire:** yeah
- **Bot (summary):** Here is what I will tell HR: The employee reported experiencing a heavy workload. [WORKLOAD] "busy"

Interviewer call times (ms): [2445, 3963]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "busy", "summary": "The employee reported experiencing a heavy workload.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said your workload is heavy. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** busy
- **Bot (question):** Which tasks are taking the most time right now?  
  *Grade: **good**. Concrete question after 'busy'.*
- **New hire:** yeah
- **Bot (summary):** Here is what I will tell HR: The employee reported experiencing a busy workload. [WORKLOAD] "busy"

Interviewer call times (ms): [3643, 4470]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "busy", "summary": "The employee reported experiencing a busy workload.", "serious_concern": false}`
