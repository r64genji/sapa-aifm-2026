# p16_off_topic: Off topic

Language setting: en. Expected: off_topic.

Taps: ROLE_CLARITY 2 (Unclear), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `ai_done:off_topic`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said expectations are unclear. What is happening?  
  *Grade: **good**. Neutral opener.*
- **New hire:** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** Back to work, what expectations are unclear?  
  *Grade: **good**. Steers back once, as the rule says. Then stops.*
- **New hire:** Liverpool lost again lah haha
- **Bot (summary):** Here is what I will tell HR: The employee asked about local food and discussed football instead of addressing work expectations. [] ""

Interviewer call times (ms): [4186, 4887, 3290]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The employee asked about local food and discussed football instead of addressing work expectations.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_done:off_topic`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You mentioned what is expected of you this week is unclear. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** Regarding your work, what tasks are currently unclear for you this week?  
  *Grade: **good**. Steers back once. Then stops.*
- **New hire:** Liverpool lost again lah haha
- **Bot (summary):** Here is what I will tell HR: The employee asked about local food and commented on a football match. [] ""

Interviewer call times (ms): [5881, 8001, 7084, 4110]. First-try valid: [True, False, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The employee asked about local food and commented on a football match.", "serious_concern": false}`

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8000, 8001]. First-try valid: [False].

## Interviewer: lite-none

Stop: `code_cap`. AI questions: 3. Quote is exact substring: None.

- **Bot (question):** You said expectations are unclear. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** Can you share an example of a task where expectations were unclear?  
  *Grade: **good**. Steers back once.*
- **New hire:** Liverpool lost again lah haha
- **Bot (question):** Can you tell me about a specific task you worked on recently?  
  *Grade: **bad**. Asks again after a second off-topic reply. The rule says stop.*
- **New hire:** what's the weather tomorrow
- **Bot (summary):** Here is what I will tell HR: The new hire discussed unrelated topics and did not report any work-related issues. [] ""

Interviewer call times (ms): [1145, 1200, 1211]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire discussed unrelated topics and did not report any work-related issues.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `ai_done:off_topic`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said what is expected of you is unclear. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** Back to work—what tasks are unclear right now?  
  *Grade: **good**. Steers back once. Then stops.*
- **New hire:** Liverpool lost again lah haha
- **Bot (summary):** Here is what I will tell HR: The new hire inquired about local food and commented on a football match. [] ""

Interviewer call times (ms): [2597, 3611, 2961]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire inquired about local food and commented on a football match.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `ai_done:off_topic`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said what is expected of you is unclear. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** You said expectations are unclear. What task did you start with?  
  *Grade: **good**. Steers back once. Then stops.*
- **New hire:** Liverpool lost again lah haha
- **Bot (summary):** Here is what I will tell HR: The new hire discussed local food and football during the check-in. [] ""

Interviewer call times (ms): [2230, 2935, 2772]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire discussed local food and football during the check-in.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `ai_done:off_topic`. AI questions: 2. Quote is exact substring: None.

- **Bot (question):** You said expectations are unclear. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** Coming back to work, what expectations are unclear for you right now?  
  *Grade: **good**. Steers back once. Then stops.*
- **New hire:** Liverpool lost again lah haha
- **Bot (summary):** Here is what I will tell HR: The new hire did not mention any work-related concerns. [] ""

Interviewer call times (ms): [2787, 5091, 2835]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": [], "evidence_quote": "", "summary": "The new hire did not mention any work-related concerns.", "serious_concern": false}`
