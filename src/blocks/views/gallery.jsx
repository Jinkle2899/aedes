import { useBlock } from './useBlock.js'
import Editable from '../../editor/components/Editable.jsx'

export default function GalleryView({ block }) {
  const { preview, p, commit } = useBlock(block)
  return (
    <div className="b-gallery">
      <Editable tag="h3" value={p.caption} onCommit={commit('caption')} disabled={preview} />
      <div className="b-gallery-grid">
        {[0, 1, 2].map((i) => (
          <div className="b-img-ph" key={i} />
        ))}
      </div>
    </div>
  )
}
