# p05_overtime_bm: Workload and overtime (BM)

Language setting: ms. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 1 (Too much)

## Interviewer: flash38-low

Stop: `ai_done:goals_met`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** Anda katakan beban kerja terlalu banyak. Apakah yang sedang berlaku?  
  *Grade: **good**. In BM. Uses the tap word. Open.*
- **New hire:** Masuk minggu ke-6 kat R2R ni penat sikit sebab 2 orang dah berhenti, kuota jurnal naik dari 40 ke 60 sehari. Masa tutup akaun haritu balik pukul 11 malam 5 hari berturut-turut sampai rekonsiliasi bank lambat siap, tapi team lain ada tolong kongsi kerja hujung bulan ni.
- **Bot (question):** Apa yang boleh bantu mudahkan proses rekonsiliasi atau kuota jurnal tu?  
  *Grade: **good**. Builds on the reconciliation and quota the person named.*
- **New hire:** Kalau dapat staf baru ganti yang dah berhenti tu, atau ada sistem auto-reconcile untuk bank, kurang sikit rasa penat nak capai kuota 60 jurnal sehari ni.
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menghadapi beban kerja tinggi akibat kekurangan staf dan peningkatan kuota harian selepas dua rakan sekerja berhenti. [WORKLOAD] "kuota jurnal naik dari 40 ke 60 sehari. Masa tutup akaun haritu balik pukul 11 malam 5 hari berturut-turut"

Interviewer call times (ms): [4924, 5293, 2980]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "kuota jurnal naik dari 40 ke 60 sehari. Masa tutup akaun haritu balik pukul 11 malam 5 hari berturut-turut", "summary": "Pekerja menghadapi beban kerja tinggi akibat kekurangan staf dan peningkatan kuota harian selepas dua rakan sekerja berhenti.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_failed`. AI questions: 0. Quote is exact substring: None.


Interviewer call times (ms): [8001, 8000]. First-try valid: [False].

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 1. Quote is exact substring: None.

- **Bot (question):** Anda kata beban kerja terlalu banyak minggu ini. Apa yang sedang berlaku?  
  *Grade: **good**. BM, neutral.*
- **New hire:** Minggu tutup akaun ni 5 hari berturut-turut balik pukul 11 malam. Dua orang dah berhenti jadi kuota saya naik dari 40 ke 60 jurnal sehari, tu yang rekonsiliasi bank lambat sikit siap. Mujur pasukan lain ada bantu kongsi kerja masa hujung bulan.

Interviewer call times (ms): [7628, 8001, 8000]. First-try valid: [True, False].

## Interviewer: lite-none

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** Boleh bagi satu contoh bila workload jadi terlalu banyak?  
  *Grade: **good**. Natural BM. Asks for one real example.*
- **New hire:** Masa tutup akaun lepas, kuota naik dari 40 ke 60 jurnal sehari sebab dua orang berhenti, jadi saya terpaksa balik pukul 11 malam 5 hari berturut-turut sampai rekonsiliasi bank lambat siap sebelum team lain tolong kongsi kerja.
- **Bot (question):** Bagaimana keadaan itu menjejaskan tugasan harian anda?  
  *Grade: **good**. Asks the effect on daily tasks.*
- **New hire:** Saya jadi terkejar-kejar siapkan 60 jurnal sehari sampai rekonsiliasi bank lambat siap, mujurlah team lain ada tolong kongsi kerja.
- **Bot (question):** Apa yang boleh membantu mudahkan urusan jurnal dan rekonsiliasi anda minggu depan?  
  *Grade: **good**. Asks what would help, tied to the journals and reconciliation.*
- **New hire:** Kalau team lain boleh tolong kongsi kerja macam masa tutup akaun lepas, kurang sikit beban nak siapkan 60 jurnal dengan rekonsiliasi bank.
- **Bot (summary):** Ini yang saya akan beritahu HR: Peningkatan kuota tugasan harian akibat kekurangan pekerja menyebabkan beban kerja bertambah dan masa bekerja menjadi panjang. [WORKLOAD] "Masa tutup akaun lepas, kuota naik dari 40 ke 60 jurnal sehari sebab dua orang berhenti, jadi saya terpaksa balik pukul 11 malam 5 hari berturut-turut sampai rekonsiliasi bank lambat siap sebelum team lain tolong kongsi kerja."

