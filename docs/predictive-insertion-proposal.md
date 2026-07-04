# Aedes Flow — The Predictive Insertion System

*A complete product proposal for the next iteration of block insertion. Supersedes and absorbs `block-library-design.md` ("One Picker, Three Doors"), which survives inside this system as the fallback layer. Constraints honored: editor layout, canvas, inspector, block components, and visual language are untouched. Everything below composes onto the existing codebase.*

---

## 0. The thesis

Every website builder on the market — Wix, Webflow, Framer, Elementor — treats insertion as **retrieval**: the user forms intent, translates it into a query or a scroll, finds the component, and aims it at a location. Our previous proposal ("One Picker, Three Doors") made retrieval world-class. This proposal makes retrieval **rare**.

> **The editor drafts. You approve.**

The insertion experience becomes what autocomplete did to typing and what Copilot did to code: the editor continuously predicts the next most probable section, stages it *in place*, and the user's job collapses from *search → choose → place* to a single decision: **yes or no.**

The north-star metric: **≥70% of all insertions happen with zero or one keystroke.** The library still exists — but opening it should feel like popping the hood, not driving the car.

---

## 1. Challenging the previous solution

| Previous assumption | Challenge | Verdict |
|---|---|---|
| Users need a library surface | They need *blocks*, not a library. The library is our org chart, not their goal. | Demote to escape hatch |
| Insertion starts when the user expresses intent | The page itself already expresses intent. A hero with no features section *is* a query. | Editor moves first |
| Search is the fastest path | Acceptance is faster than search: 0 keystrokes beats 3. | Prediction primary, search secondary |
| Categories organize discovery | Categories describe blocks; they don't describe *situations*. Context ranking replaces navigation. | Categories become metadata only |
| The user picks the insertion point | 95% of inserts are "after what I just did" or "in the obvious gap." Predict it. | Point is predicted, correctable |
| More blocks = more UI | More blocks = better predictions and *identical* UI. The catalog scales; the surface never grows past 5–10 choices. | Fixed-size surface, infinite catalog |

What survives from before — deliberately: the registry, the ranked search, `⌘K`, the seam, the drawer, live-render previews, favorites/recents. They become **Layer 3** of a three-layer system instead of the whole system.

---

## 2. UX concepts considered (5)

### Concept 1 — "The Horizon" (ghost next section)
The page always ends with a **ghost**: the predicted next block rendered in-place at ~40% opacity with a dashed boundary — a real, live render of the actual component, not a placeholder. `Tab` (or click) accepts it and it solidifies with the existing settle animation. `←/→` cycles the top 3 alternatives. Typing while a ghost is focused filters it into a search. Ghosts also appear in detected *gaps* (e.g., between pricing and footer when a page lacks any proof section).
- **Why it works:** the insert decision is made where the block will live, at full visual fidelity, with zero navigation. It is the autocomplete mental model users already have.
- **Strengths:** zero-keystroke path; teaches page structure implicitly; spectacular first-run ("the page builds itself as fast as you can Tab").
- **Weaknesses:** wrong predictions are visible (mitigated by confidence gating, §5.3); needs care to never obstruct editing.
- **Scalability ★★★★★ · Complexity ★★★ · Beginner ★★★★★ · Power user ★★★★★**

### Concept 2 — "The Current" (ambient suggestion strip)
A thin, always-visible strip docked to the bottom edge of the canvas: five live-preview chips that continuously re-rank as selection, scroll position, and page structure change. Click or drag to insert. No modal, ever.
- **Strengths:** always-on intelligence; no discovery problem; great drag affordance.
- **Weaknesses:** permanent screen tax (violates the spirit of a clean canvas); ambient re-ranking is distracting motion; competes with the seam.
- **Scalability ★★★★ · Complexity ★★★ · Beginner ★★★★ · Power user ★★★**

### Concept 3 — "The Blueprint" (skeleton-first slots)
A new page opens as a labeled skeleton derived from site type: `Navbar · Hero · [Proof] · [Offer] · [Action] · Footer`. Each slot shows its top 3 candidates; building = filling slots. Structure is explicit from second one.
- **Strengths:** strongest onboarding ever; makes page grammar (§5.2) user-visible; pairs perfectly with AI site drafting.
- **Weaknesses:** wizard-like rigidity for experienced users; awkward for pages that outgrow their skeleton; a *mode*, and modes rot.
- **Scalability ★★★ · Complexity ★★★ · Beginner ★★★★★ · Power user ★★**

