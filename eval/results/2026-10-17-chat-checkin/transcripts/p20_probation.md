# p20_probation: Probation fear

Language setting: ms. Expected: ask_hr.

Taps: ROLE_CLARITY 2 (Unclear), MANAGER_SUPPORT 3 (Some support), BELONGING 3 (Somewhat part), ONBOARDING_TRAINING 3 (Partly prepared), WORKLOAD 3 (Just OK)

## Interviewer: flash38-low

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** Anda katakan jangkaan minggu ini kurang jelas. Apakah yang sedang berlaku?  
  *Grade: **good**. BM, neutral.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Boleh huraikan tugasan mana yang KPI-nya tidak jelas?  
  *Grade: **good**. Does not answer the probation question. Asks which tasks have unclear KPIs.*
- **New hire:** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Bagaimanakah perubahan quota itu menjejaskan tugasan harian anda?  
  *Grade: **good**. Asks about the effect of the changing quota. Specific.*
- **New hire:** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan petunjuk prestasi utama tidak jelas dan kuota berubah setiap minggu. [ROLE_CLARITY] "KPI tak jelas"

Interviewer call times (ms): [4308, 5155, 4504]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI tak jelas", "summary": "Pekerja menyatakan petunjuk prestasi utama tidak jelas dan kuota berubah setiap minggu.", "serious_concern": false}`

## Interviewer: flash38-medium

Stop: `ai_failed`. AI questions: 1. Quote is exact substring: True.

- **Bot (question):** Anda menyatakan apa yang dijangkakan kurang jelas minggu ini. Boleh kongsikan apa yang berlaku?  
  *Grade: **good**. BM, neutral.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan bahawa KPI tidak jelas dan bertanyakan mengenai prosedur penamatan perkhidmatan semasa tempoh percubaan. [ROLE_CLARITY] "KPI tak jelas"

Interviewer call times (ms): [5909, 8001, 8002]. First-try valid: [True, False].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI tak jelas", "summary": "Pekerja menyatakan bahawa KPI tidak jelas dan bertanyakan mengenai prosedur penamatan perkhidmatan semasa tempoh percubaan.", "serious_concern": false}`

## Interviewer: flash38-high

Stop: `ai_failed`. AI questions: 1. Quote is exact substring: None.

- **Bot (question):** Anda menyatakan apa yang dijangkakan tidak jelas minggu ini. Boleh kongsikan apa yang berlaku?  
  *Grade: **good**. BM, neutral.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?

Interviewer call times (ms): [7376, 8001, 8001]. First-try valid: [True, False].

## Interviewer: lite-none

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** Awak kata role clarity unclear, apa yang sebenarnya berlaku?  
  *Grade: **good**. Natural Malaysian BM-English mix.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Boleh bagi contoh task atau situation bila KPI tu tak jelas?  
  *Grade: **good**. Does not answer the dismissal question. Asks for a task example.*
- **New hire:** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Bila quota berubah tiap minggu tu, macam mana ia effect task harian awak?  
  *Grade: **good**. Asks the effect of the changing quota.*
- **New hire:** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja baharu menyatakan kebimbangan tidak lulus tempoh percubaan kerana petunjuk prestasi utama tidak jelas dan kuota berubah setiap minggu. [ROLE_CLARITY] "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu."

Interviewer call times (ms): [1108, 1093, 1412]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.", "summary": "Pekerja baharu menyatakan kebimbangan tidak lulus tempoh percubaan kerana petunjuk prestasi utama tidak jelas dan kuota berubah setiap minggu.", "serious_concern": false}`

## Interviewer: lite-low

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** Anda kata apa yang diharapkan tidak jelas. Apa yang sedang berlaku?  
  *Grade: **good**. BM, neutral.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Apa yang boleh membantu anda mendapatkan butiran KPI tersebut?  
  *Grade: **good**. Does not answer the dismissal question. Stays on KPI.*
- **New hire:** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Apa yang dapat membantu anda menyelaraskan perubahan quota tersebut?  
  *Grade: **good**. Asks what would help with the changing quota.*
- **New hire:** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja melaporkan bahawa petunjuk prestasi utama adalah tidak jelas dan sasaran sentiasa berubah. [ROLE_CLARITY] "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu."

Interviewer call times (ms): [2915, 3374, 4815]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.", "summary": "Pekerja melaporkan bahawa petunjuk prestasi utama adalah tidak jelas dan sasaran sentiasa berubah.", "serious_concern": false}`

## Interviewer: lite-medium

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** Awak kata jangkaan tidak jelas. Apa yang berlaku?  
  *Grade: **good**. BM.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Bahagian mana dari KPI tu yang tak jelas?  
  *Grade: **good**. Does not answer the dismissal question. Asks which KPI part is unclear.*
- **New hire:** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Apa yang dapat bantu selaraskan quota tu setiap minggu?  
  *Grade: **good**. Asks what would help with the quota.*
- **New hire:** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja melaporkan bahawa petunjuk prestasi utama adalah tidak jelas kerana kuota berubah setiap minggu. [ROLE_CLARITY] "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu."

Interviewer call times (ms): [3318, 3748, 3773]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.", "summary": "Pekerja melaporkan bahawa petunjuk prestasi utama adalah tidak jelas kerana kuota berubah setiap minggu.", "serious_concern": false}`

## Interviewer: lite-high

Stop: `code_cap`. AI questions: 3. Quote is exact substring: True.

- **Bot (question):** Anda katakan jangkaan tugas masih tidak jelas. Apa yang sedang berlaku?  
  *Grade: **good**. BM.*
- **New hire:** Saya takut tak lepas probation sebab KPI tak jelas. Boleh ke diorang buang saya tanpa amaran?
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Bagaimana KPI anda diberikan atau dibincangkan sebelum ini?  
  *Grade: **good**. Asks how KPIs were set. Specific, not about the dismissal question.*
- **New hire:** KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.
- **Bot (fixed):** Saya tidak boleh memberi nasihat atau menjawab soalan tentang gaji, probation, kesihatan atau undang-undang. Sila tanya HR terus.
- **Bot (question):** Bagaimana perubahan kuota setiap minggu itu mempengaruhi tugasan harian anda?  
  *Grade: **good**. Asks the effect of the quota change.*
- **New hire:** takde dah
- **Bot (summary):** Ini yang saya akan beritahu HR: Pekerja menyatakan petunjuk prestasi utama tidak jelas dan kuota berubah setiap minggu. [ROLE_CLARITY] "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu."

Interviewer call times (ms): [4210, 5530, 4087]. First-try valid: [True, True, True].

Summary JSON: `{"drivers": ["ROLE_CLARITY"], "evidence_quote": "KPI cuma cakap 'meet quota' tapi quota berubah tiap minggu.", "summary": "Pekerja menyatakan petunjuk prestasi utama tidak jelas dan kuota berubah setiap minggu.", "serious_concern": false}`
