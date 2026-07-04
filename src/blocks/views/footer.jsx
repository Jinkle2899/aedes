import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function FooterView({ block }) {
  const { preview, onProp, p, commit } = useBlock(block)
  return (
    <div className="b-footer">
      <Editable tag="strong" value={p.brand} onCommit={commit('brand')} disabled={preview} />
      <div className="b-footer-links">
        {p.links.map((l, i) => (
          <Editable key={i} tag="span" value={l} disabled={preview} onCommit={(v) => onProp(block.id, { links: p.links.map((x, j) => (j === i ? v : x)) })} />
        ))}
      </div>
      <Editable tag="span" className="b-footer-note" value={p.note} onCommit={commit('note')} disabled={preview} />
    </div>
  )
}