### Concept 4 — "The Intent Bar" (semantic omnibox)
One persistent input above the canvas: `"faq after pricing"`, `"make this darker"`, `"add a booking form"` → parsed and executed. Insertion, navigation, and edits share one language surface.
- **Strengths:** infinitely expressive; absorbs AI generation naturally; one UI for everything.
- **Weaknesses:** typing sentences is slower than Tab for the common case; NL parsing failures are trust-killers; overlaps ⌘K confusingly.
- **Scalability ★★★★★ · Complexity ★★★★★ · Beginner ★★★ · Power user ★★★**

### Concept 5 — "The Choreographer" (full-page drafting)
Inversion of scale: the AI drafts entire page *variants* (3 candidate layouts, live-rendered side by side); the user picks and then edits. Insertion mostly disappears into regeneration ("redraft below this point").
- **Strengths:** fastest possible zero-to-page; the logical endpoint of the vision.
- **Weaknesses:** skips the incremental editing loop that builds ownership; needs strong generation quality on day one; not an *insertion* model so much as a replacement for editing.
- **Scalability ★★★★ · Complexity ★★★★★ · Beginner ★★★★ · Power user ★★**

---

## 3. Recommended solution — the Flow stack

**Concept 1 (Horizon) is the flagship**, but the honest architecture is a **confidence-tiered stack** where all five concepts become *rendering strategies of one prediction pipeline*:

```
                    ┌─────────────────────────────┐
                    │   PREDICTION PIPELINE        │
                    │   (one ranked list, always)  │
                    └──────────┬──────────────────┘
             confidence HIGH   │   MEDIUM            LOW / user-initiated
                    ┌──────────┼──────────────┬─────────────────┐
                    ▼          ▼              ▼                 ▼
              L1 HORIZON   L2 SEAM CHIPS   L3 PICKER        SILENCE
              ghost block  5 ranked chips  ⌘K / drawer      (no UI at all)
              in canvas    at + seams      (prev. proposal)
```

- **Layer 1 — Horizon.** When the top prediction clears the confidence threshold, it renders as a ghost at the predicted location. `Tab` accepts. This is the zero-keystroke path.
- **Layer 2 — Seam chips.** Every seam `+` opens the compact popover from the previous proposal, but its default content is now the pipeline's top 5 *for that exact position*, each with a one-line **because** ("Pages like this usually follow features with proof"). Browsing not required.
- **Layer 3 — Picker.** `⌘K` / `⌘L` / "Browse all" — the full One-Picker system, unchanged, for the minority of cases where the user knows exactly what they want or wants to explore. Search results are *also* context-boosted by the same pipeline.
- **Layer 0 — Silence.** Below the confidence floor, nothing renders. A prediction system earns trust by shutting up when unsure.

Concept 3 becomes the **empty-page state** (the skeleton is just five ghosts at once). Concept 4's best part ships as ⌘K alias/intent search. Concept 5 is the V3 endgame the same pipeline grows into (drafting = accepting many predictions at once).

**Why this wins:** every layer is the same data, so intelligence investments (better DNA, better models) improve all surfaces simultaneously; every layer is individually removable (ghost can be disabled in settings without touching seams or search); and nothing here modifies the canvas, inspector, or block components — the ghost is rendered *by* the existing `Children` mechanism as a pseudo-block.

**Trust rules (non-negotiable, product law):**
1. Never auto-insert. Predictions render; humans commit.
2. Every prediction is explainable in one plain-English line.
3. Marketplace blocks are never *predicted* for pay. Promotion lives in the drawer, labeled. Prediction ranking is incorruptible.
4. Dismissed predictions stay dismissed (per page, per position).
5. Silence over noise: no confident candidate → no ghost.

---

## 4. Complete user flows

**F1 — Blank page (beginner).** Create site → site type inferred from template choice or name ("Ember Café" → café) → canvas shows navbar ghost + hero ghost stacked (the Blueprint state) with a caption chip: *"Press Tab to build, or start typing to search."* → Tab, Tab → real navbar + hero with café-appropriate defaults → hero editing begins. Time to first meaningful page: **under 10 seconds, zero searches.**

**F2 — Mid-edit (the common loop).** User finishes editing a features block → clicks empty area below → Horizon ghost = `stats` ("proof usually follows features") → `→` cycles to `quote` → Tab. Inserted, selected, scrolled. **One keystroke.**

**F3 — Explicit intent (power).** `⌘K` → "count" → Countdown highlighted (context-boosted because page is an event site) → `⌘Enter` (multi-insert stays open) → "form" → `Enter`. **Same as previous proposal, now smarter.**

