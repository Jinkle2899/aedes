import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'
import BlockBtn from '../../editor/components/BlockBtn.jsx'

export default function FormView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className="b-form">
      <Editable tag="h2" value={p.heading} onCommit={commit('heading')} disabled={preview} />
      <Editable tag="p" className="b-form-sub" value={p.sub} onCommit={commit('sub')} disabled={preview} />
      <div className="b-form-fields">
        <input placeholder="Name" readOnly tabIndex={-1} />
        <input placeholder="Email" readOnly tabIndex={-1} />
        <textarea placeholder="Message" rows="4" readOnly tabIndex={-1} />
      </div>
      <BlockBtn p={p} />
    </div>
  )
}