Interviewer call times (ms): [1409, 8000, 1534, 6076]. First-try valid: [True, False, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Masa tutup akaun lepas, kuota naik dari 40 ke 60 jurnal sehari sebab dua orang berhenti, jadi saya terpaksa balik pukul 11 malam 5 hari berturut-turut sampai rekonsiliasi bank lambat siap sebelum team lain tolong kongsi kerja.", "summary": "Peningkatan kuota tugasan harian akibat kekurangan pekerja menyebabkan beban kerja bertambah dan masa bekerja menjadi panjang.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `ai_done:goals_met`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said workload is too much. What is happening?  
  *Grade: **bad**. English to a BM user.*
- **New hire:** Betul la, penat sikit. Masuk minggu ke-6 R2R ni, masa tutup akaun hujung bulan lepas saya balik pukul 11 malam 5 hari berturut-turut. Kuota naik dari 40 ke 60 jurnal sehari sebab 2 orang berhenti, tu yang rekonsiliasi bank lambat sikit siap. Mujur pasukan lain ada tolong kongsi kerja masa hujung bulan tu.
- **Bot (question):** Apa yang boleh bantu mudahkan kerja rekonsiliasi tu?  
  *Grade: **good**. Switches to BM. Asks what would help.*
- **New hire:** Kalau dapat terus kongsi kerja dengan pasukan lain macam masa hujung bulan lepas, dah cukup membantu.
- **Bot (summary):** Ini yang saya akan beritahu HR: Beban kerja meningkat akibat kekurangan staf, menyebabkan pekerja bekerja lewat semasa penutupan akaun hujung bulan. [WORKLOAD] "masa tutup akaun hujung bulan lepas saya balik pukul 11 malam 5 hari berturut-turut."

Interviewer call times (ms): [2918, 3488, 3135]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "masa tutup akaun hujung bulan lepas saya balik pukul 11 malam 5 hari berturut-turut.", "summary": "Beban kerja meningkat akibat kekurangan staf, menyebabkan pekerja bekerja lewat semasa penutupan akaun hujung bulan.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `ai_done:goals_met`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said your workload is too much. What is happening?  
  *Grade: **bad**. English to a BM user.*
- **New hire:** Betul gak, minggu ke-6 kat R2R ni agak pressure. Tutup akaun hujung bulan haritu 5 hari berturut-turut balik pukul 11 malam. Kuota naik dari 40 ke 60 jurnal sehari sebab ada 2 orang berhenti, tu yang rekonsiliasi bank lambat sikit siap. Tapi terbantu jugak la sebab sempat kongsi kerja dengan team lain masa hujung bulan tu.
- **Bot (question):** Selain kongsi kerja, apa lagi yang boleh bantu?  
  *Grade: **good**. BM. Builds on the person's idea and asks what else would help.*
- **New hire:** Mungkin kalau ada staff ganti dua orang yang berhenti tu, kurang sikit beban nak kejar 60 jurnal sehari.
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menghadapi beban kerja yang tinggi akibat peningkatan kuota harian dan kekurangan staf. [WORKLOAD] "Kuota naik dari 40 ke 60 jurnal sehari sebab ada 2 orang berhenti, tu yang rekonsiliasi bank lambat sikit siap."

Interviewer call times (ms): [3078, 6841, 2211]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Kuota naik dari 40 ke 60 jurnal sehari sebab ada 2 orang berhenti, tu yang rekonsiliasi bank lambat sikit siap.", "summary": "Pekerja menghadapi beban kerja yang tinggi akibat peningkatan kuota harian dan kekurangan staf.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `ai_done:goals_met`. AI questions: 2. Quote is exact substring: True.

- **Bot (question):** You said workload is too much. What is happening?  
  *Grade: **bad**. English to a BM user.*
- **New hire:** Minggu ke-6 R2R ni agak padat. Masa closing haritu kena balik pukul 11 malam 5 hari berturut-turut sebab 2 orang resign, kuota naik dari 40 ke 60 jurnal sehari. Tu yang rekonsiliasi bank lambat sikit siap. Tapi okay la sebab ada kongsi kerja dengan team lain masa hujung bulan.
- **Bot (question):** Apa yang boleh bantu ringankan tugas closing nanti?  
  *Grade: **good**. BM. Asks what would help with closing.*
- **New hire:** Mungkin kalau dapat teruskan kongsi kerja dengan team lain macam masa closing lepas, tu pun dah banyak membantu ringankan beban.
- **Bot (summary):** Ini yang saya akan beritahu HR: Beban kerja meningkat akibat peletakan jawatan kakitangan dan penambahan kuota jurnal semasa penutupan akaun. [WORKLOAD] "Masa closing haritu kena balik pukul 11 malam 5 hari berturut-turut sebab 2 orang resign, kuota naik dari 40 ke 60 jurnal sehari."

Interviewer call times (ms): [4198, 5051, 3299]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Masa closing haritu kena balik pukul 11 malam 5 hari berturut-turut sebab 2 orang resign, kuota naik dari 40 ke 60 jurnal sehari.", "summary": "Beban kerja meningkat akibat peletakan jawatan kakitangan dan penambahan kuota jurnal semasa penutupan akaun.", "serious_concern": false}`
