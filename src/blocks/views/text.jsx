import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function TextView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className="b-text">
      <Editable tag="h2" value={p.heading} onCommit={commit('heading')} disabled={preview} />
      <Editable tag="p" value={p.body} onCommit={commit('body')} disabled={preview} singleLine={false} />
    </div>
  )
}
