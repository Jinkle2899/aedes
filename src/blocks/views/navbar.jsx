import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'
import BlockBtn from '../../editor/components/BlockBtn.jsx'

export default function NavbarView({ block }) {
  const { preview, onProp, p } = useBlock(block)
  return (
    <div className="b-navbar">
      <Editable tag="strong" value={p.brand} onCommit={(v) => onProp(block.id, { brand: v })} disabled={preview} />
      <div className="b-nav-links">
        {p.links.map((l, i) => (
          <Editable key={i} tag="span" value={l} disabled={preview} onCommit={(v) => onProp(block.id, { links: p.links.map((x, j) => (j === i ? v : x)) })} />
        ))}
      </div>
      <BlockBtn p={p} className="b-btn-sm" />
    </div>
  )
}
