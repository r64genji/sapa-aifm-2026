# app/

Prototype code goes here. Scaffolded in Phase 1 of [deliverable 03](../deliverables/03-working-prototype/):

```bash
npx create-next-app -e with-supabase .
```

Then set Vercel's **Root Directory** to `app`.

Design reference: [docs/02 — Prototype architecture](../docs/02-prototype-architecture.md).

Secrets (Supabase keys, Telegram bot token, OmniRoute key, Gemini key, Langfuse keys) go in Vercel environment variables and a local `.env.local`, never in git.
