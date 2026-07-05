import { useEffect } from 'react'

/* Document title, on-demand Google Font loading, and preview entrance animations.
   Extracted verbatim from EditorInner. */
export function useEditorEffects({ name, font, preview }) {
  useEffect(() => {
    document.title = `${name} — Aedes Editor`
  }, [name])

  useEffect(() => {
    const f = font
    if (!f || f === 'Inter') return
    const id = `gfont-${f.replace(/ /g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
    document.head.appendChild(link)
  }, [font])

  useEffect(() => {
    if (!preview) return
    const wrap = document.querySelector('.ed-canvas-wrap')
    const els = document.querySelectorAll('.ed-canvas .blk[data-anim]')
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('anim-in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.15, root: wrap }
    )
    els.forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      els.forEach((el) => el.classList.remove('anim-in'))
    }
  }, [preview])
}
