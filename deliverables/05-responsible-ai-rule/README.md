# 05 — Responsible-AI rule

**Status:** Not started · **Owner:** Abraham (product) + Teammate A (consent wording, slide 9) · **Guide says:** Required ("IMPORTANT")

## Requirement (AIFM guide)

> IMPORTANT: Do not secretly monitor employees or infer emotions from cameras or a single behaviour. Use transparent, voluntary information. (p.6)

> Slide 9. Responsible AI — What must humans review? How do you reduce bias, errors, privacy or misuse risks? (p.10, suggested slide)

> 10% ESG Impact — Responsible and sustainable impact such as fairness, privacy, inclusion, accessibility, employee wellbeing, governance or efficient use of resources. (p.9)

## How Sapa meets it

- **Transparent:** consent message says what is collected, who sees it, how long it's kept, how to delete it (dossier F2).
- **Voluntary:** opt-in; stopping has no effect on employment; SKIP / STOP / DELETE work at any time.
- **No emotion inference:** the AI output schema has no emotion, personality or quit-risk field (architecture 5.3).
- **No monitoring:** no response-time tracking, no activity data, no message metadata (dossier F9).
- **Enforced in the database:** HR-only by default, themes only from 5+ people, escalations hidden from managers (architecture section 6).

## What goes in this folder

- `consent-text.md` — final consent message in BM and English
- `never-does.md` — the "What Sapa never does" statement used on slide 9 and in Q&A
- `escalation-message.md` — the fixed bot reply for serious disclosures, with **verified** helpline numbers

## Tasks (our plan, not an organiser rule)

- [ ] Write the consent message in English (Teammate A)
- [ ] Translate to BM and have a native speaker check it
- [ ] Write the fixed escalation message; verify every helpline number before use (dossier F10 says "verify before launch")
- [ ] Confirm the AI schema has no emotion or risk-score fields (Abraham)
- [ ] Confirm no timing or activity data is stored (Abraham)
- [ ] Draft slide 9 content from dossier section I (Teammate A)

## Definition of done

Consent and escalation texts are final in both languages and live in the bot; slide 9 is drafted; the schema check is done.
