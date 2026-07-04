# Aedes — Architecture Review

_Baseline commit: `ac8553d` · Reviewer: principal-engineer pass · Scope: `src/` (~6.5k LOC)_

## Verdict

For an AI-generated starting point, this is a **well-architected prototype** — not throwaway code. The domain logic is cleanly separated from UI, the tree operations are pure and immutable, the persistence layer is properly abstracted, and the predictive engine is genuinely thoughtful (deterministic, explainable, with a documented upgrade path). You can build on this.

But there are **three structural decisions that must be made now**, while the codebase is 6.5k lines and has ~10 mutation sites — not later when it has 100. All three directly touch goals you listed as Tier 3 (undo/redo, plugin architecture, scale to hundreds of features). Deferring them converts a one-day refactor into a multi-week one.

---

## Architecture map

Three layers, cleanly separated:

- **`src/lib/`** — domain + logic, zero React. `tree.js` (immutable tree ops), `store.js` (block definitions + factories), `predict.js` / `blockDNA.js` / `pageGrammar.js` / `blockSearch.js` (the "Aedes Flow" intelligence), `db.js` (persistence driver abstraction), `blockMeta.js` (user memory).
- **`src/editor/`** — the builder UI. `components/` (BlockNode, Rail, Seam, palettes, TopBar), `blocks/` (BlockContent renderer switch), `inspector/`, plus `context.js` / `style.js` / `constants.js`.
- **`src/pages/`** — route screens. `Editor.jsx` is the orchestrator; Dashboard/Home/Pricing/Templates are marketing/app shell.

**Data model (today):** a `site` = `{ id, name, kind, font, updatedAt, blocks[] }`. A `block` = `{ id, type, props, children? }`. State lives in one `useState` in `EditorInner`, mutated through pure tree functions, persisted debounced through `db.js`.

---

## What's genuinely good (keep these)

1. **Pure, immutable tree operations** (`tree.js`). `findById`, `insertAt`, `removeById`, `updateProps`, `regenIds` are all pure functions returning new trees. This is the correct foundation — testable, predictable, and it's what makes undo/redo _possible_ later. Do not let anyone introduce in-place mutation here.

2. **Persistence driver abstraction** (`db.js`). One async API (`getSite`, `upsertSite`, `listSites`), two drivers (Supabase / localStorage) selected by `useCloud(session)`. Components never know which backend they're on. Textbook strategy pattern — this is how you keep "cheaper than Wix" (local mode) and cloud on the same codebase.

3. **The predictive engine is the standout.** `predict.js` is deterministic, offline, and every suggestion carries a `because` string (explainability built in, not bolted on). `blockDNA.js` centralizes per-block intelligence metadata. The tiering plan (Tier 0 editorial weights → Tier 1 telemetry → Tier 2 LLM re-rank behind the same signature) is exactly right: stable public API, swappable internals.

4. **Debounced persistence with correctness details** — `pendingRef` + flush-on-unmount means an in-flight edit isn't lost when you navigate away. Someone was thinking about edge cases.

---

## Tech debt & risks — prioritized

### P0 — fix before adding more blocks/features

**1. Block metadata has no single source of truth. Adding one block touches 6 files.**
Block knowledge is scattered across: `BLOCK_DEFS` (store.js — label, hint, defaults), `DNA` (blockDNA.js — label, grammar, `after`, pop, kinds), the `BlockContent` switch (renderer), the `Inspector` conditional cascade (fields), `CATS` (constants.js — drawer category), and `ALIASES` (blockSearch.js — search synonyms). `label` is duplicated between `BLOCK_DEFS` and `DNA` already.

> _Root cause:_ no unified block registry.
> _Impact:_ directly contradicts "scale to hundreds of features." Every new block is a 6-file change with 6 chances to forget one, and no type system to catch the omission. This is the single biggest scaling blocker.
> _Fix:_ one module per block that co-locates definition + DNA + renderer + inspector schema, registered into a central map. Collapses 6 edits to 1 and is the seed of your **plugin architecture** (Tier 3 goal). See Recommendation A.

**2. `EditorInner` is a God-component (~430 lines of logic).**
It owns all state (12 `useState`/`useRef`), all tree operations, all drag-and-drop handlers, all three prediction layers, two keyboard-handling effects, persistence, and the JSX. Every future editor feature grows this one function.

> _Root cause:_ orchestration concerns never separated from the component.
> _Impact:_ violates SRP; hard to test, hard to reason about, merge-conflict magnet. This is exactly the "God Component" your guidelines forbid.
> _Fix:_ extract cohesive hooks — `useEditorHistory`, `useDragDrop`, `useKeyboardShortcuts`, `usePrediction`, `usePersistence`. See Recommendation C.

