# Increment 3 — Layout Engine (flow mode only)

_Status: **proposed — awaiting sign-off**. No implementation until approved._
_First step toward freeform (see freeform-architecture-analysis.md + editor-v2-architecture.md §2/§15). Introduces the engine seam with **zero behavior change** — the strangler step that lets `free` mode plug in later._

## Goal

Introduce a **pure layout engine** (`src/layout/`) that computes a node's rendered geometry, and route the renderer through it. This increment ships **only the `flow` strategy**, which reproduces today's document-flow + universal-style output exactly. Existing sites render byte-for-byte identically. The point is not a visible change — it's establishing the abstraction so `free`/`grid`/`flex` become *strategies* added behind it, not rewrites of the renderer.

Non-goals this increment: no free positioning, no drag/resize, no responsive overrides, no containment changes. Just the seam, proven behavior-preserving.

## Current state being generalized

Today a block's visual treatment comes from `src/editor/style.js`:
- `blockStyleClass(st)` → wrapper classes (`blk`, `has-bg`, `align-*`, `pad-*`, `w-*`, `br-*`, `rad-*`, `sh-*`, `gap-*`)
- `blockStyleInline(st)` → inline `backgroundColor/color/zoom`

`BlockNode` renders `<div className={blockStyleClass(st)} style={blockStyleInline(st)} data-anim={st.anim}>`. Positioning is implicit document flow. There is no notion of a container "layout mode" or child positioning data.

## The engine

A single engine, **layout strategies** behind it (Strategy pattern), each emitting a common **ComputedStyle** the renderer consumes:

```
computeStyle(node, ctx) -> { className, style, dataAnim }
   ctx = { parentMode, breakpoint }
```

- `src/layout/index.js` — `computeStyle(node, ctx)`: resolves the parent's mode, delegates to that strategy.
- `src/layout/strategies/flow.js` — the flow strategy. **Moves `style.js` logic here verbatim** and returns `{ className: blockStyleClass(st), style: blockStyleInline(st), dataAnim: st.anim }`. Output is identical to today.
- `src/layout/mode.js` — `getMode(node) => node.layout?.mode ?? 'flow'`. A container's mode decides how its children are arranged and what their `layout` data means. Absent ⇒ `flow` ⇒ today's behavior.

**Data model (additive, optional):** container nodes *may* carry `layout: { mode }` (default `flow`); child nodes *may* carry a `layout` descriptor (ignored in flow). No node has these yet, so nothing changes — exactly the additive-migration discipline used for the registry and command layers.

## Renderer change (one line, behaviorally identical)

`BlockNode`'s inner wrapper changes from calling `style.js` directly to consuming the engine:

```
const { className, style, dataAnim } = computeStyle(node, { parentMode, breakpoint })
<div className={className} style={style} data-anim={dataAnim}> <BlockContent .../> </div>
```

`parentMode` comes from the parent node's mode (via a prop threaded through `Children`, default `flow`); `breakpoint` comes from the existing `device` state (desktop/tablet/mobile) but has **no effect in flow mode** this increment (no overrides yet). `style.js` becomes a thin re-export from the flow strategy (or is deleted and its callers repointed).

## Breakpoint seam (wired, inert)

The engine takes `breakpoint` as a parameter now so the signature is stable when responsive overrides arrive (a later increment). We pass the current device, but the flow strategy ignores it — zero behavior change, future-proof signature.

## Containment prep (data-only, optional in this increment)

To set up `free` mode and generalized nesting, add `container: true` / `canContain` metadata to the registry descriptors that already nest (`section`, `columns`, `column`). This is **pure data**, changes no behavior, and lets a later increment replace the hardcoded `type === 'section'` checks with `registry` capability queries. I recommend including it here (cheap, verified by the unchanged snapshot) but it can be deferred.

## Verification

1. **Render-diff, byte-identical:** render a representative site (including styled blocks — bg/align/pad/border/shadow/size/gap/anim on various nodes) through the current renderer and the engine-based renderer; assert identical HTML. This is the back-compat proof, same method as Phases 0–3.
2. **Unit test the flow strategy** equals `style.js` for a matrix of `st` inputs (all class/inline permutations).
3. **Bundle** (esbuild-wasm) + **data snapshot** unchanged.

## Rollout after this increment

4. **Generalize containment** via registry `canContain`; replace hardcoded `section`/`columns` checks.
5. **`free` mode strategy** + constraint data model (edges as %/pins, `z`) — the engine gains a strategy; the renderer is untouched.
6. **Interaction layer** — pointer drag/resize/snap hooks + a portal `SelectionOverlay` (reads `ComputedBox` from the engine), ephemeral-transform-then-commit-command.
7. **Responsive overrides** — breakpoint-scoped sparse `layout` overrides; the breakpoint param (wired now) starts mattering.
8. Reimplement the `canvas`/`Freeform` block on the general engine, deleting its bespoke element model.

## Risks & what I'd confirm

- **Low risk** — this is a behavior-preserving seam, fully render-diff verifiable. The main care is that the flow strategy reproduces `style.js` exactly (the unit test covers it).
- **`ComputedBox` vs `ComputedStyle`:** this increment only needs `ComputedStyle` (class/inline) because flow uses the DOM box model. `free` mode will extend the return with an explicit box (`{x,y,width,height,z,transform}`). I'd design the return shape now to be forward-compatible (a `box?` field, unused in flow) so strategy 5 doesn't reshape it. Confirm you want that forward-shaping now vs later.
- **Where `style.js` lives:** I recommend moving its logic into `src/layout/strategies/flow.js` and leaving `style.js` as a re-export for one increment, then deleting it. Confirm you're fine with that path.
