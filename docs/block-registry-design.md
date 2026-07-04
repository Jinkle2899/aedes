# Design: Block Registry (Recommendation A)

_Status: **proposed — awaiting sign-off**. No production code written yet._
_Depends on baseline `ac8553d`. Fixes P0-1 (6-file block tax) and P1-4 (property-presence Inspector). Seeds the plugin architecture._

## Step 1 — Root cause

There is no single definition of "a block." A block's knowledge is spread across six independent tables, each owned by a different file, with no shared type:

| Concern | Lives in | Owns |
|---|---|---|
| label, hint, defaults, `internal` | `store.js` → `BLOCK_DEFS` | structure/content |
| grammar, `after`, pop, kinds, singleton | `blockDNA.js` → `DNA` | prediction intelligence |
| how it renders | `blocks/BlockContent.jsx` | one giant `switch` |
| which fields to edit | `inspector/Inspector.jsx` | `'x' in p` conditional cascade |
| drawer category | `constants.js` → `CATS` | palette grouping |
| search synonyms | `blockSearch.js` → `ALIASES` | search |

`label` is already duplicated between `BLOCK_DEFS` and `DNA`. Adding one block = editing six files with six chances to forget one and no compiler to catch it. This is the concrete mechanism behind "can't scale to hundreds of features."

## Step 2 — Approaches considered

**Approach 1 — One big registry object.** A single file mapping `type → descriptor`, renderers inline.
_Pro:_ trivial, everything visible at once. _Con:_ recreates a God-file, renderers bloat it, no isolation, merge-conflict magnet, not plugin-ready. Rejected — trades six small problems for one big one.

**Approach 2 — One module per block + an explicit registry that imports them.** `src/blocks/hero/{index.js, Hero.jsx}` exports a descriptor; `src/blocks/index.js` imports all modules and assembles the map plus derived indexes.
_Pro:_ co-location, isolation (test one block alone), low coupling, plugin-ready, explicit and statically analyzable. _Con:_ more files, a barrel/manifest to maintain.

**Approach 3 — Self-registration via side-effect imports.** Each module calls `register(descriptor)` at import time.
_Pro:_ adding a block feels like "drop a file in," closest to runtime plugins. _Con:_ import-order and side-effect coupling, tree-shaking hazards, test isolation needs registry resets, order-dependent bugs. Too implicit for something meant to last 5 years.

## Step 3 — Recommendation

**Approach 2.** It captures ~90% of the plugin benefit (co-location, add-in-one-place, isolation) without the side-effect fragility of Approach 3. Crucially it is a **forward-compatible subset**: when you later want true third-party runtime plugins, add a public `registry.register(descriptor)` entry point on top of the same core — nothing already built has to change. Explicit beats implicit for long-term maintainability.

### The descriptor shape (the crux)

```js
// src/blocks/hero/index.js
import Hero from './Hero.jsx'

export default {
  type: 'hero',
  label: 'Hero',
  hint: 'Big opening statement',
  category: 'marketing',                 // replaces CATS
  aliases: ['banner','headline','intro','above the fold'], // replaces ALIASES

  dna: {                                 // replaces blockDNA.js entry
    grammar: 'opening', after: ['navbar'],
    pop: 0.9, singleton: true, kinds: [],
  },

  defaults: { heading: '…', sub: '…', button: 'Get started', align: 'center', tone: 'light' },
  create: null,                          // optional custom factory (columns/countdown need one)

  render: Hero,                          // ({ block }) => JSX — replaces one switch case

  fields: [                             // declarative — replaces Inspector conditionals
    { key: 'heading', label: 'Heading',    control: 'text' },
    { key: 'sub',     label: 'Subheading', control: 'textarea', rows: 3 },
    { key: 'align',   label: 'Alignment',  control: 'segment',  options: ['left','center'] },
    { key: 'tone',    label: 'Background',  control: 'segment',  options: ['light','tint','dark'] },
    { group: 'button' },                 // shared field group (button label/href/style)
  ],
}
```

