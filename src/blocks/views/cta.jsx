import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'
import BlockBtn from '../../editor/components/BlockBtn.jsx'

export default function CtaView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className="b-cta">
      <Editable tag="h2" value={p.heading} onCommit={commit('heading')} disabled={preview} />
      <BlockBtn p={p} className="invert" />
    </div>
  )
}