**F4 — Gap repair.** Page has hero → pricing → footer. Pipeline detects missing *proof* segment → a slim ghost seam pulses once between hero and pricing: *"Add social proof?"* → click → seam chips show quote / stats / logos. Dismiss → never shown again for this gap.

**F5 — Generate.** Seam chips → "None of these" → picker → no result for "3D product spinner" → **Generate with AI** row → skeleton → live preview → Insert / Save to Yours. Generated block's DNA is authored by the generator, so it immediately participates in future predictions.

**F6 — Team.** Designer publishes `acme/hero-launch` v2 to the team library → org policy "prefer team blocks" boosts it → every teammate's Horizon now ghosts the *team* hero on new pages → version bump shows an unobtrusive "v2 available" chip on instances, one-click upgrade, versioned rollback.

---

## 5. The intelligence architecture

### 5.1 Block DNA (metadata model)

```js
{
  id: 'stats', version: '1.2.0',
  label: 'Stats', aliases: ['numbers', 'metrics', 'kpi', 'social proof'],
  category: 'marketing', tags: ['proof', 'trust', 'numbers'],
  grammar: ['proof'],                      // page-grammar roles (§5.2)
  business: ['saas', 'agency', 'ecommerce'], industries: ['*'],
  style: { tone: ['light', 'dark'], density: 'compact' },
  pairs:   { after: ['features', 'hero'], before: ['cta', 'pricing'] },
  excludes: ['stats'],                     // don't suggest twice on one page
  singleton: false,                        // navbar/footer: true
  slots: false,                            // containers: true
  scores: { popularity: 0.74, a11y: 0.95, perf: 0.99 },
  responsive: 'full', cms: 'static', ai: { generable: true, editable: true },
  animation: ['fade', 'stagger'], deps: [],
  variants: ['3-up', '4-up', 'inline'],
  source: 'core', author: 'aedes', license: 'core',
  make: () => Block,                       // or recipe for composites
}
```

DNA powers search (aliases/tags), prediction (grammar/pairs/business), page generation (grammar + recommended order), marketplace ranking (scores + popularity), personalization (per-user counters live *outside* DNA in `blockMeta`), and analytics (every field is a dimension).

### 5.2 Page grammar

Pages parse into a five-segment grammar — `opening` (navbar, hero) → `body` (features, text, media, tabs) → `proof` (stats, quote, logos) → `conversion` (pricing, form, countdown, cta) → `closing` (footer). The parser is ~40 lines: map each block's `grammar` role, in order. From it we get **structural gap detection** (missing proof/conversion segments), **position typing** (a seam between `body` and `closing` wants `proof` or `conversion`), and later, template/AI-draft generation from the same grammar. This is the piece adjacency tables alone can't do — it's why suggestions feel like *judgment* rather than *statistics*.

### 5.3 Recommendation engine

One pure function, deterministic and testable:

```
score(candidate, ctx) =
    0.30 · pairs(prev.type, candidate)        // Block DNA adjacency
  + 0.25 · grammarFit(pageParse, position)    // fills a structural gap?
  + 0.15 · siteAffinity(siteType, candidate)  // café ≠ saas
  + 0.15 · personal(usageCount, recency)      // your habits
  + 0.10 · popularity(global)                 // everyone's habits
  + 0.05 · styleFit(pageTone, candidate)      // dark page → dark-capable
  − penalties: duplicate singleton (−∞), excludes (−∞),
               dismissed-here (−∞), same type adjacent (−0.4)
```

Confidence = normalized gap between #1 and #2. **Ghost renders only when score₁ > 0.55 AND margin > 0.15**; otherwise Layer 2 only. Every factor emits its own explanation string; the top factor becomes the "because" line. Phase 1 ships these editorial weights (works offline, zero backend); Phase 2 fits weights from telemetry; Phase 3 adds an LLM re-rank on the top 10 for ties and cold starts. The function signature never changes, so surfaces never change.

### 5.4 Search engine

