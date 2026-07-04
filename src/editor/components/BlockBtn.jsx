import { useContext } from 'react'
import { EdCtx } from '../context.js'

/* Block button: link target + style variant; inert while editing, live in preview */
export default function BlockBtn({ p, className = '' }) {
  const ed = useContext(EdCtx)
  return (
    <a
      className={`b-btn ${p.btnStyle || ''} ${className}`}
      href={p.href || '#'}
      target={ed.preview && p.href ? '_blank' : undefined}
      rel="noreferrer"
      onClick={(e) => {
        if (!ed.preview || !p.href) e.preventDefault()
      }}
    >
      {p.button}
    </a>
  )
}
