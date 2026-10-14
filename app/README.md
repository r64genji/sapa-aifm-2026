# app/

Prototype code goes here. Scaffolded in Phase 1 of [deliverable 03](../deliverables/03-working-prototype/):

```bash
npx create-next-app -e with-supabase .
```

Then set Vercel's **Root Directory** to `app`.

Design reference: [docs/05 — Implementation spec](../docs/05-implementation-spec.md) (wins over [docs/02](../docs/02-prototype-architecture.md) where they disagree).

Secrets (Supabase keys, Telegram bot token, OmniRoute key, DeepSeek key) go in Vercel environment variables and a local `.env.local`, never in git.
