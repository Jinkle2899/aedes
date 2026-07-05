/*
 * Ephemeral editor store (hand-rolled, ~useSyncExternalStore).
 *
 * Holds transient UI state that must NOT live in the document, the command
 * history, or the sync stream (selection, seam-open, later hover/drag). Views
 * subscribe to just the slice they need, so changing one node's selection
 * re-renders only the affected nodes — not the whole canvas.
 */
import { useSyncExternalStore } from 'react'

export function createEditorStore(initial) {
  let state = initial
  const listeners = new Set()
  return {
    getState: () => state,
    setState: (patch) => {
      const next = typeof patch === 'function' ? patch(state) : patch
      state = { ...state, ...next }
      listeners.forEach((l) => l())
    },
    subscribe: (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

/* Subscribe a component to a derived slice; re-renders only when it changes. */
export function useStore(store, selector) {
  const snap = () => selector(store.getState())
  return useSyncExternalStore(store.subscribe, snap, snap)
}

/* A frozen store used to render block previews (ghosts, palette) in preview
   mode — never mutates, always preview:true so Editables are inert. */
export const previewStore = {
  getState: () => ({ preview: true, selected: null, seamOpen: null, dropTarget: null, meta: { counts: {}, favs: [], recents: [] } }),
  subscribe: () => () => {},
}
