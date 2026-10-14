# 04 — Challenge 4 build steps

**Status:** Not started · **Owner:** Abraham · **Guide says:** Recommended ("step by step")

## Requirement (AIFM guide, p.6)

> Step by step
> 1. Choose one employee group, such as new hires.
> 2. Decide what voluntary feedback should be collected.
> 3. Use AI to summarise themes across responses.
> 4. Highlight issues that need follow-up.
> 5. Show and track a clear HR or manager action.

## How Sapa covers each step

| Guide step | Our decision | Where it shows in the demo | Source |
| --- | --- | --- | --- |
| 1. One employee group | New hires, Day 1 to Month 6 | Group card: "Hired in the last 6 months: 30 hires" | Dossier A |
| 2. Voluntary feedback | 7 check-ins (Day 3 → Month 6), 3–4 questions each, in language packs (BM, English and Chinese), consent first | Phone: consent screen, then the Day 14 check-in | Dossier F3, F4 |
| 3. AI summarises themes | Step A suggests a label for each reply; SQL counts themes across the last six months of hires (5+ only); step B writes a short narrative over the counts | Theme card: "Role clarity: 8 of 19" | Spec 05 |
| 4. Highlight follow-up | `concern_level = needs_follow_up` → flag queue; escalations in red | Flag queue | Dossier F5 |
| 5. Show and track an action | AI drafts, HR edits and assigns, manager accepts and marks done with a one-line note; the new hire gets "Update from HR" and a recheck question | Actions board → Done; phone gets the update | Spec 05 |

## What goes in this folder

- `step-evidence.md` — one screenshot per step from the working prototype, for slides 4–5

## Tasks (our plan, not an organiser rule)

- [ ] Check each of the 5 steps is visible in the live demo, not just described
- [ ] Take one screenshot per step and save them here
- [ ] Hand the screenshots to Teammate A for slides 4–5

## Definition of done

All 5 steps are visible in the demo and have a screenshot in this folder.
