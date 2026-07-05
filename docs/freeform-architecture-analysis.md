# Architecture Analysis: True Freeform Drag & Drop

_Analysis only — no implementation, per request. Grounded in the current codebase._

## TL;DR verdict

Your tree data model is a **good foundation** and does not need replacing. What's missing is a **layout layer**: today, position is implicit document flow, containment is hardcoded to two block types, and drag-drop is index-based reordering. True freeform needs (a) an optional, constraint-based, breakpoint-aware **layout engine** layered onto the existing tree, (b) generalized containment driven by the registry, and (c) a decomposed **interaction layer** for pointer-drag/resize/snap. Crucially: adopt **constraints (Framer/Wix Studio), not absolute pixels** — absolute pixels are precisely what broke classic Wix on mobile. And this must **not** be built on today's `EditorInner` God-component; decomposition is a prerequisite, not a nice-to-have.

---

## 1. Does the current architecture support true freeform?

**Partially — the tree yes, the layout no.** A block is `{ id, type, props, children? }` and the tree helpers (`tree.js`) are pure and general. But three things block freeform:

- **No positional data.** Blocks carry no x/y/z/size; they render in normal document flow (`BlockContent` emits `b-hero`, `b-text`… stacked vertically). Position is implicit.
- **Containment is hardcoded.** Only `section` and `columns/column` nest, via `if (type === 'section')` in `makeBlock` and special cases in the `BlockContent` switch. There is no general "this block can contain these children" concept.
- **DnD is index-based.** `dragRef` + `dropTarget = { parentId, index }`; `overBlock` picks an insert index from mouse-Y vs the block midpoint. It reorders/nests into flow — it cannot place a block at an arbitrary point.

You already have exactly one freeform surface: the **`canvas` block** (`src/components/Freeform.jsx`) with absolutely-positioned `props.elements` (x/y/w, drag, corner-resize). But those "elements" are **not blocks** — it's a bespoke parallel model. That's the anti-pattern to generalize away from, not to copy.

## 2. Required data-model changes

