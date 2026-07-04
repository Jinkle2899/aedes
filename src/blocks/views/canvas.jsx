import Freeform from '../../components/Freeform.jsx'
import { useBlock } from './useBlock.js'

export default function CanvasView({ block }) {
  const { preview, onProp } = useBlock(block)
  return <Freeform block={block} preview={preview} onProp={onProp} />
}
