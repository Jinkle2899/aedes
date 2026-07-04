/* Tree helpers for nested blocks. A block: { id, type, props, children?: Block[] } */

export function findById(blocks, id) {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.children) {
      const r = findById(b.children, id)
      if (r) return r
    }
  }
  return null
}

/* Returns { parentId, index } of a block (parentId null = root level) */
export function findParent(blocks, id, parentId = null) {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.id === id) return { parentId, index: i }
    if (b.children) {
      const r = findParent(b.children, id, b.id)
      if (r) return r
    }
  }
  return null
}

/* Returns [newTree, removedBlock|null] */
export function removeById(blocks, id) {
  const out = []
  let removed = null
  for (const b of blocks) {
    if (b.id === id) {
      removed = b
      continue
    }
    if (b.children) {
      const [ch, r] = removeById(b.children, id)
      if (r) removed = r
      out.push({ ...b, children: ch })
    } else {
      out.push(b)
    }
  }
  return [out, removed]
}

/* Insert block at index inside parentId's children (null = root) */
export function insertAt(blocks, parentId, index, block) {
  if (parentId === null) {
    const c = [...blocks]
    c.splice(Math.max(0, Math.min(index, c.length)), 0, block)
    return c
  }
  return blocks.map((b) => {
    if (b.id === parentId) {
      const ch = [...(b.children || [])]
      ch.splice(Math.max(0, Math.min(index, ch.length)), 0, block)
      return { ...b, children: ch }
    }
    if (b.children) return { ...b, children: insertAt(b.children, parentId, index, block) }
    return b
  })
}

export function updateProps(blocks, id, patch) {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, props: { ...b.props, ...patch } }
    if (b.children) return { ...b, children: updateProps(b.children, id, patch) }
    return b
  })
}

/* Path from root to the block (inclusive). Returns [] if not found. */
export function findPath(blocks, id) {
  for (const b of blocks) {
    if (b.id === id) return [b]
    if (b.children) {
      const r = findPath(b.children, id)
      if (r.length) return [b, ...r]
    }
  }
  return []
}

/* Deep clone with fresh ids (for duplicate) */
export function regenIds(block) {
  const nb = { ...block, id: Math.random().toString(36).slice(2, 10), props: JSON.parse(JSON.stringify(block.props)) }
  if (nb.children) nb.children = nb.children.map(regenIds)
  return nb
}
