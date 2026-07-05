# Increment 4 — Generalized Containment + `free` Layout Strategy

_Status: **proposed — awaiting sign-off**. No implementation until approved._
_Builds on Increment 3 (layout engine). Structural foundation for freeform; the pointer-drag **interaction layer is a separate later increment** (it's the runtime-heavy part)._

## Goal

Two coupled, verifiable pieces:

1. **Generalized containment** — replace the hardcoded `type === 'section' | 'columns'` nesting rules with registry capabilities (`container`, `canContain`), so any block can declare it holds children.
2. **`free` layout strategy** — a container can declare `layout.mode = 'free'`; its children carry **constraint-based positions** (relative to the parent, not absolute pixels), and `computeStyle` renders them absolutely-positioned. This is the data model + rendering only — no drag/resize UI yet.

After this, a free layout can be *represented and rendered* correctly; Increment 5 makes it *editable* (pointer drag/resize/snap + selection overlay). Existing sites are untouched (default mode stays `flow`).

## Part A — Generalized containment

Add to the block descriptors (pure data):
- `container: true` on `section`, `columns`, `column` (the blocks that nest today).
- `canContain`: optional allow-list of child types. `section`/`column` → any non-internal block; `columns` → `column` only. Omitted ⇒ any non-internal.

Add registry helpers:
- `registry.isContainer(type)` → boolean.
- `registry.canContain(parentType, childType)` → boolean.

Replace the hardcoded checks:
- Drag-drop drop-target eligibility and the `overContainer` wiring key off `registry.isContainer(type)` instead of naming `section`/`columns`.
- `MoveNode`'s "refuse to drop a container into itself" guard already generalizes (it's id/descendant-based, not type-based) — no change.

This is additive data + two helpers + repointing a couple of checks. Behavior is unchanged for existing block types (the same ones nest), verified by the unchanged data snapshot.

## Part B — `free` layout strategy

### Data model (additive, optional)

**Free container** node:
```
layout: { mode: 'free', height: <px> }   // explicit height: absolute children don't create flow height
```

**Free child** node carries a constraint block, interpreted by its parent's mode:
```
layout: { free: { left?, top?, right?, bottom?, width?, height?, z? } }
```
- Positions/sizes stored as **percentages of the parent** (e.g. `left: 25` = 25%) — the constraint model from the freeform analysis, NOT raw pixels. This is what makes free layouts survive responsive later.
- **Pins** are implicit in which edges are set: `{left}` pins left, `{right}` pins right, `{left,right}` stretches horizontally. Same for `top`/`bottom`. v1 stores `left`/`top`/`width`/`height` (+ `z`); `right`/`bottom` pins are supported by the resolver but the UI won't emit them until later.
- `z` → stacking order (integer).

### computeStyle for `free`

`src/layout/strategies/free.js` — `freeStyle(node, ctx)` returns:
```
{
  className,                         // reuse the universal style classes (bg/border/etc.)
  style: {
    position: 'absolute',
    left/right/top/bottom: '<n>%',   // whichever edges are pinned
    width/height: '<n>%' | undefined,
    zIndex: z,
    ...blockStyleInline(st),         // bg/color/zoom still apply
  },
  dataAnim,
  box: { xPct, yPct, wPct, hPct, z }, // explicit box for the future interaction/overlay layer
}
```

The **free container view** renders `position: relative; height: <container.layout.height>px` and its `Children` in `free` mode. `computeStyle(child, { parentMode: 'free' })` then absolutely-positions each child. Flow-mode rendering is completely unchanged.

### The `box` field

The ComputedStyle gains a populated `box` in free mode (unused/`null` in flow, as forward-shaped in Increment 3). The interaction layer (Increment 5) reads `box` to place resize/move handles and compute snapping — so the geometry is authored in one place (the engine), consumed by screen + overlay + export alike.

## What this deliberately does NOT include

- No pointer drag / resize / rotate / snapping / guides / selection overlay (Increment 5 — the interactive, runtime-verified part).
- No responsive breakpoint overrides (later increment; the constraint model makes them tractable).
- No conversion of the existing `canvas`/`Freeform` block yet (it keeps its bespoke model until the interaction layer exists to replace it cleanly).

## Verification

1. **Flow unchanged:** the existing-site render-diff stays byte-identical (default mode is flow).
2. **Free strategy unit test:** given a matrix of constraint inputs, `freeStyle` returns the expected `style`/`box` (percent positioning, pins, z, universal styles merged).
3. **Free render fixture:** a hand-authored free container with 2–3 positioned children renders to the expected absolute-positioned HTML (render-diff against a golden snapshot).
4. **Containment helpers:** unit-test `isContainer`/`canContain` against the descriptor table; assert drop-eligibility matches the previous hardcoded behavior for existing types.
5. Bundle + data snapshot unchanged.

## Risks & what I'd confirm before coding

- **Low-to-moderate risk** — pure data + a strategy + rendering, all render-diff/unit verifiable. No interaction code yet, so no un-testable-here surface.
- **Constraint storage — confirm the v1 shape:** percentages relative to parent, storing `left/top/width/height/z`, with `right/bottom` pins resolved-but-not-yet-emitted. (Alternative: store px — I recommend against it, per the freeform analysis; percentages are what scale to responsive.)
- **Existing `canvas` block:** leave it on its bespoke element model this increment (retire it once the interaction layer lands), or fold it in now? I recommend leaving it.
- **Whether to bundle Increment 5 (interaction layer):** I recommend keeping it separate so this structural piece stays fully verifiable and you can build-check it before the interactive part.
