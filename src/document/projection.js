/*
 * Projection bridge between the normalized document and the nested block tree.
 *
 * The V2 source of truth is the normalized Doc; the current renderer,
 * persistence (db.js) and prediction still consume the nested `blocks[]`.
 * toNested() derives that shape so the UI is untouched this increment.
 * Requirement: toNested(fromNested(blocks)) === blocks (verified).
 */

export function fromNested(blocks, meta = {}) {
  const byId = {}
  const parentOf = {}
  const walk = (n, pid) => {
    const has = Array.isArray(n.children)
    byId[n.id] = {
      id: n.id,
      type: n.type,
      props: n.props,
      ...(n.layout ? { layout: n.layout } : {}),
      ...(has ? { childIds: n.children.map((c) => c.id) } : {}),
    }
    parentOf[n.id] = pid
    if (has) n.children.forEach((c) => walk(c, n.id))
  }
  blocks.forEach((b) => walk(b, null))
  return { byId, parentOf, rootIds: blocks.map((b) => b.id), meta: { ...meta } }
}

export function toNested(doc) {
  const build = (id) => {
    const n = doc.byId[id]
    const out = { id: n.id, type: n.type, props: n.props }
    if (n.layout) out.layout = n.layout
    if (n.childIds) out.children = n.childIds.map(build)
    return out
  }
  return doc.rootIds.map(build)
}

/* Doc -> the site object shape used by db.js / the editor. */
export function toSite(doc) {
  return { ...doc.meta, blocks: toNested(doc) }
}
