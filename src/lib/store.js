/* Site storage — localStorage-backed, no backend needed for the prototype */

import { registry } from '../blocks/index.js'

const KEY = 'aedes:sites'

export const uid = () => Math.random().toString(36).slice(2, 10)

export function loadSites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function saveSites(sites) {
  localStorage.setItem(KEY, JSON.stringify(sites))
}

export function saveSite(site) {
  const sites = loadSites()
  const i = sites.findIndex((s) => s.id === site.id)
  if (i === -1) sites.unshift(site)
  else sites[i] = site
  saveSites(sites)
}

/* ---------------- Block definitions ----------------
 * Sourced from the Block Registry (src/blocks). BLOCK_DEFS / BLOCK_TYPES keep
 * their historical shape so existing consumers are untouched. Add or edit a
 * block in src/blocks/types — not here.
 */
export const BLOCK_DEFS = registry.toBlockDefs()

export const BLOCK_TYPES = registry.blockTypes

export const emptyColumn = () => ({ id: uid(), type: 'column', props: {}, children: [] })

export function makeBlock(type) {
  const b = { id: uid(), type, props: JSON.parse(JSON.stringify(BLOCK_DEFS[type].defaults)) }
  if (type === 'section') b.children = []
  if (type === 'columns') b.children = [emptyColumn(), emptyColumn()]
  if (type === 'countdown') b.props.target = new Date(Date.now() + 14 * 864e5).toISOString()
  return b
}

export function starterBlocks() {
  const blocks = ['navbar', 'hero', 'canvas'].map(makeBlock)

  /* Showcase nesting: a section containing two columns of text */
  const section = makeBlock('section')
  const cols = makeBlock('columns')
  const t1 = makeBlock('text')
  t1.props = { ...t1.props, heading: 'Side by side', body: 'Columns can hold any block. Drag more in from the palette, or change the column count in the Inspector.' }
  const t2 = makeBlock('text')
  t2.props = { ...t2.props, heading: 'Fully nested', body: 'Sections contain blocks. Columns contain blocks. Drag things between them freely.' }
  cols.children[0].children.push(t1)
  cols.children[1].children.push(t2)
  section.children.push(cols)
  blocks.push(section)

  blocks.push(...['features', 'text', 'cta', 'footer'].map(makeBlock))
  return blocks
}

export function createSite(name = 'Untitled site') {
  const site = { id: uid(), name, updatedAt: Date.now(), blocks: starterBlocks() }
  saveSite(site)
  return site
}

/* Create a site seeded from a template recipe: [{ type, props }] */
export function createSiteFromRecipe(name, recipe, kind = null) {
  const blocks = recipe.map((r) => {
    const b = makeBlock(r.type)
    b.props = { ...b.props, ...JSON.parse(JSON.stringify(r.props || {})) }
    return b
  })
  const site = { id: uid(), name, kind, updatedAt: Date.now(), blocks }
  saveSite(site)
  return site
}

export function deleteSite(id) {
  saveSites(loadSites().filter((s) => s.id !== id))
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'my-site'
  )
}
