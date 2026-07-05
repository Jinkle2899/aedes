import { registry } from '../../blocks/index.js'

/*
 * Layout panel (cross-cutting, like StylePanel). For a container: a Flow/Free
 * mode toggle (+ height when free). For a child of a `free` container: numeric
 * position/size/z constraints. All changes dispatch a SetLayout command, so
 * they're undoable. Direct-manipulation (drag/resize) arrives in 5b; this gives
 * a precise numeric path that's fully verifiable now.
 */
export default function LayoutPanel({ block, path, onSetLayout }) {
  if (!onSetLayout) return null
  const isContainer = registry.isContainer(block.type)
  const parent = path && path.length >= 2 ? path[path.length - 2] : null
  const parentFree = !!(parent && parent.layout && parent.layout.mode === 'free')
  if (!isContainer && !parentFree) return null

  const L = block.layout || {}
  const F = L.free || {}

  const setMode = (mode) => {
    if (mode === 'free') onSetLayout(block.id, { ...L, mode: 'free', height: L.height || 460 })
    else {
      const next = { ...L }
      delete next.mode
      delete next.height
      onSetLayout(block.id, Object.keys(next).length ? next : undefined)
    }
  }
  const setHeight = (h) => onSetLayout(block.id, { ...L, mode: 'free', height: h })
  const setFree = (patch) => onSetLayout(block.id, { ...L, free: { ...F, ...patch } })

  const FIELDS = [
    ['left', 'Left %'],
    ['top', 'Top %'],
    ['width', 'Width %'],
    ['height', 'Height %'],
    ['z', 'Z-index'],
  ]

  return (
    <div className="ins-layout">
      <p className="ins-subhead">Layout</p>

      {isContainer && (
        <>
          <div className="ins-field">
            <span>Mode</span>
            <div className="ins-seg">
              {['flow', 'free'].map((m) => (
                <button key={m} type="button" className={(L.mode || 'flow') === m ? 'active' : ''} onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {L.mode === 'free' && (
            <label className="ins-field">
              <span>Container height (px)</span>
              <input
                type="number"
                min="120"
                max="4000"
                value={L.height || 460}
                onChange={(e) => setHeight(Math.min(4000, Math.max(120, +e.target.value || 460)))}
              />
            </label>
          )}
        </>
      )}

      {parentFree &&
        FIELDS.map(([k, label]) => (
          <label className="ins-field" key={k}>
            <span>{label}</span>
            <input
              type="number"
              value={F[k] ?? ''}
              onChange={(e) => setFree({ [k]: e.target.value === '' ? undefined : +e.target.value })}
            />
          </label>
        ))}
    </div>
  )
}
