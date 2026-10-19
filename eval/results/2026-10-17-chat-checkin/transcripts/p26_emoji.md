# p26_emoji: Emoji then gibberish

Language setting: en. Expected: short.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 2 (On the edge), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said you are on the edge of the team. What is happening?  
  *Grade: **good**. Neutral opener.*
- **New hire:** 😭
- **Bot (question):** What happens when you work with the team on tasks?  
  *Grade: **good**. After a crying emoji it asks about work, not mood. Correct.*
- **New hire:** asdkjh qwpoe
- **Bot (summary):** Here is what I will tell HR: The new hire expressed emotional distress during the check-in without providing specific details. [] ""

Interviewer call times (ms): [3326, 4493]. First-try valid: [True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire expressed emotional distress during the check-in without providing specific details.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You mentioned being on the edge of the team. What has been happening during team work?  
  *Grade: **good**. Asks about team work, not mood.*
- **New hire:** 😭
- **Bot (question):** Could you share an example of what happened during team tasks this week?  
  *Grade: **good**. After a crying emoji it asks for a work example. Correct.*
- **New hire:** asdkjh qwpoe
- **Bot (summary):** Here is what I will tell HR: The employee responded with an emoji and unintelligible text when asked about their experiences during team work. [] ""

Interviewer call times (ms): [6569, 5908]. First-try valid: [True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The employee responded with an emoji and unintelligible text when asked about their experiences during team work.", "serious_concern": false}`

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 1. Quote is exact substring: None.

- **Bot (question):** You mentioned being on the edge of the team. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** 😭

Interviewer call times (ms): [7544, 8001, 8001]. First-try valid: [True, False].

## Interviewer: lite-none

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You mentioned feeling on the edge with the team. What is happening in your daily interactions?  
  *Grade: **bad**. Names a feeling ('feeling on the edge').*
- **New hire:** 😭
- **Bot (question):** What happened during your daily interactions that made you feel on the edge?  
  *Grade: **bad**. After a crying emoji it asks what made them 'feel on the edge'. A feelings question.*
- **New hire:** asdkjh qwpoe
- **Bot (summary):** Here is what I will tell HR: The new hire expressed distress without providing specific details about their work experience. [] ""

Interviewer call times (ms): [1168, 1354]. First-try valid: [True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire expressed distress without providing specific details about their work experience.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said you are on the edge of the team. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** 😭
- **Bot (question):** Can you share what happened during team tasks?  
  *Grade: **good**. After a crying emoji it asks about team tasks, not mood.*
- **New hire:** asdkjh qwpoe
- **Bot (summary):** Here is what I will tell HR: The new hire expressed distress and provided unintelligible responses during the check-in. [] ""

Interviewer call times (ms): [2859, 4392]. First-try valid: [True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire expressed distress and provided unintelligible responses during the check-in.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `code_short_replies`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You mentioned being on the edge of the team. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** 😭
- **Bot (question):** What tasks did you work on with the team recently?  
  *Grade: **good**. After a crying emoji it asks about team tasks, not mood.*
- **New hire:** asdkjh qwpoe
- **Bot (summary):** Here is what I will tell HR: The new hire provided non-specific responses during the check-in conversation. [] ""

Interviewer call times (ms): [2745, 3787]. First-try valid: [True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire provided non-specific responses during the check-in conversation.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `code_short_replies+summary_safety`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said you are on the edge. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** 😭
- **Bot (question):** What specific tasks or meetings did you work on with the team recently?  
  *Grade: **good**. After a crying emoji it asks about tasks and meetings, not mood.*
- **New hire:** asdkjh qwpoe
- **Bot (fixed):** Thank you for telling us. This is serious. Please report it to HR through Contoh Speak Up. You can stay 100% anonymous.

Interviewer call times (ms): [3776, 4568]. First-try valid: [True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire responded to the check-in questions with an emoji and uninformative text.", "serious_concern": true}`
