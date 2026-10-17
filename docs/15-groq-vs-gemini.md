# 15 — Groq models vs Gemini, per AI feature

*17 Oct 2026. Can the fast models on Groq replace Gemini? Raw answers: [`eval/results/`](../eval/results/) (files dated 2026-10-17). Runner: `app/measure/run.ts` ([app/README](../app/README.md#eval-runners)).*

## Decision (proposed, owner to confirm)

**Do not swap everything. Split by feature.**

- **Move draft, group, translate and Q&A to `openai/gpt-oss-120b` on Groq.** It is as good as Gemini or better on each of them, and 3 to 8 times faster. Gemini times out on half of the drafts today.
- **Keep classify on Gemini.** gpt-oss-120b is almost 3 times faster there, but it tags drivers worse (κ 0.64 vs 0.77) and it did not escalate a debt-bondage reply. Classify feeds every number HR sees and the safety path, so accuracy wins.
- **Never use `openai/gpt-oss-20b`.** It missed 13 of 27 escalations and obeyed an injected instruction.
- **`qwen/qwen3.8-27b` is the fastest (0.5 s) and close to Gemini on drivers, but it missed 2 of 5 forced-labour replies and rated both as no concern, and it is weak in Chinese (κ 0.36).** It is also a preview model at about 5 times gpt-oss-120b's price.
- **If a paid Groq tier is not wanted, use Gemini 3.5 Flash Lite with thinking off for those four features instead.** Same quality, no new account, but about 2 times slower than gpt-oss-120b. See the Flash Lite section.
- **The free Groq key cannot run the app.** It allows 8,000 tokens a minute and 200,000 a day per model. One classify call uses about 1,500. A paid Groq tier is needed before any switch.

Code change for the switch is in `app/lib/ai.ts` `providers()` and is not made here.

## Method

- Same prompts and schemas as the app, imported from `lib/`. Strict JSON schema output on every model.
- Same items for every model. Classify: 90 evenly spaced items of the 183-item test split (`--sample 90`). Reliability: 20 runs plus the 16 adversarial items. Q&A: all 30. New sets written for this test: translate (15 Chinese replies), draft (10 named fixes, one injection), group (3 problem areas, 30 summaries with gold groups).
- Gemini is `agy/gemini-3.8-flash-low` (classify, Q&A, translate) and `-medium` (draft, group) through OmniRoute, as in the app. Groq gpt-oss models run with `reasoning_effort: low`; Qwen with reasoning off.
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
- **A second option for the four non-classify features: Lite with thinking off.** It has the same quality as gpt-oss-120b there, needs no new account and no paid Groq tier, but it is about 2 times slower (1.6–2.5 s vs 0.6–1.0 s).
- **Classify stays on Flash (low).** Lite with thinking off is faster, but tags drivers worse in BM, the main language of the reference customer.
- Cost is not known: OmniRoute does not say what Lite costs.

## Limits

- 90 classify items, about 20 per language: per-language κ is rough. One run per model.
- gpt-oss-120b used `reasoning_effort: low`. `medium` may close the classify gap; it was not tested because the daily cap ran out. Rerun with `GROQ_REASONING=medium`.
- No prompt work for the Groq models. The classify prompt was written for Gemini.
- AI-written gold labels, as in [13](13-classifier-bakeoff.md). Do not use these numbers on slide 8.
