# 05 — Responsible-AI rule

**Status:** Not started · **Owner:** Abraham (product) + Teammate A (consent wording, slide 9) · **Guide says:** Required ("IMPORTANT")

## Requirement (AIFM guide)

> IMPORTANT: Do not secretly monitor employees or infer emotions from cameras or a single behaviour. Use transparent, voluntary information. (p.6)

> Slide 9. Responsible AI — What must humans review? How do you reduce bias, errors, privacy or misuse risks? (p.10, suggested slide)

> 10% ESG Impact — Responsible and sustainable impact such as fairness, privacy, inclusion, accessibility, employee wellbeing, governance or efficient use of resources. (p.9)

## How Sapa meets it

- **Transparent:** consent message says what is collected, who sees it, how long it's kept, how to delete it (dossier F2).
- **Voluntary:** opt-in; stopping has no effect on employment; SKIP / STOP / DELETE work at any time.
- **No emotion inference:** the AI output schema has no emotion, personality or quit-risk field (architecture 5.3). The bot takes typed text only; voice notes are out of scope (spec 05 R16, R50).
- **No monitoring:** no message metadata. The bot keeps send times only to schedule check-ins; HR never sees per-person response times. Per person, HR sees only "invite used / not used". Declined, stopped and skipped are shown only as intake counts of 5 or more (spec 05 R41).
- **Enforced in the database:** HR-only by default, escalations hidden from managers (architecture section 6). Thresholds: "5 for themes, 3 for questions". A question group shows its text to HR only at 3 or more distinct askers; important-topic questions are counted by topic only.
- **Right to challenge:** `/myanswers` (`/jawapansaya`) shows a new hire their stored replies with the AI summary and tags, and lets them flag "this is wrong" to HR (spec 05 R40).

## What goes in this folder

- `consent-text.md` — final consent message in BM and English (the two packs, spec 05 R46)
- `never-does.md` — the "What Sapa never does" statement used on slide 9 and in Q&A
- `escalation-message.md` — the fixed bot reply for serious disclosures, with **verified** helpline numbers, and the outside authority line for forced labour and sexual harassment (spec 05 R14)

## Tasks (our plan, not an organiser rule)

- [ ] Write the consent message in English (Teammate A)
- [ ] Translate to BM and have a native speaker check it
- [ ] Write the fixed escalation message; verify every helpline number before use (dossier F10 says "verify before launch")
- [ ] Confirm the AI schema has no emotion or risk-score fields (Abraham)
- [ ] Confirm HR sees no per-person send, answer or skip times, only "invite used / not used" (Abraham)
- [ ] Draft slide 9 content from dossier section I (Teammate A)

## Definition of done

Consent and escalation texts are final in both languages and live in the bot; slide 9 is drafted; the schema check is done.
