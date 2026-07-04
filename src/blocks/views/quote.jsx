import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function QuoteView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className="b-quote">
      <Editable tag="blockquote" value={p.text} onCommit={commit('text')} disabled={preview} singleLine={false} />
      <div className="b-quote-author">
        <Editable tag="strong" value={p.author} onCommit={commit('author')} disabled={preview} />
        <Editable tag="span" value={p.role} onCommit={commit('role')} disabled={preview} />
      </div>
    </div>
  )
}
