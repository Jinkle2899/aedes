# Aedes Editor — Version 2 Architecture

_Design exercise. No implementation. CTO/principal-architect view, 5–10 year horizon._

## The thesis (read this first)

One decision determines whether all 50 of your long-term features coexist cleanly or collapse into debt:

> **The document is a normalized scene graph, and every mutation is a typed, invertible, serializable command.**

If that holds, then **undo/redo, multiplayer, AI editing, plugins, macros, history, and templates are all the same mechanism** — a stream of commands over a shared document. You don't build them five times; you build the command layer once and each feature is a producer or consumer of commands. Everything below serves that thesis.

The second decision is a fork I'll force you to make consciously:

> **Aedes builds *websites* (DOM/CSS output), not an infinite design canvas. That means DOM rendering + virtualization, not a WebGL scene like Figma.** "100,000 nodes on one page" is a design-canvas requirement, not a website one. I recommend the DOM path and put the WebGL option behind a clean seam so it *could* be swapped — but building WebGL now would be building a different product.

I'll defend both throughout, and challenge several other points in your brief.

---

## 1. Overall system architecture

Seven layers, each depending only on the ones above it, communicating through stable APIs and the command bus:

1. **Document Model** — normalized scene graph (source of truth). Owns nodes, structure, schema + versioning/migrations. Pure data + selectors. Never mutated directly.
2. **Command Layer** — the *only* way to mutate the document. Typed, invertible, serializable commands; a command bus; reducers; transactions. Undo/redo, AI, plugins, and multiplayer all flow through here.
3. **Engines (pure, headless, React-free)** — Layout, Responsive, Snapping/Geometry, Animation, Prediction/AI-planning, Export. Functions/services over the document; independently testable and swappable.
4. **Editor Runtime** — ephemeral interaction state: a state machine (idle/drag/resize/rotate/marquee/text), selection/hover, drag & resize sessions, clipboard, viewport, guides. Separate from the document; never persisted or synced (except presence).
5. **View Layer (React, dumb)** — renders nodes from computed layout, subscribes granularly, dispatches commands, never mutates. Overlays (selection, handles, guides, cursors) on separate compositor layers.
6. **Plugin System** — every component is a package implementing one contract (metadata, renderer, inspector schema, layout defaults, AI/prediction metadata, serialization, validation). Core primitives are trusted built-ins; third-party are sandboxed. Marketplace = distribution.
7. **Platform** — persistence drivers, plugin loader, collaboration transport, telemetry.

**Why it scales:** dependencies point one direction; the document and command bus are the only shared contracts; engines are pure and replaceable; the view is disposable. A new feature is a new command + optional engine + optional panel — never a change to the core mutation path. This is the property that lets the codebase absorb a decade of features.

**Communication rules (non-negotiable):**
- Read the document only via **selectors**. Mutate only via **commands**. No component or plugin touches document internals.
- Engines are pure: `(document, params) → result`. No side effects, no React.
- Ephemeral editor state lives in the editor store, never in the document, never in history, never synced (presence excepted).

## 2. Layout Engine

One engine, multiple **layout strategies** (Strategy pattern) — not six unrelated systems. A container node declares `layout.mode`; children carry mode-appropriate data; a strategy computes geometry; a constraint/responsive pass adjusts it. All strategies emit the same **ComputedBox** (`{x, y, width, height, transform, z}` in parent space) that the renderer consumes. Adding a layout type = adding a strategy, not touching the renderer.

