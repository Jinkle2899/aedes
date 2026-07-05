import { useContext, useMemo } from 'react'
import { EdCtx, EditorStoreCtx } from '../context.js'
import { previewStore } from '../store/editorStore.js'
import { makeBlock } from '../../lib/store.js'
import BlockContent from '../blocks/BlockContent.jsx'

/* Live render of a block type with default props (previews everywhere) */
export default function GhostRender({ type }) {
  const ed = useContext(EdCtx)
  const block = useMemo(() => makeBlock(type), [type])
  return (
    <EdCtx.Provider value={ed}>
      <EditorStoreCtx.Provider value={previewStore}>
        <BlockContent block={block} />
      </EditorStoreCtx.Provider>
    </EdCtx.Provider>
  )
}
