/*
 * Normalized document model (V2 foundation).
 *
 * Doc = {
 *   byId:     { [id]: { id, type, props, childIds?: string[] } },
 *   parentOf: { [id]: string | null },   // null = top level
 *   rootIds:  string[],
 *   meta:     { id, name, kind, font, updatedAt },
 * }
 *
 * Nodes reference children by id (not by nesting) so access is O(1), views can
 * subscribe to a single id, and the graph is CRDT-ready. Read via these
 * selectors only; mutate only through commands (src/commands).
 */

export const clamp = (i, lo, hi) => Math.max(lo, Math.min(i, hi))

export const getNode = (doc, id) => doc.byId[id]
export const getChildIds = (doc, id) => (doc.byId[id] && doc.byId[id].childIds) || []
export const parentOf = (doc, id) => doc.parentOf[id]

export const siblingsOf = (doc, id) => {
  const p = doc.parentOf[id]
  return p === null || p === undefined ? doc.rootIds : doc.byId[p].childIds || []
}

export const indexOf = (doc, id) => siblingsOf(doc, id).indexOf(id)

/* Is `maybeId` inside the subtree rooted at `ancestorId` (or equal)? */
export function isDescendant(doc, ancestorId, maybeId) {
  let p = maybeId
  while (p !== null && p !== undefined) {
    if (p === ancestorId) return true
    p = doc.parentOf[p]
  }
  return false
}

/* Reconstruct the nested {id,type,props,children?} subtree for one node. */
export function buildNested(doc, id) {
  const n = doc.byId[id]
  const out = { id: n.id, type: n.type, props: n.props }
  if (n.childIds) out.children = n.childIds.map((c) => buildNested(doc, c))
  return out
}
