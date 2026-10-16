# app/

The Sapa backend: one Next.js app (scaffolded from the `with-supabase` template) with Supabase migrations in `supabase/`. Vercel's **Root Directory** is `app`.

Design reference: [docs/05 — Implementation spec](../docs/05-implementation-spec.md) (wins over [docs/02](../docs/02-prototype-architecture.md) where they disagree).

## Test

```bash
npm test
```

This is the only test command, and the only thing that may start or reset the local Supabase stack. It waits for an exclusive lock (`/tmp/sapa-e2e.lock`), so runs from parallel worktrees queue. It starts a cut-down local Supabase (project `sapa`, shared by every worktree, left running), resets it with this worktree's migrations, builds and starts the app on port 54330 with `SAPA_TEST=1`, starts the fake Telegram Bot API (54331) and the fake model server (54332), runs `e2e/*.test.ts`, stops what it started and prints one `E2E PASS` or `E2E FAIL` last line. A skipped test is a fail.

- Tests follow "Testing Decisions" in docs/05: rules R1–R53 and bug fixes only, end to end over HTTP, expected values from the spec and the data files. One file per journey, named by rule IDs.
- Each test file resets to the seed first through `POST /api/demo/reset`, the same reset the demo uses, and freezes the clock with `freezeClock`. With `SAPA_TEST=1` the clock reads the `test_clock` row; that table and code path exist only in the test build.
- With `SAPA_TEST=1` the app refuses to start if any base URL is not on localhost. `NODE_ENV=test` stops Next from loading `.env.local`, so no real key or token reaches a test run.

## Eval runners

```bash
npm run measure -- classify|qa|reliability --model gemini|deepseek [--split dev|test]
```

Not part of `npm test`: these call the real model and need real keys in `.env.local`. Exactly one `--model` is required and there is no fallback (R38); a failed call is recorded as failed. The sets are hand-written data in `../eval/sets/` (`classify.jsonl` with a dev/test `split` per item, `qa.jsonl`, `reliability-adversarial.jsonl`). Results, with every response, are written to `../eval/results/`. Set `EVAL_ORGANISATION_ID` to also write `ai_usage` rows tagged with the run ID. Run the test split once per prompt version.

## Rehearsal

```bash
REHEARSAL_CHAT_ID=<your Telegram chat ID> npm run rehearsal
```

Run before each rehearsal, not on every commit. It runs required journey 2 against the deployed app (`APP_URL`, default https://sapa-aifm-2026.vercel.app) with the real model and the real Telegram Bot API: it resets the demo seed, binds the live hire to your chat (message the bot once first, so Telegram lets it write to you), sends scripted updates to the real webhook, then does the HR and manager steps through the real routes. It ends when the action is done, the notice is sent and the Day 30 check-in carries the neutral 1-5 question, then resets the seed again and checks it is restored. The last line is `REHEARSAL PASS: ...` or `REHEARSAL FAIL: ...`. Needs `.env.local`.

## Production jobs

Two `pg_cron` jobs on the cloud Supabase project call the app with `Authorization: Bearer $DISPATCH_SECRET`. They are created by SQL, not by a migration, so the secret stays out of git. `sapa-dispatch` runs every minute (`* * * * *`) and posts to `/api/dispatch`. `sapa-nightly` runs at 03:00 Kuala Lumpur time (`0 19 * * *` UTC) and posts to `/api/nightly`: retention purge, weekly snapshots, held manager alerts and spot checks. Without it none of these run.

## Data and secrets

- The dev server for people is `npm run dev -- -p 3148`, reached at https://dev.sapa.abrahamtan.com through a Cloudflare tunnel. It uses the local Supabase through https://devdb.sapa.abrahamtan.com. The owner can open only this dev server, so check UI work there.
- `npm run dev` signs you in as the seed HR admin `admin@contoh.test` with `SEED_USER_PASSWORD`, so there is no login page: `/auth/login` sends you to `/`. This runs only when `NODE_ENV` is `development`. Production, `npm test` and `next start` still need a real login. To use another seed user, sign in on `/auth/login` while signed in.
- Seed and pack texts are data files in `data/`. The seed is loaded only by the demo reset.
- `POST /api/demo/reset` needs its own `DEMO_RESET_SECRET`, never the dispatch secret, and refuses while any organisation has demo mode off. The seed holds no unused invite token: each reset makes a new one for the live hire and returns its link only to the caller.
- Secrets live in a git-ignored `.env.local` and in Vercel. Names are in `.env.example`.
