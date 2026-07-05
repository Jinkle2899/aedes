/*
 * Document subscriptions. Each node view subscribes to its own node id, so
 * structural sharing in the reducers means an edit re-renders only the edited
 * node (its byId entry gets a new identity; siblings/ancestors keep theirs).
 */
import { useContext, useSyncExternalStore } from 'react'
import { DocCtx } from '../context.js'

const EMPTY = []

export function useNode(id) {
  const bus = useContext(DocCtx)
  const snap = () => bus.getDoc().byId[id]
  return useSyncExternalStore(bus.subscribe, snap, snap)
}

/* Child id list for a container (or root ids when parentId === null). */
export function useChildList(parentId) {
  const bus = useContext(DocCtx)
  const snap = () => {
    const doc = bus.getDoc()
    if (parentId === null) return doc.rootIds
    const n = doc.byId[parentId]
    return (n && n.childIds) || EMPTY
  }
  return useSyncExternalStore(bus.subscribe, snap, snap)
}