Add an **optional, additive `layout`** concept (no `layout` ⇒ today's flow, so existing sites are untouched — same migration discipline as the registry work):

- **Containers** gain a mode: `layout.mode ∈ { flow, stack, grid, free }` (default `flow`).
- **Children** gain a `layout` descriptor interpreted by the parent's mode:
  - flow/stack → order (array index) + align/grow;
  - grid → `col/row/span`;
  - free → **constraints** `{ left?, right?, top?, bottom?, width, height, pins }` + `z`.
- **Responsive** → `layout` is breakpoint-keyed and **sparse**: `{ base: {…}, md: {…}, sm: {…} }`, overriding only what changes.
- **Registry** gains containment capability (`container: true`, `canContain: [...types]`, `defaultChildLayout`) so "what can nest where" lives in one place.

Children always live in `children[]` — one tree, one source of truth. Positioning is *interpretation* of that tree, never a second structure (this is where the current `canvas.elements` design went wrong).

## 3. How parent-child relationships should work

Generalize containment through the **registry**, replacing the hardcoded `type === 'section'` checks with capability queries (`registry.get(type).canContain`). Every block becomes a potential container if it declares so. The parent's `layout.mode` decides how children are arranged and what their `layout` data means — the same child block behaves as a flow item in a `flow` parent and a free-positioned element in a `free` parent, with no change to the block itself. This composition is what lets nesting go arbitrarily deep without special cases.

## 4. How positioning should be stored

**Constraint-based, relative to the immediate parent — not absolute pixels.** For free-mode children store edges as **percentages + pin flags** (which edges are anchored), size as %/px/auto, and explicit `z`. This is the Framer "constraints" / Wix Studio "docking" model.

Why not absolute px: a fixed-canvas pixel layout looks perfect at design width and shatters at every other viewport — this is the well-documented failure of classic Wix's absolute editor, which forced years of retrofitting (anchors, then a grid/breakpoint rebuild in Wix Studio). Constraints relative to the parent reflow correctly by construction and compose under nesting. Store per-breakpoint overrides sparsely; normalize `z` to integers on write.

## 5. How resizing and dragging should be implemented

A dedicated **interaction layer**, never logic inside block renderers:

- **Two input mechanisms.** Keep HTML5-DnD (or pointer) for *tree* operations (insert/reparent); use **pointer events** for *intra-parent* free move/resize (pixel precision HTML5 DnD can't give).
- **Hooks, single-responsibility:** `useDragMove`, `useResize`, `useSnapping`, `useMarquee`, composed — not inlined in `EditorInner`.
- **A `SelectionOverlay`** (portal, above the canvas) draws handles and guides, decoupled from renderers so moving a handle doesn't re-render content.
- **Ephemeral-then-commit:** during a drag, update a transient transform on the dragged node only (CSS `transform`, compositor-friendly); **commit to the tree once on drop** (debounced). Never rewrite the tree per mousemove.
- **Snapping/guides:** a pure geometry service computes sibling/parent edges + centers at drag-start (cached), the overlay renders lines, snap thresholds apply. Testable in isolation.

Your existing `Freeform.jsx` already implements a primitive of all this — harvest its interaction code into these hooks, then retire its element model.

## 6. How this affects responsive layouts

This is the hard part and where naive freeform dies. Answer: **breakpoint-scoped overrides + constraints**. `base` cascades; each breakpoint overrides only changed layout props. Free children reflow via pins/%. Provide a per-container **"collapse to flow on narrow"** escape (Wix/EditorX docking behavior) so mobile doesn't become a pile of overlaps. Wire breakpoints to the `device` state that already exists in `EditorInner` (desktop/tablet/mobile). Start with a small fixed breakpoint set; expand later. Guardrails here are product design as much as architecture — free positioning is the easiest way for users to build broken mobile, so constraint defaults and flow-fallback matter.

## 7. Impact on the predictive insertion engine

The engine survives but must gain a **parent-context mode**. Today `predict`/`pageGrammar` reason about the *top-level flow sequence* (narrative segments, seams). Under freeform:

- Flow containers keep sequence/grammar prediction and seams unchanged.
- **Free containers have no seams** — "what comes next" is meaningless. Prediction shifts to "**what element belongs in this container**," scored by parent type + role, using registry `canContain` and Block DNA. `predictAt` (index seams) simply doesn't apply inside free parents.
- Block DNA needs containment/role metadata (which parents a block fits, default layout on drop). This extends the existing DNA cleanly.

Keep the `predict()` interface; broaden its inputs from "sequence" to "(parent context + sequence)." Consistent with the tiering already documented in `predict.js`.

## 8. How to avoid a God Component

Freeform is a God-component magnet (drag + resize + snap + z + selection + keyboard + history all want to live in one place — and `EditorInner` is already that place). Prevent it structurally:

- **Pure layout engine, React-free** (`src/layout/`): `computeStyle(block, parentMode, breakpoint) → CSSProps`, constraint solver, snap geometry. Testable like `tree`/`predict`.
- **Interaction as composed hooks**, each one responsibility.
- **Selection/overlay subsystem** separate from renderers (portal).
- **Dumb renderers**: a block view consumes a computed `style`; it knows nothing about dragging (builds directly on the Phase 2 view registry).
- **Reified editor store/reducer** holding selection, drag session, and history — this is where Recommendations B (undo) and C (decompose `EditorInner`) finally get realized. Freeform is the forcing function to do them properly.

## 9. Performance implications

Freeform makes the render-perf debt I flagged earlier (P1-5) **load-bearing**:

- **No per-frame tree rewrites.** `updateProps` rebuilds the whole tree; at 60fps that's fatal. Live drag = ephemeral CSS `transform` on one node; commit once on drop.
- **Memoize nodes + split context** (dispatch vs state) so editing one element doesn't re-render the canvas — mandatory before freeform, not after.
- **Overlay on its own layer** (transform/GPU) so handle movement doesn't touch content.
- **Cache sibling rects at drag-start** for snapping; don't recompute per frame.
- Use `transform` (compositor) for motion, not `top/left` (reflow). Virtualization matters less for one viewport but keep render cost proportional to visible nodes in deep trees.

Net: pay down render perf **before** building freeform.

## 10. New layout engine, or modify the existing one?

**New engine module — but integrated into the one existing tree, not a fork.** Do not create a parallel tree or a separate editor (the `canvas.elements` split is the mistake to retire, not replicate). Introduce layout as a well-bounded, pure subsystem the existing tree and renderers consume: today's flow rendering becomes simply the `flow` **mode** of the new engine, so "no layout data ⇒ flow" is 100% backward-compatible. Free mode is opt-in per container. The `canvas` block becomes the first thing reimplemented on the general engine, deleting its bespoke element model and removing that duplication.

---

## Recommended architecture

A **container-scoped, constraint-based, breakpoint-aware layout engine** on the existing block tree, edited through a decomposed interaction layer:

- **Data:** optional `layout` — container `mode` + child `constraints`, sparse per-breakpoint overrides; registry declares `container`/`canContain`/`defaultChildLayout`.
- **Engine:** pure `src/layout/` (`computeStyle`, constraint solver, snap geometry) — React-free, unit-tested like `predict`/`tree`.
- **Rendering:** Phase-2 block views consume computed styles; a separate `SelectionOverlay` draws handles/guides via portal.
- **Editing:** pointer-based hooks (move/resize/snap/marquee/z) + an editor store/reducer owning selection, drag session, and history (realizes Rec B + C). `EditorInner` shrinks to composition.
- **Positioning:** constraints relative to the immediate parent (%/pins), explicit `z`, per-breakpoint overrides — **never raw absolute px**.
- **Prediction:** `predict()` gains a parent-context mode; registry `canContain` feeds "fits-in-parent" scoring; seams only in flow containers.

## Phased rollout (each shippable, verifiable)

1. **Prereqs (pay first):** render-perf (memoize nodes, split context) + decompose `EditorInner` into an editor store/reducer with history (Rec B/C). Freeform on the current God-component would be a disaster.
2. **Generalize containment** via the registry (`canContain`), replacing hardcoded `section`/`columns` checks. No visual change.
3. **Layout engine with `flow` as default mode** — pure module, existing sites render identically (back-compat proof, snapshot-tested).
4. **`free` mode + interaction layer** (pointer drag/resize/snap, overlay) within a single breakpoint.
5. **Reimplement `canvas` on the engine**, delete the bespoke element model.
6. **Breakpoints/responsive overrides** wired to the existing `device` toggle; flow-fallback guardrail.
7. **Prediction parent-context mode.**

## What I'd push back on

- **Scope.** This is, literally, the core of Framer/Webflow/Wix Studio — multi-year efforts. Don't frame it as one feature. Build the engine abstraction first and deliver a *subset*: generalized containment + constraint-based free mode at one breakpoint + basic drag/resize/snap. Defer full multi-breakpoint constraint solving, advanced z/guides UX, and grid mode.
- **Absolute pixels.** Reject them explicitly. Every serious tool converged on constraints; the pixel path feels faster for a week and costs you the mobile story forever.
- **Sequencing.** The prereqs (perf + `EditorInner` decomposition + undo) are non-negotiable before freeform. If we build freeform on the current God-component, we bake in debt that freeform will multiply.
- **Guardrails as product.** Freeform without constraint defaults and flow-fallback produces beautiful desktop / broken mobile. That's a design requirement, not an afterthought.
