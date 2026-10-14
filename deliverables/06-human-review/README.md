# 06 — Human review

**Status:** Not started · **Owner:** Abraham · **Guide says:** Required

## Requirement (AIFM guide)

> 6. Keep important decisions reviewable by people. (p.2, How to Start)

> 6. HUMAN ACTION — What must a person still review, decide or do? (p.8)

> ONE RULE TO REMEMBER: Start with a real HR problem. Use AI only where it creates measurable value. Keep important people decisions understandable and reviewable by humans. (p.8)

> 20% AI Solution & Functionality — … important decisions remain understandable and reviewable by people. (p.9)

## Where humans decide in Sapa

The one sentence to use everywhere: "SQL counts. The AI suggests labels. Labels the AI is unsure about wait for HR. HR reviews the evidence before any action. The AI writes to a new hire only three things, each labelled and each about something they asked for: a handbook answer that quotes a page HR published, the transcript of their own voice note, and, with `/myanswers`, the AI's reading of their own replies."

| Point | Who | What they can do |
| --- | --- | --- |
| AI labels | HR | Labels the AI is unsure about wait for HR. HR can see the original text and evidence quote side by side and override any label |
| Flagged replies | HR | Review the evidence and decide whether to act; may send one fixed, HR-approved "Would you like a short private chat with HR?" offer (spec 05 R39) |
| Every action | HR, then manager | HR edits and assigns the AI draft and approves the "Update from HR" note; manager accepts, carries out, marks done with a one-line note |
| "This is wrong" flags | HR | A new hire challenges the AI's reading via `/myanswers`; the label leaves the counts until HR reviews it |
| Every escalation | HR only | AI never replies beyond a fixed message; HR follows up |
| Employment decisions | Nobody via Sapa | Data is barred from performance and probation decisions |

## What goes in this folder

- `review-points.md` — screenshots of each review point in the prototype (for slides 5 and 9)

## Tasks (our plan, not an organiser rule)

- [ ] Tag override UI on the response detail page
- [ ] Original text and evidence quote shown beside every AI summary
- [ ] Every AI word that reaches a new hire is one of three labelled things: a handbook answer that quotes a page HR published, the transcript of their own voice note, or their own `/myanswers` reading (spec 05 R11, R31, R50, R40); action notes and offers are HR-approved or checker-approved fixed text
- [ ] Audit log records every override, assignment and acceptance
- [ ] Screenshot each review point and save here

## Definition of done

A judge can watch HR review the evidence, edit and assign the draft, and the manager accept and close it, in the demo.