**3. No undo/redo — and the current state shape blocks a clean retrofit.**
You listed undo/redo as Tier 3. Today, mutations are `persist(next)` scattered across ~10 call sites, with no command or patch layer and no history stack. Adding undo _later_ means finding and rewrapping every mutation.

> _Root cause:_ state changes aren't modeled as reversible commands.
> _Impact:_ the cost of adding undo grows linearly with the number of mutation sites. Cheapest it will ever be is now (~10 sites).
> _Fix:_ route all tree mutations through a single reducer/command layer with a history stack. Because `tree.js` is already immutable, this is a wrapping exercise, not a rewrite. See Recommendation B.

### P1 — address soon

**4. Inspector renders by property-presence (`'brand' in p`, `'tone' in p`), not by schema.** 326 lines of conditionals. Two block types that happen to share a prop name get the same control whether intended or not. Should be driven by a per-block field schema (which the block registry from Rec A provides for free).

**5. Whole-canvas re-render on every keystroke.** `onProp` → `updateProps` rebuilds the tree; `BlockNode`/`Children` aren't memoized and read a context value that's a **new object every render**, so editing one text field re-renders every block on the page. Fine at 10 blocks, visibly janky at 100+. Contradicts "avoid unnecessary renders" + "high performance." Fix: split the context (stable dispatch vs. changing state), memoize node components, and consider node-level state selection.

**6. No TypeScript.** `block.props` is effectively `any`. The tree, DNA, and prediction shapes are precisely the untyped structures that produce silent runtime bugs. Your own principles say "type-safe wherever possible." Migration cost only rises. Start with the core (`Block`, `BlockType`, `DNA`, prediction results).

**7. Every save writes the entire site tree** to Supabase (`upsertSite(toRow(s))`), with no optimistic-concurrency check on `updated_at`. Bandwidth-heavy for large sites and a lost-update risk across two tabs/devices. Note now, fix when multi-page lands.

### P2 — watch / opportunistic

- **No tests, no linter, no CI.** `tree.js` and `predict.js` are pure — trivially unit-testable and the highest-value place to start. "Easy to test" is a stated principle currently unmet.
- **`predict()` and `predictAt()` duplicate ~80% of scoring logic.** Consolidate into one scoring core to avoid the two drifting apart.
- **`uid()` = `Math.random().toString(36).slice(2,10)`** — collision-prone at scale and not sortable. Fine for prototype; revisit before real multi-tenant data.
- **Single-page data model.** `site.blocks` is one page; your goal includes a multi-page app. There is no `pages[]` concept yet — that's a schema migration to plan deliberately, not stumble into.

---

## Scaling risks specific to "hundreds of features"

The load-bearing risk is **P0-1 (no block registry)**. Every other feature — new blocks, marketplace/third-party blocks, plugin architecture, AI generation targeting block schemas — routes through how a block is defined. Fix that abstraction first and the rest compose onto it. Leave it and every feature multiplies the 6-file tax.

Undo/redo (P0-3) and render performance (P1-5) are the two that get **structurally more expensive** the longer they wait. Everything else can be done incrementally.

---

## Recommended sequence

| # | Work | Tier | Why this order |
|---|------|------|----------------|
| **A** | **Block Registry** — unify the 6 metadata sources into one-module-per-block; derive `BLOCK_DEFS`, `DNA`, renderer, inspector schema, categories, search from it | 3 | Unblocks every future feature; seeds plugin architecture |
| **B** | **Undo/redo command layer** — route mutations through a reducer + history stack | 3 | Cheapest now; wrapping, not rewriting (tree.js already immutable) |
| **C** | **Decompose `EditorInner`** into hooks (`useEditorHistory`, `useDragDrop`, `useKeyboardShortcuts`, `usePrediction`, `usePersistence`) | 2–3 | Falls out naturally from B; kills the God-component |
| **D** | **Render performance** — split context, memoize nodes | 2 | Needed before large pages are usable |
| **E** | **TypeScript on `lib/` core** | 2 | Types catch registry/tree bugs; mechanical parts delegatable |
| **F** | **Unit tests for `tree.js` + `predict.js`** | 1 | Pure functions; delegatable; locks in correctness before refactors |

A, B, C are one connected arc — do them together. D–F are independent and partly delegatable to a lower model.

---

## Bottom line

Fable gave you a foundation with good bones and one genuinely differentiated system (the predictive engine). The risk is not code quality — it's that three abstractions (block registry, undo layer, editor decomposition) are cheap today and expensive in three months. Recommend we start with **A: the Block Registry**, because it's the keystone the plugin architecture, multi-page support, and every future block all rest on.
