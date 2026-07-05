import { useContext, useEffect, useMemo, useState } from 'react'
import { EdCtx, EditorStoreCtx } from '../context.js'
import { useStore } from '../store/editorStore.js'
import { BLOCK_DEFS } from '../../lib/store.js'
import { searchBlocks } from '../../lib/blockSearch.js'
import GhostRender from './GhostRender.jsx'

/* ---------------- Command palette (Layer 3, ⌘K) ---------------- */
export default function CommandPalette() {
  const ed = useContext(EdCtx)
  const meta = useStore(useContext(EditorStoreCtx), (s) => s.meta)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const target = ed.paletteTarget()

  const items = useMemo(() => {
    if (q.trim()) {
      return searchBlocks(q, meta.counts)
        .slice(0, 8)
        .map((r) => ({ type: r.type, note: BLOCK_DEFS[r.type].hint, section: 'Results' }))
    }
    const out = []
    const seen = new Set()
    const push = (type, note, section) => {
      if (!seen.has(type) && out.length < 8) {
        seen.add(type)
        out.push({ type, note, section })
      }
    }
    ed.predictAtIndex(target).slice(0, 3).forEach((s) => push(s.type, s.because, 'Suggested here'))
    meta.recents.forEach((t) => push(t, BLOCK_DEFS[t].hint, 'Recent'))
    meta.favs.forEach((t) => push(t, BLOCK_DEFS[t].hint, 'Pinned'))
    if (out.length === 0)
      ['hero', 'text', 'image', 'features', 'cta'].forEach((t) => push(t, BLOCK_DEFS[t].hint, 'Starter'))
    return out
  }, [q, ed, target])

  useEffect(() => setSel(0), [q])
  const cur = items[Math.min(sel, Math.max(items.length - 1, 0))]

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(s + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!cur) return
      const keepOpen = e.metaKey || e.ctrlKey
      ed.insertFromPalette(cur.type, keepOpen)
      if (keepOpen) setQ('')
    } else if (e.key === 'Escape') {
      ed.closePalette()
    }
  }

  let lastSection = null
  return (
    <div className="cmdk-scrim" onClick={ed.closePalette}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-main">
          <input
            autoFocus
            placeholder="Search blocks — or pick a suggestion…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="cmdk-list">
            {items.map((it, i) => {
              const header = it.section !== lastSection ? it.section : null
              lastSection = it.section
              return (
                <div key={`${it.section}-${it.type}`}>
                  {header && <p className="cmdk-section">{header}</p>}
                  <div
                    className={`cmdk-row${i === sel ? ' on' : ''}`}
                    onMouseEnter={() => setSel(i)}
                    onClick={(e) => ed.insertFromPalette(it.type, e.metaKey || e.ctrlKey)}
                  >
                    <strong>{BLOCK_DEFS[it.type].label}</strong>
                    <span>{it.note}</span>
                    <button
                      type="button"
                      className={`cmdk-star${meta.favs.includes(it.type) ? ' on' : ''}`}
                      title="Pin to rail"
                      onClick={(e) => {
                        e.stopPropagation()
                        ed.toggleFavorite(it.type)
                      }}
                    >
                      {meta.favs.includes(it.type) ? '★' : '☆'}
                    </button>
                  </div>
                </div>
              )
            })}
            {items.length === 0 && <p className="cmdk-none">No blocks match “{q}”</p>}
            <div
              className="cmdk-row cmdk-browse"
              onClick={() => {
                ed.openCompose()
              }}
            >
              <strong>✨ Generate from a prompt</strong>
              <span>describe a section or page</span>
              <kbd>⌘G</kbd>
            </div>
            <div
              className="cmdk-row cmdk-browse"
              onClick={() => {
                ed.openDrawer()
              }}
            >
              <strong>Browse all blocks</strong>
              <span>the full library</span>
              <kbd>⌘L</kbd>
            </div>
          </div>
          <div className="cmdk-foot">
            <span><kbd>↩</kbd> insert</span>
            <span><kbd>⌘↩</kbd> insert &amp; continue</span>
            <span><kbd>↑↓</kbd> navigate</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>
        <div className="cmdk-preview">
          {cur && (
            <span className="cmdk-preview-inner">
              <GhostRender type={cur.type} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
