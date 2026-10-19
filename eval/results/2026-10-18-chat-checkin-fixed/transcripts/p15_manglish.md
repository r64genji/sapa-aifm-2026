# p15_manglish: Manglish, workload

Language setting: en. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 2 (Heavy)

## flash38-low-p15_manglish

Mode: full. Stop: `ai_done:goals_met`. AI questions: 0. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Heavy". What is happening?
- **New hire (reply):** Aiya, the 80 invoices per day target is quite tough la. Actually trainer told me 50 for the first month, but now need to hit 80 already. Last week OT until 9pm three times just to clear the queue, then when rush doing the AP vouchers, end up make more mistakes also. Would be very helpful if can have a proper ramp-up quota for the first 2 months instead, at least can balance accuracy and speed.
- **Bot (summary):** Here is what I will tell HR: The employee is struggling with an increased target of 80 invoices daily, resulting in overtime and mistakes, and requests a ramp-up quota for the first two months. [WORKLOAD] "Last week OT until 9pm three times just to clear the queue, then when rush doing the AP vouchers, end up make more mistakes also."

Interviewer call times (ms): [[2508]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Last week OT until 9pm three times just to clear the queue, then when rush doing the AP vouchers, end up make more mistakes also.", "summary": "The employee is struggling with an increased target of 80 invoices daily, resulting in overtime and mistakes, and requests a ramp-up quota for the first two months.", "serious_concern": false}`. Summary call (ms): [2246]. Feelings word in summary: None.

## lite-high-p15_manglish

Mode: full. Stop: `ai_done:goals_met`. AI questions: 0. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Heavy". What is happening?
- **New hire (reply):** Aiyo the workload quite crazy la. Now is week 4, the quota already 80 invoices a day, but last time trainer said first month is 50. Last week 3 times I OT until 9pm just to hit the target. If rush rush do then sure make more mistakes one. Really hope can have proper ramp-up quota for first 2 months, at least won't so stressful.
- **Bot (summary):** Here is what I will tell HR: The employee experienced a heavy workload with an increased daily quota, requiring overtime to meet targets. [ROLE_CLARITY, WORKLOAD] "Last week 3 times I OT until 9pm just to hit the target."

Interviewer call times (ms): [[4275]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["ROLE_CLARITY", "WORKLOAD"], "evidence_quote": "Last week 3 times I OT until 9pm just to hit the target.", "summary": "The employee experienced a heavy workload with an increased daily quota, requiring overtime to meet targets.", "serious_concern": false}`. Summary call (ms): [6900]. Feelings word in summary: None.

## flash38-low-shortp-p15_manglish

Mode: shortp. Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Heavy". What is happening?
- **New hire (reply):** Daily quota is 80 invoices already even though trainer said 50 for first month. Last week had to stay until 9pm three times to hit it, and rushing just makes more mistakes lah.
- **Bot (question):** What would help you manage the 80 invoice target better?  
  *Grade: **good**. Open help question.*
- **New hire (reply):** Would help a lot if got proper ramp-up quota for the first 2 months instead. At least can build up speed slowly without so many mistakes.
- **Bot (summary):** Here is what I will tell HR: The employee is working late to meet a daily quota of 80 invoices and suggests a ramp-up quota for the first two months. [WORKLOAD] "Last week had to stay until 9pm three times to hit it, and rushing just makes more mistakes lah."

Interviewer call times (ms): [[2720], [2869]]. work_detail per reply: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Last week had to stay until 9pm three times to hit it, and rushing just makes more mistakes lah.", "summary": "The employee is working late to meet a daily quota of 80 invoices and suggests a ramp-up quota for the first two months.", "serious_concern": false}`. Summary call (ms): [2280]. Feelings word in summary: None.

## lite-high-shortp-p15_manglish

Mode: shortp. Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Heavy". What is happening?
- **New hire (reply):** Aiyo, the quota is 80 invoices a day but trainer earlier said 50 for first month. Last week had to OT until 9pm three times to hit, then rush-rush make more mistakes la.
- **Bot (question):** What support or adjustment would help with the invoice quota?  
  *Grade: **good**. Open help question.*
- **New hire (reply):** If can give proper ramp-up quota for first 2 months would really help la. That way don't need to rush so much and can reduce mistakes.
- **Bot (summary):** Here is what I will tell HR: The employee reported a discrepancy between the daily invoice quota and initial training guidance, requiring multiple overtime shifts to meet targets. [ROLE_CLARITY, ONBOARDING_TRAINING, WORKLOAD] "Aiyo, the quota is 80 invoices a day but trainer earlier said 50 for first month. Last week had to OT until 9pm three times to hit, then rush-rush make more mistakes la."

Interviewer call times (ms): [[3841], [3170]]. work_detail per reply: [True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY", "ONBOARDING_TRAINING", "WORKLOAD"], "evidence_quote": "Aiyo, the quota is 80 invoices a day but trainer earlier said 50 for first month. Last week had to OT until 9pm three times to hit, then rush-rush make more mistakes la.", "summary": "The employee reported a discrepancy between the daily invoice quota and initial training guidance, requiring multiple overtime shifts to meet targets.", "serious_concern": false}`. Summary call (ms): [6002]. Feelings word in summary: None.
