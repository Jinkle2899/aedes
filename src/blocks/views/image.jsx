import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function ImageView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className="b-image">
      <div className={`b-img-ph ratio-${p.ratio}`}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="M3 17l5-4 4 3 5-5 4 4" />
        </svg>
      </div>
      <Editable tag="p" className="b-caption" value={p.caption} onCommit={commit('caption')} disabled={preview} />
    </div>
  )
}
