import { useBlock } from './useBlock.js'
import { Children } from '../../editor/components/BlockNode.jsx'
import { getMode } from '../../layout/mode.js'

export default function SectionView({ block }) {
  const { ed, p } = useBlock(block)
  const count = (block.childIds || []).length
  const mode = getMode(block)
  if (mode === 'free') {
    const height = (block.layout && block.layout.height) || 460
    return (
      <div className="b-sec b-free" style={{ position: 'relative', height }} onDragOver={ed.overContainer(block.id, count)}>
        <Children parentId={block.id} parentMode="free" emptyHint="" />
      </div>
    )
  }
  return (
    <div className={`b-sec tone-${p.tone} pad-${p.pad}`} onDragOver={ed.overContainer(block.id, count)}>
      <Children parentId={block.id} parentMode="flow" emptyHint="Drop blocks into this section" />
    </div>
  )
}
