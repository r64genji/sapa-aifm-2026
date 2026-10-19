# p04_sap_youtube: SAP learned from YouTube

Language setting: en. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 2 (Poorly prepared), WORKLOAD 3 (Just OK)

## flash38-low-p04_sap_youtube

Mode: full. Stop: `ai_done:goals_met`. AI questions: 0. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Poorly prepared". What is happening?
- **New hire (reply):** My onboarding training was just a single slide deck, and since my buddy has been tied up with month-end, I’ve had to rely on YouTube to learn how to post invoices. Last week I ended up posting three invoices to the wrong cost centre and had to reverse them all. What would really help me get on track is a two-hour hands-on SAP session working through real cases.
- **Bot (summary):** Here is what I will tell HR: The new hire reported insufficient onboarding training and having to use YouTube for invoice posting, leading to errors. [ONBOARDING_TRAINING] "My onboarding training was just a single slide deck, and since my buddy has been tied up with month-end, I’ve had to rely on YouTube to learn how to post invoices."

Interviewer call times (ms): [[2726]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "My onboarding training was just a single slide deck, and since my buddy has been tied up with month-end, I’ve had to rely on YouTube to learn how to post invoices.", "summary": "The new hire reported insufficient onboarding training and having to use YouTube for invoice posting, leading to errors.", "serious_concern": false}`. Summary call (ms): [2952]. Feelings word in summary: None.

## lite-high-p04_sap_youtube

Mode: full. Stop: `ai_done:goals_met`. AI questions: 0. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Poorly prepared". What is happening?
- **New hire (reply):** I'm in week 3 as an AP analyst and my onboarding was just one slide deck. My buddy has been busy with month-end, so I've mostly been learning invoice posting from YouTube. Last week I posted three invoices to the wrong cost centre and had to reverse them. What would really help me is a two-hour hands-on SAP session with real cases so I can get the process down properly.
- **Bot (summary):** Here is what I will tell HR: The employee experienced minimal onboarding and relies on self-directed videos to learn job tasks after making errors. [ROLE_CLARITY, ONBOARDING_TRAINING] "my onboarding was just one slide deck."

Interviewer call times (ms): [[3396]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["ROLE_CLARITY", "ONBOARDING_TRAINING"], "evidence_quote": "my onboarding was just one slide deck.", "summary": "The employee experienced minimal onboarding and relies on self-directed videos to learn job tasks after making errors.", "serious_concern": false}`. Summary call (ms): [4821]. Feelings word in summary: None.

## flash38-low-shortp-p04_sap_youtube

Mode: shortp. Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Poorly prepared". What is happening?
- **New hire (reply):** My training was just one slide deck and my buddy is busy with month-end, so I've been learning invoice posting from YouTube. Last week I posted three invoices to the wrong cost centre and had to reverse them.
- **Bot (question):** What would help you post the invoices correctly?  
  *Grade: **good**. Open help question.*
- **New hire (reply):** A two-hour hands-on SAP session with real cases would really help.
- **Bot (summary):** Here is what I will tell HR: The new hire received minimal training on invoice posting and requested a hands-on SAP practice session to avoid further errors. [ONBOARDING_TRAINING] "My training was just one slide deck and my buddy is busy with month-end, so I've been learning invoice posting from YouTube."

Interviewer call times (ms): [[2810], [3104]]. work_detail per reply: [True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "My training was just one slide deck and my buddy is busy with month-end, so I've been learning invoice posting from YouTube.", "summary": "The new hire received minimal training on invoice posting and requested a hands-on SAP practice session to avoid further errors.", "serious_concern": false}`. Summary call (ms): [3609]. Feelings word in summary: None.

## lite-high-shortp-p04_sap_youtube

Mode: shortp. Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** You tapped "Poorly prepared". What is happening?
- **New hire (reply):** My training was just one slide deck and my buddy is busy with month-end, so I've been learning invoice posting from YouTube. Last week I posted three invoices to the wrong cost centre and had to reverse them.
- **Bot (question):** What would help you complete your invoice posting training?  
  *Grade: **good**. Open help question.*
- **New hire (reply):** A two-hour hands-on SAP session with real cases would really help.
- **Bot (summary):** Here is what I will tell HR: The employee received minimal training and used external videos to learn invoice posting tasks. [ONBOARDING_TRAINING] "My training was just one slide deck and my buddy is busy with month-end, so I've been learning invoice posting from YouTube."

Interviewer call times (ms): [[5559], [6761]]. work_detail per reply: [True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "My training was just one slide deck and my buddy is busy with month-end, so I've been learning invoice posting from YouTube.", "summary": "The employee received minimal training and used external videos to learn invoice posting tasks.", "serious_concern": false}`. Summary call (ms): [5891]. Feelings word in summary: None.
