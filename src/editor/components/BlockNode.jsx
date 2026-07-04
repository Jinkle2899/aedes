import { useContext } from 'react'
import { EdCtx } from '../context.js'
import { blockStyleClass, blockStyleInline } from '../style.js'
import BlockContent from '../blocks/BlockContent.jsx'
import { Seam } from './Seam.jsx'

/* ---------------- Recursive children renderer ---------------- */
export function Children({ blocks, parentId, emptyHint }) {
  const ed = useContext(EdCtx)
  const showLine = (i) =>
    ed.dropTarget && ed.dropTarget.parentId === parentId && ed.dropTarget.index === i
  return (
    <>
      {blocks.length === 0 && !ed.preview && emptyHint && (
        <div className="ed-drop-empty">{emptyHint}</div>
      )}
      {blocks.map((b, i) => (
        <div key={b.id}>
          {showLine(i) && <div className="drop-line" />}
          {parentId === null && <Seam index={i} />}
          <BlockNode block={b} index={i} parentId={parentId} />
        </div>
      ))}
      {showLine(blocks.length) && <div className="drop-line" />}
    </>
  )
}

/* ---------------- A block node (selection wrapper + style wrapper) ---------------- */
export function BlockNode({ block, index, parentId }) {
  const ed = useContext(EdCtx)
  const isSel = ed.selected === block.id && !ed.preview
  const st = block.props.style || {}
  return (
    <div
      className={`ed-block${isSel ? ' selected' : ''}`}
      onClick={(e) => {
        if (ed.preview) return
        e.stopPropagation()
        ed.setSelected(block.id)
        ed.setSeamOpen(null)
      }}
      onDragOver={ed.overBlock(parentId, index)}
    >
      {!ed.preview && (
        <span
          className="ed-handle"
          draggable
          onDragStart={ed.startBlockDrag(block.id)}
          onDragEnd={ed.endDrag}
          title="Drag to reorder"
        >
          ⠿
        </span>
      )}
      {isSel && (
        <div className="ed-tools" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => ed.nudge(block.id, -1)} title="Move up">↑</button>
          <button type="button" onClick={() => ed.nudge(block.id, 1)} title="Move down">↓</button>
          <button type="button" onClick={() => ed.duplicate(block.id)} title="Duplicate">⧉</button>
          <button type="button" onClick={() => ed.remove(block.id)} title="Delete">✕</button>
        </div>
      )}
      <div className={blockStyleClass(st)} style={blockStyleInline(st)} data-anim={st.anim || undefined}>
        <BlockContent block={block} />
      </div>
    </div>
  )
}
