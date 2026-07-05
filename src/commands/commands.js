/*
 * Command catalog — the ONLY way to mutate the document.
 *
 * applyCommand(doc, command) -> { doc, inverse }
 *
 * Every command is a plain serializable object and returns its exact inverse
 * (captured at apply time), so undo/redo, AI, and multiplayer later reuse this
 * one catalog. Reducers are pure and immutable (structural sharing).
 */
import { clamp, buildNested, isDescendant, indexOf } from '../document/model.js'
import { emptyColumn } from '../lib/store.js'

/* ---------------- immutable structural helpers ---------------- */

function addSubtree(doc, node, parentId) {
  const byId = { ...doc.byId }
  const parentOf = { ...doc.parentOf }
  const walk = (n, pid) => {
    const has = Array.isArray(n.children)
    byId[n.id] = { id: n.id, type: n.type, props: n.props, ...(has ? { childIds: n.children.map((c) => c.id) } : {}) }
    parentOf[n.id] = pid
    if (has) n.children.forEach((c) => walk(c, n.id))
  }
  walk(node, parentId)
  return { ...doc, byId, parentOf }
}

function removeSubtree(doc, id) {
  const byId = { ...doc.byId }
  const parentOf = { ...doc.parentOf }
  const walk = (nid) => {
    const n = byId[nid]
    if (n && n.childIds) n.childIds.forEach(walk)
    delete byId[nid]
    delete parentOf[nid]
  }
  walk(id)
  return { ...doc, byId, parentOf }
}

function linkChild(doc, parentId, index, id) {
  if (parentId === null) {
    const r = [...doc.rootIds]
    r.splice(clamp(index, 0, r.length), 0, id)
    return { ...doc, rootIds: r }
  }
  const p = doc.byId[parentId]
  const c = [...(p.childIds || [])]
  c.splice(clamp(index, 0, c.length), 0, id)
  return { ...doc, byId: { ...doc.byId, [parentId]: { ...p, childIds: c } } }
}

function unlinkChild(doc, parentId, id) {
  if (parentId === null) return { ...doc, rootIds: doc.rootIds.filter((x) => x !== id) }
  const p = doc.byId[parentId]
  return { ...doc, byId: { ...doc.byId, [parentId]: { ...p, childIds: (p.childIds || []).filter((x) => x !== id) } } }
}

/* ---------------- reducers ---------------- */

export function applyCommand(doc, command) {
  switch (command.type) {
    case 'Noop':
      return { doc, inverse: { type: 'Noop' } }

    case 'InsertNode': {
      const { node, parentId, index } = command
      let d = addSubtree(doc, node, parentId)
      d = linkChild(d, parentId, index, node.id)
      return { doc: d, inverse: { type: 'RemoveNode', id: node.id } }
    }

    case 'RemoveNode': {
      const { id } = command
      const parentId = doc.parentOf[id]
      const index = indexOf(doc, id)
      const node = buildNested(doc, id)
      let d = unlinkChild(doc, parentId, id)
      d = removeSubtree(d, id)
      return { doc: d, inverse: { type: 'InsertNode', node, parentId, index } }
    }

    case 'MoveNode': {
      const { id, toParentId, toIndex, raw } = command
      if (toParentId !== null && (toParentId === id || isDescendant(doc, id, toParentId))) {
        return { doc, inverse: { type: 'Noop' } } // refuse dropping a container into itself
      }
      const fromParent = doc.parentOf[id]
      const fromIndex = indexOf(doc, id)
      let idx = toIndex
      if (!raw && fromParent === toParentId && fromIndex < toIndex) idx -= 1
      let d = unlinkChild(doc, fromParent, id)
      d = linkChild(d, toParentId, idx, id)
      d = { ...d, parentOf: { ...d.parentOf, [id]: toParentId } }
      return { doc: d, inverse: { type: 'MoveNode', id, toParentId: fromParent, toIndex: fromIndex, raw: true } }
    }

    case 'UpdateProps': {
      const { id, patch } = command
      const n = doc.byId[id]
      const prev = {}
      for (const k of Object.keys(patch)) prev[k] = n.props[k]
      const d = { ...doc, byId: { ...doc.byId, [id]: { ...n, props: { ...n.props, ...patch } } } }
      return { doc: d, inverse: { type: 'UpdateProps', id, patch: prev } }
    }

    case 'ReplaceSubtree': {
      const { id, node } = command
      const parentId = doc.parentOf[id]
      const index = indexOf(doc, id)
      const old = buildNested(doc, id)
      let d = unlinkChild(doc, parentId, id)
      d = removeSubtree(d, id)
      d = addSubtree(d, node, parentId)
      d = linkChild(d, parentId, index, node.id)
      return { doc: d, inverse: { type: 'ReplaceSubtree', id: node.id, node: old } }
    }

    case 'SetColumns': {
      const { id, count } = command
      const old = buildNested(doc, id)
      let ch = [...old.children]
      while (ch.length < count) ch.push(emptyColumn())
      if (ch.length > count) {
        const extra = ch.slice(count)
        ch = ch.slice(0, count)
        ch[count - 1] = { ...ch[count - 1], children: [...ch[count - 1].children, ...extra.flatMap((c) => c.children)] }
      }
      const node = { ...old, children: ch }
      const r = applyCommand(doc, { type: 'ReplaceSubtree', id, node })
      return { doc: r.doc, inverse: { type: 'ReplaceSubtree', id, node: old } }
    }

    case 'InsertMany': {
      const { nodes, parentId, index } = command
      let d = doc
      nodes.forEach((node, k) => {
        d = addSubtree(d, node, parentId)
        d = linkChild(d, parentId, index + k, node.id)
      })
      return { doc: d, inverse: { type: 'RemoveMany', ids: nodes.map((n) => n.id) } }
    }

    case 'RemoveMany': {
      const { ids } = command
      let d = doc
      const items = []
      for (const id of ids) {
        const parentId = d.parentOf[id]
        const index = indexOf(d, id)
        items.push({ node: buildNested(d, id), parentId, index })
        d = unlinkChild(d, parentId, id)
        d = removeSubtree(d, id)
      }
      return { doc: d, inverse: { type: 'InsertNodes', items } }
    }

    case 'InsertNodes': {
      const { items } = command
      let d = doc
      for (const it of items) {
        d = addSubtree(d, it.node, it.parentId)
        d = linkChild(d, it.parentId, it.index, it.node.id)
      }
      return { doc: d, inverse: { type: 'RemoveMany', ids: items.map((i) => i.node.id) } }
    }

    case 'PatchMeta': {
      const { patch } = command
      const prev = {}
      for (const k of Object.keys(patch)) prev[k] = doc.meta[k]
      return { doc: { ...doc, meta: { ...doc.meta, ...patch } }, inverse: { type: 'PatchMeta', patch: prev } }
    }

    default:
      throw new Error(`Unknown command: ${command.type}`)
  }
}

/* ---------------- ergonomic factories ---------------- */

export const cmd = {
  insert: (node, parentId, index) => ({ type: 'InsertNode', node, parentId, index }),
  remove: (id) => ({ type: 'RemoveNode', id }),
  move: (id, toParentId, toIndex, raw = false) => ({ type: 'MoveNode', id, toParentId, toIndex, raw }),
  update: (id, patch) => ({ type: 'UpdateProps', id, patch }),
  setColumns: (id, count) => ({ type: 'SetColumns', id, count }),
  insertMany: (nodes, parentId, index) => ({ type: 'InsertMany', nodes, parentId, index }),
  patchMeta: (patch) => ({ type: 'PatchMeta', patch }),
}
