# 03 — Working prototype

**Status:** In progress · **Owner:** Abraham (Teammate B on UI pages) · **Guide says:** Required

## Requirement (AIFM guide)

> Minimum output we want to see: EMPLOYEE FEEDBACK → AI FINDS THEMES → HR / MANAGER REVIEWS → SUPPORT ACTION (p.6)

> What a strong prototype looks like: REAL INPUT → AI PROCESS → CLEAR OUTPUT → HUMAN ACTION. Your prototype can be small. The judges should immediately understand what goes in, what AI does, what comes out, and what a person does next. (p.2)

> Build the smallest useful solution and show exactly where AI adds value. (p.2, step 5)

## Where the code lives

The app goes in [`/app`](../../app/). This folder holds the plan, decisions and links. Full design: [architecture doc](../../docs/02-prototype-architecture.md).

## What goes in this folder

- `links.md` — production URL, Telegram bot handle, Supabase project, Langfuse project (no secrets)
- `decisions.md` — anything we change from the architecture doc, with the reason

## Tasks (our plan, not an organiser rule)

Phases follow section 7.2 of the architecture doc.

**Phase 1 — Foundations (build day 1, Abraham)**
- [ ] Scaffold `/app` with `npx create-next-app -e with-supabase`
- [ ] Create the Supabase project; add schema migrations for the F7 tables
- [ ] Row-Level Security policies for `hr` and `manager` roles
- [ ] Create the Telegram bot (BotFather); Chat SDK webhook at `/api/webhooks/telegram`
- [ ] Expose OmniRoute over Tailscale Funnel with an app-only API key
- [ ] Confirm the exact Gemini 3.8 Flash model ID in OmniRoute
- [ ] Day-1 check: OmniRoute passes JSON-schema requests intact (else JSON mode + Zod)
- [ ] Direct-Gemini fallback via `@ai-sdk/google`
- [ ] Deploy to Vercel; decide public repo vs Abraham-only pushes (Hobby plan limit)

**Phase 2 — Check-in loop (build days 2–3)**
- [ ] QR / deep-link onboarding with invite token
- [ ] Consent flow in BM and English (text from [deliverable 05](../05-responsible-ai-rule/))
- [ ] Question bank from dossier F4, after native-speaker review
- [ ] `checkin_schedule` rows + Supabase Cron → `/api/dispatch` every minute
- [ ] Demo clock (`demo_offset_days`) with an "Advance to Day N" button
- [ ] SKIP / STOP / DELETE commands handled before any AI call

**Phase 3 — AI pipeline (build days 3–4)**
- [ ] PII masking (NRIC, phone, email) before the model
- [ ] Step A classify with verbatim evidence-quote check
- [ ] AI follow-up question (max 1–2 per touchpoint)
- [ ] Step B intake themes, only for groups of 5+
- [ ] Step C draft action from the action library (dossier F6)
- [ ] BM/English safety keyword list + escalation flow
- [ ] Langfuse tracing on every AI call

**Phase 4 — Dashboard (build days 4–6, Abraham + Teammate B)**
- [ ] Cohorts page with theme cards and weekly trend
- [ ] Flag queue (escalations pinned in red)
- [ ] Response detail: AI summary beside original text, tag override
- [ ] Actions board: draft → assigned → approved → done / dismissed
- [ ] Manager role: actions only, individual words only with consent
- [ ] Settings page and audit log
- [ ] Supabase Realtime so new replies appear live
- [ ] Telegram alert to the manager when an action is assigned

## Definition of done

The 90-second demo loop in [deliverable 11](../11-live-demo/) runs end to end on the production URL, with a real phone, three times in a row.
