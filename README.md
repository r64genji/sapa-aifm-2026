# Sapa

**A voluntary check-in bot for new hires, plus a dashboard that shows HR what to fix before people resign.**

Built for AIFM 2026, Challenge 4 (RETAIN). Live demo: https://sapa-aifm-2026.vercel.app

Many new hires leave in their first six months, and HR often finds out why only at the exit interview. Sapa asks earlier. It checks in with new employees on Telegram, finds the problems they share, and turns them into fixes that HR and managers approve and track.

## How it works

1. **Check-in on Telegram.** A new hire joins with a team QR code and gets short chats on set days. A few taps, then up to two AI follow-up questions. Bahasa Malaysia, English and Chinese.
2. **AI labels, HR confirms.** The AI tags each reply with a problem area (workload, role clarity, manager support, onboarding and more) and quotes the words it used. HR confirms or changes the label.
3. **HR sends a fix.** HR drafts a fix and sends it to one or many team leads. Managers accept it and mark it done in Telegram.
4. **Sapa checks if it worked.** The next check-in asks the same question again, then asks what changed. HR sees the score change against other teams.

Other parts: `/ask` answers questions from the company handbook, `/say` turns a message for a team lead into clear, polite English, and serious concerns go to the company's speak-up channel, not to Sapa.

## Privacy

- Each new hire chooses to share their name with HR or stay anonymous, and can change it with `/privacy`.
- Managers never see replies or a dashboard. They only get fixes from HR.
- The AI never sees a name. Phone numbers, emails and ID numbers are masked.
- All data in this repo is fictional sample data.

## Tech

- [Next.js](https://nextjs.org) app on Vercel, in [`app/`](app/)
- [Supabase](https://supabase.com) Postgres, with migrations in [`app/supabase/migrations/`](app/supabase/migrations/)
- Telegram Bot API for the chat
- Gemini and DeepSeek models for labels, follow-up questions and translation
- End-to-end tests over real HTTP against a local Supabase, with fake Telegram and model servers

## Run it

Setup, tests and the model eval runners are in [`app/README.md`](app/README.md). Copy `app/.env.example` to `app/.env.local` and fill in your own keys.

## Repo map

| Folder | What is in it |
| --- | --- |
| [`app/`](app/) | The bot and HR dashboard |
| [`docs/`](docs/) | Intent, spec, AI use rules, research and HR interview notes |
| [`eval/`](eval/) | Model test sets and raw results |
| [`deliverables/`](deliverables/) | Hackathon hand-ins |

## License

[MIT](LICENSE)
