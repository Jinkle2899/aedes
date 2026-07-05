import { useRef } from 'react'
import { makeBlock } from '../../lib/store.js'

/* HTML5 drag-and-drop for palette inserts + block reordering. Writes the live
   drop target to the editor store; commits an insert/move command on drop.
   Extracted verbatim from EditorInner. */
export function useDragDrop({ editor, store, doInsert, doMove }) {
  const dragRef = useRef(null)
  const setDropTarget = (v) => store.setState({ dropTarget: v })

  const startPaletteDrag = (type) => (e) => {
    dragRef.current = { kind: 'new', type }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', type)
  }
  const startBlockDrag = (id) => (e) => {
    e.stopPropagation()
    dragRef.current = { kind: 'move', id }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  const overBlock = (parentId, index) => (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    setDropTarget({ parentId, index: e.clientY < r.top + r.height / 2 ? index : index + 1 })
  }
  const overContainer = (parentId, count) => (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    e.stopPropagation()
    setDropTarget({ parentId, index: count })
  }
  const overRoot = (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    setDropTarget({ parentId: null, index: editor.getDoc().rootIds.length })
  }
  const drop = (e) => {
    e.preventDefault()
    const d = dragRef.current
    const dt = store.getState().dropTarget
    if (d && dt) {
      if (d.kind === 'new') doInsert(dt.parentId, dt.index, makeBlock(d.type))
      else doMove(d.id, dt)
    }
    dragRef.current = null
    setDropTarget(null)
  }
  const endDrag = () => {
    dragRef.current = null
    setDropTarget(null)
  }

  return { startPaletteDrag, startBlockDrag, overBlock, overContainer, overRoot, drop, endDrag }
}
