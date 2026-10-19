# Sapa — AIFM 2026 Challenge 4 (RETAIN)

**We are building Sapa, a voluntary chat check-in assistant, for HR teams and line managers at companies that hire continuously, so they can understand new-hire difficulties earlier and act on them more clearly.**

Sapa checks in with new employees on Telegram during their first six months, uses AI to find the problems they share (unclear priorities, weak onboarding, little support), and turns them into actions HR and managers approve and track — before people resign.

## Start here

| If you want to… | Go to |
| --- | --- |
| See what we must hand in and who's doing what | [deliverables/ — master checklist](deliverables/README.md) |
| See what the AI may do alone and what needs a person | [docs/14 — AI use contract](docs/14-ai-use-contract.md) |
| Find a statistic, persona, question or Q&A answer | [docs/03 — Research dossier](docs/03-research-dossier.md) |
| Read the official rules | [docs/reference — AIFM guide PDF](docs/reference/AIFM_2026_Student_Challenge_Guide_All_Challenges.pdf) |
| See what we still need to ask the organisers | [admin/organiser-questions.md](admin/organiser-questions.md) |

## Team

Replace the placeholders with GitHub handles.

| Person | Role | Owns |
| --- | --- | --- |
| Abraham (`@handle`) | Tech lead | Prototype (03), build steps (04), human review (06), demo driving (11) |
| Teammate A (`@handle`) | Pitch, admin and research | Challenge choice (01), one-sentence idea (02), 7 questions (08), slides (10), pitch lead (12) |
| Teammate B (`@handle`) | Data, testing and UI support | Sample data (07), testing evidence (09), dashboard pages with Abraham (03) |

## Repo map

```
.
├── README.md                    ← you are here
├── CONTRIBUTING.md              ← how we work (read once)
├── docs/
│   ├── 03-research-dossier.md
│   └── reference/               ← organisers' guide PDF
├── deliverables/                ← one folder per deliverable, each with a checklist
│   ├── README.md                ← master checklist: owners + status
│   ├── 01-challenge-choice/ … 12-pitch-session/
├── admin/
│   └── organiser-questions.md   ← things the guide doesn't say
├── app/                         ← prototype code (Next.js + Supabase), scaffolded in Phase 1
├── scripts/
│   └── create-github-issues.sh  ← turns each deliverable into a GitHub issue
└── .github/                     ← issue and pull-request templates
```

## The one rule

Every requirement in [`deliverables/`](deliverables/README.md) is quoted from the organisers' guide, with a page number. Our own plans are always labelled as *tasks*, never as requirements. If you find a new official rule (from the website, an email, a briefing), add it to [`admin/organiser-questions.md`](admin/organiser-questions.md) with where it came from.

## Never commit

- Real employee data, real CVs or anything about a real person's job (guide p.11: use fictional or permitted sample data only)
- API keys, tokens, `.env` files or passwords — they go in Vercel / Supabase settings