- **Flow** (default, back-compatible with today) — document order, block stacking. "No layout data ⇒ flow" keeps existing sites identical.
- **Flex / Auto Layout** — Auto Layout *is* flex with content-driven sizing (direction, gap, align, distribute, grow/shrink). Treat them as one strategy with a "hug/fill/fixed" sizing model (Figma's mental model), compiled to CSS flex on export.
- **Grid** — tracks, spans, areas; child `{col,row,span}`.
- **Free** — children positioned by **constraints relative to the immediate parent**: edges as %/px with **pins** (anchor left/right/top/bottom), size hug/fill/fixed, explicit `z`, optional rotation. Constraints — not raw pixels — are what make free layout survive responsive (see §8). This is the Framer/Wix-Studio convergence.
- **Constraint pass** — after a strategy positions children, a resolver applies pins/anchors and clamps. Docking = a constraint preset ("pin to edge, fill cross-axis").

**Calculation:** layout is computed **bottom-up for intrinsic sizes, then top-down for final positions** (two-pass, like browsers and Figma). Memoize per `(nodeId, breakpoint, inputs-hash)`; recompute only the affected subtree on change (incremental layout). Heavy solves run in a **web worker** for large scenes.

**Rendering consumes layout, never computes it:** a node view reads its `ComputedBox` and renders a positioned `<div>` (or applies CSS class for flow). Editor overlays read boxes for handles. Export reads the same boxes to emit CSS. One engine feeds screen, handles, and codegen — no divergence.

## 3. Plugin architecture

**Challenge to your brief:** "every component becomes an independent plugin" is right about the *contract*, wrong if it means everything is dynamically loaded and sandboxed. Core primitives (frame/container, text, image, media, the layout box) are used on every render — dynamic-loading and sandboxing them costs performance and trust for no gain. Adopt **one uniform plugin contract, two trust tiers**: core primitives are first-party built-ins compiled in; third-party blocks are sandboxed and lazy-loaded. (This is the VS Code / Figma model.) Uniform interface, tiered execution.

Your Phase 0–3 registry is already this contract in embryo — descriptor (`type/label/dna/fields`) + view + inspector schema. V2 extends the same descriptor:

```
ComponentPlugin = {
  meta:        { type, name, icon, category, version }
  render:      (node, ctx) => View            // presentational, dumb
  inspector:   FieldSchema[]                   // Phase-3 schema, extended
  toolbar:     ToolbarSchema                   // contextual actions
  layout:      { defaultMode?, defaultChildLayout, resize: ResizeRules }
  containment: { canContain?, allowedParents? } // §replaces hardcoded section/columns
  ai:          { role, promptHints, editableProps }   // AI targets this, not JSON
  prediction:  { grammar, after, pop, kinds }  // today's Block DNA
  serialize:   (node) => JSON                  // versioned
  deserialize: (json, schemaVersion) => node   // with migrations
  validate:    (node) => Issue[]
}
```

Marketplace becomes trivial because a block is a self-describing package with a stable contract and its own serialization/validation — the host never needs to know a block's internals. **Capability-based sandbox** for third-party: plugins get a scoped host API (dispatch commands, read selectors), never direct document or DOM access.

## 4. Editor engine

The editor is an **explicit state machine** over ephemeral state, not a pile of handlers in one component (your current `EditorInner` God-component is exactly what this replaces):

- **States:** `Idle → Hovering → Selecting(marquee) → Dragging → Resizing → Rotating → EditingText → PanZoom`. Transitions on pointer/keyboard events. Each state delegates to a **session controller** (`DragSession`, `ResizeSession`, `RotateSession`) — testable objects holding start geometry, current delta, snap results.
- **Selection / Hover** — a selection model (ids + primary), hover id, both ephemeral. Multi-select, marquee.
- **Clipboard** — serialize selected subtrees (via plugin `serialize`) to app + OS clipboard; paste = deserialize + `InsertNodes` command with fresh ids.
- **History / Undo / Redo** — derived from the command log: each command has an inverse; undo dispatches inverses. **Store inverse commands (diffs), not document snapshots** — cheap memory, and per-user in multiplayer.
- **Command Bus** — validates, applies (reducer), records inverse, notifies subscribers, forwards to collab transport. The one chokepoint every mutation passes through.
- **Selection Overlay / Interaction Layer** — a separate React layer rendering handles/guides from selection + session, on its own compositor layer so dragging doesn't re-render content.

Sessions update an **ephemeral transform** during interaction (60fps, no document writes) and emit **one command on commit** (drop/mouse-up). This is the single most important editor performance rule.

## 5. State management

Four distinct stores with hard ownership rules:

| State | Store | Persisted? | Undoable? | Synced? |
|---|---|---|---|---|
| Nodes, structure, props, layout, components, tokens | **Document** | yes | yes | yes (CRDT) |
| Selection, hover | Editor (ephemeral) | no | no | presence only |
| Drag/resize/rotate session, guides, snap results | Editor (ephemeral) | no | no | no |
| Viewport (zoom/pan), active breakpoint, panel open/closed, tool | Editor/UI | maybe (per user) | no | no |
| Clipboard | App/OS | no | no | no |
| Computed layout boxes, render styles | Derived (memoized selectors) | no | no | no |

**The rule that prevents 90% of future bugs:** ephemeral interaction state and UI state **never enter the document, the history, or the sync stream.** Undoing must never toggle a panel; a collaborator's cursor must never appear in your undo stack. Derived state is never stored — it's memoized selectors recomputed from the document.

**Normalized, not nested:** the document is `{ nodes: Map<id, Node>, childrenOf: Map<id, id[]>, root }`, not an in-memory nested tree. Normalized gives O(1) node access, granular subscription (a view subscribes to one id), cheap structural sharing, and is CRDT-friendly. Nested trees (today's `tree.js`) are fine at 50 nodes and quadratic pain at scale + multiplayer. Keep a nested **projection** only for serialization/export.

## 6. Rendering engine

- **Granular subscription, not top-down Context.** Each node view subscribes to *its* node slice via an external store (signals / Zustand-style selectors). Editing one node re-renders one node — not the tree. **Do not use React Context for the document** (Context re-renders every consumer; this is your current P1-5 perf bug writ large).
- **Recursive, but memoized.** The tree is rendered recursively; each `NodeView` is `memo`'d and keyed by stable node id. A parent re-rendering doesn't re-render children unless their slice changed.
- **Layout is precomputed by the engine and read, not computed in render.**
- **Overlays on separate layers**, driven by ephemeral transforms during drag (CSS `transform`, GPU) — content layer untouched mid-drag.
- **Virtualization** for large pages: window the off-viewport nodes; hit-testing via a **spatial index** (quadtree/R-tree), not DOM scans.
- **DOM vs WebGL (the fork):** for a website builder, DOM + virtualization + memoization handles realistic pages (thousands of nodes). Put rendering behind a `SceneRenderer` interface so a WebGL renderer *could* replace it if you ever pivot to an infinite design canvas — but don't build WebGL speculatively. Building it now optimizes for a product you haven't decided to be.

## 7. Layout interaction engine (algorithms)

- **Hit testing:** spatial index (quadtree) over ComputedBoxes → O(log n) pick; topmost by z. Cache boxes; invalidate on layout change.
- **Bounding boxes:** each node's world box derived from parent chain transforms; cached, recomputed lazily.
- **Drag:** on start, snapshot dragged nodes' boxes + candidate snap edges from spatial query of siblings/parent; per-move, apply delta to an ephemeral transform, run snapping, render guides; on drop, emit `MoveNodes`/`ReparentNodes` command.
- **Resize:** handle → axis/anchor; compute new size from pointer delta respecting `ResizeRules` (min/max, aspect lock, hug/fill), snap to sibling edges/sizes; commit `ResizeNode`.
- **Rotate:** angle from pointer vs node center; snap to 15° increments; store rotation in layout; commit.
- **Alignment / snapping:** candidate lines = parent edges/center + sibling edges/centers + a spacing grid; within threshold, snap and draw guide; **smart spacing** = detect equal gaps among siblings and suggest. Runs off cached geometry, not per-frame recompute.
- **Marquee:** rectangle intersect test against spatial index → selection set.
- **Collision/overlap:** for free layout, overlap is allowed (z decides); optional "distribute/avoid" is an engine helper, not enforced.

All of this reads geometry from the layout engine and emits commands on commit — the interaction layer holds no document truth.

## 8. Responsive engine

- **Breakpoints** as a small ordered set (desktop → tablet → mobile), extensible. The active breakpoint is editor state, not document.
- **Sparse overrides + cascade:** a node's layout is `{ base, tablet?, mobile? }`, storing only *changed* props per breakpoint; resolution cascades base → active. Editing at a breakpoint writes an override at that breakpoint (a command), never mutates base unless base is active.
- **Constraint solving** makes free layouts reflow: pins/% resolve against the current parent size per breakpoint. This is why we store constraints, not pixels (§2).
- **Flow fallback:** a container can declare "collapse to flow below X" so free/grid layouts degrade to a stack on mobile — the guardrail that stops "perfect desktop / broken mobile."
- **Inheritance:** overrides inherit down the cascade; a mobile edit shadows base for that node only.

Wire the active breakpoint to the viewport; the renderer and layout engine take breakpoint as a parameter, so preview = editing at that breakpoint with interaction disabled.

## 9. AI integration

**Your instinct is exactly right, and it's *free* given the command layer:** AI never touches JSON. **AI emits the same commands the UI emits.** The AI API is a vocabulary of **high-level intents** that a planner compiles into primitive commands, validated by the same reducers as human input:

```
AI intents → planner → command(s) → command bus → document
   move / resize / align / insert / delete / replace
   wrap / group / ungroup / convertLayout / generateLayout / optimizeLayout
```

- The planner is given a **registry-derived catalog** (block types, editable props, containment, layout modes) so it can only target real capabilities — the Aedes Compose validator from P1 generalizes into this.
- Every AI edit is a command → **undoable, auditable, multiplayer-safe, and identical to a human edit**. No special-casing, no divergent path, no way for AI to corrupt state the reducers reject.
- Generation (`generateLayout`) produces a candidate subtree → validated → inserted as one transaction (undoable atomically). `optimizeLayout` reads computed geometry and proposes constraint/spacing commands.

This is the cleanest part of the whole design *because* the command layer already exists for undo/multiplayer. AI is just another command producer.

## 10. Animation engine

- **Data in the document** (it's persistent design intent): an `interactions` model per node (`trigger → action`, e.g. hover/scroll/click → animate props) and a `timeline` model (keyframes over time). Both are node-attached, versioned, serializable — thus undoable and collaborative like everything else.
- **Runtime in a separate engine:** an Animation Runtime resolves interactions/timelines to actual transitions at preview/publish time (Web Animations API / GSAP under the hood — you already ship GSAP). Editing happens via a Timeline panel that dispatches commands; playback never mutates the document.
- **Separation:** animation is orthogonal to layout — it animates *computed* properties, it does not participate in layout solving. Keep the engines independent so neither entangles the other.

## 11. Multiplayer

The feature most often bolted on and regretted. Here it's a transport, not a rewrite, **because the document is normalized and mutations are commands**:

- **Document convergence via CRDT** (Yjs-style) over the normalized node map — chosen over OT for offline support, simpler client logic, and natural convergence on a graph. (OT, à la Google Docs, is the alternative; it needs a central server to transform ops and is harder for tree ops. For a design document with offline, CRDT wins. I'd revisit only if you need strict server authority.)
- **Commands map to CRDT transactions;** remote commands apply through the same reducers. Local-first: apply optimistically, reconcile on sync.
- **Presence is ephemeral and separate:** selection, cursor, hover, and drag sessions broadcast on a presence channel, never in the document or history. A collaborator's selection is not your undo.
- **History is per-user,** derived from that user's commands — you undo *your* edits, not theirs. The inverse-command history model makes this natural.

Because the seams (normalized doc, command bus, ephemeral-vs-persistent split) are designed now, multiplayer is an adapter in `collab/`, not surgery on the editor.

## 12. Performance

- **Normalized store** → O(1) node access; structural sharing (Immer/persistent maps) → cheap immutable updates.
- **Granular subscriptions** → edit one node, render one node.
- **Memoized incremental layout** → recompute only the changed subtree, keyed by inputs hash.
- **Ephemeral drag transforms** → zero document writes during interaction; one command on commit.
- **Virtualization + spatial index** → render and hit-test proportional to visible nodes, not total.
- **Web workers** for layout/constraint solving, snapping geometry, export, and validation — keep the main thread at 60fps.
- **History as diffs**, not snapshots → bounded memory over long sessions.
- **Lazy plugin loading** for third-party blocks; core primitives compiled in.
- **Batched transactions** coalesce multi-node edits into one command/one render.
- **Realistic target:** thousands of nodes per page at 60fps via the above. **100k nodes is a WebGL/design-canvas target** — reachable only if you take the renderer fork in §6, which I advise against unless the product becomes an infinite canvas.

## 13. Internal APIs (stable contracts)

Subsystems talk only through these; implementations behind them can change freely:

- **DocumentAPI** — `getNode`, `getChildren`, `query`, `subscribe(id)`. Read-only.
- **CommandAPI (bus)** — `dispatch(command)`, `transaction(fn)`. The sole mutation path.
- **HistoryAPI** — `undo`, `redo`, `canUndo`, transaction grouping.
- **LayoutAPI** — `computeBox(id, breakpoint)`, `measure(id)`, `invalidate(id)`.
- **SelectionAPI** — `get`, `set`, `add`, `marquee`, `subscribe`.
- **RenderAPI** — `registerNodeView(type, renderer)`; renderer receives node + ComputedBox + dispatch.
- **PluginAPI** — host↔plugin contract (§3) + scoped capability API for sandboxed plugins.
- **AIAPI** — `plan(intent) → command[]`, `generate`, `optimize`.
- **AnimationAPI** — `registerInteraction`, `play(previewCtx)`.
- **ResponsiveAPI** — `resolve(node, breakpoint)`, `setOverride`.
- **CollabAPI** — `connect`, `broadcastPresence`, transport of commands.

Stability rule: these signatures are versioned and change rarely; everything else is an implementation detail. This is what keeps a 5-year codebase from ossifying.

## 14. Folder structure (by responsibility)

```
src/
  document/       normalized graph, schema, versioning, migrations, selectors
  commands/       command defs, bus, reducers, inverse, transactions, history
  engines/
    layout/       strategies (flow|flex/auto|grid|free), constraint solver, ComputedBox
    responsive/   breakpoints, override cascade, flow-fallback
    snapping/     geometry, guides, hit-test, spatial index, smart spacing
    animation/    interactions, timeline, runtime resolver
    prediction/   predict + AI planning (today's predict.js grows here)
    export/       doc → html/css/react, seo/a11y analyzers
  editor/
    runtime/      state machine, drag/resize/rotate sessions
    selection/    selection + hover
    clipboard/  viewport/  store/ (ephemeral, subscriptions)
  plugins/
    kit/          plugin contract types, host API, sandbox
    builtin/      first-party primitives (frame,text,image,media,layout-box)
  view/
    canvas/       renderer, NodeView host, granular subscription, virtualization
    overlays/     selection, handles, guides, presence cursors
    panels/       inspector, layers, assets (dumb UI)
  design-system/  tokens, variables, themes, components/variants/symbols defs
  collab/         crdt/ot adapter, presence, transport
  ai/             intent → command compiler, generation, optimize
  site/           pages, routes, cms bindings, dynamic data
  platform/       persistence drivers, plugin loader, telemetry
```

Organized by subsystem/responsibility, never by file size. Each engine is a pure, independently testable package.

## 15. Migration strategy (from today → V2)

**Keep (already aligned):**
- The **block registry (Phases 0–3)** — it *is* the plugin contract in embryo. V2 extends the descriptor with layout/containment/AI/serialization fields.
- Pure tree helpers, `predict`/`pageGrammar`/`blockDNA` (move into `engines/prediction`), the `db.js` driver pattern (becomes a persistence driver in `platform`).
- The schema-driven Inspector (Phase 3) → becomes the plugin `inspector` schema renderer.

**Replace:**
- Nested-tree-as-mutation (`tree.js` mutation flows) → **normalized document + command bus**. Keep a nested projection for export.
- `EditorInner` God-component → **editor runtime (state machine) + ephemeral store + overlays**.
- Ad-hoc HTML5 DnD (`dropTarget`/index) → **interaction sessions + layout engine**.

**Deprecate:**
- The bespoke `canvas.elements` freeform model → reimplemented as a `free` layout container on the general engine (removes the parallel model).

**Rewrite:**
- The mutation path (introduce commands) and the layout system (introduce the engine with `flow` as default).

**Safe migration (strangler-fig, verified like Phases 0–3):**
1. Introduce the **command bus + normalized store behind the current UI** — dispatch existing edits as commands; prove byte-identical behavior with snapshot tests (the method already used this session).
2. Add the **layout engine with `flow` as the only mode** — existing sites render identically (back-compat proof).
3. Decompose `EditorInner` into the runtime/store; add **undo/redo** (now trivial — commands are invertible).
4. Add `free` mode + interaction layer; reimplement `canvas` on it.
5. Responsive overrides; then components/tokens; then collab (adapter); then animation.
6. A document schema **version + migration** function runs on load so old sites upgrade automatically — this is what makes "no rewrites for years" literally true.

Every step is independently shippable and verifiable, with old documents auto-migrating.

---

## Where I challenge your brief (CTO honesty)

1. **"Every component is an independent plugin"** — yes to one uniform contract; no to dynamically loading/sandboxing core primitives. Tiered trust (built-in vs sandboxed) beats uniformity-at-all-costs on performance and reliability.
2. **"100,000 nodes"** — that's a design-canvas (WebGL) target, not a website one. For a builder competing with Webflow/Wix Studio/Framer, DOM + virtualization at thousands of nodes is the right target. Decide consciously whether you're building a canvas or a site builder; don't accidentally sign up for WebGL.
3. **Absolute positioning** — reject it as the storage model; constraints relative to parent are the only thing that scales to responsive. (Same conclusion as the freeform analysis.)
4. **Context-based state** — the current Context approach cannot render at this scale; V2 must use an external store with granular subscriptions.
5. **Nested tree** — replace with a normalized graph; it's the prerequisite for multiplayer, granular subscription, and large scenes.
6. **Sequencing** — the command layer + normalized document + `EditorInner` decomposition are the foundation for *everything else on your list*. Build them first. Freeform, AI, multiplayer, and animation are all cheap once they exist and expensive without them.

## The one-paragraph recommendation

Build V2 as a **normalized document mutated exclusively through a typed, invertible command bus**, read by **pure engines** (layout with pluggable strategies, responsive, snapping, animation, prediction) and rendered by a **dumb, granularly-subscribed DOM view** with overlays on separate layers, edited through a **state-machine runtime** of interaction sessions, with **every component a plugin** implementing one contract (core built-in, third-party sandboxed). Undo/redo, AI, multiplayer, and macros are then all just command streams. Start the migration by introducing the command bus and normalized store behind today's UI and proving zero behavior change — exactly the verified, phase-by-phase method we've used so far.
