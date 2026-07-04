# Block Library — UX Redesign

*Scope: Block Library / Insert Component experience only. The editor, canvas, blocks, and inspector are untouched. Everything here reuses the existing design tokens (`--ed-bg`, `--ed-panel`, `--ed-line`, `--acc`, the `cubic-bezier(0.22, 1, 0.36, 1)` motion curve, Inter, the dark chrome / white canvas split).*

---

## 1. Why the current palette fails at scale

The current left rail is a flat, always-visible list of 19 draggable cards. It works because 19 items fit on one screen. Its failure modes at 2,000 blocks are structural, not cosmetic:

- **Linear scan is the only discovery mechanism.** Finding a block is O(n) eyeball work. At 100+ items this exceeds the 5-second budget for everyone.
- **No memory.** The list doesn't know what you use, what you used last, or what you're building. Every visit starts from zero.
- **One namespace.** Core blocks, user blocks, team blocks, marketplace blocks, and AI output would all pile into one scroll.
- **Permanent screen tax.** 250px of horizontal space is spent 100% of the time on a tool used ~2% of the time.
- **Drag is the only insert.** Drag requires the destination to be on screen — brutal on long pages.

The 5-second budget breaks down into: *recall or express intent* (~2s) → *system responds* (<200ms) → *confirm and insert* (~1s). Any design where browsing is on the critical path fails. **Search, memory, and context must be the primary paths; browsing is the fallback.**

---

## 2. Five concepts

### Concept A — "The Conjurer" (command-palette-first)

Raycast/Linear model. The library has no permanent UI. `⌘K` (or typing `/` on the canvas) summons a centered palette: type-ahead fuzzy search over everything, `↑↓ Enter` to insert at the current selection point. Empty query shows Recents + AI suggestions. Categories are search tokens (`#marketing`), sources are facets (`@team`). The left rail shrinks to a slim strip of pinned favorites.

