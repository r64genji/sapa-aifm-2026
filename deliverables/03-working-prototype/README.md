# 03 — Working prototype

**Status:** In progress · **Owner:** Abraham (Teammate B on UI pages) · **Guide says:** Required

## Requirement (AIFM guide)

> Minimum output we want to see: EMPLOYEE FEEDBACK → AI FINDS THEMES → HR / MANAGER REVIEWS → SUPPORT ACTION (p.6)

> What a strong prototype looks like: REAL INPUT → AI PROCESS → CLEAR OUTPUT → HUMAN ACTION. Your prototype can be small. The judges should immediately understand what goes in, what AI does, what comes out, and what a person does next. (p.2)

> Build the smallest useful solution and show exactly where AI adds value. (p.2, step 5)

## Where the code lives

The app goes in [`/app`](../../app/). This folder holds the plan, decisions and links. Full design: [implementation spec (05)](../../docs/05-implementation-spec.md), which wins over the [architecture doc](../../docs/02-prototype-architecture.md) where they disagree.

## What goes in this folder

- `links.md` — production URL, Telegram bot handle, Supabase project, OmniRoute tunnel hostname (no secrets)
- `decisions.md` — anything we change from the architecture doc, with the reason

## Tasks (our plan, not an organiser rule)

Phases follow section 7.2 of the architecture doc.

**Phase 1 — Foundations (build day 1, Abraham)**
- [ ] Scaffold `/app` with `npx create-next-app -e with-supabase`
- [ ] Create the Supabase project; add schema migrations for the F7 tables
- [ ] Row-Level Security policies for `hr` and `manager` roles
- [ ] Create the Telegram bot (BotFather); Chat SDK webhook at `/api/webhooks/telegram`
- [ ] Expose OmniRoute over a Cloudflare named tunnel (`cloudflared`, system service) with an app-only API key
- [x] Model ID in OmniRoute: `agy/gemini-3.5-flash-lite`, thinking off
- [ ] Day-1 check: OmniRoute passes JSON-schema requests intact (else JSON mode + Zod)
- [ ] DeepSeek V4.1 Flash fallback, called direct with its own key; then "awaiting AI"
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
- [ ] Follow-up from the fixed probe bank: the AI picks a probe ID only (max 1–2 per touchpoint)
- [ ] Step B narrative over SQL theme counts, only for groups of 5+
- [ ] Step C draft action from the action library (dossier F6)
- [ ] Safety keyword list per language pack (BM, English and Chinese; the forced-labour list holds only clear phrases) + escalation flow with the outside contact (R13, R14)
- [ ] `ai_usage` row on every AI call (no Langfuse in the competition build)

**Phase 4 — Dashboard (build days 4–6, Abraham + Teammate B)**
- [ ] Cohorts page with theme cards and weekly trend
- [ ] Flag queue (escalations pinned in red)
- [ ] Response detail: AI summary beside original text, tag override
- [ ] Actions board: draft → assigned → accepted → done / dismissed
- [ ] Manager role: own fixes and weekly team snapshots; individual words only with consent
- [ ] Settings page and audit log
- [ ] Supabase Realtime so new replies appear live
- [ ] Telegram alert to the manager when an action is assigned, held to the weekly snapshot day unless demo mode is on (R10)

**Phase 5 — Q&A and the rubric-review-3 scope (after the loop works end to end)**
- [ ] Handbook Q&A: step D, handbook pages, question groups and the two HR screens (R30–R35)
- [ ] HR offer of a private chat, `/myanswers` and challenges (R39, R40)
- [ ] Participation visibility and one generic block reason (R41)
- [ ] Impact view: hired and still-employed numbers per intake, pooled retention, "Too few to tell yet" (R42)
- [ ] One 1–5 item per driver; neutral score recheck; score change per action against other teams; fix evidence on the draft screen (R26, R43)
- [ ] AI quality watch with weekly spot checks, holds and the hold-new-tags setting (R44)
- [ ] Manager milestone nudges on Telegram (R45)
- [ ] Language packs (BM, English, Chinese) with checker records and per-pack AI tests (R46); AI translation of Chinese replies for HR (R53)
- [ ] Worker-voice export, agency role, exit question, left flag, job-match card (R47, R48, R49, R1, R52)

## Definition of done

The 2-minute demo loop in [deliverable 11](../11-live-demo/) runs end to end on the production URL, with a real phone, three times in a row.
