import { createContext } from 'react'

/* Stable editor actions + prediction (identity stable across state changes). */
export const EdCtx = createContext(null)

/* The ephemeral editor store instance (selection, seam-open, preview, drag). Stable —
   views read reactive slices via useStore(store, selector), not from EdCtx. */
export const EditorStoreCtx = createContext(null)

/* The document store (the command bus). Node views subscribe to their own node
   via useNode(id) so an edit re-renders only that node. */
export const DocCtx = createContext(null)
