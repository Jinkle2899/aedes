/*
 * Prediction engine (Tier 0 — deterministic, offline, explainable).
 *
 * predict(blocks, siteKind) → {
 *   show: boolean,              // confidence gate for the Horizon ghost
 *   candidates: [{ type, score, because }],   // top 3, ranked
 * }
 *
 * Scoring:  0.40 pair-adjacency + 0.30 grammar fit + 0.20 popularity
 *           + 0.08 site-type affinity − repeat penalty
 * The weights are editorial (Tier 0); Tier 1 learns them from telemetry,
 * Tier 2 adds LLM re-ranking — behind this same function signature.
 */
import { DNA } from './blockDNA.js'
import { parse, SEGMENTS, SEGMENT_PHRASES } from './pageGrammar.js'

const TOP_N = 3
const SHOW_SCORE = 0.55
const SHOW_MARGIN = 0.12
const SHOW_OVERRIDE = 0.7 // strong top score shows even with close #2

/* Personal usage boost: up to +0.08 for a user's habitual blocks */
function personal(type, counts) {
  if (!counts) return 0
  return 0.08 * Math.min(counts[type] || 0, 10) / 10
}

export function predict(blocks, siteKind = null, counts = null) {
  const page = parse(blocks)

  /* Page complete: footer is the last flow block → the chain ends. */
  if (page.last && page.last.type === 'footer') {
    return { show: false, candidates: [] }
  }

  const lastIdx = page.lastSegment ? SEGMENTS.indexOf(page.lastSegment) : -1
  const results = []

  for (const type of Object.keys(DNA)) {
    const d = DNA[type]
    if (d.internal || d.grammar === 'utility') continue
    if (d.singleton && page.present.has(type)) continue
    if (page.last && page.last.type === type) continue // never same block twice in a row

    let score = 0
    let because = null

    /* 1. Pair adjacency (Block DNA) */
    if (page.last && d.after.includes(page.last.type)) {
      score += 0.4
      because = `usually follows ${DNA[page.last.type].label.toLowerCase()}`
    }
    if (!page.last && type === 'navbar') {
      score += 0.4
      because = 'pages start with navigation'
    }

    /* 2. Grammar fit */
    const gi = SEGMENTS.indexOf(d.grammar)
    let fit
    if (!page.last) {
      fit = type === 'navbar' ? 1 : type === 'hero' ? 0.85 : 0.2
    } else if (gi === lastIdx) {
      fit = 0.8
    } else if (gi === lastIdx + 1) {
      fit = 1
    } else if (gi === lastIdx + 2) {
      fit = 0.45
    } else {
      fit = 0.15
    }
    /* Footer only makes sense once a page exists */
    if (type === 'footer' && page.flow.length < 4) fit = Math.min(fit, 0.2)
    score += 0.3 * fit
    if (!because && fit >= 1 && SEGMENT_PHRASES[d.grammar]) {
      because = SEGMENT_PHRASES[d.grammar]
    }

    /* 3. Popularity prior */
    score += 0.2 * d.pop

    /* 4. Site-type affinity */
    if (siteKind && d.kinds && d.kinds.includes(siteKind)) {
      score += 0.08
      if (!because) because = `popular on ${siteKind.toLowerCase()} sites`
    }

    /* 5. Personal habits */
    score += personal(type, counts)

    /* 6. Repeat discouragement (non-singletons already on the page) */
    if (page.present.has(type)) score -= 0.25

    results.push({ type, score, because: because || 'a popular next step' })
  }

  results.sort((a, b) => b.score - a.score)
  const top = results.slice(0, TOP_N)
  const show =
    top.length > 0 &&
    top[0].score >= SHOW_SCORE &&
    (top.length < 2 || top[0].score - top[1].score >= SHOW_MARGIN || top[0].score >= SHOW_OVERRIDE)

  return { show, candidates: top }
}

/*
 * Position-aware prediction for seams: what belongs BETWEEN
 * blocks[index-1] and blocks[index]? Returns top 5.
 */
export function predictAt(blocks, index, siteKind = null, counts = null) {
  const prev = index > 0 ? blocks[index - 1] : null
  const next = index < blocks.length ? blocks[index] : null
  const page = parse(blocks)

  const prevIdx = prev && DNA[prev.type] && DNA[prev.type].grammar !== 'utility'
    ? SEGMENTS.indexOf(DNA[prev.type].grammar)
    : -1
  const nextIdx = next && DNA[next.type] && DNA[next.type].grammar !== 'utility'
    ? SEGMENTS.indexOf(DNA[next.type].grammar)
    : SEGMENTS.length

  const results = []
  for (const type of Object.keys(DNA)) {
    const d = DNA[type]
    if (d.internal || d.grammar === 'utility') continue
    if (d.singleton && page.present.has(type)) continue
    if (prev && prev.type === type) continue
    if (next && next.type === type) continue
    if (type === 'footer' && next) continue // footer only ever last
    if (type === 'navbar' && index !== 0) continue // navbar only ever first

    let score = 0
    let because = null

    /* Pair adjacency, both directions */
    if (prev && d.after.includes(prev.type)) {
      score += 0.35
      because = `usually follows ${DNA[prev.type].label.toLowerCase()}`
    }
    if (!prev && type === 'navbar') {
      score += 0.35
      because = 'pages start with navigation'
    }
    if (next && DNA[next.type] && DNA[next.type].after.includes(type)) {
      score += 0.25
      if (!because) because = `fits before ${DNA[next.type].label.toLowerCase()}`
    }

    /* Grammar fit: candidate's segment should sit between neighbors' segments */
    const gi = SEGMENTS.indexOf(d.grammar)
    let fit
    if (gi >= prevIdx && gi <= nextIdx) fit = 1
    else if (gi === prevIdx - 1 || gi === nextIdx + 1) fit = 0.4
    else fit = 0.1
    score += 0.3 * fit
    if (!because && fit >= 1 && SEGMENT_PHRASES[d.grammar]) because = SEGMENT_PHRASES[d.grammar]

    score += 0.2 * d.pop
    if (siteKind && d.kinds && d.kinds.includes(siteKind)) score += 0.08
    score += personal(type, counts)
    if (page.present.has(type)) score -= 0.25

    results.push({ type, score, because: because || 'a popular choice' })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 5)
}

/*
 * Structural gaps worth surfacing (proof / conversion only), each mapped
 * to the seam index where the missing segment belongs.
 */
export function gapSeams(blocks) {
  const page = parse(blocks)
  if (page.flow.length < 3) return []
  const LABELS = { proof: 'social proof', conversion: 'a call to action' }
  const out = []
  for (const seg of ['proof', 'conversion']) {
    if (page.segments.has(seg)) continue
    const segIdx = SEGMENTS.indexOf(seg)
    /* insert before the first block belonging to a LATER segment */
    const at = blocks.findIndex((b) => {
      const g = DNA[b.type] && DNA[b.type].grammar
      return g && g !== 'utility' && SEGMENTS.indexOf(g) > segIdx
    })
    if (at > 0) out.push({ segment: seg, label: LABELS[seg], index: at })
  }
  return out
}
