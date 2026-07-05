# Increment 1 — Command Bus + Normalized Document (behind today's UI)

_Status: **proposed — awaiting sign-off**. No implementation until approved._
_First step of the V2 migration (see editor-v2-architecture.md §15). Payoff shipped this increment: **undo/redo**._

## Goal & guardrails

Introduce the two foundations everything else in V2 depends on — a **normalized document** and a **typed, invertible command bus** — *without changing the UI or the rendered output*. The existing editor keeps consuming a nested `blocks[]` tree; that tree becomes a **projection** derived from the normalized document. Every mutation becomes a command; undo/redo falls out for free.

Non-goals this increment: no layout engine, no freeform, no rendering changes, no normalized rendering yet. We are only swapping the *mutation path* under the hood and proving it's behavior-identical.

## Why this first (not freeform, not AI)

Undo/redo, multiplayer, AI editing, and macros are all command streams. None can be built cleanly until commands exist. This increment is the cheapest one that unlocks all of them, and it ships a real user feature (undo/redo) as proof the layer is real. It also has the lowest risk because the projection guarantees the render output is unchanged.

## Current state being replaced

All edits in `EditorInner` funnel through `setBlocks(fn)` → `persist`, operating on the nested `site.blocks` via pure `tree.js` functions:

`doInsert, doMove, nudge, duplicate, remove, setColumnsCount, onProp, patchSite(meta), compose(bulk insert)`.

These are the exact operations we re-express as commands.

## The normalized document

```
Doc = {
  byId:     { [id]: { id, type, props, childIds?: string[] } },
  parentOf: { [id]: string | null },   // O(1) parent lookup
  rootIds:  string[],                  // top-level block order
  meta:     { id, name, font, kind, updatedAt },
}
```

- Nodes reference children by id (`childIds`), not by nesting — O(1) access, granular subscription later, CRDT-ready.
- `parentOf` and `rootIds` are maintained by the reducers (never derived per read).

**Projection (the compatibility bridge):**
- `toNested(doc): blocks[]` — rebuilds the nested `{id,type,props,children?}` tree the current renderer + `db.js` persistence expect. The UI is untouched because it still receives this shape.
- `fromNested(blocks, meta): Doc` — seeds the document from a loaded site.

Round-trip `fromNested → toNested` must be identity (a verification target).

## Commands

Each command is a plain, serializable object with a pure reducer that returns the next doc **and its inverse** (captured at apply time so undo is exact):

```
apply(doc, command) -> { doc, inverse }
```

| Command | Replaces | Inverse |
|---|---|---|
| `InsertNode {node, parentId, index}` | doInsert | `RemoveNode {id}` |
| `RemoveNode {id}` | remove | `InsertNode` (captured subtree + location) |
| `MoveNode {id, toParentId, toIndex}` | doMove, nudge | `MoveNode` (to original location) |
| `UpdateProps {id, patch}` | onProp | `UpdateProps` (previous values) |
| `SetColumns {id, count}` | setColumnsCount | `ReplaceSubtree` (snapshot of prior columns node) |
| `DuplicateNode {id}` | duplicate | `RemoveNode {newId}` |
| `InsertMany {nodes, parentId, index}` | compose | `RemoveMany {ids}` |
| `PatchMeta {patch}` | patchSite | `PatchMeta` (previous meta) |

Most inverses are precise and cheap. The one destructive reshape (`SetColumns`, which redistributes children) uses a **subtree-snapshot inverse** (`ReplaceSubtree`) — simple and bulletproof. Serializable commands mean AI and multiplayer later reuse this exact catalog.

## Command bus + history

```
createEditor(initialDoc, { persist }) -> {
  dispatch(command),   // validate → apply → push {command, inverse} to undo, clear redo → notify → persist(debounced)
  undo(), redo(),
  canUndo, canRedo,
  getDoc(), subscribe(listener),
}
```

- **History stores inverse commands (diffs), not document snapshots** — bounded memory, and per-user when multiplayer arrives.
- `undo()` applies the inverse and moves the entry to the redo stack; `redo()` re-applies.
- **Transactions:** `dispatch` accepts a command *or* an array (compose/bulk) recorded as one undo entry.
- Persistence unchanged: the bus calls `persist(toNested(doc), meta)` debounced — same `db.js` path as today.

## Editor adapter (minimal, additive to EditorInner)

`EditorInner` holds an editor instance (`useRef`) and a small `version` state bumped on change to trigger re-render. `site.blocks` becomes `useMemo(() => toNested(editor.getDoc()), [version])`. The existing handlers change from `setBlocks(fn)` to `dispatch(command)`:

```
doInsert(parentId,i,block) → editor.dispatch(InsertNode{node:block, parentId, index:i})
onProp(id,patch)           → editor.dispatch(UpdateProps{id, patch})
remove(id)                 → editor.dispatch(RemoveNode{id})
… etc.
```

Everything downstream (renderers, Inspector, prediction, Compose) is unchanged — they still read `site.blocks`. Undo/redo wire to ⌘Z / ⌘⇧Z in the existing keyboard effect. This is the only file with meaningful edits, and the change is mechanical.

> **Debt note (honest):** this temporarily keeps *two* representations (normalized doc + nested projection). That's intentional for a strangler migration — it's what makes the step zero-risk. A later increment renders from the normalized doc directly and deletes the projection. I'm flagging it so it's a conscious, time-boxed trade, not hidden debt.

## Verification plan (same rigor as Phases 0–3)

1. **Projection identity:** `toNested(fromNested(blocks)) deep-equals blocks` for the starter site + template recipes.
2. **Behavioral equivalence:** for a battery of randomized operation sequences (insert/move/nudge/duplicate/remove/setColumns/updateProps/compose), apply via the **old** `tree.js` path and the **new** command path, then assert the resulting nested trees are **deep-equal**. This proves the command layer reproduces today's semantics exactly. Pure, Node-testable — no app run needed.
3. **Undo/redo invariants:** for every command type, `dispatch(c)` then `undo()` returns a doc whose projection deep-equals the pre-state; `redo()` deep-equals the post-state. Nested transactions undo atomically.
4. **Bundle check** (esbuild-wasm) that the rewired `EditorInner` compiles.
5. **Data snapshot** unchanged (registry/predict untouched).

Runtime click-through (does ⌘Z feel right in the app) is left to you — my checks prove the state transitions are correct.

## Deliverables & folder placement

```
src/document/      model.js (Doc, selectors), projection.js (to/fromNested)
src/commands/      commands.js (catalog + reducers + inverses), bus.js (createEditor + history)
src/pages/Editor.jsx  (adapter: dispatch instead of setBlocks; ⌘Z/⌘⇧Z)
```

Aligns with the V2 folder structure; these directories are where the document and command subsystems live permanently.

## Rollout after this increment

2. Render from the normalized doc directly (granular subscription); delete the projection.
3. Decompose `EditorInner` into the editor store/runtime (the state now lives in the bus, so this is mostly moving code).
4. Layout engine with `flow` default → then `free` mode → freeform.
5. Collab/AI reuse the command catalog unchanged.

## What I'd confirm before coding

- **Scope of undo granularity:** per-command (typing each prop patch = one undo) vs coalesced (debounce rapid `UpdateProps` on the same node into one entry). I recommend **coalescing text edits** (Framer/Figma behavior) — one undo per "edit burst," not per keystroke.
- **Whether to ship undo/redo UI** (toolbar buttons) this increment or just the shortcuts. Recommend shortcuts now, buttons when the TopBar is next touched.
```
