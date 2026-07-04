import { useContext, useMemo } from 'react'
import { EdCtx } from '../context.js'
import { makeBlock } from '../../lib/store.js'
import BlockContent from '../blocks/BlockContent.jsx'

/* Live render of a block type with default props (previews everywhere) */
export default function GhostRender({ type }) {
  const ed = useContext(EdCtx)
  const block = useMemo(() => makeBlock(type), [type])
  const previewCtx = useMemo(() => ({ ...ed, preview: true }), [ed])
  return (
    <EdCtx.Provider value={previewCtx}>
      <BlockContent block={block} />
    </EdCtx.Provider>
  )
}
