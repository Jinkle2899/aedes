import { useBlock } from './useBlock.js'
import { Children } from '../../editor/components/BlockNode.jsx'

export default function ColumnsView({ block }) {
  const { ed } = useBlock(block)
  return (
    <div className="b-columns" style={{ gridTemplateColumns: `repeat(${block.children.length}, 1fr)` }}>
      {block.children.map((col) => (
        <div className="b-column" key={col.id} onDragOver={ed.overContainer(col.id, col.children.length)}>
          <Children blocks={col.children} parentId={col.id} emptyHint="Drop here" />
        </div>
      ))}
    </div>
  )
}
