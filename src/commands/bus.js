/*
 * Command bus + history. The single chokepoint every document mutation passes
 * through. Records inverse commands (diffs, not snapshots) for cheap undo/redo,
 * coalesces rapid same-field edits into one undo entry (Framer/Figma feel), and
 * debounces persistence. Later: forward the same commands to a collab transport.
 */
import { applyCommand } from './commands.js'

export function createEditor(initialDoc, opts = {}) {
  const coalesceMs = opts.coalesceMs ?? 600
  const persistMs = opts.persistMs ?? 700
  let doc = initialDoc
  const undoStack = []
  const redoStack = []
  let lastEdit = null // { sig, time } for UpdateProps coalescing
  const listeners = new Set()
  let timer = null

  const notify = () => listeners.forEach((l) => l(doc))
  const persist = () => {
    if (!opts.persist) return
    clearTimeout(timer)
    timer = setTimeout(() => opts.persist(doc), persistMs)
  }

  const applyAll = (cmds) => {
    const inverses = []
    for (const c of cmds) {
      const r = applyCommand(doc, c)
      doc = r.doc
      inverses.unshift(r.inverse) // reverse order so undo replays correctly
    }
    return inverses
  }

  function dispatch(input) {
    const cmds = Array.isArray(input) ? input : [input]
    const single = cmds.length === 1 ? cmds[0] : null
    const sig =
      single && single.type === 'UpdateProps'
        ? `${single.id}|${Object.keys(single.patch).sort().join(',')}`
        : null
    const now = Date.now()

    if (sig && lastEdit && lastEdit.sig === sig && now - lastEdit.time < coalesceMs && undoStack.length) {
      // Coalesce into the previous entry: apply now, keep its inverse (pre-burst
      // values), merge the redo patch so redo replays the final value.
      applyAll(cmds)
      const prev = undoStack[undoStack.length - 1]
      const pc = prev.commands[0]
      prev.commands = [{ type: 'UpdateProps', id: single.id, patch: { ...pc.patch, ...single.patch } }]
      redoStack.length = 0
      lastEdit.time = now
      notify()
      persist()
      return
    }

    const inverses = applyAll(cmds)
    undoStack.push({ commands: cmds, inverses })
    redoStack.length = 0
    lastEdit = sig ? { sig, time: now } : null
    notify()
    persist()
  }

  return {
    dispatch,
    undo() {
      const e = undoStack.pop()
      if (!e) return false
      for (const inv of e.inverses) doc = applyCommand(doc, inv).doc
      redoStack.push(e)
      lastEdit = null
      notify()
      persist()
      return true
    },
    redo() {
      const e = redoStack.pop()
      if (!e) return false
      for (const c of e.commands) doc = applyCommand(doc, c).doc
      undoStack.push(e)
      lastEdit = null
      notify()
      persist()
      return true
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    getDoc: () => doc,
    subscribe: (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    flush: () => {
      if (!opts.persist) return
      clearTimeout(timer)
      opts.persist(doc)
    },
  }
}
