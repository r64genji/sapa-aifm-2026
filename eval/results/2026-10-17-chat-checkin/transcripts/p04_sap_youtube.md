# p04_sap_youtube: SAP learned from YouTube

Language setting: en. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 2 (Poorly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your training left you poorly prepared. What is happening?  
  *Grade: **good**. Neutral opener. The person answered all 3 goals at once.*
- **New hire:** My training was just one slide deck and my buddy is swamped with month-end, so I learned invoice posting from YouTube. Last week I posted three invoices to the wrong cost centre and had to reverse them, so a two-hour hands-on SAP session with real cases would really help.
- **Bot (summary):** Here is what I will tell HR: Inadequate onboarding training and an unavailable buddy led to self-teaching invoice posting from YouTube and subsequent errors. [ONBOARDING_TRAINING] "My training was just one slide deck and my buddy is swamped with month-end, so I learned invoice posting from YouTube."

Interviewer call times (ms): [3813, 3666]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "My training was just one slide deck and my buddy is swamped with month-end, so I learned invoice posting from YouTube.", "summary": "Inadequate onboarding training and an unavailable buddy led to self-teaching invoice posting from YouTube and subsequent errors.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8000, 8000]. First-try valid: [False].

## Interviewer: flash38-high

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: None.

- **Bot (question):** You said you were poorly prepared by training. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** The training was just one slide deck and my buddy was too busy with month-end, so I had to learn invoice posting from YouTube and ended up posting three invoices to the wrong cost centre last week. A two-hour hands-on SAP session with real cases would really help me get the hang of it.

Interviewer call times (ms): [7739, 6853]. First-try valid: [True, True].

## Interviewer: lite-none

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your training left you poorly prepared. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Since my buddy is too busy with month-end, I had to learn invoice posting from YouTube videos and ended up posting three invoices to the wrong cost centre last week. A two-hour hands-on SAP session with real cases would really help.
- **Bot (summary):** Here is what I will tell HR: The new hire had to learn invoice posting independently from online videos due to an unavailable buddy, resulting in incorrect entries. [ONBOARDING_TRAINING] "Since my buddy is too busy with month-end, I had to learn invoice posting from YouTube videos and ended up posting three invoices to the wrong cost centre last week."

Interviewer call times (ms): [5019, 8003, 3545]. First-try valid: [True, False].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Since my buddy is too busy with month-end, I had to learn invoice posting from YouTube videos and ended up posting three invoices to the wrong cost centre last week.", "summary": "The new hire had to learn invoice posting independently from online videos due to an unavailable buddy, resulting in incorrect entries.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said training left you poorly prepared. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Training was just one slide deck and my buddy has been too busy with month-end, so I learned invoice posting from YouTube and ended up posting three invoices to the wrong cost centre last week. A 2-hour hands-on SAP session with real cases would really help.
- **Bot (summary):** Here is what I will tell HR: The new hire reported that training consisted of a single slide deck and required independent learning to complete tasks. [ONBOARDING_TRAINING] "Training was just one slide deck and my buddy has been too busy with month-end, so I learned invoice posting from YouTube and ended up posting three invoices to the wrong cost centre last week. A 2-hour hands-on SAP session with real cases would really help."

Interviewer call times (ms): [2402, 2781]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training was just one slide deck and my buddy has been too busy with month-end, so I learned invoice posting from YouTube and ended up posting three invoices to the wrong cost centre last week. A 2-hour hands-on SAP session with real cases would really help.", "summary": "The new hire reported that training consisted of a single slide deck and required independent learning to complete tasks.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your training left you poorly prepared. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My training was just a single slide deck and my buddy has been too busy with month-end, so I had to learn invoice posting from YouTube. A two-hour hands-on SAP session with real cases would really help, especially since I had to reverse three invoices last week after posting them to the wrong cost centre.
- **Bot (summary):** Here is what I will tell HR: The onboarding training consisted of a single slide deck, and self-directed learning was required for invoice posting tasks. [ONBOARDING_TRAINING] "My training was just a single slide deck and my buddy has been too busy with month-end, so I had to learn invoice posting from YouTube."

Interviewer call times (ms): [2290, 2226]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "My training was just a single slide deck and my buddy has been too busy with month-end, so I had to learn invoice posting from YouTube.", "summary": "The onboarding training consisted of a single slide deck, and self-directed learning was required for invoice posting tasks.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said your training left you poorly prepared. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My training was just one slide deck and my buddy's been too busy with month-end, so I had to learn invoice posting from YouTube videos. A two-hour hands-on SAP session with real cases would really help me avoid posting invoices to the wrong cost centre like I had to reverse last week.
- **Bot (summary):** Here is what I will tell HR: The onboarding training was limited to a single slide deck, requiring independent learning for invoice posting tasks. [ONBOARDING_TRAINING] "My training was just one slide deck and my buddy's been too busy with month-end, so I had to learn invoice posting from YouTube videos."

Interviewer call times (ms): [3401, 3522]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "My training was just one slide deck and my buddy's been too busy with month-end, so I had to learn invoice posting from YouTube videos.", "summary": "The onboarding training was limited to a single slide deck, requiring independent learning for invoice posting tasks.", "serious_concern": false}`
