# Increment 2 — Render from the Document + Decompose EditorInner

_Status: **proposed — awaiting sign-off**. No implementation until approved._
_Builds on Increment 1 (command bus + normalized doc). Delivers the P1-5 performance fix and Recommendation C (decompose the God-component)._

## Goal

Three coupled changes, all enabled by Increment 1:

1. **Render from the normalized document directly** — each node view reads its own node by id from the doc; remove the nested projection from the *render path*.
2. **Granular per-node subscriptions** — editing one node re-renders that node only, not the canvas. This is the fix for the whole-canvas-re-render debt (P1-5).
3. **Decompose `EditorInner`** into an editor store + hooks + stable actions, shrinking it to composition (Recommendation C).

Non-goals: no layout engine, no freeform, no visual/behavioral change. Same rigor as before — behavior identical, verified.

## Root cause being fixed

Today every node reads one big `EdCtx` value that is a **new object every render**, and selection/hover live in `EditorInner` state. So any change — selecting a block, dragging, editing one field — re-renders `EditorInner`, produces a new context value, and re-renders **every** node. At 10 blocks it's invisible; at hundreds (and mandatory before freeform) it's fatal. Increment 1 already made the data granular (structural sharing means only the edited node gets a new identity); Increment 2 makes the *rendering* exploit that.

## The subscription model

Use React 18's `useSyncExternalStore` — no external library. The command bus is already an external store (`subscribe`, `getDoc`).

```
useNode(id)      = useSyncExternalStore(bus.subscribe, () => bus.getDoc().byId[id])
useChildIds(id)  = useSyncExternalStore(bus.subscribe, () => bus.getDoc().byId[id]?.childIds)
useRootIds()     = useSyncExternalStore(bus.subscribe, () => bus.getDoc().rootIds)
```

`useSyncExternalStore` bails out when the selected snapshot is `Object.is`-equal to the previous one. Because reducers use structural sharing:

- **Prop edit on node A** → only `byId[A]` gets a new identity. `useNode(A)` re-renders A; every sibling and ancestor keeps identity → **no other node re-renders.**
- **Insert/remove/move under parent P** → `byId[P].childIds` changes → `useChildIds(P)` re-renders P's child list; untouched subtrees keep identity.

This is the whole performance thesis, and it's a *provable data property* (see Verification), not a hope.

## Store split (the core structural change)

Three concerns, three stores/contexts — never one blob:

- **Document store** = the command bus (Increment 1). Persistent, undoable. Read via `useNode`/`useChildIds`; mutate via commands.
- **Editor store** (new, ephemeral) = selection, hover, dropTarget, device, preview, palette, toast. A tiny observable with `getState/setState/subscribe` + `useEditorSelector(fn)`. Per-node selection subscription: `useIsSelected(id)` returns a boolean, so only the node whose selection flips re-renders.
- **Actions context** (stable) = the callback bag (`onProp, doInsert, doMove, nudge, duplicate, remove, setColumns, drag handlers, seam/predict, compose`). Built **once** (identity stable across renders, using refs for latest state) so memoized node views don't re-render just because a parent re-rendered.

The rule from the V2 doc, realized: **changing state and stable dispatch are separate; views subscribe to the slice they need.**

## Node view redesign

```
Children({ parentId })        // reads useChildIds(parentId) (or useRootIds), maps to <NodeView/> + seams
  NodeView = memo(({ id }) => {
    const node   = useNode(id)
    const sel    = useIsSelected(id)
    const drop   = useDropIndicator(parentId, index)   // per-slot, granular
    const actions = useActions()                        // stable
    ... selection wrapper + <BlockContent node={node} />
  })
```

`BlockContent` receives `node` (not a context blob) and dispatches through `useActions`. The Phase-2 view registry is unchanged; only `useBlock` is rewired: `preview` comes from `useEditorSelector(s => s.preview)`, `onProp` from stable actions. Views stay dumb.

## EditorInner decomposition (Rec C)

`EditorInner` stops being the God-component and becomes composition:

```
editor/
  store/editorStore.js         // ephemeral state + selectors, useEditorSelector, useIsSelected
  store/useDoc.js              // useNode / useChildIds / useRootIds over the bus
  actions.js                   // buildActions(bus, editorStore, meta) -> stable action bag
  hooks/useDragDrop.js         // dragRef + over/drop handlers → dispatch move/insert
  hooks/useKeyboardShortcuts.js// ⌘K/L/G/Z, ghost keys, "/"
  hooks/usePrediction.js       // predict/predictAt/gapSeams memo + ghost/seam state
  hooks/useFontLoader.js, usePreviewAnimations.js
EditorInner: create bus + editor store, wire hooks, render <TopBar/><Rail/><Canvas/><Inspector/> + palettes.
```

Each hook is single-responsibility and unit-testable. `EditorInner` shrinks from ~430 lines to a thin composition root. This is the decomposition that must precede freeform (a God-component + freeform interactions = disaster).

## What happens to the projection

- **Removed from the render path** — nothing renders from `toNested` anymore.
- **Retained at the persistence/export boundary only** — `db.js` still stores nested site JSON, so the bus persists via `toSite(doc)`. A later increment updates persistence to store normalized docs (with a schema version) and drops nested entirely. So "delete the projection" = delete it from rendering now; retire it at the storage layer later, deliberately.

## Verification plan

1. **Subscription-granularity proof (data level):** after `UpdateProps(A)`, assert `byId[A]` identity changed AND `byId[sibling]`, `byId[parent]` identities are unchanged (`Object.is`). After `InsertNode` under P, assert `byId[P].childIds` changed but untouched subtree node identities are stable. This *proves* the re-render granularity that drives the perf win — runnable in Node, no browser.
2. **Render-equivalence:** the DOM output is unchanged. Reuse the Phase-2 approach — render a representative site through the new `Children`/`NodeView` and diff HTML against the current renderer (react-dom/server), for a normal page and a nested (section/columns) page.
3. **Behavioral equivalence** (Increment 1 tests still pass — commands untouched).
4. **Bundle check** (esbuild-wasm) of the decomposed editor.
5. **Data snapshot** unchanged.

Runtime feel (does drag/selection still work, is editing snappier) is yours to confirm in `npm run dev` — the tests prove correctness and the data-level granularity; only the browser confirms the frame-rate payoff.

## Risks & mitigation

- **Hot-path refactor with no runtime measurement here.** Mitigation: land in three sub-steps, each independently shippable and verifiable — (2a) editor store + stable actions + memoized nodes *still reading the projection* (kills the selection-re-renders-all problem with minimal change); (2b) switch `NodeView` to `useNode` from the doc, delete render-path projection; (2c) extract the hooks and slim `EditorInner`. If you prefer, we stop after 2a and measure.
- **`useSyncExternalStore` snapshot stability** — selectors must return referentially-stable values (raw node objects/arrays, not freshly-mapped ones) or it loops. The design returns raw slices; verification includes a "no infinite render" check via a render-count harness.
- **Preview/device toggles legitimately re-render broadly** — acceptable (rare, and they change render mode globally).

## What I'd confirm before coding

- **One increment or staged (2a → 2b → 2c)?** I recommend **staged**, landing 2a first so we get the biggest perf win at the lowest risk and can stop to measure.
- **External store: hand-rolled vs a tiny library** (Zustand/valtio). I recommend **hand-rolled `useSyncExternalStore`** — zero dependencies, ~30 lines, and we already have the bus as a store. Add a library only if the store grows complex.
