import { useBlock } from './useBlock.js'

export default function SpacerView({ block }) {
  const { preview, p } = useBlock(block)
  return (
    <div className="b-spacer" style={{ height: p.height }}>
      {!preview && <span>Spacer · {p.height}px</span>}
    </div>
  )
}
