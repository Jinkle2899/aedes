import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function StatsView({ block }) {
  const { preview, onProp, p } = useBlock(block)
  return (
    <div className="b-stats">
      {p.items.map((it, i) => (
        <div className="b-stat" key={i}>
          <Editable tag="strong" value={it.n} disabled={preview} onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, n: v } : x)) })} />
          <Editable tag="span" value={it.l} disabled={preview} onCommit={(v) => onProp(block.id, { items: p.items.map((x, j) => (j === i ? { ...x, l: v } : x)) })} />
        </div>
      ))}
    </div>
  )
}
