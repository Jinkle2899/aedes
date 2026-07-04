import { useContext } from 'react'
import { EdCtx } from '../../editor/context.js'

/* Shared editor wiring for a block view. Keeps view components DRY:
   mirrors exactly what the old BlockContent switch pulled from context. */
export function useBlock(block) {
  const ed = useContext(EdCtx)
  const onProp = ed.onProp
  const commit = (key) => (v) => onProp(block.id, { [key]: v })
  return { ed, preview: ed.preview, onProp, p: block.props, commit }
}
