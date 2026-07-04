import { Seg } from './controls.jsx'

/*
 * Schema-driven inspector fields. Each block descriptor (src/blocks/types)
 * declares a `fields` array; this renders it. Replaces the former
 * property-presence conditional cascade in Inspector.jsx. Markup is kept
 * identical to the original controls so behavior is preserved exactly.
 */
export default function FieldRenderer({ block, fields, onProp, setColumnsCount }) {
  const p = block.props
  const set = (patch) => onProp(block.id, patch)
  return (
    <>
      {(fields || []).map((f, i) => (
        <Field key={i} f={f} p={p} block={block} set={set} setColumnsCount={setColumnsCount} />
      ))}
    </>
  )
}

function Field({ f, p, block, set, setColumnsCount }) {
  switch (f.control) {
    case 'text':
      return (
        <label className="ins-field">
          <span>{f.label}</span>
          <input value={p[f.key]} onChange={(e) => set({ [f.key]: e.target.value })} />
        </label>
      )
    case 'textarea':
      return (
        <label className="ins-field">
          <span>{f.label}</span>
          <textarea rows={String(f.rows)} value={p[f.key]} onChange={(e) => set({ [f.key]: e.target.value })} />
        </label>
      )
    case 'number':
      return (
        <label className="ins-field">
          <span>{f.label}</span>
          <input
            type="number"
            min={String(f.min)}
            max={String(f.max)}
            value={p[f.key]}
            onChange={(e) => set({ [f.key]: Math.min(f.max, Math.max(f.min, +e.target.value || f.min)) })}
          />
        </label>
      )
    case 'seg':
      return (
        <div className="ins-field">
          <span>{f.label}</span>
          <div className="ins-seg">
            {f.options.map((o) => (
              <button key={o} type="button" className={p[f.key] === o ? 'active' : ''} onClick={() => set({ [f.key]: o })}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )
    case 'button':
      return (
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
      )
    case 'stringArray':
      return (
        <div className="ins-field">
          <span>{f.label}</span>
          {p[f.key].map((v, i) => (
            <input
              key={i}
              style={{ marginBottom: '0.4rem' }}
              value={v}
              onChange={(e) => set({ [f.key]: p[f.key].map((x, j) => (j === i ? e.target.value : x)) })}
            />
          ))}
        </div>
      )
    case 'columns':
      return (
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
      )
    case 'note':
      return <p className="ins-note">{f.text}</p>
    case 'date':
      return (
        <label className="ins-field">
          <span>{f.label}</span>
          <input
            type="date"
            value={p[f.key] ? p[f.key].slice(0, 10) : ''}
            onChange={(e) => e.target.value && set({ [f.key]: new Date(`${e.target.value}T12:00:00`).toISOString() })}
          />
        </label>
      )
    case 'items':
      return (
        <div className="ins-field">
          <span>{f.label}</span>
          {p.items.map((it, i) => (
            <div className="ins-item" key={i}>
              {f.item.map((sub) =>
                sub.control === 'textarea' ? (
                  <textarea
                    key={sub.key}
                    rows={String(sub.rows)}
                    value={it[sub.key]}
                    onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, [sub.key]: e.target.value } : x)) })}
                  />
                ) : (
                  <input
                    key={sub.key}
                    value={it[sub.key]}
                    onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, [sub.key]: e.target.value } : x)) })}
                  />
                )
              )}
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}
