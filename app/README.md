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

## Data and secrets

- Seed and pack texts are data files in `data/`. The seed is loaded only by the demo reset.
- Secrets live in a git-ignored `.env.local` and in Vercel. Names are in `.env.example`.
