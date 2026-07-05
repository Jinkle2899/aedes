You are a senior test/QA engineer. I need you to design and write a complete test suite for my web app, "Aedes." I will paste the source files after this message (or attach the repo). Base your tests on the actual code I provide — if a contract below doesn't match the code, trust the code and flag the discrepancy.

## What Aedes is
A no-code website builder (think Wix Studio / Framer / Webflow). Users drag blocks onto a canvas, edit them in an Inspector, and get a live site. It has a predictive "next block" engine and an AI-ish layout generator.

## Stack (important constraints)
- Vite 5, React 18, react-router-dom 6.
- **Plain JavaScript, ESM modules. NOT TypeScript.** Do not introduce TS.
- No test framework is set up yet. Recommend and configure **Vitest** (unit/integration) + **@testing-library/react** (components) + **Playwright** (e2e). Give me the exact devDependencies, config files, and `package.json` script changes.
- Persistence is localStorage by default (Supabase optional). Tests must not require a network or a Supabase key.
- Note: block ids are generated with `Math.random()`, so many outputs are non-deterministic in id only — normalize/ignore ids when asserting structure.

## Architecture (so you understand the module contracts)
The app is built on a normalized document + a command bus; pure engines read the document; React renders it.

Pure, headless modules (prioritize unit tests here — they're deterministic and high-value):
- `src/lib/tree.js` — pure nested-tree ops: `findById, findParent, findPath, insertAt, removeById, updateProps, regenIds`.
- `src/document/model.js` + `src/document/projection.js` — the normalized document (`{byId, parentOf, rootIds, meta}`) and projection. **Invariant: `toNested(fromNested(blocks)) deep-equals blocks`.**
- `src/commands/commands.js` + `src/commands/bus.js` — every mutation is an invertible command (`InsertNode, RemoveNode, MoveNode, UpdateProps, SetColumns, InsertMany, PatchMeta`). **Invariants:** (a) for every command, `applyCommand` then applying its returned inverse restores the document exactly; (b) applying commands then projecting must equal the result of the equivalent old `tree.js` operations; (c) the bus coalesces rapid same-field `UpdateProps` into ONE undo entry; (d) `undo()`/`redo()` round-trip.
- `src/blocks/` — a block registry: one descriptor module per block type in `src/blocks/types/*.js`; `src/blocks/registry.js` derives the legacy tables. **Invariant:** `registry.toBlockDefs()/toDNA()/toCategories()/toAliases()` reproduce the expected per-block metadata; every non-internal block has a renderer in `src/blocks/views/` and a `fields` schema.
- `src/lib/predict.js` + `pageGrammar.js` + `blockDNA.js` + `blockSearch.js` — deterministic prediction & search. Same inputs → same ranked outputs.
- `src/lib/generate.js` — Tier-0 deterministic layout generator + `validateRecipe`. **Invariant:** `validateRecipe` must repair untrusted input — drop unknown/internal block types, dedupe singletons (navbar/hero/footer), strip prop keys not in the block's schema, reject invalid segment values, clamp out-of-range numbers — and never produce a structurally-broken tree. Page generation must start with navbar and end with footer.
- `src/layout/` — `computeStyle(node, ctx)` layout engine; the `flow` strategy must produce output identical to `src/editor/style.js` (`blockStyleClass`/`blockStyleInline`).

React editor (test with Testing Library / Playwright — these are interaction paths with no coverage yet, HIGHEST risk):
- `src/pages/Editor.jsx` — orchestration (composition root).
- `src/editor/store/editorStore.js` (ephemeral state: selection, seamOpen, preview, dropTarget, meta) and `useDoc.js` (per-node subscriptions).
- `src/editor/hooks/` — `useDragDrop, useKeyboardShortcuts, usePrediction, useEditorEffects`.
- `src/editor/components/` — `BlockNode` (renders a node, selection wrapper), `Seam`, `CommandPalette` (⌘K), `BrowseDrawer` (⌘L), `ComposePalette` (⌘G), `HorizonGhost`, `Rail`, `TopBar`.
- `src/editor/inspector/` — schema-driven Inspector + `FieldRenderer` + `InspectorPanel`.

## What I want you to produce
1. **Test tooling setup**: exact devDependencies, `vitest.config.js`, jsdom setup, Playwright config, and the `package.json` scripts (`test`, `test:ui`, `e2e`).
2. **Unit tests (Vitest)** for every pure module above, explicitly asserting the invariants I listed. Use a small fixture site. Normalize ids where needed.
3. **Component/integration tests (@testing-library/react)** for the editor interactions: selecting a block, editing an Inspector field updates the canvas, columns count 2↔3, undo/redo (including coalesced typing), delete/duplicate/nudge, and that selecting one block does not re-render unrelated blocks (render-count assertion).
4. **E2E tests (Playwright)** for full user flows: load editor → drag a block from the rail onto the canvas → reorder by dragging the handle → nest into a section → edit text → ⌘Z/⌘⇧Z → open ⌘K and insert → Compose (⌘G) a section → toggle preview → reload and confirm persistence.
5. **A manual QA checklist** (markdown) mapped to features, for the things automation can't easily cover (drag pixel behavior, drop-line indicators, ghost keyboard Tab/arrows/Esc, animations in preview).
6. **A prioritized run order** — tell me which tests to write first by risk/value. I believe undo/redo, drag-and-drop, and the keyboard/prediction hooks are the riskiest (they have zero coverage today); confirm or correct that.

Ask me for any specific file's contents you need before writing tests against it. Output real, runnable test code, not pseudocode. Keep everything plain-JS ESM.
