import { findById, findPath } from '../../lib/tree.js'
import { useStore } from '../store/editorStore.js'
import Inspector from './Inspector.jsx'

/*
 * Inspector panel — subscribes to the selection itself so that selecting a
 * block re-renders only this panel (and the affected canvas nodes), not the
 * whole editor. `blocks` is the current projection, passed from EditorInner.
 */
export default function InspectorPanel({ store, blocks, onProp, setColumnsCount, onSelect }) {
  const selected = useStore(store, (s) => s.selected)
  const block = selected ? findById(blocks, selected) : null
  const path = selected ? findPath(blocks, selected) : []
  return (
    <aside className="ed-right" onClick={(e) => e.stopPropagation()}>
      <p className="ed-panel-title">Inspector</p>
      <Inspector block={block} path={path} onProp={onProp} setColumnsCount={setColumnsCount} onSelect={onSelect} />
    </aside>
  )
}
