import { useContext } from 'react'
import { EdCtx } from '../../editor/context.js'
import { useNode } from '../../editor/store/useDoc.js'
import { Children } from '../../editor/components/BlockNode.jsx'

function Column({ id }) {
  const ed = useContext(EdCtx)
  const col = useNode(id)
  if (!col) return null
  return (
    <div className="b-column" onDragOver={ed.overContainer(id, (col.childIds || []).length)}>
      <Children parentId={id} emptyHint="Drop here" />
    </div>
  )
}

export default function ColumnsView({ block }) {
  const cols = block.childIds || []
  return (
    <div className="b-columns" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
      {cols.map((id) => (
        <Column key={id} id={id} />
      ))}
    </div>
  )
}
