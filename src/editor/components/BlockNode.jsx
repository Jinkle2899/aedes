import { memo, useContext } from 'react'
import { EdCtx, EditorStoreCtx } from '../context.js'
import { useStore } from '../store/editorStore.js'
import { useNode, useChildList } from '../store/useDoc.js'
import { computeStyle } from '../../layout/index.js'
import BlockContent from '../blocks/BlockContent.jsx'
import { Seam } from './Seam.jsx'

/* ---------------- Recursive children renderer (reads child ids from the doc) ---------------- */
export function Children({ parentId, parentMode = 'flow', emptyHint }) {
  const store = useContext(EditorStoreCtx)
  const ids = useChildList(parentId)
  const preview = useStore(store, (s) => s.preview)
  const dropTarget = useStore(store, (s) => s.dropTarget)
  const showLine = (i) => dropTarget && dropTarget.parentId === parentId && dropTarget.index === i
  return (
    <>
      {ids.length === 0 && !preview && emptyHint && <div className="ed-drop-empty">{emptyHint}</div>}
      {ids.map((id, i) => (
        <div key={id}>
          {showLine(i) && <div className="drop-line" />}
          {parentId === null && <Seam index={i} />}
          <BlockNode id={id} index={i} parentId={parentId} parentMode={parentMode} />
        </div>
      ))}
      {showLine(ids.length) && <div className="drop-line" />}
    </>
  )
}

/* ---------------- A block node: subscribes to its own node + selection ---------------- */
export const BlockNode = memo(function BlockNode({ id, index, parentId, parentMode = 'flow' }) {
  const ed = useContext(EdCtx)
  const store = useContext(EditorStoreCtx)
  const block = useNode(id)
  const preview = useStore(store, (s) => s.preview)
  const isSel = useStore(store, (s) => s.selected === id) && !preview
  if (!block) return null
  const { className, style, dataAnim, wrapperStyle } = computeStyle(block, { parentMode })
  return (
    <div
      className={`ed-block${isSel ? ' selected' : ''}`}
      style={wrapperStyle}
      onClick={(e) => {
        if (preview) return
        e.stopPropagation()
        ed.setSelected(id)
        ed.setSeamOpen(null)
      }}
      onDragOver={ed.overBlock(parentId, index)}
    >
      {!preview && (
        <span
          className="ed-handle"
          draggable
          onDragStart={ed.startBlockDrag(id)}
          onDragEnd={ed.endDrag}
          title="Drag to reorder"
        >
          ⠿
        </span>
      )}
      {isSel && (
        <div className="ed-tools" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => ed.nudge(id, -1)} title="Move up">↑</button>
          <button type="button" onClick={() => ed.nudge(id, 1)} title="Move down">↓</button>
          <button type="button" onClick={() => ed.duplicate(id)} title="Duplicate">⧉</button>
          <button type="button" onClick={() => ed.remove(id)} title="Delete">✕</button>
        </div>
      )}
      <div className={className} style={style} data-anim={dataAnim}>
        <BlockContent block={block} />
      </div>
    </div>
  )
})
