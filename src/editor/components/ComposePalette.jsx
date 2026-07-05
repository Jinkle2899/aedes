import { useContext, useMemo, useState } from 'react'
import { EdCtx } from '../context.js'
import { BLOCK_DEFS } from '../../lib/store.js'

/* ---------------- Aedes Compose (⌘G) — describe a section/page, get blocks ----------------
 * Preview is deterministic (Tier 0), so it updates live and for free as you type.
 * Enter generates real, editable blocks and inserts them.
 */
export default function ComposePalette() {
  const ed = useContext(EdCtx)
  const [prompt, setPrompt] = useState('')
  const [scope, setScope] = useState('section')

  const preview = useMemo(() => (prompt.trim() ? ed.composePreview(prompt, scope) : null), [prompt, scope, ed])

  const run = () => {
    if (prompt.trim()) ed.compose(prompt, scope)
  }
  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
    } else if (e.key === 'Escape') {
      ed.closePalette()
    }
  }

  return (
    <div className="cmdk-scrim" onClick={ed.closePalette}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-main">
          <div className="cmp-scope">
            {['section', 'page'].map((s) => (
              <button key={s} type="button" className={scope === s ? 'on' : ''} onClick={() => setScope(s)}>
                {s}
              </button>
            ))}
          </div>
          <input
            autoFocus
            placeholder={
              scope === 'page'
                ? 'Describe a page — e.g. “SaaS landing page with pricing and FAQ”'
                : 'Describe a section — e.g. “a testimonial” or “contact form”'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="cmdk-list">
            {preview && preview.blocks.length > 0 ? (
              <>
                <p className="cmdk-section">Will insert{preview.kind ? ` · ${preview.kind}` : ''}</p>
                {preview.recipe.map((b, i) => (
                  <div className="cmdk-row" key={i}>
                    <strong>{BLOCK_DEFS[b.type].label}</strong>
                    <span>{BLOCK_DEFS[b.type].hint}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="cmdk-none">
                {prompt.trim()
                  ? 'No blocks matched — try naming a section (testimonial, FAQ, gallery…)'
                  : 'Type what you want. Generated blocks are fully editable.'}
              </p>
            )}
          </div>
          <div className="cmdk-foot">
            <span>
              <kbd>↩</kbd> generate &amp; insert
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
