# Increment 5 — Freeform Interaction Layer

_Status: **proposed — awaiting sign-off**. No implementation until approved._
_Builds on Increment 4 (free strategy + constraints + `box`). Makes free layouts **editable**. This is the first increment whose core is inherently interactive — the pointer-drag parts require your in-browser verification; I'll isolate the pure geometry so as much as possible stays unit-testable._

## Goal

Let users (a) turn a container into `free` mode and (b) position/resize its children — with every change committed as a **command** (so undo/redo, persistence, and future multiplayer all work for free). Split into two sub-increments so the verifiable part lands first:

- **5a — SetLayout command + Inspector controls (fully verifiable now).** Make free mode *reachable and editable* through the schema-driven Inspector: a flow↔free toggle + height on containers, and position/size/z number fields on free children. No pointer dragging yet — but free layouts become creatable and editable, and I can verify it with the same render-diff/command tests as everything so far.
- **5b — Direct manipulation (needs your runtime verification).** Pointer drag to move, handles to resize, snapping + alignment guides, all via a selection overlay. The math is pure and unit-tested; the pointer wiring is what only a browser confirms.

## 5a — SetLayout command + Inspector

### Command

```
SetLayout { id, layout }   // sets node.layout (merged); inverse restores the previous layout
```
One command handles both "make this container free" (`layout: { mode:'free', height }`) and "position this child" (`layout: { free: { left, top, width, height, z } }`). Inverse captures the prior `node.layout`. `layout` already round-trips through projection/persistence (Increment 4), so this is a small, pure reducer addition + its equivalence/undo tests.

### Inspector controls (schema-driven, via FieldRenderer)

- **On a container:** a `layout-mode` control (segment: Flow / Free) → dispatches `SetLayout` to set/clear `mode:'free'`; when free, a `height` number field.
- **On a free child** (a node whose parent is `free`): position/size number fields (Left %, Top %, Width %, Height %, Z) → dispatch `SetLayout` merging `layout.free`.

These reuse the Phase-3 field system (new control types: `layoutMode`, `freeConstraint`) so they're declarative and testable. This alone gives a numeric, precise way to build free layouts (how early design tools worked) — usable and verifiable without any drag code.

## 5b — Direct manipulation

### Pure geometry (unit-tested)

`src/layout/geometry.js`:
- `pxToPct(deltaPx, containerPx)` — pointer delta → percentage delta relative to the container.
- `resizeBox(box, handle, dx, dy, min)` — new box from a resize handle + pointer delta, respecting min size and pins.
- `computeSnap(movingBox, siblingBoxes, containerBox, threshold)` — returns `{ box, guides }`: snapped position + the alignment guide lines to draw (sibling edges/centers + container edges/center + equal-spacing). Pure, exhaustively unit-testable.

### Interaction model (ephemeral → commit)

- On pointer-down on a selected free child (or a resize handle), start a **drag session** in the editor store holding a transient `box` (percent). During pointer-move, update that transient box (60fps, **no commands**); the free child reads the transient box and overrides its computed position; the overlay redraws handles + guides.
- On pointer-up, dispatch **one** `SetLayout` command with the final constraints → one undo entry. This is the "ephemeral transform, commit once" rule from the V2 doc.

### Selection overlay

`src/editor/overlays/SelectionOverlay.jsx` — a portal layer above the canvas that, for the selected free child, renders a selection rectangle + 8 resize handles + live snap guides, positioned from the engine's `box`. Decoupled from the node renderers (moving a handle never re-renders content). Flow-mode selection keeps today's inline toolbar; the overlay is free-mode only for now.

### Scope guardrails for v1

Include: single-selection **move + resize** in a free container, snapping to siblings/container/center. Defer: rotation, multi-selection, marquee, drag *between* containers in free mode, grid/flex modes — each a later increment. Keeping v1 to move+resize keeps the interaction surface small enough to verify by hand.

## Verification

- **5a:** `SetLayout` apply/inverse restores exactly; undo/redo round-trip; Inspector render-diff for a free container/child (controls appear, dispatch the right command); bundle; snapshot. All static, same rigor as prior increments.
- **5b pure math:** unit tests for `pxToPct`, `resizeBox`, `computeSnap` (snap thresholds, guide generation, min-size clamping, pin preservation) — deterministic, fully covered.
- **5b interaction:** bundle-check only from me. **You verify in-browser:** drag a free child moves it; handles resize; guides appear and snap; release creates exactly one undo step; ⌘Z reverts the whole drag. I'll provide a precise click-through checklist.

## Risks & what I'd confirm

- **5a is low-risk and verifiable. 5b is the first thing I genuinely cannot fully verify** — pointer events, hit-testing, and drag feel are browser-only. Mitigation: isolate all math into pure modules (tested), keep the React wiring thin, and hand you a tight manual checklist.
- **Confirm staging:** I recommend **5a first** (land + verify the command and Inspector controls), then 5b. You could even stop after 5a if numeric positioning is enough for now.
- **Confirm v1 manipulation scope:** move + resize + snapping only (no rotate/multi-select/marquee yet)?
- **Overlay vs inline for free mode:** I recommend a portal overlay for free children (proper handles) while flow blocks keep the current inline toolbar. Confirm you're fine with that split.
