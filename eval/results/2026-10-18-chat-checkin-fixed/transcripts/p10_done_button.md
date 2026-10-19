# p10_done_button: Presses Done after one reply

Language setting: en. Expected: done_button.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 2 (Little support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## flash38-low-p10_done_button

Mode: full. Stop: `done_button`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Little support". What is happening?
- **New hire (reply):** My manager cancels our 1:1 almost every week.
- **Bot (question):** How does your manager cancelling those 1:1 meetings affect your daily work?  
  *Grade: **good**. Builds on their words; asks the effect on work.*
- **Bot (summary):** Here is what I will tell HR: The employee reports that their manager cancels their one-on-one meetings almost every week. [MANAGER_SUPPORT] "My manager cancels our 1:1 almost every week."

Interviewer call times (ms): [[2658]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My manager cancels our 1:1 almost every week.", "summary": "The employee reports that their manager cancels their one-on-one meetings almost every week.", "serious_concern": false}`. Summary call (ms): [3490]. Feelings word in summary: None.

## lite-high-p10_done_button

Mode: full. Stop: `done_button`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Little support". What is happening?
- **New hire (reply):** My manager cancels our 1:1 almost every week.
- **Bot (question):** How does missing these 1:1s affect your tasks?  
  *Grade: **good**. Neutral effect question.*
- **Bot (summary):** Here is what I will tell HR: The new hire reports that the manager cancels check-ins almost weekly and is unsure of expectations. [ROLE_CLARITY, MANAGER_SUPPORT] "My manager cancels our 1:1 almost every week."

Interviewer call times (ms): [[3602]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["ROLE_CLARITY", "MANAGER_SUPPORT"], "evidence_quote": "My manager cancels our 1:1 almost every week.", "summary": "The new hire reports that the manager cancels check-ins almost weekly and is unsure of expectations.", "serious_concern": false}`. Summary call (ms): [6957]. Feelings word in summary: None.
