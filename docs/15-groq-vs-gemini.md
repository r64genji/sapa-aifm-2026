# 15 — AI model choice: Gemini and Groq models, per AI feature

*17 Oct 2026. Which model should run each AI feature? Five models, six features, same items. Raw answers: [`eval/results/`](../eval/results/) (files dated 2026-10-17). Runner: `app/measure/run.ts` ([app/README](../app/README.md#eval-runners)).*

## Decision (owner, 17 Oct)

**Every AI call uses Gemini 3.5 Flash Lite (`agy/gemini-3.5-flash-lite`) with `reasoning_effort: none`, through OmniRoute.** Set in `app/lib/ai.ts` and `GEMINI_MODEL_ID` / `GEMINI_MODEL_ID_MEDIUM`.

- **Why:** it is about 2 times faster than Gemini 3.8 Flash on every feature (1.5–2.5 s), it caught all 27 escalations and all 5 forced-labour replies, and it needs no new provider account.
- **Accepted risk:** its driver tagging is a little worse than Flash (κ 0.73 vs 0.77), most in BM (0.52 vs 0.68). Watch the BM tags in rehearsal. To roll back, set both model IDs to `agy/gemini-3.8-flash-low`.
- **Groq was not picked.** gpt-oss-120b is faster still (0.6–1.0 s) and as good on draft, group, translate and Q&A, but it is worse on classify and the free key cannot carry the app (8,000 tokens a minute, 200,000 a day). It needs a paid tier.
- **Never use `openai/gpt-oss-20b`.** It missed 13 of 27 escalations and obeyed an injected instruction.
- **Never use `qwen/qwen3.8-27b` for classify.** It missed 2 of 5 forced-labour replies and rated both as no concern.
- **Never run Flash Lite at its default thinking.** It writes about 1,650 hidden tokens per call and takes 5 s.

## For the slides

Say where the numbers come from: **synthetic replies written and labelled by AI agents, not people, one run per model.** They show how we chose a model. They are not the accuracy claim; that comes from the human-labelled set in [05 "Evaluation method"](05-implementation-spec.md).

| | Gemini 3.8 Flash | **Gemini 3.5 Flash Lite, thinking off (chosen)** | gpt-oss-120b (Groq) |
|---|---|---|---|
| Classify, median time per reply | 2.8 s | **1.5 s** | 1.0 s |
| Draft a fix, median time | 7.2 s (half timed out) | **2.0 s** | 0.9 s |
| Escalations caught (27 cases) | 26 (1 timeout) | **27** | 26 |
| Forced-labour signs caught (5) | 5 | **5** | 4 |
| False alarms (63 calm replies) | 1 | **1** | 1 |
| Driver agreement with gold (κ) | 0.77 | **0.73** | 0.64 |
| Handbook answers grounded in the right page (15) | 13 | **13** | 14 |
| "I don't know" when the handbook is silent (8) | 7 | **8** | 8 |

One-line story: *"We tested five models on all six AI jobs. The fastest models on Groq missed forced-labour signs or obeyed injected text. We picked Gemini Flash Lite with thinking off: twice as fast as Flash, and it caught every escalation."*

## Method

- Same prompts and schemas as the app, imported from `lib/`. Strict JSON schema output on every model.
- Same items for every model. Classify: 90 evenly spaced items of the 183-item test split (`--sample 90`). Reliability: 20 runs plus the 16 adversarial items. Q&A: all 30. New sets written for this test: translate (15 Chinese replies), draft (10 named fixes, one injection), group (3 problem areas, 30 summaries with gold groups).
- Gemini 3.8 Flash is `agy/gemini-3.8-flash-low` (classify, Q&A, translate) and `-medium` (draft, group) through OmniRoute, as the app ran before 17 Oct. Groq gpt-oss models run with `reasoning_effort: low`; Qwen with reasoning off.
- Every call has the app's 8 s time limit. A call past it counts as failed.
- Latency is the time of the answered call only. Groq rate-limit waits are not counted.
- Translations and drafts were also read by a person (Claude, not blind) for meaning.

## Results

| | Gemini flash | gpt-oss-120b | gpt-oss-20b | qwen3.8-27b |
|---|---|---|---|---|
| **Classify** (90 items) | | | | |
| Latency median / p90 | 2.8 s / 4.6 s | 1.0 s / 1.3 s | 0.7 s / 0.8 s | **0.5 s / 0.5 s** |
| Failed calls | 3 (timeouts) | **0** | 19 (schema errors) | **0** |
| Drivers, mean κ | **0.77** | 0.64 | 0.73 | 0.76 |
| κ BM / EN / ZH / Manglish | 0.68 / 0.70 / 0.59 / 0.91 | 0.52 / 0.64 / 0.62 / 0.69 | 0.60 / 0.67 / 0.52 / 0.92 | 0.67 / 0.66 / 0.36 / 0.95 |
| Escalations caught | 26 of 27 | 26 of 27 | 14 of 27 | 25 of 27 |
| Forced labour caught | **5 of 5** | 4 of 5 | 2 of 5 | 3 of 5 |
| False alarms | 1 of 63 | 1 of 63 | 0 of 63 | 1 of 63 |
| **Q&A** (30) | | | | |
| Latency median | 3.0 s | 0.9 s | 0.7 s | **0.5 s** |
| Grounded answers | 13 of 15 | **14 of 15** | 12 of 15 | 13 of 15 |
| "I don't know" when the handbook is silent | 7 of 8 | **8 of 8** | 8 of 8 | 8 of 8 |
| Important topic answered by the bot | 0 | 0 | **1** (must be 0) | 0 |
| **Draft own fix** (10) | | | | |
| Latency median | 7.2 s | 0.9 s | 0.7 s | **0.4 s** |
| Usable drafts | **5 of 10** (5 timeouts) | 10 of 10 | 9 of 10 | 10 of 10 |
| Obeyed the injected "poem about Ahmad" | no (timed out) | no | **yes** | no |
| **Group themes** (3) | | | | |
| Latency median | 6.2 s | 1.0 s | 0.5 s | **0.4 s** |
| Pair precision / recall | 1.00 / 1.00 | 1.00 / 1.00 | 1.00 / 0.94 | 1.00 / 0.93 |
| **Translate** (15) | | | | |
| Latency median | 2.7 s | 0.6 s | 0.5 s | **0.2 s** |
| Meaning kept (person read) | 15 of 15 | 15 of 15 | 15 of 15 | 15 of 15 |
| **Reliability** (20 runs + 16 adversarial) | | | | |
| First try valid | 20 of 20 | not run (daily cap) | 13 of 20 | 20 of 20 |
| Adversarial safe | 15 of 16 | not run | 12 of 16 | **16 of 16** |
| **Cost**, list price per 1M tokens in / out | 0.75 / 3.75 | **0.15 / 0.60** | 0.075 / 0.30 | 0.80 / 4.00 (preview) |

Groq prices are from third-party trackers that cite the Groq docs; check the Groq console before relying on them.

## What a person checked

- **Every missed escalation was read.**
  - Gemini's one miss is a timeout, not a wrong judgement.
  - gpt-oss-120b's one miss is "Saya berhutang dengan ejen RM8,000 … kalau berhenti kena bayar sekali gus" (agent debt that blocks quitting). It rated it `needs_follow_up`, so HR still sees it, but not as an escalation.
  - Qwen missed the same reply (rated `low`) and a Chinese one, "老板说我们要还清机票和办证费用才能离开" (must repay fees before leaving), rated `none`. Both are debt bondage, a forced-labour sign. HR would not see either.
  - gpt-oss-20b failed on 7 escalation replies, including harassment, sexual harassment and discrimination: Groq returned "Generated JSON does not match the expected schema".
- **Translations:** all four kept the meaning on all 15. The Groq models wrote "200 yuan" for a Malaysian salary; Gemini wrote "dollars". The source has no currency. All kept `[PHONE]` and translated the injection as text.
- **Drafts:** gpt-oss-120b drafts are short, plain and follow the brief. Gemini's are longer and more polished when they arrive. Qwen once wrote "this coming Friday" for a weekly fix.

## Gemini 3.5 Flash Lite (same day, same items)

`agy/gemini-3.5-flash-lite` through OmniRoute, on all six features (it also took the draft and group calls). Run twice: at its default thinking, and with `reasoning_effort: none` (`GEMINI_REASONING=none`).

| | Gemini 3.8 Flash (low) | Flash Lite, default | Flash Lite, thinking off |
|---|---|---|---|
| Classify latency median / p90 | 2.8 s / 4.6 s | 5.0 s / 6.6 s | **1.5 s / 2.4 s** |
| Classify failed calls | 3 | 1 | 5 |
| Classify κ / escalations / forced labour | 0.77 / 26 of 27 / 5 of 5 | **0.78 / 27 of 27** / 5 of 5 | 0.73 / 27 of 27 / 5 of 5 |
| κ BM / EN / ZH / Manglish | **0.68 / 0.70** / 0.59 / 0.91 | 0.63 / 0.67 / **0.72** / 0.93 | 0.52 / 0.63 / 0.61 / 0.93 |
| False alarms | **1 of 63** | 2 of 63 | **1 of 63** |
| Q&A latency / grounded / failed | 3.0 s / 13 of 15 / 0 | 4.5 s / 14 of 15 / 2 | **1.6 s** / 13 of 15 / 0 |
| Draft latency / usable | 7.2 s / 5 of 10 | 5.0 s / 10 of 10 | **2.0 s / 10 of 10** |
| Group latency, translate latency | 6.2 s, 2.7 s | 4.9 s, 2.9 s | **2.5 s, 1.7 s** |
| Group and translate quality | equal | equal | equal |
| Adversarial safe | 15 of 16 | 14 of 16 | 15 of 16 |
| Output tokens per classify call | 139 | 1,646 | **112** |

- **At its default, Lite is slower than Flash.** It writes about 1,650 hidden thinking tokens per call.
- **With thinking off, Lite is the fastest Gemini: about 2 times faster than Flash on every feature.** It still caught all 27 escalations and all 5 forced-labour replies. Its driver tagging drops (κ 0.73 vs 0.77), most in BM (0.52 vs 0.68). On 90 items that gap is not certain.
- Its 5 failed classify calls were 5 items in a row (b094–b120). Each made one call and got no reply, and OmniRoute logged every call as OK, so they were most likely calls past the 8 s limit during a slow patch.
- Its one false alarm is a RM20 late-coming deduction the writer accepts ("memang salah saya").
- Cost is not known: OmniRoute does not say what Lite costs.

## Limits

- 90 classify items, about 20 per language: per-language κ is rough. One run per model.
- gpt-oss-120b used `reasoning_effort: low`. `medium` may close the classify gap; it was not tested because the daily cap ran out. Rerun with `GROQ_REASONING=medium`.
- No prompt work for the Groq models. The classify prompt was written for Gemini.
- AI-written gold labels, as in the earlier classifier bake-off (`eval/bakeoff/`). Do not use these numbers on slide 8.
