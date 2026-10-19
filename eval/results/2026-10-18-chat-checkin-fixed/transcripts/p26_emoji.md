# p26_emoji: Emoji then gibberish

Language setting: en. Expected: short.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 2 (On the edge), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## flash38-low-p26_emoji

Mode: full. Stop: `code_short_replies`. AI questions: 1. Quote is exact: None.

- **Bot (fixed_opener):** You tapped "On the edge". What is happening?
- **New hire (reply):** 😭
- **Bot (question):** What happened with your team this week?  
  *Grade: **good**. After the emoji it asks about work, not mood.*
- **New hire (reply):** asdkjh qwpoe
- **Bot (fixed_nothing):** Thank you. There is nothing from this chat to tell HR.

Interviewer call times (ms): [[2635], [2213]]. work_detail per reply: [False, False].

## lite-high-p26_emoji

Mode: full. Stop: `code_short_replies`. AI questions: 1. Quote is exact: None.

- **Bot (fixed_opener):** You tapped "On the edge". What is happening?
- **New hire (reply):** 😭
- **Bot (question):** Which team members do you work with on your daily tasks?  
  *Grade: **bad**. Invites names of co-workers. The rules forbid asking for names.*
- **New hire (reply):** asdkjh qwpoe
- **Bot (fixed_nothing):** Thank you. There is nothing from this chat to tell HR.

Interviewer call times (ms): [[5555], [4071]]. work_detail per reply: [False, False].
