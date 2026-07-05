import { useBlock } from './useBlock.js'
import { Children } from '../../editor/components/BlockNode.jsx'
import { getMode } from '../../layout/mode.js'

export default function SectionView({ block }) {
  const { ed, p } = useBlock(block)
  const count = (block.childIds || []).length
  return (
    <div className={`b-sec tone-${p.tone} pad-${p.pad}`} onDragOver={ed.overContainer(block.id, count)}>
      <Children parentId={block.id} parentMode={getMode(block)} emptyHint="Drop blocks into this section" />
    </div>
  )
}
