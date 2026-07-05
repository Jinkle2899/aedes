import { useContext, useMemo } from 'react'
import { EdCtx, EditorStoreCtx } from '../context.js'
import { previewStore } from '../store/editorStore.js'
import { makeBlock, BLOCK_DEFS } from '../../lib/store.js'
import BlockContent from '../blocks/BlockContent.jsx'

/* ---------------- Horizon ghost (predictive insertion, Layer 1) ---------------- */
export default function HorizonGhost({ candidates, cycle, onCycle, onAccept, onDismiss }) {
  const ed = useContext(EdCtx)
  const cand = candidates[((cycle % candidates.length) + candidates.length) % candidates.length]
  const ghostBlock = useMemo(() => makeBlock(cand.type), [cand.type])
  const alts = candidates.filter((c) => c.type !== cand.type)

  return (
    <div className="horizon" onClick={(e) => e.stopPropagation()}>
      <div
        className="horizon-render"
        onClick={() => onAccept(cand.type)}
        title={`Add ${BLOCK_DEFS[cand.type].label}`}
        role="button"
        aria-label={`Suggested: ${BLOCK_DEFS[cand.type].label}. Press Tab to add, arrow keys for alternatives, Escape to dismiss.`}
      >
        <div className="horizon-inner">
          <EditorStoreCtx.Provider value={previewStore}>
            <BlockContent block={ghostBlock} />
          </EditorStoreCtx.Provider>
        </div>
      </div>
      <div className="horizon-bar">
        <span className="horizon-glyph">⌁</span>
        <strong>{BLOCK_DEFS[cand.type].label}</strong>
        <em>{cand.because}</em>
        <button type="button" className="horizon-add" onClick={() => onAccept(cand.type)}>
          Add <kbd>Tab</kbd>
        </button>
        {alts.length > 0 && (
          <span className="horizon-alts">
            <button type="button" onClick={() => onCycle(-1)} title="Previous suggestion">‹</button>
            <button type="button" onClick={() => onCycle(1)} title="Next suggestion">›</button>
            <span>{alts.map((a) => BLOCK_DEFS[a.type].label).join(' · ')}</span>
          </span>
        )}
        <button type="button" className="horizon-x" onClick={onDismiss} title="Dismiss (Esc)">✕</button>
      </div>
    </div>
  )
}
