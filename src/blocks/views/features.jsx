import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function FeaturesView({ block }) {
  const { preview, onProp, p } = useBlock(block)
  return (
    <div className="b-features">
      {p.items.map((it, i) => (
        <div className="b-feature" key={i}>
          <span className="b-feature-dot" />
          <Editable tag="h4" value={it.t} disabled={preview} onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, t: v } : x)) })} />
          <Editable tag="p" value={it.d} disabled={preview} singleLine={false} onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, d: v } : x)) })} />
        </div>
      ))}
    </div>
  )
}
