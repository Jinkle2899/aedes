import { BLOCK_DEFS } from '../../lib/store.js'
import { Seg } from './controls.jsx'
import StylePanel from './StylePanel.jsx'

/* ---------------- Inspector: breadcrumbs, style panel, per-type fields ---------------- */
export default function Inspector({ block, path, onProp, setColumnsCount, onSelect }) {
  if (!block) {
    return (
      <div className="ins-empty">
        <p>Select a block on the canvas to edit it — or drag a new one in from the left.</p>
      </div>
    )
  }
  const p = block.props
  const set = (patch) => onProp(block.id, patch)
  const crumbs = (path || []).filter((b) => b.type !== 'column')

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

      {block.type === 'columns' && (
        <div className="ins-field">
          <span>Columns</span>
          <div className="ins-seg">
            {[2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={block.children.length === n ? 'active' : ''}
                onClick={() => setColumnsCount(block.id, n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
      {'pad' in p && (
        <div className="ins-field">
          <span>Padding</span>
          <div className="ins-seg">
            {['sm', 'md', 'lg'].map((s) => (
              <button key={s} type="button" className={p.pad === s ? 'active' : ''} onClick={() => set({ pad: s })}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {block.type === 'canvas' && (
        <>
          <label className="ins-field">
            <span>Section height (px)</span>
            <input
              type="number"
              min="200"
              max="1400"
              value={p.height}
              onChange={(e) => set({ height: Math.min(1400, Math.max(200, +e.target.value || 200)) })}
            />
          </label>
          <p className="ins-note">
            Edit elements directly on the canvas: drag to move, double-click text to edit,
            pull the corner dot to resize, use the floating toolbar for style &amp; images.
          </p>
        </>
      )}
      {block.type === 'spacer' && (
        <label className="ins-field">
          <span>Height (px)</span>
          <input
            type="number"
            min="16"
            max="400"
            value={p.height}
            onChange={(e) => set({ height: Math.min(400, Math.max(16, +e.target.value || 16)) })}
          />
        </label>
      )}
      {'brand' in p && (
        <label className="ins-field">
          <span>Brand</span>
          <input value={p.brand} onChange={(e) => set({ brand: e.target.value })} />
        </label>
      )}
      {'heading' in p && (
        <label className="ins-field">
          <span>Heading</span>
          <input value={p.heading} onChange={(e) => set({ heading: e.target.value })} />
        </label>
      )}
      {'text' in p && (
        <label className="ins-field">
          <span>Quote</span>
          <textarea rows="4" value={p.text} onChange={(e) => set({ text: e.target.value })} />
        </label>
      )}
      {'author' in p && (
        <label className="ins-field">
          <span>Author</span>
          <input value={p.author} onChange={(e) => set({ author: e.target.value })} />
        </label>
      )}
      {'role' in p && (
        <label className="ins-field">
          <span>Role</span>
          <input value={p.role} onChange={(e) => set({ role: e.target.value })} />
        </label>
      )}
      {'sub' in p && (
        <label className="ins-field">
          <span>Subheading</span>
          <textarea rows="3" value={p.sub} onChange={(e) => set({ sub: e.target.value })} />
        </label>
      )}
      {'body' in p && (
        <label className="ins-field">
          <span>Body</span>
          <textarea rows="5" value={p.body} onChange={(e) => set({ body: e.target.value })} />
        </label>
      )}
      {'button' in p && (
        <>
          <label className="ins-field">
            <span>Button label</span>
            <input value={p.button} onChange={(e) => set({ button: e.target.value })} />
          </label>
          <label className="ins-field">
            <span>Button link (URL)</span>
            <input
              placeholder="https://… (opens in preview)"
              value={p.href || ''}
              onChange={(e) => set({ href: e.target.value || undefined })}
            />
          </label>
          <Seg
            label="Button style"
            value={p.btnStyle}
            clearOn="fill"
            options={[['fill', 'fill'], ['outline', 'outline'], ['soft', 'soft']]}
            onChange={(btnStyle) => set({ btnStyle })}
          />
        </>
      )}
      {'caption' in p && (
        <label className="ins-field">
          <span>Caption</span>
          <input value={p.caption} onChange={(e) => set({ caption: e.target.value })} />
        </label>
      )}
      {'align' in p && (
        <div className="ins-field">
          <span>Alignment</span>
          <div className="ins-seg">
            {['left', 'center'].map((a) => (
              <button key={a} type="button" className={p.align === a ? 'active' : ''} onClick={() => set({ align: a })}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
      {'tone' in p && (
        <div className="ins-field">
          <span>Background</span>
          <div className="ins-seg">
            {['light', 'tint', 'dark'].map((t) => (
              <button key={t} type="button" className={p.tone === t ? 'active' : ''} onClick={() => set({ tone: t })}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {'ratio' in p && (
        <div className="ins-field">
          <span>Ratio</span>
          <div className="ins-seg">
            {['wide', 'square'].map((r) => (
              <button key={r} type="button" className={p.ratio === r ? 'active' : ''} onClick={() => set({ ratio: r })}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {'note' in p && (
        <label className="ins-field">
          <span>Small print</span>
          <input value={p.note} onChange={(e) => set({ note: e.target.value })} />
        </label>
      )}
      {Array.isArray(p.links) && (
        <div className="ins-field">
          <span>Links</span>
          {p.links.map((l, i) => (
            <input
              key={i}
              style={{ marginBottom: '0.4rem' }}
              value={l}
              onChange={(e) => set({ links: p.links.map((x, j) => (j === i ? e.target.value : x)) })}
            />
          ))}
        </div>
      )}
      {block.type === 'countdown' && (
        <label className="ins-field">
          <span>Counting down to</span>
          <input
            type="date"
            value={p.target ? p.target.slice(0, 10) : ''}
            onChange={(e) => e.target.value && set({ target: new Date(`${e.target.value}T12:00:00`).toISOString() })}
          />
        </label>
      )}
      {block.type === 'rotator' && (
        <>
          <label className="ins-field">
            <span>Leading text</span>
            <input value={p.prefix} onChange={(e) => set({ prefix: e.target.value })} />
          </label>
          <div className="ins-field">
            <span>Cycling words</span>
            {p.words.map((w, i) => (
              <input
                key={i}
                style={{ marginBottom: '0.4rem' }}
                value={w}
                onChange={(e) => set({ words: p.words.map((x, j) => (j === i ? e.target.value : x)) })}
              />
            ))}
          </div>
        </>
      )}
      {block.type === 'tabs' && (
        <div className="ins-field">
          <span>Tabs</span>
          {p.items.map((it, i) => (
            <div className="ins-item" key={i}>
              <input
                value={it.t}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)) })}
              />
              <textarea
                rows="2"
                value={it.d}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)) })}
              />
            </div>
          ))}
        </div>
      )}
      {block.type === 'accordion' && (
        <div className="ins-field">
          <span>Questions</span>
          {p.items.map((it, i) => (
            <div className="ins-item" key={i}>
              <input
                value={it.q}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })}
              />
              <textarea
                rows="2"
                value={it.a}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
              />
            </div>
          ))}
        </div>
      )}
      {block.type === 'stats' && (
        <div className="ins-field">
          <span>Stats</span>
          {p.items.map((it, i) => (
            <div className="ins-item" key={i}>
              <input
                value={it.n}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)) })}
              />
              <input
                value={it.l}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, l: e.target.value } : x)) })}
              />
            </div>
          ))}
        </div>
      )}
      {block.type === 'features' && (
        <div className="ins-field">
          <span>Items</span>
          {p.items.map((it, i) => (
            <div className="ins-item" key={i}>
              <input
                value={it.t}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)) })}
              />
              <input
                value={it.d}
                onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)) })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
