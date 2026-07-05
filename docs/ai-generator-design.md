# Design: AI Section/Page Generator ("Aedes Compose")

_Status: **proposed — awaiting sign-off**. No feature code written yet._
_Strategy: match the useful core of Wix Harmony/Aria (describe → editable site) without competing on Wix's model+data moat, and stay cheaper-than-Wix by making the deterministic path free._

## Goal & non-goals

**Goal:** user describes a section or page in natural language → the system produces a **validated, editable Aedes block tree** and inserts it on the canvas.

**Non-goals (deliberate):** we do NOT build an open-ended conversational agent trained on millions of sites (Wix's moat), and the AI never emits HTML or executable code. It only ever produces a constrained recipe of *known block types*, which is validated against the registry before rendering. You cannot generate a broken site.

## Core principle: the registry is the generation target AND the validator

The block registry we built (descriptors + `fields` + `defaults` + `pageGrammar`) is exactly the substrate an AI generator needs. The model's output is untrusted; the registry is the authority that makes it safe:

- **Target:** the LLM emits JSON referencing block `type`s and prop keys — never markup.
- **Menu:** the model's list of available blocks + their editable props is generated *from the registry* at call time, so it can never drift from what actually exists.
- **Validator:** a pure function repairs/rejects anything off-catalog before it becomes blocks.

## The generation contract (stable interface)

```
generate(intent) => Promise<Recipe>

intent = { prompt, scope: 'section' | 'page', siteKind?, context?: { precedingTypes, followingTypes } }
Recipe = { blocks: BlockSpec[] }
BlockSpec = { type, props?: Partial<props>, children?: BlockSpec[] }
```

`BlockSpec` is the same shape `createSiteFromRecipe` already ingests (`[{type, props}]`), extended with `children`. The ingestion path exists; we add validation and nesting.

## Layered generators behind one interface (mirrors predict.js tiering)

- **Tier 0 — Deterministic (no LLM, $0, offline).** Intent keywords → block selection via existing `blockSearch` aliases; structure via `pageGrammar` + `predict` + DNA `kinds` affinity; content = each block's `defaults`. "SaaS pricing page" → a grammar-valid scaffold `[navbar, hero, features, stats, cta, footer]` filled with defaults. Ships the whole feature end-to-end with zero API cost and works in local mode.
- **Tier 1 — LLM content fill (cheap).** Deterministic engine picks the **structure** (types + order); one bounded LLM call writes **copy** into those blocks' text props, constrained to the exact prop keys from each block's `fields`. Structure reasoning is free; the paid call is small, content-only JSON.
- **Tier 2 — LLM structure + content (full "Harmony-like").** The model proposes the block tree too, still constrained to registry types, then re-scored/repaired by the deterministic grammar validator.

One `generate()` signature; tiers swap behind it — the same pattern `predict.js` already documents (Tier 0 editorial → Tier 2 LLM). Ship Tier 0 first.

## Validation & repair layer (the safety moat)

Pure function `validateRecipe(recipe, context)` — deterministic, testable, no LLM:

1. Drop unknown `type`s (not in `registry`).
2. Strip prop keys absent from the block's `defaults`/`fields` (kills hallucinated props); coerce values — segment props must be within `options`, numbers clamped to field `min`/`max` (logic already lives in FieldRenderer's controls).
3. Fill missing props from `defaults`.
4. Enforce structure via `pageGrammar` + DNA: singletons once (navbar/hero/footer), navbar-first / footer-last, dedupe, order by narrative segment.
5. **Rebuild every block through `makeBlock(type)` + validated prop patch** — never hand-construct. Guarantees valid ids, child scaffolds (section/columns), countdown target, etc. A generated block is byte-shaped identically to a user-dragged one.

Consequence: even a garbage model response degrades to a valid, editable tree. This is the differentiator vs HTML generation.

## Where the LLM boundary sits

- Provider-agnostic `llm.complete(messages)` adapter — same driver pattern as `db.js`. Configured via env (`.env` already exists). **No key → Tier 0 only, fully functional.** Respects local/no-cost mode.
- System prompt embeds the **registry-derived block catalog** (types, labels, hints, editable field keys) so the menu is always in sync. Output constrained to JSON (response-format / tool schema).
- LLM output is untrusted input: validation is mandatory. No code execution, ever — we only map to known types. No AI-authored custom-code blocks in v1 (prompt-injection surface).

## Cost model (the cheaper-than-Wix thesis)

| Tier | Cost | When |
|---|---|---|
| 0 deterministic | $0, offline | Always available; free-plan generation |
| 1 content fill | one small JSON completion, cached by (prompt, kind) hash | Default when a key is configured |
| 2 full tree | one completion, gated | Paid tier / when 0–1 insufficient |

LLM tiers are a **monetization lever**: free users get instant deterministic drafts (still a selling point); paid users get AI-written copy/structure. You never pay for structure reasoning — the grammar engine does that for free.

## UX integration (reuse what exists)

- Entry via the command palette (⌘K) or a "✨ Generate" affordance in the Rail. User types intent → `generate()` → `validateRecipe` → insert through the existing `doInsert`/recipe path at the seam the **prediction engine already computes**.
- Generated blocks are normal blocks → immediately editable via the schema-driven Inspector (Phase 3). The "refine by hand" half of Harmony is already built.
- Scope toggle: **section** (insert at cursor/seam) vs **page** (scaffold/replace `site.blocks`).

## Phasing

- **P1 — Tier 0 generator + `validateRecipe` + palette entry.** $0, ships the feature end-to-end, proves the contract. Pure functions → snapshot-testable like we did for `predict`.
- **P2 — LLM adapter + Tier 1 content fill.** Registry-built system prompt, JSON parse → validate.
- **P3 — Tier 2 full generation + page scope + caching/gating.**

## Tradeoffs & risks (honest)

- **Tier 0 is smart templating, not magic** — weaker on open-ended prompts than Aria. Mitigation: it's free, instant, offline, always valid; frame as "instant draft," upsell LLM tiers.
- **LLM cost/latency (T1/2)** — bounded by content-only calls + caching + gating.
- **Untrusted output / prompt injection** — mandatory registry validation; never execute generated content; no AI custom-code blocks in v1.
- **Model/registry drift** — avoided by generating the model's catalog from the registry each call.
- **Quality ceiling of deterministic grammar** — only as good as DNA/grammar data; improving DNA improves generation *and* prediction together (shared investment).

## Why this is the right build

It assembles abstractions we already have (registry, `fields`, `pageGrammar`, `predict`, `createSiteFromRecipe`) — little new foundation. Deterministic-first keeps it cheap and shippable now without an LLM bill. Output is editable blocks, not HTML, so it's cleaner than Wix and the refine path already exists. Same tier-behind-one-interface pattern as `predict.js` keeps the architecture consistent.

## Future

- Feed acceptance telemetry into DNA/prediction weights (Tier 1 learning already planned) — generation and prediction co-improve.
- Per-block AI (regenerate section, rewrite copy) on the same adapter → the "15 AI tools" surface, incrementally.
- Component/template extraction from generated sections.
