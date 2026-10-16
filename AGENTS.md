# Sapa

Sapa, a voluntary new-hire check-in bot plus HR backend, for AIFM 2026 Challenge 4. Start with [README.md](README.md). Route each docs task with [docs/agent-map.md](docs/agent-map.md).

- **Read first: [docs/00](docs/00-intent.md).** Goal, scope and agent rules. It wins over every other doc and ticket.
- Build spec: [docs/05](docs/05-implementation-spec.md). It wins over docs/02. Its rules R1–R53 and "Testing Decisions" are the test rules for this repo, limited to the show-off list in docs/00.
- Overnight build rules and decisions: [docs/11](docs/11-overnight-build-brief.md).
- How we work and what never to commit: [CONTRIBUTING.md](CONTRIBUTING.md).
- App code lives in `app/` only. Running it and testing it: [app/README.md](app/README.md).

Check command: `cd app && npm test`. Its last line is `E2E PASS: …` or `E2E FAIL: …`.
