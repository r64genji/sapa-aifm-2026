# How we work

Short version: **tick boxes, keep the status column honest, never commit secrets or real data.**

## If you don't code (most edits)

You can do everything in the GitHub website:

1. Open the file (e.g. `deliverables/10-presentation-slides/README.md`).
2. Click the pencil icon to edit.
3. Change `- [ ]` to `- [x]` to tick a task, or update the **Status** line.
4. Scroll down, write a short message ("Slides 1–3 drafted"), choose **Commit directly to `main`** for docs-only changes.
5. Also update the Status column in [`deliverables/README.md`](deliverables/README.md).

To add a file (screenshots, a PDF, notes): open the deliverable folder → **Add file → Upload files**.

## Issues (our to-do board)

Each deliverable can become a GitHub issue with its task list, so you can assign it, comment on it and see progress on one page. Abraham runs [`scripts/create-github-issues.sh`](scripts/create-github-issues.sh) once. Then:

- Assign yourself to the issues you own.
- Comment when you're blocked.
- Close the issue when the folder's **Definition of done** is met.

## If you code

- Branch from `main`: `feat/dashboard-actions`, `fix/consent-copy`, `data/eval-set`.
- Open a pull request; the template has a short checklist.
- App code lives in `/app` only.
- **Vercel Hobby note:** on a private repo, Vercel blocks deployments of commits authored by anyone except the account owner (Abraham). Simplest fix: make the repo public. If it stays private, check after each merge that `main` actually deployed.

## Status words

Use exactly these, so the master checklist stays scannable: **Not started**, **In progress**, **Blocked**, **Done**.

## Never commit

- Real personal data of any kind (AIFM guide p.11)
- Secrets: API keys, bot tokens, Supabase service keys, `.env*` files
