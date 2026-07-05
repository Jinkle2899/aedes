import { useContext, useMemo, useState } from 'react'
import { EdCtx, EditorStoreCtx } from '../context.js'
import { useStore } from '../store/editorStore.js'
import { BLOCK_DEFS, BLOCK_TYPES } from '../../lib/store.js'
import GhostRender from './GhostRender.jsx'

/* ---------------- Seam (Layer 2): + between blocks, context chips, gap hints ---------------- */
export function Seam({ index }) {
  const ed = useContext(EdCtx)
  const store = useContext(EditorStoreCtx)
  const open = useStore(store, (s) => s.seamOpen === index)
  const preview = useStore(store, (s) => s.preview)
  if (preview) return null
  const gap = ed.gapAt(index)
  return (
    <div className={`seam${open ? ' open' : ''}${gap ? ' has-gap' : ''}`}>
      <div
        className="seam-hit"
        onClick={(e) => {
          e.stopPropagation()
          ed.setSeamOpen(open ? null : index)
        }}
      >
        <span className="seam-line" />
        <span className="seam-plus">+</span>
        {gap && !open && (
          <span className="seam-gap-label" title="This page is missing a segment">
            Add {gap.label}?
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                ed.dismissGap(gap.segment)
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </span>
        )}
      </div>
      {open && <SeamPanel index={index} />}
    </div>
  )
}

export function SeamPanel({ index }) {
  const ed = useContext(EdCtx)
  const [q, setQ] = useState('')
  const suggestions = useMemo(() => ed.predictAtIndex(index), [ed, index])
  const query = q.trim().toLowerCase()
  const filtered = query
    ? BLOCK_TYPES.filter((t) =>
        `${BLOCK_DEFS[t].label} ${BLOCK_DEFS[t].hint || ''}`.toLowerCase().includes(query)
      )
    : null

  return (
    <div
      className="seam-panel"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        placeholder="Search blocks…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') ed.setSeamOpen(null)
          if (e.key === 'Enter') {
            const t = filtered ? filtered[0] : suggestions[0] && suggestions[0].type
            if (t) ed.insertAtSeam(index, t)
          }
        }}
      />
      {!filtered ? (
        <>
          <p className="seam-title">Suggested here</p>
          <div className="seam-chips">
            {suggestions.map((s) => (
              <button
                key={s.type}
                type="button"
                className="seam-chip"
                title={s.because}
                onClick={() => ed.insertAtSeam(index, s.type)}
              >
                <span className="chip-thumb">
                  <span className="chip-thumb-inner">
                    <GhostRender type={s.type} />
                  </span>
                </span>
                <strong>{BLOCK_DEFS[s.type].label}</strong>
              </button>
            ))}
          </div>
          {suggestions[0] && <p className="seam-because">because: {suggestions[0].because}</p>}
        </>
      ) : (
        <div className="seam-rows">
          {filtered.map((t) => (
            <button key={t} type="button" onClick={() => ed.insertAtSeam(index, t)}>
              <strong>{BLOCK_DEFS[t].label}</strong>
              <span>{BLOCK_DEFS[t].hint}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="seam-none">No blocks match “{q}”</p>}
        </div>
      )}
    </div>
  )
}
