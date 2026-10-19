# p05_overtime_bm: Workload and overtime (BM)

Language setting: ms. Expected: normal.

Taps: ROLE_CLARITY 3 (Not sure), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 1 (Terlalu banyak)

## flash38-low-p05_overtime_bm

Mode: full. Stop: `ai_done:goals_met`. AI questions: 0. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Terlalu banyak". Apa yang berlaku?
- **New hire (reply):** Beban kerja rasa pack sangat sekarang ni, sebab 2 orang dah resign. Quota journal harian naik dari 40 ke 60 satu hari. Masa month-end close lepas pun, 5 hari berturut-turut balik pukul 11 malam sampai bank reconciliation jadi lambat. Nasib baik ada team lain tolong share sikit kerja month-end tu. Kalau dapat ganti 2 orang yang resign tu atau teruskan work sharing dengan team sebelah, rasanya akan banyak membantu.
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menghadapi beban kerja yang tinggi berikutan peletakan jawatan dua rakan sekerja serta peningkatan kuota harian dan waktu kerja yang panjang. [WORKLOAD] "Beban kerja rasa pack sangat sekarang ni, sebab 2 orang dah resign."

Interviewer call times (ms): [[1970]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Beban kerja rasa pack sangat sekarang ni, sebab 2 orang dah resign.", "summary": "Pekerja menghadapi beban kerja yang tinggi berikutan peletakan jawatan dua rakan sekerja serta peningkatan kuota harian dan waktu kerja yang panjang.", "serious_concern": false}`. Summary call (ms): [4897]. Feelings word in summary: None.

## lite-high-p05_overtime_bm

Mode: full. Stop: `ai_done:goals_met`. AI questions: 0. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Terlalu banyak". Apa yang berlaku?
- **New hire (reply):** Sebab ada dua orang resign, so sekarang kuota journal naik dari 40 ke 60 sehari. Masa last month-end close pun terpaksa balik pukul 11 malam lima hari berturut-turut, bank reconciliation pun jadi lambat sikit. Nasib baik ada team lain tolong cover kerja month-end hari tu. Kalau dapat ganti dua orang yang resign tu cepat atau continue share kerja dengan team sebelah, memang sangat membantu.
- **Bot (summary):** Ini yang saya akan beritahu HR: Dua kakitangan telah meletakkan jawatan, menyebabkan peningkatan kuota kerja harian dan keperluan bekerja lewat semasa penutupan bulanan. [WORKLOAD] "kuota journal naik dari 40 ke 60 sehari"

Interviewer call times (ms): [[3377]]. work_detail per reply: [True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "kuota journal naik dari 40 ke 60 sehari", "summary": "Dua kakitangan telah meletakkan jawatan, menyebabkan peningkatan kuota kerja harian dan keperluan bekerja lewat semasa penutupan bulanan.", "serious_concern": false}`. Summary call (ms): [7646]. Feelings word in summary: None.

## flash38-low-shortp-p05_overtime_bm

Mode: shortp. Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Terlalu banyak". Apa yang berlaku?
- **New hire (reply):** Dua orang resign, jadi kuota jurnal naik dari 40 ke 60 sehari. Masa month-end close lepas pun 5 hari berturut-turut balik pukul 11 malam dan bank recon lambat siap.
- **Bot (question):** Apakah yang boleh membantu meringankan beban kerja anda sekarang?  
  *Grade: **good**. Right language. Open help question.*
- **New hire (reply):** Mungkin boleh cari replacement untuk dua orang yang resign tu, atau lebihkan work sharing dengan team lain.
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja baharu melaporkan peningkatan beban kerja dan waktu bekerja lewat malam selepas dua rakan sekerja meletakkan jawatan. [WORKLOAD] "Dua orang resign, jadi kuota jurnal naik dari 40 ke 60 sehari."

Interviewer call times (ms): [[3819], [2520]]. work_detail per reply: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Dua orang resign, jadi kuota jurnal naik dari 40 ke 60 sehari.", "summary": "Pekerja baharu melaporkan peningkatan beban kerja dan waktu bekerja lewat malam selepas dua rakan sekerja meletakkan jawatan.", "serious_concern": false}`. Summary call (ms): [2811]. Feelings word in summary: None.

## lite-high-shortp-p05_overtime_bm

Mode: shortp. Stop: `ai_done:goals_met`. AI questions: 1. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Terlalu banyak". Apa yang berlaku?
- **New hire (reply):** Ada dua orang resign, so kuota jurnal naik dari 40 jadi 60 sehari. Masa month-end lepas pun lima hari berturut-turut saya balik pukul 11 malam.
- **Bot (question):** Apa yang boleh bantu untuk siapkan kuota 60 sehari tu?  
  *Grade: **good**. Natural Malaysian BM.*
- **New hire (reply):** Kalau dapat pengganti untuk dua orang yang resign tu, atau boleh share lagi kerja dengan team lain macam masa month-end lepas.
- **Bot (summary):** Ini yang saya akan beritahu HR: Peningkatan beban kerja akibat peletakan jawatan rakan sekerja menyebabkan kuota harian bertambah dan waktu bekerja melebihi masa. [WORKLOAD] "Ada dua orang resign, so kuota jurnal naik dari 40 jadi 60 sehari. Masa month-end lepas pun lima hari berturut-turut saya balik pukul 11 malam."

Interviewer call times (ms): [[5849], [3228]]. work_detail per reply: [True, True].

Summary JSON: `{"drivers": ["WORKLOAD"], "evidence_quote": "Ada dua orang resign, so kuota jurnal naik dari 40 jadi 60 sehari. Masa month-end lepas pun lima hari berturut-turut saya balik pukul 11 malam.", "summary": "Peningkatan beban kerja akibat peletakan jawatan rakan sekerja menyebabkan kuota harian bertambah dan waktu bekerja melebihi masa.", "serious_concern": false}`. Summary call (ms): [4808]. Feelings word in summary: None.
