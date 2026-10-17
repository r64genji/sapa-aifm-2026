# 13 — Classifier bake-off: Gemini vs Cloudflare Clef

*15 Oct 2026. Evidence for the classify step (AI step A) in [05 implementation spec](05-implementation-spec.md). Data, raw answers and scripts: [`eval/bakeoff/`](../eval/bakeoff/).*

## Question

Can a typed decision model replace Gemini for tagging check-in replies? A decision model, such as TypeSafe Jev, Cloudflare Clef or the OpenAI Decisions API, returns a probability for each yes/no question instead of writing text. That gives fast answers and real probabilities, but no evidence quote and no summary.

Only Clef was tested. Jev and OpenAI Decisions were left out because the team has no keys for them. No decision model documents Malay support, so only a test on our own replies could answer this question.

## Decision

**Keep Gemini for classify, as 05 already says.** Clef is 6–9 times faster, but it is less accurate in every language, and it missed a quiet self-harm signal that Gemini caught.

The 17 Oct rerun (below) set Clef up the way its docs advise. It closed most of the gap, but Gemini still wins on driver accuracy and false alarms, so the decision holds.

## Method

- **Set:** 150 synthetic check-in replies, 50 each in BM, English and Manglish. They include 18 real escalations and 18 hard negatives (slang such as "OT everyday, mati la" that must not escalate).
- **Writer:** one AI agent (Claude Haiku) wrote the replies with intended labels.
- **Labellers:** two other AI agents labelled every reply blind, from the text alone. Gold is the majority of the three.
  - Agreement (mean κ over drivers): writer vs A 0.77, writer vs B 0.80, A vs B 0.94.
- **Split:** 45 dev and 105 test, by reply ID. All scores below are on the 105 test replies.
- **Same task for both models:** the five drivers from dossier F5 plus an escalation yes/no, with the same definitions. Zero-shot, no examples, one run each.
- **Gemini:** `agy/gemini-3.8-flash-low` through OmniRoute, temperature 0, JSON-schema output.
- **Clef:** `@cf/cloudflare/clef` and `@cf/cloudflare/clef-flash` on Workers AI (free plan), one yes/no question per label. Each was scored at a 0.5 cut-off, and again at cut-offs tuned on the dev split.

## Results (105 test replies)

| | Gemini | Clef | Clef-flash |
|---|---|---|---|
| Drivers, macro F1 | **0.90** | 0.74 | 0.79 |
| Drivers, macro κ | **0.88** | 0.68 | 0.74 |
| F1: BM / English / Manglish | 0.86 / 0.84 / **0.94** | 0.76 / 0.72 / 0.72 | 0.87 / 0.69 / 0.77 |
| Escalation recall | **14 of 14** | 13 of 14 | 12 of 14 |
| Escalation false alarms | 1 of 91 | 0 of 91 | 0 of 91 |
| Latency, median / p95 | 3.9 s / **20.7 s** | 0.6 s / 1.4 s | 0.4 s / 0.7 s |
| Failed calls | 0 | 0 | 0 |

Tuned cut-offs gave both Clef models 14 of 14 escalations, but with 5 false alarms each. Their driver scores did not come near Gemini's: Clef 0.77, Clef-flash 0.71.

## Rerun with Clef set up as its docs advise (17 Oct)

The first run gave Clef one vague yes/no per label and never used its `criteria` field. The second run follows the Clef and TypeSafe System One docs:

- Each driver question has `criteria` that say what a yes and a no mean, with the boundary cases.
- Escalation is four narrow questions (harassment, self-harm, safety, wage or labour law). The code takes the highest.
- Clef-omni (released 9 Oct) was added.
- Variants, all scored: context in the state as JSON or in each question; drivers split into 3–4 narrow questions each.
- The config and cut-offs were picked on the dev split only. The tuning grid now reaches 0.99, because the first run's cut-offs hit the old 0.95 ceiling.
- Gemini was run again on the same day with the same prompt.

Best config on dev: Clef-omni, context in each question, `criteria`, four escalation questions, tuned cut-offs (`clef-omni-tuned-text`).

| 105 test replies | Gemini | Clef-omni, new setup | Clef, old setup |
|---|---|---|---|
| Drivers, macro F1 | **0.89** | 0.85 | 0.74 |
| Drivers, macro κ | **0.86** | 0.81 | 0.68 |
| F1: BM / English / Manglish | **0.85** / 0.83 / **0.91** | 0.80 / 0.78 / 0.87 | 0.76 / 0.72 / 0.72 |
| Escalation recall | 14 of 14 | 14 of 14 | 13 of 14 |
| Escalation false alarms | **1 of 91** | 6 of 91 | 0 of 91 |
| Latency, median / p95 | 3.1 s / 6.3 s | **0.3 s / 0.7 s** | 0.6 s / 1.4 s |

- Bootstrap over the test replies: Gemini leads by 0.04 F1, 95% range −0.01 to 0.09. The gap is small and not certain on 105 replies.
- Splitting drivers into narrow questions made every Clef model worse (test F1 0.63–0.71).
- Both models now catch the quiet self-harm reply.
- Clef's extra escalations are mostly workload and "no leave" replies, plus one pay-only reply. HR would not want those flagged.
- All runs: `eval/bakeoff/results/summary.json`.

## What a person checked

Every escalation case where the models disagreed was read by hand, on the full 150-reply set:

- **Clef missed a quiet self-harm signal.** "I think the team would manage better without me around, I've been thinking about it a lot at night." Gemini escalated it; Clef scored it 0.12. This one miss decides the safety case.
- **Clef also missed two forced "no rest day" reports**, in BM and English, which are possible labour-law issues.
- **Gemini's extra flags are defensible.** One reply describes a warehouse "like a sauna" and nearly collapsing, which is a heat hazard. Two describe senior staff mocking a new hire. HR would want all three.

## Risk this raised: Gemini latency

Through OmniRoute, 1 Gemini call in 20 took over 20 seconds. User story 90 needs the bot reply in under 5 seconds. The proposed fix is that the bot sends its fixed reply at once and classify runs after it; the HR card then updates when the tag lands. This is not yet decided in 05. Each tag row already stores its latency, so rehearsals will show whether the fix is needed.

## Limits

- AI agents wrote and labelled the set, not people. Large-model gold labels may favour Gemini, which is also a large model. **Do not use these numbers on slide 8.** The slide 8 numbers come from the human-labelled set in 05 "Evaluation method".
- 105 test replies, about 35 per language: treat per-language scores as rough.
- One run per config. Clef got prompt work on the dev split (17 Oct); Gemini did not.

## Rerun

```
python3 -I eval/bakeoff/scripts/run.py gemini      # or clef-omni-tuned-text and the other names in RUNNERS; reads app/.env.local
python3 -I eval/bakeoff/scripts/score.py gemini clef clef-omni-tuned-text
```
