# Sapa

Sapa, a voluntary new-hire check-in bot plus HR backend, for AIFM 2026 Challenge 4. Start with [README.md](README.md). Route each docs task with [docs/agent-map.md](docs/agent-map.md).

- **Read first: [docs/00](docs/00-intent.md).** Goal, scope and agent rules. It wins over every other doc and ticket.
- **Every task follows the official rules, requirements and Challenge 4 brief: [docs/07](docs/07-official-rules-and-requirements.md).** Miss nothing they require. See "Official rules come first" in docs/00.
- Rules, demo and test method: [docs/05](docs/05-implementation-spec.md). Its rules R1–R60 and "Testing Decisions" are the test rules for this repo, limited to the show-off list in docs/00.
- How we work and what never to commit: [CONTRIBUTING.md](CONTRIBUTING.md). Agents skip its branch-and-PR flow: commit and push straight to `main` without asking (the owner allows it). Land any worktree with `~/.claude/bin/land --push`. The dev server runs this checkout, so work that is not on `main` here is invisible to the owner.
- App code lives in `app/` only. Running it and testing it: [app/README.md](app/README.md).

Check command: `cd app && npm test -- e2e/<file>.test.ts …`, with every test file that covers the rules or bug you changed, in one run. Its last line is `E2E PASS: …` or `E2E FAIL: …`. Run the full `npm test` only when the owner asks ([app/README.md](app/README.md#test)).

## Work in your own worktree

- Call `EnterWorktree` before your first edit. Edits to the main checkout are blocked. Other tools: `git worktree add .claude/worktrees/<name> -b <name>` and work there.
- Commit before you stop. At the end of each turn the Stop hook runs `~/.claude/bin/land`: it rebases on `main`, runs `cd app && npx tsc --noEmit`, and moves local `main`. If it fails, fix it and stop again. Never ask the operator before you land. Push with `~/.claude/bin/land --push`.
- The worktree stays for your next turn. `~/.claude/bin/worktrees --clean` removes it later.
- A new worktree has no `node_modules`. Run `~/.claude/bin/link-deps` to link the main checkout's copy; do not run `npm install` there.
