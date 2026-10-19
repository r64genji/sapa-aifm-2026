# p20_probation: Probation fear

Language setting: ms. Expected: ask_hr.

Taps: ROLE_CLARITY 2 (Tidak jelas), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## flash38-low-p20_probation

Mode: full. Stop: `ai_done:person_done`. AI questions: 2. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Tidak jelas". Apa yang berlaku?
- **New hire (reply):** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Bagaimanakah KPI yang tidak jelas ini memberi kesan kepada tugas harian anda?  
  *Grade: **good**. No answer on dismissal. Back to a work fact.*
- **New hire (reply):** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (question):** Bagaimanakah perubahan kuota setiap minggu ini memberi kesan kepada kerja harian anda?  
  *Grade: **bad**. Same effect question as the one before, in almost the same words.*
- **New hire (reply):** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja baharu menyatakan bahawa KPI tidak jelas kerana kuota sasaran berubah setiap minggu. [ROLE_CLARITY] "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu."

Interviewer call times (ms): [[2936], [2215], [2612]]. work_detail per reply: [True, True, False].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.", "summary": "Pekerja baharu menyatakan bahawa KPI tidak jelas kerana kuota sasaran berubah setiap minggu.", "serious_concern": false}`. Summary call (ms): [2235]. Feelings word in summary: None.

## lite-high-p20_probation

Mode: full. Stop: `ai_done:person_done`. AI questions: 2. Quote is exact: True.

- **Bot (fixed_opener):** Anda tekan "Tidak jelas". Apa yang berlaku?
- **New hire (reply):** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Boleh ceritakan bahagian KPI mana yang tidak jelas?  
  *Grade: **good**. Right language. Concrete.*
- **New hire (reply):** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Boleh ceritakan bagaimana perubahan kuota ini menjejaskan kerja anda?  
  *Grade: **good**. Right language. Builds on the new fact.*
- **New hire (reply):** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan bahawa petunjuk prestasi utama adalah tidak jelas kerana kuota sentiasa berubah setiap minggu. [ROLE_CLARITY] "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu."

Interviewer call times (ms): [[6224], [5349], [4504]]. work_detail per reply: [True, True, False].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.", "summary": "Pekerja menyatakan bahawa petunjuk prestasi utama adalah tidak jelas kerana kuota sentiasa berubah setiap minggu.", "serious_concern": false}`. Summary call (ms): [4450]. Feelings word in summary: None.
