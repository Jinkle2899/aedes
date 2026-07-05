/*
 * Aedes Compose — deterministic generation (Tier 0, offline, $0).
 *
 * generate({ prompt, scope, siteKind, existingTypes }) -> { blocks, recipe, kind, scope }
 *
 * The registry is both the generation target and the validator: we only ever
 * produce a recipe of KNOWN block types, run it through validateRecipe (drop
 * unknowns, strip/coerce props, enforce grammar), then rebuild every block via
 * makeBlock so it is shaped identically to a user-dragged one. LLM tiers (1/2)
 * plug in behind this same signature — they just propose the recipe, which is
 * still funneled through validateRecipe. See docs/ai-generator-design.md.
 */
import { registry } from '../blocks/index.js'
import { makeBlock } from './store.js'
import { DNA } from './blockDNA.js'
import { SEGMENTS } from './pageGrammar.js'
import { predict } from './predict.js'
import { searchBlocks } from './blockSearch.js'

const BTN_STYLES = ['fill', 'outline', 'soft']

/* ---------------- intent detection ---------------- */

const KIND_HINTS = [
  [/\b(saas|software|app|platform|dashboard|api)\b/, 'SaaS'],
  [/\b(agency|marketing|consult)/, 'Agency'],
  [/\b(portfolio|designer|developer|resume|cv)\b/, 'Portfolio'],
  [/\b(studio|creative|photograph)/, 'Studio'],
  [/\b(boutique|shop|store|ecommerce|commerce)/, 'Boutique'],
  [/\b(restaurant|cafe|café|food|menu|coffee|bakery)/, 'Café & food'],
]

export function detectKind(prompt, fallback = null) {
  const s = (prompt || '').toLowerCase()
  for (const [re, kind] of KIND_HINTS) if (re.test(s)) return kind
  return fallback
}

/* Block types the prompt explicitly asks for, via the existing block search. */
/* Generic structural words that describe the request, not a block to add. */
const STOPWORDS = new Set(['section', 'page', 'website', 'site', 'block', 'design'])

export function detectRequestedTypes(prompt) {
  const s = (prompt || '').toLowerCase()
  const found = new Set()
  const phrase = searchBlocks(s)[0]
  if (phrase && phrase.score >= 70) found.add(phrase.type)
  for (const w of s.split(/[^a-zàâäéèêëïîôöùûüç]+/i).filter((x) => x.length > 2)) {
    if (STOPWORDS.has(w)) continue
    const top = searchBlocks(w)[0]
    if (top && top.score >= 70) found.add(top.type)
  }
  return [...found]
}

/* ---------------- planners (produce a raw recipe of {type, props}) ---------------- */

function insertByGrammar(types, t) {
  const seg = SEGMENTS.indexOf(DNA[t].grammar)
  let at = types.length
  for (let i = 0; i < types.length; i++) {
    const g = DNA[types[i]] && DNA[types[i]].grammar
    if (g && g !== 'utility' && SEGMENTS.indexOf(g) > seg) {
      at = i
      break
    }
  }
  if (types[types.length - 1] === 'footer' && at === types.length) at = types.length - 1
  types.splice(at, 0, t)
}

function planPage(prompt, kind) {
  const requested = new Set(detectRequestedTypes(prompt))
  requested.delete('navbar')
  requested.delete('hero')
  const types = ['navbar', 'hero']
  for (let i = 0; i < 12; i++) {
    const spec = types.map((t) => ({ type: t, props: {} }))
    const { candidates } = predict(spec, kind, null)
    if (!candidates.length) break
    const next = candidates.find((c) => requested.has(c.type)) || candidates[0]
    types.push(next.type)
    requested.delete(next.type)
    if (next.type === 'footer') break
  }
  if (!types.includes('footer')) types.push('footer')
  for (const t of requested) if (DNA[t] && !DNA[t].internal) insertByGrammar(types, t)
  return types.map((t) => ({ type: t, props: {} }))
}

