export const DEMO_SCRIPT_CAPTION = "About 115 seconds · time it against real clicks";

export const DEMO_SCRIPT: { beat: string; time: string; what: string; screen: string }[] = [
  {
    beat: "1 · Check-in",
    time: "20 s",
    what: "Advance to Day 14 · the phone gets the check-in · Mei Ling replies \"Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu\" · the bot sends one fixed probe",
    screen: "Phone",
  },
  {
    beat: "2 · One reply, one person",
    time: "30 s",
    what: "Reply shows Role clarity with the quote and \"New labels wait for HR during calibration\" · card reads 23 of 64 (16 reviewed, 7 AI-confident) · Confirm label · it becomes 24 of 65 · mark needs follow-up · Offer a private chat · top question: \"Where can I park my motorbike?\", 7 asked",
    screen: "Replies to check, Needs you",
  },
  {
    beat: "3 · The pattern",
    time: "20 s",
    what: "Phone taps Yes · contact task (due in 2 working days) marked done · Draft a fix from the Role clarity card · \"Mei Ling only\" blocked: \"She chose HR only\" · pick Raj's team · approve note · assign · \"In real use this alert waits until Monday\"",
    screen: "Private chats, Draft a fix",
  },
  {
    beat: "4 · Manager acts",
    time: "15 s",
    what: "Raj taps Accept, then Mark done: \"Weekly priority list every Monday\"",
    screen: "Raj's phone",
  },
  {
    beat: "5 · Loop closes",
    time: "15 s",
    what: "\"Update from HR: your team now has a weekly priority list every Monday\" arrives at once · Advance to Day 30 · first question is the 1–5 recheck · tap 4",
    screen: "Phone",
  },
  {
    beat: "6 · Outcome",
    time: "15 s",
    what: "Earlier fix: Raj's team +1.3, other teams +0.1 (6 and 44 people) · live fix: \"Not enough answers yet (1 of 5)\" · Impact: role clarity is the top leaver reason (5 of 12) and the top Day 14 theme · 80 of 99 still employed at Month 6, against a usual 73 in 100 — a trend, not proof",
    screen: "Fix results, Impact",
  },
];

export const IF_SOMETHING_FAILS =
  "If the AI is down: the reply shows as Awaiting AI and you set the label by hand, which counts as reviewed. The seeded cards still tell the story. A screen recording of the full loop is on the laptop.";
