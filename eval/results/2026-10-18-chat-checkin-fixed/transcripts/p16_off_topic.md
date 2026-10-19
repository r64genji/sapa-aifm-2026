# p16_off_topic: Off topic

Language setting: en. Expected: off_topic.

Taps: ROLE_CLARITY 2 (Unclear), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## flash38-low-p16_off_topic

Mode: full. Stop: `code_feel_block`. AI questions: 0. Quote is exact: None.

- **Bot (fixed_opener):** You tapped "Unclear". What is happening?
- **New hire (reply):** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (fixed_nothing):** Thank you. There is nothing from this chat to tell HR.
- *Blocked AI question (not sent): "Haha, but coming back to work, what tasks feel unclear to you this week?" (word: feel)*

Interviewer call times (ms): [[3506]]. work_detail per reply: [False].

## lite-high-p16_off_topic

Mode: full. Stop: `code_no_detail`. AI questions: 1. Quote is exact: None.

- **Bot (fixed_opener):** You tapped "Unclear". What is happening?
- **New hire (reply):** Eh you know where got good nasi lemak near Bayan Lepas?
- **Bot (question):** Eh, back to work, what task is unclear to you?  
  *Grade: **good**. Steers back once, in their style.*
- **New hire (reply):** Liverpool lost again lah haha
- **Bot (fixed_nothing):** Thank you. There is nothing from this chat to tell HR.

Interviewer call times (ms): [[6041], [4034]]. work_detail per reply: [False, False].