- **Why it works:** search is the only interaction that is O(1) in library size. Keyboard-native, zero screen tax, sub-2-second inserts for known items.
- **Strengths:** fastest possible path; scales to millions of items; trivially extended with new sources (they're just facets).
- **Weaknesses:** terrible *discovery* — beginners don't know what to type; text rows undersell visual blocks; drag-out of a modal is awkward.
- **Scalability:** ★★★★★ **Complexity:** ★★☆ (medium-low)
- **Beginner:** ★★☆ — intimidating blank field. **Power user:** ★★★★★

### Concept B — "The Atelier" (full-bleed visual library)

Figma-Assets / App-Store model. A `Library` button (and `⌘L`) slides a large drawer over the left 60% of the canvas: live-rendered block previews in a rich grid, a category rail, curated collections ("Landing essentials", "E-commerce kit"), tabs for Core / Yours / Team / Marketplace / AI. Blocks are browsed like products, with hover previews and one-click or drag insert.

- **Why it works:** visual blocks deserve visual browsing; the only model that makes a *marketplace* feel native; room for metadata, authors, ratings.
- **Strengths:** best-in-class discovery and inspiration; obvious home for collections, teams, marketplace.
- **Weaknesses:** heavyweight for the 90% case ("I need a spacer"); covers the canvas; browsing ≠ fast.
- **Scalability:** ★★★★☆ **Complexity:** ★★★★ (medium-high)
- **Beginner:** ★★★★★ **Power user:** ★★☆ — too many pixels between intent and insert.

### Concept C — "The Seam" (contextual insertion)

Notion's `/` turned spatial. There is no library panel at all. Hovering the gap between any two blocks reveals a thin `+` seam; clicking opens a compact popover *at that exact spot*: a search field, your recents, and — the key move — **AI-ranked "what usually comes next"** based on the neighbors (after a hero: features, stats, logos; before a footer: CTA, form). Insertion point is implicit; nothing is ever dragged.

- **Why it works:** zero distance between intent and placement; context makes recommendations genuinely smart instead of decorative; the empty-page case becomes a guided build.
- **Strengths:** most beginner-friendly; makes the AI promise tangible; kills the drag-targeting problem entirely.
- **Weaknesses:** a small popover can't browse 2,000 blocks; still needs a full library somewhere; hover affordances are invisible until discovered.
- **Scalability:** ★★★☆ alone **Complexity:** ★★★
- **Beginner:** ★★★★★ **Power user:** ★★★★ (mouse-bound)

### Concept D — "The Librarian" (AI-prompt-first)

Describe-what-you-need model. The primary insert surface is a prompt bar: "a pricing section with three tiers and a toggle" → the system returns the three closest existing blocks *and* an offer to AI-generate a new one; pick and insert. Search and browse are demoted to secondary.

- **Why it works:** semantic retrieval is the only interface that stays constant from 19 blocks to infinity, and it doubles as the generation UI.
- **Strengths:** perfectly aligned with the "AI drafts your site" brand; handles the long tail; naturally absorbs AI-generated blocks.
- **Weaknesses:** typing a sentence is *slower* than typing "tabs" for known items; non-deterministic results erode trust; requires a real model + embeddings backend on day one.
- **Scalability:** ★★★★★ **Complexity:** ★★★★★ (needs backend)
- **Beginner:** ★★★★ **Power user:** ★★☆ — power users know names; sentences are overhead.

### Concept E — "The Deck" (spatial shelf)

Arc-flavored original: a bottom dock of block *decks* (one per category) fanned like cards. Scrubbing a deck fans out its blocks as large previews above the dock; favorites live as loose cards pinned at the dock's edge; throwing a card up flicks it onto the canvas.

- **Why it works:** tactile and genuinely novel; canvas keeps full width; categories become muscle-memory locations.
- **Strengths:** memorable, delightful, demo-gold.
- **Weaknesses:** horizontal space caps category count; scrubbing scales worse than scrolling; fights the canvas's vertical scroll; high gimmick risk once the novelty fades.
- **Scalability:** ★★☆ **Complexity:** ★★★★
- **Beginner:** ★★★ **Power user:** ★★☆

---

## 3. Recommendation — "One Picker, Three Doors"

No single concept wins both ends: A is unbeatable for speed, B for discovery, C for context. The losing move is picking one. The winning move is noticing they can be **the same component opened three ways**.

> **One BlockPicker. One search index. One block metadata model. Three doors.**

| Door | Trigger | Shell | Optimizes |
|---|---|---|---|
| **Command** | `⌘K`, or `/` on canvas | Centered palette (Concept A) | Speed, power users |
| **Seam** | `+` between blocks | Anchored popover (Concept C) | Context, beginners |
| **Browse** | "All blocks" button, `⌘L`, or "Browse all →" from either door | Full drawer (Concept B) | Discovery, marketplace |

The same search, ranking, recents, favorites, previews, and insert logic run in all three; only the shell and the default (empty-query) content differ. The left rail survives as a **6-item strip: pinned favorites + recents + the "All blocks" button** — familiar, still draggable, no longer load-bearing.

**Why this never needs redesigning again:** every future source — custom blocks, team libraries, marketplace, AI generations, plugins — is just *new rows in the registry with a different `source` facet*. They appear in search, in seam suggestions, and as drawer tabs automatically. The shells never change; only the index grows.

---

## 4. Detailed interaction design

### 4.1 The registry (foundation)

Every insertable thing is one record:

```js
{
  id: 'accordion',            // or 'user:xj3k', 'market:pro-faq-2'
  label: 'Accordion',
  aliases: ['faq', 'expandable', 'collapse', 'questions'],
  category: 'interactive',    // layout | typography | media | forms | marketing | interactive | navigation
  source: 'core',             // core | custom | team | market | ai
  keywords: 'q&a toggle expand',
  make: () => Block | recipe, // core: makeBlock(type); composite: recipe of blocks
  favorite: false,            // persisted per user
  usageCount: 0, lastUsedAt: 0,
}
```

Search ranking (top → bottom): exact label prefix → word-boundary match → alias match → fuzzy label → keyword. Ties broken by `usageCount` with a recency boost. A `context` argument (the block types adjacent to the insertion point) adds a rank boost from the adjacency table (§4.6). Sync and instant for core/custom; remote sources merge in as they resolve (§4.13).

### 4.2 Opening

- `⌘K` (and `Ctrl+K`) anywhere in the editor → Command door. Opens in ≤120ms: overlay fades in (opacity 0→1), panel scales 0.98→1, both on the existing `cubic-bezier(0.22,1,0.36,1)`. Search focused, caret ready. Insertion target = after the currently selected block (or end of page).
- `/` when the canvas has focus and no text is being edited → same thing. (Muscle memory from Notion transfers for free.)
- **Seam:** hovering the horizontal gap between any two blocks (or above the first / below the last) for 150ms reveals a hairline in `--acc` blue with a centered `+` chip — the same visual weight as the existing drop-line, so it reads as family. Click → picker popover anchored to that seam, insertion target = exactly there.
- `⌘L` or the rail's "All blocks" → Browse door: drawer slides over the canvas from the left edge, 560px wide (canvas stays partially visible and live).
- `Esc` closes any door. Focus returns to the canvas selection.

### 4.3 Search behavior

- Instant, per-keystroke, no debounce for local sources (<1ms for thousands of records with the ranking above).
- Fuzzy but conservative: `accrd` finds Accordion; `xzq` finds nothing (better empty than wrong).
- **Intent synonyms ship in `aliases`** — "faq" → Accordion, "timer" → Countdown, "testimonial" → Quote, "menu" → Navbar. This is 80% of "AI search" for 0% of the cost, and the semantic-embedding upgrade slots in behind the same API later.
- Tokens: `#forms` filters category, `@team` filters source. Typed or clicked (chips under the input).
- Empty query is never empty (§4.7).
- Results cap at 8 in Command/Seam doors (information overload is a design failure, not a data problem — "Browse all →" is always the 9th row). The drawer shows everything, virtualized.

### 4.4 Keyboard

| Key | Action |
|---|---|
| `↑ ↓` | move selection |
| `Enter` | insert, close, select + scroll to the new block on canvas |
| `⌘Enter` | insert **and keep the picker open**, target advances to after the inserted block — this is multi-insert: hero `⌘Enter`, features `⌘Enter`, cta `Enter`, and a page exists in ten seconds |
| `→` | toggle the preview flyout for the highlighted row |
| `⌘F` | favorite/unfavorite highlighted row |
| `1–9` | insert nth result directly |
| `Esc` | close |

### 4.5 Previews

Aedes has an advantage no marketplace screenshots can match: **blocks are renderable components.** The preview *is* the block — `<BlockContent>` rendered with default props inside a 280px-wide, `pointer-events: none`, `transform: scale()` frame on the white canvas background. Always current, zero image pipeline, works for AI-generated blocks the moment they exist.

- Command/Seam doors: hovering a row 200ms (or pressing `→`) opens the preview as a flyout card beside the panel.
- Drawer: previews *are* the grid cells (scaled live renders), with label + source badge below. Hover lifts the card 2px and plays the block's own animation (countdown ticks, rotator cycles) — the library literally feels alive.

### 4.6 AI recommendations (context engine)

Recommendations are ranked by a transparent adjacency model, not a black box:

- **Adjacency table** (editorial, shipped): `hero → [features, stats, logos, text]`, `features → [stats, quote, cta]`, `quote → [cta, pricing]`, `* → footer` when none exists, `navbar` suggested only at index 0…
- **Page-state rules:** never suggest a second navbar/footer; suggest `form` if page has CTA but no form; suggest `spacer` rarely.
- **Personal usage:** blend in the user's own most-inserted follow-ons over time.

In the Seam door these appear as the top group, labeled **"Suggested here"** with a subtle `--acc` tick icon. In the Command door they seed the empty-query state. Later, a real model can re-rank the same list — the UI contract doesn't change. Long-term, "Generate with AI" (§4.12) is also just a row.

### 4.7 Empty query = memory

Empty-query state, in order: **Suggested here** (seam context, ≤3) → **Recents** (last 8, auto-tracked) → **Favorites** (starred, user-ordered) → **Browse all →**. A brand-new user with no history sees a curated starter set (hero, text, image, features, cta) instead of recents. Nothing is ever a blank void.

### 4.8 Favorites & the rail

- Star on hover (rows and grid cells), `⌘F` from keyboard. Persisted in `localStorage` (`aedes:blockMeta`), later synced to account.
- The slim rail shows favorites (up to 6) + 2 most-recent, as the same mini-cards as today — **still draggable onto the canvas with the existing drop-line behavior, unchanged.** The rail is a cache of the library, not the library.

### 4.9 Insert & drag

- Click/Enter inserts at the door's target (seam position, after-selection, or page end from the drawer), using the existing `insertAt`/tree ops untouched. New block gets selected; canvas smooth-scrolls to it; it plays a one-time 300ms "settle" (translateY 8px→0 + the drop-line flash) so the eye lands where the work continued.
- Drag remains fully supported from the rail and the drawer grid (same `dragRef` + drop-line machinery). The Command/Seam doors are click/keyboard-only by design — they exist to *eliminate* the aim-and-drag cost.

### 4.10 Categories & the drawer

Drawer layout: left mini-rail of category chips with counts (All · Layout · Typography · Media · Forms · Marketing · Interactive · Navigation), source tabs across the top (**Core · Yours · Team · Marketplace · AI**), search box shared with the other doors. Below, before any scrolling: **Collections** — hand-curated rows ("Landing essentials", "Portfolio kit", "E-commerce basics") that insert *sets* (they're just recipes, same as templates). Grid is virtualized (`react-window` or equivalent) — 2,000 cells never mount at once.

### 4.11 Sources: custom, team, marketplace

- **Custom blocks:** "Save as block" lands in **Yours** (`source: custom`) — full search/favorite/preview parity from day one, since a saved block is just a registry record whose `make` returns a deep-cloned subtree.
- **Team:** same records, `source: team`, namespaced (`acme/pricing-v2`), synced via backend later; a small avatar badge on the card. Read-only vs editable is a permission bit on the record, not new UI.
- **Marketplace:** same cards + price/author/install state. Installing = copying the record (and recipe) into the local registry. Not-installed items are searchable but gated behind an Install button — discovery drives the store without polluting inserts.

### 4.12 AI-generated blocks

"Generate with AI" appears as the last row of every no-result state and as a persistent chip in the drawer's AI tab. Flow: query becomes the prompt → skeleton card while generating → preview rendered live → **Insert / Regenerate / Save to Yours**. Generated blocks are `source: ai` registry records; saving promotes them to `custom`. The library UX doesn't special-case them anywhere else — that's the point.

### 4.13 States

- **Loading:** core/custom sources are synchronous — no spinner ever. Remote sources (team/market) show 3 shimmer skeleton cards in their section while resolving; results merge in without reflowing the user's current keyboard selection.
- **Empty search:** "No blocks match *'xyz'*" + did-you-mean chips (closest 3 by fuzzy distance) + "Generate '*xyz*' with AI" + "Browse all". Never a dead end.
- **Empty page (canvas):** the current "Drag your first block here" area becomes a first-class seam: a large `+ Add your first block` target opening the Seam door with the starter set.
- **Error (remote source down):** inline row in that section only — "Marketplace unavailable · Retry". Core library never blocks on network.
- **Reduced motion:** all transitions drop to opacity-only, previews render static.

### 4.14 Responsive

Below 900px (where the panels already collapse): rail hidden; a floating `+` FAB opens the picker as a bottom sheet (Seam door behavior, full-width, thumb-reachable), search on top, suggestions/recents as large touch rows. The drawer becomes a full-screen sheet. Same component, fourth shell — the architecture absorbs it.

---

## 5. Component architecture (fits the current codebase)

```
src/lib/blockRegistry.js     // records for all BLOCK_TYPES + aliases/categories; register() API for future sources
src/lib/useBlockSearch.js    // (query, context) -> ranked results; pure, testable
src/lib/blockMeta.js         // favorites/recents/usage persistence (localStorage aedes:blockMeta)
src/components/BlockPicker.jsx   // one component; prop mode: 'command' | 'seam' | 'drawer' | 'sheet'
src/components/BlockCard.jsx     // row + cell variants; star, badge, drag source
src/components/BlockPreview.jsx  // scaled live render of BlockContent (reuses existing renderers)
src/components/Seam.jsx          // hover-gap + trigger, rendered by Children between blocks
```

**Editor diffs are small:** `Children` renders `<Seam>` between blocks (beside the existing drop-line logic); a `⌘K`/`/`/`⌘L` key handler + picker state in `Editor`; the palette markup in `ed-left` shrinks to favorites/recents + "All blocks". `BlockContent`, tree ops, DnD, Inspector: **zero changes.** Everything uses existing tokens; the only new visual primitives are the overlay scrim (`rgba(10,10,11,0.6)` + blur, same as `.nav`'s backdrop language) and the seam chip (drop-line blue).

**Phasing:**
1. Registry + metadata + `useBlockSearch` (pure logic, no UI risk)
2. Command door (`⌘K`) + slim rail — the speed win
3. Seam door + adjacency suggestions — the context win
4. Drawer with virtualized grid + collections — the discovery win
5. (Backend era) team/market/AI sources merge into the same index

---

## 6. The 5-second test, re-run

| Scenario | Path | Time |
|---|---|---|
| Power user knows the name | `⌘K` → "acc" → `Enter` | **~1.5s** |
| Beginner, doesn't know names | seam `+` → "Suggested here" → click | **~3s** |
| "Something for testimonials" | `⌘K` → "testimonial" → alias hit → `Enter` | **~2s** |
| Browsing for inspiration | `⌘L` → collections → hover previews | untimed by design |
| Build a page from nothing | `⌘K` → `⌘Enter` ×4 | **~10s for a full page** |

Every path stays constant-time as the library grows from 19 to 2,000 to 20,000 — that's the property that means we never redesign this again.