Client-side inverted index over DNA (label n-grams, aliases, tags), built at boot in a Web Worker, <1ms lookups to 10k blocks; ranking = exact prefix > word boundary > alias > fuzzy > tag, blended with the same context score (weight 0.3) so search results are position-aware too. Remote sources (team/marketplace) federate: local results render instantly, remote merge in under a stable-selection rule (never reorder under the user's cursor). Semantic search (embeddings) slots in at Phase 3 as one more signal, behind the same `search(query, ctx)` API.

### 5.5 AI integration strategy

| Tier | Capability | Backend | When |
|---|---|---|---|
| T0 | DNA heuristics: pairs, grammar, affinity | none — ships in JS | now |
| T1 | Learned weights + personal model | telemetry store | after launch |
| T2 | LLM re-rank + "because" copywriting + block *generation* (F5) | model API | with backend era |
| T3 | Full drafting: site type + grammar → staged multi-ghost pages (Concept 5) | model API | V3 |

Everything sits behind `PredictionService.predict(ctx) → RankedList` and `generate(prompt, ctx) → Block`. Surfaces are tier-blind: shipping T2 changes zero UI code.

### 5.6 Ecosystem mapping

**Custom blocks** — "Save as block" writes a DNA record (`source: custom`), auto-inferring grammar/pairs from where it was saved; instantly predictable. **Global components** — a custom block flagged `linked: true`; instances reference the record, edits propagate, version history per record. **Variants** — DNA `variants[]` render as a sub-row in chips/picker; ghost shows the last-used variant. **Collections / Smart collections** — static lists vs. saved DNA queries (`grammar:proof AND style:dark`); both insertable as sets. **Marketplace** — DNA + author/price/install state; discoverable in drawer and search (labeled), *predictable only after install* (trust rule 3). **Team libraries** — namespaced DNA (`acme/*`) synced from backend, org policy boosts, roles: viewer/user/publisher; publishing = versioned DNA push. **Plugins** — a plugin is a DNA pack + renderers registered through the same `register()` API; prediction treats them identically. **Design systems** — a theme constrains `styleFit` hard (off-brand candidates filtered, not just demoted) and pins the org's canonical block per grammar role. **Version history** — DNA records are immutable per version; sites pin versions; upgrades are explicit. **Analytics / Favorites / Recents** — `blockMeta` counters feed `personal()`; favorites pin to rail and boost score by a fixed epsilon.

---

## 6. Wireframes

**L1 — Horizon ghost (in canvas, below last block):**
```
│  ████ Features block (real, opaque) ████████████████  │
│                                                        │
│  ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮  │
│  ┊   12k+          99.9%          4.9★    (40% op) ┊  │
│  ┊   customers     uptime         rating           ┊  │
│  ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯  │
│   ⌁ Stats — proof usually follows features            │
│   [Tab] add   [←→] alternatives (Quote · Logos)  [✕]  │
```

**L2 — Seam chips (click + between blocks):**
```
       ────────────────────●─────────────────────
   ╭───────────────────────────────────────────────╮
   │ 🔍 Search all blocks…                          │
   │ SUGGESTED HERE                                 │
   │ ▸ [▦ Stats]  [❝ Quote]  [▦ Logos]  [▤ Tabs]   │  ← live mini-renders
   │   because: pages like this need social proof   │
   │ RECENT   [Text] [Image]                        │
   │ Browse all blocks →                     ⌘K     │
   ╰───────────────────────────────────────────────╯
```

**L3 — Picker (⌘K / drawer):** unchanged from `block-library-design.md` §4, with one addition — a context header row: *"Inserting after: Features"* + the top 3 contextual results pinned above search results.

**Empty page (Blueprint state):**
```
│  ╭┄ Navbar ┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮  ← stacked ghosts, each
│  ╭┄ Hero ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮     individually Tab-able
│   Press Tab to build your café site,
│   or start typing to search.
```

**Mobile (<900px):** ghosts render identically (they're just blocks); accept = tap. Seam `+` opens the picker as a bottom sheet. No hover dependencies anywhere — hover-only affordances all have tap/keyboard equivalents.

## 7. High-fidelity spec (existing tokens only)

- **Ghost:** real `BlockContent` at `opacity: 0.4; filter: saturate(0.6)`, boundary `1.5px dashed var(--acc)` at 45% alpha, `border-radius: 0` (it's a section), background untouched. Caption bar below: `--ed-panel` pill, 12px Inter 500, `--muted`, with `⌁` glyph in `--acc`. Accept: opacity 0.4→1 + the existing settle animation (translateY 8px→0, 300ms, `cubic-bezier(0.22,1,0.36,1)`) + drop-line flash. Dismiss: 120ms fade + height collapse.
- **Cycle (←/→):** crossfade 140ms; caption text swaps with 80ms stagger. No slides, no springs — matches product motion language.
- **Seam chips:** existing popover shell; chips are 92×64 live-render cards with the `.tpl`-style hover lift (2px), "because" line in `--muted` 12px italic (Instrument Serif — ties to marketing site's voice).
- **Gap pulse (F4):** the seam hairline pulses `--acc` at 30%→60%→30% over 1.8s, **once**, then rests as a dot. Never loops. `prefers-reduced-motion`: no pulse, dot only.
- **Empty/loading/error states:** inherited verbatim from previous proposal §4.13; predictions add one rule — *prediction failure renders as silence, never as an error*.

---

## 8. Component & code architecture

```
src/lib/blockDNA.js            // DNA records for all core blocks (data only)
src/lib/pageGrammar.js         // parse(blocks) → segments; gaps(); positionType()
src/lib/predict.js             // score(candidate, ctx); predict(ctx) → ranked+confidence+because
src/lib/contextSignals.js      // useContext signals: selection, neighbors, parse, siteType, blockMeta
src/lib/blockRegistry.js       // register()/query(); federates sources     (from prev. proposal)
src/lib/useBlockSearch.js      // search(query, ctx)                        (from prev. proposal)
src/lib/blockMeta.js           // favorites/recents/usage/dismissals        (from prev. proposal)
src/components/HorizonGhost.jsx    // renders prediction as pseudo-block; Tab/←→/✕
src/components/SeamChips.jsx       // L2 popover content (wraps BlockPicker mode="seam")
src/components/BlockPicker.jsx     // L3, unchanged design
```

**Editor integration is three seams, no rewrites:** (1) `Children` renders `<HorizonGhost>` after the last root block and at flagged gaps — it's outside the block array, so tree ops/undo/DnD never see it until accepted (acceptance = existing `insertAt`); (2) one keydown handler in `Editor` for Tab/←→/Esc when a ghost is focused and ⌘K/⌘L; (3) the left rail swap from the previous proposal. `BlockContent`, tree.js, Freeform, Inspector, DnD: **zero changes.**

**Performance strategy for 10k blocks:** DNA index built in a worker at boot (~ms); `predict()` recomputed only on structure change (insert/delete/move), not per keystroke or selection twitch, debounced through `requestIdleCallback`; ghost renders one component (not a list); chip previews render max 5, memoized, in an LRU cache keyed by `type+variant`; drawer grid virtualized; remote sources streamed and cached in IndexedDB; telemetry batched. Budgets: predict <5ms, search <5ms, ghost paint <16ms, picker open <120ms.

**Accessibility:** ghost is `role="button"`, `aria-label="Suggested: Stats section. Press Tab to add, arrow keys for alternatives, Escape to dismiss"`, announced via polite `aria-live`; never steals focus — Tab-accept only fires when canvas has focus and nothing is being edited (same guard as the existing Delete-key logic); chips/picker fully arrow-navigable with visible `--acc` focus rings; all hover affordances have keyboard + tap twins; dashed-ghost + `⌁` glyph carry meaning without color; reduced-motion collapses all animation to opacity; contrast on caption text ≥4.5:1.

---

## 9. Implementation roadmap

| Phase | Ships | Depends on | Size |
|---|---|---|---|
| **1. DNA + engines** | `blockDNA`, `pageGrammar`, `predict`, `contextSignals` — pure logic + tests, no UI | nothing | S |
| **2. Horizon** | ghost at page end + Tab/←→/dismiss + empty-page Blueprint state | 1 | M |
| **3. Seam chips** | context-first seam popover + gap pulse + dismissals | 1 | M |
| **4. Picker** | ⌘K + slim rail + drawer (previous proposal, context-boosted) | 1 | M–L |
| **5. Memory** | favorites/recents/usage wired into `personal()`; settings toggle for ghosts | 1–4 | S |
| **6. Backend era** | team libraries, marketplace, telemetry-learned weights (T1) | server | L |
| **7. Generation** | AI block generation (T2), then multi-ghost drafting (T3) | 6 | L |

Phases 1–5 run entirely on the current stack — no backend, no new deps (optionally `react-window` at Phase 4). Each phase is independently shippable and independently killable.

**Validation metrics from day one:** % inserts by layer (target: L1+L2 ≥ 70%), ghost acceptance rate (healthy: 40–60%; >80% means we're too conservative, <25% means noise), time-to-insert p50, dismissal recurrence (should be ~0), picker opens per session (should *fall* over time).

---

## 10. Why this is a new category

Wix gives you a warehouse. Webflow gives you a workshop. Framer gives you a fast workshop. All of them wait to be asked. **Aedes edits with you**: the page itself is the query, the canvas is the results list, and the whole catalog — 19 blocks today, 10,000 tomorrow, plus your team's, the marketplace's, and the AI's — compresses into one quiet question asked at exactly the right place and time: *"this next?"*

The library didn't get better. It disappeared.
