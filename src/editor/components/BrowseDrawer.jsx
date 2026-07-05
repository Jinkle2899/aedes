import { useContext, useState } from 'react'
import { EdCtx, EditorStoreCtx } from '../context.js'
import { useStore } from '../store/editorStore.js'
import { BLOCK_DEFS, BLOCK_TYPES } from '../../lib/store.js'
import { searchBlocks } from '../../lib/blockSearch.js'
import { CATS } from '../constants.js'
import GhostRender from './GhostRender.jsx'

/* ---------------- Browse drawer (Layer 3, ⌘L) ---------------- */
export default function BrowseDrawer() {
  const ed = useContext(EdCtx)
  const meta = useStore(useContext(EditorStoreCtx), (s) => s.meta)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  let types = BLOCK_TYPES
  if (q.trim()) types = searchBlocks(q, meta.counts).map((r) => r.type)
  else if (cat !== 'all') types = CATS[cat] || []

  return (
    <>
      <div className="drawer-scrim" onClick={ed.closePalette} />
      <aside className="drawer">
        <div className="drawer-head">
          <strong>All blocks</strong>
          <span>{types.length} of {BLOCK_TYPES.length}</span>
          <button type="button" className="drawer-x" onClick={ed.closePalette} title="Close (Esc)">✕</button>
        </div>
        <input
          autoFocus
          placeholder="Search blocks…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && ed.closePalette()}
        />
        <div className="dcats">
          {['all', ...Object.keys(CATS)].map((c) => (
            <button
              key={c}
              type="button"
              className={`dcat${cat === c && !q.trim() ? ' on' : ''}`}
              onClick={() => {
                setCat(c)
                setQ('')
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="drawer-grid">
          {types.map((t) => (
            <div
              key={t}
              className="drawer-card"
              draggable
              onDragStart={ed.paletteDrag(t)}
              onDragEnd={ed.endDrag}
              onClick={() => ed.insertFromPalette(t, false)}
              title={`${BLOCK_DEFS[t].label} — click to insert, or drag onto the page`}
            >
              <span className="chip-thumb thumb-lg">
                <span className="chip-thumb-inner thumb-lg-inner">
                  <GhostRender type={t} />
                </span>
              </span>
              <div className="drawer-card-meta">
                <strong>{BLOCK_DEFS[t].label}</strong>
                <button
                  type="button"
                  className={`cmdk-star${meta.favs.includes(t) ? ' on' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    ed.toggleFavorite(t)
                  }}
                >
                  {meta.favs.includes(t) ? '★' : '☆'}
                </button>
              </div>
            </div>
          ))}
          {types.length === 0 && <p className="cmdk-none">No blocks match “{q}”</p>}
        </div>
      </aside>
    </>
  )
}
