# 10 — Presentation slides

**Status:** Not started · **Owner:** Teammate A · **Guide says:** Slides required; ≤10 slides recommended

## Requirement (AIFM guide, p.10)

> PITCHING FORMAT: Each team must present its solution using presentation slides AND show a working demo or prototype.

> SLIDE LIMIT: We recommend no more than 10 slides. Keep the presentation focused on the problem, solution, AI value and evidence that your idea works.

> FINAL REMINDER: Do not spend the whole pitch explaining features. Start with the HR problem, show how your solution solves it, demonstrate the product, and be ready to answer the judges' questions.

## Suggested structure (guide p.10) → our content source

The story and slide direction live in [storyboard.md](storyboard.md); it wins over this table.

| # | Guide's slide | Our content | Feeds from |
| --- | --- | --- | --- |
| 1 | Team & Challenge | Team name, Challenge 4 · RETAIN, one-sentence idea | [02](../02-one-sentence-idea/) |
| 2 | The Real HR Problem | Six-month exit scenario; Aon 18.2%, Gallup 25% engaged | Dossier B, K |
| 3 | Evidence / Current Process | 7-step current process; Employment Hero: leaders expect to lose about 2 in 10 new hires within six months (an expectation, not a measured rate); practitioner quotes from real interviews only, else "desk research only" | Dossier C, [09](../09-testing-evidence/) evidence slot |
| 4 | Your Solution | Sapa: check-ins, handbook Q&A, dashboard, "Update from HR" and a neutral recheck | Rundown 1, [04](../04-challenge-4-build-steps/) |
| 5 | How It Works | Input → AI → output → human action; "SQL counts. The AI suggests labels…" | Spec 05 Solution, [06](../06-human-review/) |
| 6 | How AI Adds Value | Manual vs Sapa; accuracy | [09](../09-testing-evidence/) Test 1, 3 |
| 7 | Demo | Live demo | [11](../11-live-demo/) |
| 8 | Testing / Result | κ by language, time bar, quotes, limitation | [09](../09-testing-evidence/) |
| 9 | Responsible AI | What Sapa never does, consent, "5 for themes, 3 for questions", `/myanswers`, escalation | [05](../05-responsible-ai-rule/), Dossier I |
| 10 | Impact & Next Step | Impact for HR, the roadmap, then one pilot ask: see [storyboard.md](storyboard.md) | Client story, Dossier H |

## What goes in this folder

- `deck.html` — the deck: open in a browser, arrows or space to step, F for fullscreen. Slots in `[BRACKETS]` wait for real data
- `deck.pdf` — exported final deck (keep the editable source link in `links.md`)
- `links.md` — link to the editable deck (Canva / Slides / Claude)
- `speaker-notes.md` — who says what on each slide
- `illustrations/sapa-join-accounts-payable-asia.png` — QR for judges to join the live bot as Accounts Payable Asia new hires (Raj's team). It stays valid across demo resets; it changes only if production's `DEMO_RESET_SECRET` changes. Re-save it from Join codes on the production site if needed.

## Tasks (our plan, not an organiser rule)

- [ ] Pick the tool and share edit access with all three
- [ ] Draft slides 1–6 and 9–10 (no dependency on test results)
- [ ] Add slide 8 once [09](../09-testing-evidence/) has numbers
- [ ] Every statistic on a slide has its source in small text
- [ ] Assign each slide to a speaker in `speaker-notes.md`
- [ ] Check the deck is 10 slides or fewer
- [ ] Export `deck.pdf` here

## Definition of done

The deck is 10 slides or fewer, every number is sourced, each slide has a speaker, and the PDF is saved here.
