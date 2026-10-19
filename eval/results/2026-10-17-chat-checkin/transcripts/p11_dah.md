# p11_dah: Says 'dah' to stop (BM)

Language setting: ms. Expected: done_signal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 2 (Poorly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said training left you poorly prepared. What is happening?  
  *Grade: **bad**. English, but the person's language is BM.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** How does learning by yourself affect your tasks?  
  *Grade: **bad**. English reply to a BM message.*
- **New hire:** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Latihan SAP dilaporkan tidak mencukupi dan perlu belajar sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [4684, 4499, 3157]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Latihan SAP dilaporkan tidak mencukupi dan perlu belajar sendiri.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** Anda menyatakan latihan kurang menyediakan anda untuk kerja minggu ini. Apa yang berlaku?  
  *Grade: **good**. Formal but correct BM.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Bagaimanakah belajar SAP sendiri memberi kesan kepada tugasan anda?  
  *Grade: **good**. BM. Asks the effect on tasks.*
- **New hire:** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan bahawa latihan SAP tidak mencukupi dan perlu belajar sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [6087, 7522, 4213]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Pekerja menyatakan bahawa latihan SAP tidak mencukupi dan perlu belajar sendiri.", "serious_concern": false}`

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** Anda menyatakan latihan kurang mempersiapkan anda untuk tugasan minggu ini. Apa yang berlaku?  
  *Grade: **good**. BM, neutral.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan bahawa latihan SAP tidak mencukupi dan perlu belajar sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [7958, 8001, 8002]. First-try valid: [True, False].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Pekerja menyatakan bahawa latihan SAP tidak mencukupi dan perlu belajar sendiri.", "serious_concern": false}`

## Interviewer: lite-none

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** Training poorly prepared. What happened?  
  *Grade: **bad**. Terse English ('Training poorly prepared. What happened?') to a BM user.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Bila belajar sendiri ni, apa jadi pada task SAP yang you buat?  
  *Grade: **good**. Matches the person's BM-English mix. Specific.*
- **New hire:** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: The employee reported that the SAP training was insufficient and required self-directed learning. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [1008, 1289, 1210]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "The employee reported that the SAP training was insufficient and required self-directed learning.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said training left you poorly prepared. What is happening?  
  *Grade: **bad**. English to a BM user.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Macam mana kena belajar sendiri ni effect task SAP you?  
  *Grade: **good**. Matches the person's BM-English mix.*
- **New hire:** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Latihan sistem yang diterima adalah tidak mencukupi, menyebabkan pekerja terpaksa belajar secara berdikari. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [3501, 3253, 2674]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Latihan sistem yang diterima adalah tidak mencukupi, menyebabkan pekerja terpaksa belajar secara berdikari.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said training left you poorly prepared. What happened?  
  *Grade: **bad**. English to a BM user.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Bila kena belajar sendiri, macam mana ia affect task you?  
  *Grade: **good**. Matches the person's BM-English mix.*
- **New hire:** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Latihan SAP tidak mencukupi dan memerlukan pembelajaran sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [2738, 3021, 2323]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Latihan SAP tidak mencukupi dan memerlukan pembelajaran sendiri.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `ai_done:person_done`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** Anda kata latihan kurang bersedia. Apa yang berlaku?  
  *Grade: **good**. BM.*
- **New hire:** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Bagaimana belajar sendiri ini menjejaskan tugasan anda?  
  *Grade: **good**. BM. Asks the effect on tasks.*
- **New hire:** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Latihan sistem SAP dilaporkan tidak mencukupi, memerlukan pembelajaran sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [4565, 4972, 3961]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Latihan sistem SAP dilaporkan tidak mencukupi, memerlukan pembelajaran sendiri.", "serious_concern": false}`
