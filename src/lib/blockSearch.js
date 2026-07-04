/* Ranked block search: label prefix > word boundary > alias > substring > hint. */
import { BLOCK_DEFS, BLOCK_TYPES } from './store.js'
import { registry } from '../blocks/index.js'

/* Intent synonyms — most of "AI search" for none of the cost.
   Now sourced from each block's `aliases` in the registry.
   (Tier upgrade: fold into Block DNA + embeddings behind this same API.) */
const ALIASES = registry.toAliases()

export function searchBlocks(query, counts = {}) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results = []
  for (const type of BLOCK_TYPES) {
    const label = BLOCK_DEFS[type].label.toLowerCase()
    const hint = (BLOCK_DEFS[type].hint || '').toLowerCase()
    const aliases = ALIASES[type] || []
    let score = 0
    if (label.startsWith(q)) score = 100
    else if (label.split(' ').some((w) => w.startsWith(q))) score = 80
    else if (aliases.some((a) => a.startsWith(q) || a.split(' ').some((w) => w.startsWith(q)))) score = 70
    else if (label.includes(q)) score = 60
    else if (aliases.some((a) => a.includes(q))) score = 50
    else if (hint.includes(q)) score = 40
    if (score > 0) results.push({ type, score: score + Math.min(counts[type] || 0, 10) })
  }
  return results.sort((a, b) => b.score - a.score)
}
