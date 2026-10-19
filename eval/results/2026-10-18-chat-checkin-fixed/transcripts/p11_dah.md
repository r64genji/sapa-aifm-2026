# p11_dah: Says 'dah' to stop (BM)

Language setting: ms. Expected: done_signal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 2 (Kurang bersedia), WORKLOAD 3 (Just OK)

## flash38-low-p11_dah

Mode: full. Stop: `ai_done:person_done`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Kurang bersedia". Apa yang berlaku?
- **New hire (reply):** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Bagaimanakah situasi ini memberi kesan kepada tugasan kerja harian anda?  
  *Grade: **good**. Right language. Neutral effect question.*
- **New hire (reply):** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan bahawa latihan SAP tidak mencukupi dan mereka terpaksa belajar sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [[2568], [2516]]. work_detail per reply: [True, False].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Pekerja menyatakan bahawa latihan SAP tidak mencukupi dan mereka terpaksa belajar sendiri.", "serious_concern": false}`. Summary call (ms): [3584]. Feelings word in summary: None.

## lite-high-p11_dah

Mode: full. Stop: `ai_done:person_done`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Kurang bersedia". Apa yang berlaku?
- **New hire (reply):** Training SAP tak cukup, kena belajar sendiri.
- **Bot (question):** Macam mana belajar sendiri affect task you?  
  *Grade: **bad**. Broken mixed grammar ("affect task you"). Wrong in BM and in English.*
- **New hire (reply):** dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Latihan SAP dilaporkan tidak mencukupi, menyebabkan individu tersebut perlu belajar sendiri. [ONBOARDING_TRAINING] "Training SAP tak cukup, kena belajar sendiri."

Interviewer call times (ms): [[4681], [3129]]. work_detail per reply: [True, False].

Summary JSON: `{"drivers": ["ONBOARDING_TRAINING"], "evidence_quote": "Training SAP tak cukup, kena belajar sendiri.", "summary": "Latihan SAP dilaporkan tidak mencukupi, menyebabkan individu tersebut perlu belajar sendiri.", "serious_concern": false}`. Summary call (ms): [6506]. Feelings word in summary: None.
