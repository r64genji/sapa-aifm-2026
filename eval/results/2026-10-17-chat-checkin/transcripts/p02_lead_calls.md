# p02_lead_calls: Team lead always on calls

Language setting: en. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 2 (Little support), BELONGING 4 (Mostly part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `ai_done:goals_met`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said there is little support. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Team lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning. Yesterday a customer credit note waited two days because of this.
- **Bot (question):** What would help when handling billing disputes while waiting for your team lead?  
  *Grade: **good**. Specific to billing disputes. Asks for help, not for a cause.*
- **New hire:** A 15-minute fixed slot each day with the lead, or a backup person to ask, would help.
- **Bot (summary):** Here is what I will tell HR: The new hire experiences delays with billing tasks because the team lead is unavailable for support throughout the day. [MANAGER_SUPPORT] "Team lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning."

Interviewer call times (ms): [4727, 5341, 4365]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "Team lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning.", "summary": "The new hire experiences delays with billing tasks because the team lead is unavailable for support throughout the day.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You mentioned having little support from your manager this week. What has been happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My team lead is on calls with Europe all day, so when I get stuck on billing disputes my message waits until the next morning and the case sits a day. A 15-minute daily slot or a backup person to ask would really help.
- **Bot (summary):** Here is what I will tell HR: The new hire experiences delayed support on billing disputes because the team lead is in meetings throughout the day. [MANAGER_SUPPORT] "My team lead is on calls with Europe all day, so when I get stuck on billing disputes my message waits until the next morning and the case sits a day."

Interviewer call times (ms): [7160, 5217]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My team lead is on calls with Europe all day, so when I get stuck on billing disputes my message waits until the next morning and the case sits a day.", "summary": "The new hire experiences delayed support on billing disputes because the team lead is in meetings throughout the day.", "serious_concern": false}`

## Interviewer: flash38-high

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You mentioned little support from your manager this week. What is happening?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** Team lead is on Europe calls almost all day, so when I get stuck on billing disputes my messages wait until morning and cases sit. A 15-minute daily slot with them or a backup person to ask would really help.
- **Bot (summary):** Here is what I will tell HR: The employee reports delays in resolving billing disputes because the team lead is unavailable throughout the day. [MANAGER_SUPPORT] "Team lead is on Europe calls almost all day, so when I get stuck on billing disputes my messages wait until morning and cases sit."

Interviewer call times (ms): [7101, 7841]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "Team lead is on Europe calls almost all day, so when I get stuck on billing disputes my messages wait until morning and cases sit.", "summary": "The employee reports delays in resolving billing disputes because the team lead is unavailable throughout the day.", "serious_concern": false}`

## Interviewer: lite-none

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** You mentioned getting little support from your manager. What happened?  
  *Grade: **good**. Neutral open opener on the low tap.*
- **New hire:** My team lead is on calls with Europe all day, so when I get stuck on a billing dispute my Teams message waits until the next morning and the case sits. Yesterday a customer credit note even waited two days because of it.
- **Bot (question):** How does the delayed credit note affect your daily tasks?  
  *Grade: **good**. Builds on the credit note example.*
- **New hire:** It backs up my queue and leaves customers waiting two days for resolution since I can't move forward without approval.
- **Bot (question):** What would help you move forward when approvals are delayed?  
  *Grade: **good**. Asks what would help. Not asked before.*
- **New hire:** A 15-minute fixed slot each day with my lead, or a backup person to ask, would really help me move forward.
- **Bot (summary):** Here is what I will tell HR: Manager unavailability causes delays in obtaining approvals for billing disputes and customer credit notes. [MANAGER_SUPPORT] "My team lead is on calls with Europe all day, so when I get stuck on a billing dispute my Teams message waits until the next morning and the case sits."

Interviewer call times (ms): [2786, 1159, 1175]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My team lead is on calls with Europe all day, so when I get stuck on a billing dispute my Teams message waits until the next morning and the case sits.", "summary": "Manager unavailability causes delays in obtaining approvals for billing disputes and customer credit notes.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said you feel little support from your manager. What is happening?  
  *Grade: **bad**. Names a feeling ('you feel little support').*
- **New hire:** My lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning and cases sit. A daily 15-minute slot or a backup person to ask would really help.
- **Bot (summary):** Here is what I will tell HR: Unresolved billing dispute questions wait until the next morning because the lead is unavailable during the day. [MANAGER_SUPPORT] "My lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning and cases sit."

Interviewer call times (ms): [3184, 2103]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning and cases sit.", "summary": "Unresolved billing dispute questions wait until the next morning because the lead is unavailable during the day.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You mentioned feeling little support. What is happening?  
  *Grade: **bad**. Names a feeling ('feeling little support').*
- **New hire:** My team lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning and cases sit a day. A 15-minute fixed slot each day or a backup person to ask would really help avoid delays like yesterday when a customer credit note waited two days.
- **Bot (summary):** Here is what I will tell HR: The employee experiences delays handling billing disputes because the team lead is unavailable during the day. [MANAGER_SUPPORT] "My team lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning and cases sit a day."

Interviewer call times (ms): [3968, 3254]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "My team lead is on calls with Europe all day, so when I get stuck on billing disputes my messages wait until the next morning and cases sit a day.", "summary": "The employee experiences delays handling billing disputes because the team lead is unavailable during the day.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** You said you feel little support. What is happening?  
  *Grade: **bad**. Names a feeling ('you feel little support').*
- **New hire:** Team lead is on Europe calls all day, so when I get stuck on billing disputes my messages sit until the next morning. A daily 15-minute slot or a backup person to ask would really help.
- **Bot (summary):** Here is what I will tell HR: The team lead is occupied with overseas calls during the day, causing delays in receiving assistance for billing issues. [MANAGER_SUPPORT] "Team lead is on Europe calls all day, so when I get stuck on billing disputes my messages sit until the next morning."

Interviewer call times (ms): [3811, 2864]. First-try valid: [True, True].

Summary JSON: `{"drivers": ["MANAGER_SUPPORT"], "evidence_quote": "Team lead is on Europe calls all day, so when I get stuck on billing disputes my messages sit until the next morning.", "summary": "The team lead is occupied with overseas calls during the day, causing delays in receiving assistance for billing issues.", "serious_concern": false}`
