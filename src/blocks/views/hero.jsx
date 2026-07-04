import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'
import BlockBtn from '../../editor/components/BlockBtn.jsx'

export default function HeroView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className={`b-hero align-${p.align} tone-${p.tone}`}>
      <Editable tag="h1" value={p.heading} onCommit={commit('heading')} disabled={preview} />
      <Editable tag="p" className="b-hero-sub" value={p.sub} onCommit={commit('sub')} disabled={preview} />
      <BlockBtn p={p} />
    </div>
  )
}
