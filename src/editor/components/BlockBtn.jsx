import { useContext } from 'react'
import { EditorStoreCtx } from '../context.js'
import { useStore } from '../store/editorStore.js'

/* Block button: link target + style variant; inert while editing, live in preview */
export default function BlockBtn({ p, className = '' }) {
  const store = useContext(EditorStoreCtx)
  const preview = useStore(store, (s) => s.preview)
  return (
    <a
      className={`b-btn ${p.btnStyle || ''} ${className}`}
      href={p.href || '#'}
      target={preview && p.href ? '_blank' : undefined}
      rel="noreferrer"
      onClick={(e) => {
        if (!preview || !p.href) e.preventDefault()
      }}
    >
      {p.button}
    </a>
  )
}
