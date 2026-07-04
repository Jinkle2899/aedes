import { useBlock } from './useBlock.js'
import { Children } from '../../editor/components/BlockNode.jsx'

export default function SectionView({ block }) {
  const { ed, p } = useBlock(block)
  return (
    <div className={`b-sec tone-${p.tone} pad-${p.pad}`} onDragOver={ed.overContainer(block.id, block.children.length)}>
      <Children blocks={block.children} parentId={block.id} emptyHint="Drop blocks into this section" />
    </div>
  )
}