### The registry core

```js
// src/blocks/index.js
import hero from './hero/index.js'
import navbar from './navbar/index.js'
// …all ~20 modules
const MODULES = [navbar, hero, /* … */]

const byType = Object.fromEntries(MODULES.map(m => [m.type, m]))

export const registry = {
  get: (type) => byType[type],
  all: () => MODULES,
  // derived indexes — the old tables, now computed from one source:
  toBlockDefs:  () => mapValues(byType, m => ({ label: m.label, hint: m.hint, defaults: m.defaults, internal: m.internal })),
  toDNA:        () => mapValues(byType, m => ({ label: m.label, ...m.dna })),
  toCategories: () => groupBy(MODULES.filter(m => !m.internal), m => m.category),
  toAliases:    () => mapValues(byType, m => m.aliases || []),
}
```

## Step 4 — Migration plan (phased, each phase independently shippable)

The key move: **make the registry the source of truth, then derive the legacy exports from it** — so `predict.js`, `blockSearch.js`, `constants.js`, `store.js` consumers keep working unchanged while we migrate one seam at a time.

- **Phase 0 — Build `src/blocks/`.** Create descriptor modules for all ~20 types (mechanical translation of existing tables). No consumer touched yet. Add unit tests asserting the derived indexes exactly equal today's hand-written tables — this _proves_ zero behavior change.
- **Phase 1 — Flip the sources.** `BLOCK_DEFS`/`BLOCK_TYPES` (store.js), `DNA` (blockDNA.js), `CATS` (constants.js), `ALIASES` (blockSearch.js) become thin re-exports of `registry.to*()`. Their public exports stay identical, so `predict.js`, `pageGrammar.js`, `blockSearch.js`, palettes — none change. **P0-1 is dead at this point: one source of truth, adding a block is now one folder.**
- **Phase 2 — Registry-driven rendering.** Replace the `BlockContent` switch with `registry.get(type).render`. Each case's JSX moves into its block module. Behavior-preserving; guarded by manual QA + snapshots.
- **Phase 3 — Schema-driven Inspector.** Replace the 326-line cascade with a `FieldRenderer` that walks `descriptor.fields`. Fixes P1-4. Biggest UI change; gets the most test attention.

Phases 2–3 are where regressions could hide, so they land separately from 0–1 with their own verification.

## Step 5 — Tradeoffs & future considerations (stated honestly)

- **More files** (~20 block folders). Net LOC ≈ flat: logic moves _out_ of the two God-files (`BlockContent`, `Inspector`) into co-located modules. Worth it for isolation and plugin-readiness.
- **Schema can't express every control.** The freeform-canvas note, columns-count, countdown date are bespoke. Solution: `fields` supports `{ control: 'custom', render: Cmp }` as an escape hatch — used sparingly, not forced. Don't over-abstract.
- **Renderer ↔ editor coupling.** Block renderers currently read `EdCtx` (`preview`, `onProp`). Moving them to `src/blocks/` keeps that import, coupling `blocks/` → `editor/`. Acceptable for now. **Future:** split a pure presentational renderer (for published/read-only output) from the editor-aware wrapper — relevant when you build the published-site export, not before. Flagged, not done.
- **Enables downstream goals:** public `register()` → plugin architecture; declarative `fields`+`defaults` → safe AI block generation and prop validation (a stepping stone to the TS types in Rec E); registry is page-agnostic, so no conflict with multi-page.

## Verification strategy

Phase 0/1: assert `registry.toBlockDefs()` deep-equals current `BLOCK_DEFS`, `toDNA()` equals `DNA`, etc. — a mechanical proof of no behavior change. Phase 2/3: snapshot the rendered canvas + inspector for a representative site before/after, plus manual click-through of each block's editing. Baseline `ac8553d` is the rollback point.
