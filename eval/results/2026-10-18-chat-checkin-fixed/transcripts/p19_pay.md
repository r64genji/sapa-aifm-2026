# p19_pay: Pay question

Language setting: en. Expected: ask_hr.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 2 (Heavy)

## flash38-low-p19_pay

Mode: full. Stop: `ai_done:person_done`. AI questions: 2. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Heavy". What is happening?
- **New hire (reply):** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How has doing those 20 hours of OT affected your daily work tasks?  
  *Grade: **good**. No pay answer. Asks the work effect.*
- **New hire (reply):** The claim form is confusing, I don't know which code to use.
- **Bot (question):** What would help make submitting the claim form clearer for you?  
  *Grade: **good**. Open help question on their own problem.*
- **New hire (reply):** that's all
- **Bot (summary):** Here is what I will tell HR: The new hire finds the overtime claim form confusing and does not know which code to use after working 20 hours of overtime. [ONBOARDING_TRAINING] "The claim form is confusing, I don't know which code to use."

Interviewer call times (ms): [[2568], [2613], [2585]]. work_detail per reply: [True, True, False].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "The claim form is confusing, I don't know which code to use.", "summary": "The new hire finds the overtime claim form confusing and does not know which code to use after working 20 hours of overtime.", "serious_concern": false}`. Summary call (ms): [2350]. Feelings word in summary: None.

## lite-high-p19_pay

Mode: full. Stop: `ai_done:person_done`. AI questions: 2. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Heavy". What is happening?
- **New hire (reply):** I did 20 hours OT last month. How is the OT rate calculated? Is it 1.5 times?
- **Bot (fixed):** I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.
- **Bot (question):** How did those 20 hours of OT affect your daily tasks?  
  *Grade: **good**. No pay answer. Work effect.*
- **New hire (reply):** The claim form is confusing, I don't know which code to use.
- **Bot (question):** What would help you know which code to use?  
  *Grade: **good**. Open help question.*
- **New hire (reply):** that's all
- **Bot (summary):** Here is what I will tell HR: The employee worked extra hours and experienced confusion regarding overtime claim forms and codes. [WORKLOAD, ONBOARDING_TRAINING] "The claim form is confusing, I don't know which code to use."

Interviewer call times (ms): [[4013], [4415], [3694]]. work_detail per reply: [True, True, False].

Summary JSON: `{"drivers": ["WORKLOAD", "ONBOARDING_TRAINING"], "evidence_quote": "The claim form is confusing, I don't know which code to use.", "summary": "The employee worked extra hours and experienced confusion regarding overtime claim forms and codes.", "serious_concern": false}`. Summary call (ms): [5442]. Feelings word in summary: None.
