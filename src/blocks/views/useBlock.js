import { useContext } from 'react'
import { EdCtx, EditorStoreCtx } from '../../editor/context.js'
import { useStore } from '../../editor/store/editorStore.js'

/* Shared editor wiring for a block view. `ed` is the stable actions context;
   `preview` is a reactive slice of the editor store (so prop edits don't churn
   the actions context). */
export function useBlock(block) {
  const ed = useContext(EdCtx)
  const store = useContext(EditorStoreCtx)
  const preview = useStore(store, (s) => s.preview)
  const onProp = ed.onProp
  const commit = (key) => (v) => onProp(block.id, { [key]: v })
  return { ed, preview, onProp, p: block.props, commit }
}
