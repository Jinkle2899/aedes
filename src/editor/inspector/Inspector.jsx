import { BLOCK_DEFS } from '../../lib/store.js'
import { registry } from '../../blocks/index.js'
import StylePanel from './StylePanel.jsx'
import FieldRenderer from './FieldRenderer.jsx'

/* ---------------- Inspector: breadcrumbs, style panel, per-type fields ----------------
 * Per-type fields are now declared as a `fields` schema on each block
 * descriptor (src/blocks/types) and rendered by FieldRenderer — replacing the
 * former property-presence conditional cascade.
 */
export default function Inspector({ block, path, onProp, setColumnsCount, onSelect }) {
  if (!block) {
    return (
      <div className="ins-empty">
        <p>Select a block on the canvas to edit it — or drag a new one in from the left.</p>
      </div>
    )
  }
  const crumbs = (path || []).filter((b) => b.type !== 'column')
  const fields = registry.get(block.type)?.fields || []

  return (
    <div>
      {crumbs.length > 1 && (
        <div className="ins-crumbs">
          {crumbs.map((b, i) => (
            <span key={b.id}>
              {i > 0 && <i>›</i>}
              <button
                type="button"
                className={b.id === block.id ? 'on' : ''}
                onClick={() => onSelect(b.id)}
              >
                {BLOCK_DEFS[b.type].label}
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="ins-title">{BLOCK_DEFS[block.type].label}</p>

      <StylePanel block={block} onProp={onProp} />

      <FieldRenderer block={block} fields={fields} onProp={onProp} setColumnsCount={setColumnsCount} />
    </div>
  )
}
