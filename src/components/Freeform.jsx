import { useEffect, useRef, useState } from 'react'
import { uid } from '../lib/store.js'

/*
 * Freeform section — absolutely positioned elements inside a block.
 * x and w are stored as % of section width (responsive-ish);
 * y and image height are px.
 */

const newText = (x, y) => ({
  id: uid(), kind: 'text', x, y, w: 34, text: 'New text — double-click to edit', size: 18, weight: 400, color: '#17171a',
})
const newImage = (x, y) => ({
  id: uid(), kind: 'image', x, y, w: 34, h: 190, src: null,
})

export default function Freeform({ block, preview, onProp }) {
  const wrap = useRef(null)
  const fileRef = useRef(null)
  const [sel, setSel] = useState(null)
  const [editing, setEditing] = useState(null)

  const els = block.props.elements
  const setEls = (fn) => onProp(block.id, { elements: fn([...els]) })
  const patchEl = (id, patch) =>
    setEls((arr) => arr.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  const removeEl = (id) => {
    setEls((arr) => arr.filter((e) => e.id !== id))
    setSel(null)
  }

  /* Delete key removes the selected element (when not typing) */
  useEffect(() => {
    const onKey = (e) => {
      if (!sel || editing || preview) return
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
      e.preventDefault()
      removeEl(sel)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ---- pointer interactions ---- */
  const startMove = (el) => (e) => {
    e.stopPropagation()
    if (preview || editing === el.id) return
    setSel(el.id)
    const cw = wrap.current.offsetWidth
    const sx = e.clientX
    const sy = e.clientY
    const ox = el.x
    const oy = el.y
    const move = (ev) => {
      patchEl(el.id, {
        x: Math.min(96, Math.max(-4, ox + ((ev.clientX - sx) / cw) * 100)),
        y: Math.max(0, oy + (ev.clientY - sy)),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startResize = (el) => (e) => {
    e.stopPropagation()
    e.preventDefault()
    const cw = wrap.current.offsetWidth
    const sx = e.clientX
    const sy = e.clientY
    const ow = el.w
    const oh = el.h
    const move = (ev) => {
      const patch = { w: Math.min(100, Math.max(8, ow + ((ev.clientX - sx) / cw) * 100)) }
      if (el.kind === 'image') patch.h = Math.max(60, oh + (ev.clientY - sy))
      patchEl(el.id, patch)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startHeight = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const sy = e.clientY
    const oh = block.props.height
    const move = (ev) =>
      onProp(block.id, { height: Math.min(1400, Math.max(200, oh + (ev.clientY - sy))) })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /* Double-click empty area → add text right there */
  const onDbl = (e) => {
    if (preview || e.target !== wrap.current) return
    const r = wrap.current.getBoundingClientRect()
    const el = newText(
      Math.min(88, ((e.clientX - r.left) / r.width) * 100),
      Math.max(0, e.clientY - r.top - 12)
    )
    setEls((arr) => [...arr, el])
    setSel(el.id)
    setEditing(el.id)
  }

  /* ---- image upload (downscaled data URL) ---- */
  const onFile = (e) => {
    const f = e.target.files[0]
    const targetId = sel
    if (!f || !targetId) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 1200 / img.width)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        try {
          patchEl(targetId, { src: c.toDataURL('image/jpeg', 0.82) })
        } catch {
          alert('That image is too large to store locally — try a smaller one.')
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  const addEl = (make) => (e) => {
    e.stopPropagation()
    const el = make(8, 40 + Math.random() * 60)
    setEls((arr) => [...arr, el])
    setSel(el.id)
  }

  return (
    <div
      ref={wrap}
      className={`b-canvas${preview ? ' preview' : ''}`}
      style={{ height: block.props.height }}
      onPointerDown={() => {
        setSel(null)
        setEditing(null)
      }}
      onDoubleClick={onDbl}
    >
      {!preview && (
        <div className="ff-add" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" onClick={addEl(newText)}>+ Text</button>
          <button type="button" onClick={addEl(newImage)}>+ Image</button>
        </div>
      )}

      {els.length === 0 && !preview && (
        <div className="ff-hint">Double-click anywhere to add text, or use the buttons above</div>
      )}

      {els.map((el) => (
        <div
          key={el.id}
          className={`ff-el${sel === el.id && !preview ? ' sel' : ''}${editing === el.id ? ' editing' : ''}`}
          style={{ left: `${el.x}%`, top: el.y, width: `${el.w}%` }}
          onPointerDown={startMove(el)}
          onDoubleClick={(e) => {
            if (preview || el.kind !== 'text') return
            e.stopPropagation()
            setEditing(el.id)
          }}
        >
          {el.kind === 'text' ? (
            <div
              className="ff-text"
              style={{ fontSize: el.size, fontWeight: el.weight, color: el.color }}
              contentEditable={editing === el.id}
              suppressContentEditableWarning
              spellCheck={false}
              onBlur={(e) => {
                patchEl(el.id, { text: e.currentTarget.textContent })
                setEditing(null)
              }}
            >
              {el.text}
            </div>
          ) : el.src ? (
            <img className="ff-img" src={el.src} style={{ height: el.h }} alt="" draggable={false} />
          ) : (
            <div className="ff-img-ph" style={{ height: el.h }}>
              <span>Image — select &amp; “Upload”</span>
            </div>
          )}

          {sel === el.id && !preview && (
            <>
              <span className="ff-resize" onPointerDown={startResize(el)} title="Resize" />
              <div className="ff-tools" onPointerDown={(e) => e.stopPropagation()}>
                {el.kind === 'text' ? (
                  <>
                    <button type="button" onClick={() => patchEl(el.id, { size: Math.max(11, el.size - 2) })}>A−</button>
                    <button type="button" onClick={() => patchEl(el.id, { size: Math.min(96, el.size + 2) })}>A+</button>
                    <button
                      type="button"
                      className={el.weight >= 600 ? 'on' : ''}
                      onClick={() => patchEl(el.id, { weight: el.weight >= 600 ? 400 : 700 })}
                    >
                      B
                    </button>
                    {['#17171a', '#6b7280', '#ffffff'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`dot${el.color === c ? ' on' : ''}`}
                        style={{ background: c }}
                        onClick={() => patchEl(el.id, { color: c })}
                        title={c}
                      />
                    ))}
                  </>
                ) : (
                  <button type="button" onClick={() => fileRef.current.click()}>Upload</button>
                )}
                <button type="button" onClick={() => removeEl(el.id)} title="Delete">✕</button>
              </div>
            </>
          )}
        </div>
      ))}

      {!preview && <span className="ff-height" onPointerDown={startHeight} title="Drag to change section height" />}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  )
}