function planSection(prompt, existingTypes) {
  const present = new Set(existingTypes || [])
  let picks = detectRequestedTypes(prompt).filter((t) => !(DNA[t] && DNA[t].singleton && present.has(t)))
  if (!picks.length) picks = ['text']
  return picks.map((t) => ({ type: t, props: {} }))
}

/* ---------------- validation & repair (registry-driven, pure) ---------------- */

function allowedKeys(type) {
  const d = registry.get(type)
  const keys = new Set(Object.keys(d.defaults || {}))
  for (const f of d.fields || []) {
    if (f.control === 'button') ['button', 'href', 'btnStyle'].forEach((k) => keys.add(k))
    else if (f.key) keys.add(f.key)
  }
  return keys
}

function coerceProps(type, props) {
  const d = registry.get(type)
  const defaults = d.defaults || {}
  const allowed = allowedKeys(type)
  const seg = {}
  const num = {}
  for (const f of d.fields || []) {
    if (f.control === 'seg') seg[f.key] = f.options
    if (f.control === 'number') num[f.key] = [f.min, f.max]
  }
  const out = {}
  for (const k of Object.keys(props || {})) {
    if (!allowed.has(k)) continue
    const v = props[k]
    if (seg[k]) {
      if (seg[k].includes(v)) out[k] = v
    } else if (num[k]) {
      out[k] = Math.min(num[k][1], Math.max(num[k][0], Number(v) || num[k][0]))
    } else if (k === 'btnStyle') {
      if (BTN_STYLES.includes(v)) out[k] = v
    } else if (k === 'href') {
      if (typeof v === 'string') out[k] = v
    } else if (k in defaults) {
      if (typeof defaults[k] === 'number') out[k] = Number(v) || defaults[k]
      else if (typeof defaults[k] === 'string') out[k] = String(v)
      else if (Array.isArray(defaults[k])) {
        if (Array.isArray(v)) out[k] = v
      } else out[k] = v
    }
  }
  return out
}

/* recipe -> cleaned [{ type, props, children? }] */
export function validateRecipe(recipe, opts = {}) {
  const specs = Array.isArray(recipe) ? recipe : recipe && recipe.blocks ? recipe.blocks : []
  const seen = new Set(opts.existingTypes || [])
  const out = []
  for (const spec of specs) {
    if (!spec || typeof spec.type !== 'string') continue
    const d = registry.get(spec.type)
    if (!d || d.internal) continue
    if (d.dna && d.dna.singleton && seen.has(spec.type)) continue
    seen.add(spec.type)
    const clean = { type: spec.type, props: coerceProps(spec.type, spec.props) }
    if (spec.type === 'section' && Array.isArray(spec.children)) {
      clean.children = validateRecipe({ blocks: spec.children })
    }
    out.push(clean)
  }
  return opts.scope === 'page' ? orderPage(out) : out
}

function orderPage(specs) {
  return specs
    .filter((s) => {
      const g = DNA[s.type] && DNA[s.type].grammar
      return g && g !== 'utility'
    })
    .sort((a, b) => SEGMENTS.indexOf(DNA[a.type].grammar) - SEGMENTS.indexOf(DNA[b.type].grammar))
}

/* cleaned recipe -> real editable blocks (identical shape to user-dragged) */
export function recipeToBlocks(specs) {
  return specs.map((s) => {
    const b = makeBlock(s.type)
    b.props = { ...b.props, ...JSON.parse(JSON.stringify(s.props || {})) }
    if (s.children && b.children) b.children = recipeToBlocks(s.children)
    return b
  })
}

/* ---------------- public entry ---------------- */

export function generate(intent = {}) {
  const { prompt = '', scope = 'section', siteKind = null, existingTypes = [] } = intent
  const kind = siteKind || detectKind(prompt)
  const planned = scope === 'page' ? planPage(prompt, kind) : planSection(prompt, existingTypes)
  const recipe = validateRecipe({ blocks: planned }, { scope, existingTypes })
  return { blocks: recipeToBlocks(recipe), recipe, kind, scope }
}
