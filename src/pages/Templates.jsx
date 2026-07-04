import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import TemplateCard from '../components/TemplateCard.jsx'
import { TEMPLATES, CATEGORIES } from '../data.js'

export default function Templates() {
  const rootRef = useRef(null)
  const [cat, setCat] = useState('All')
  const filtered = cat === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.tag === cat)

  /* Page intro */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ['.page-head > *', '.filters'],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  /* Re-animate the grid whenever the filter changes */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.tpl',
        { y: 36, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.05, duration: 0.55, ease: 'power3.out' }
      )
    }, rootRef)
    return () => ctx.revert()
  }, [cat])

  return (
    <div ref={rootRef}>
      <section className="page gallery">
        <div className="page-head">
          <p className="section-label">Templates</p>
          <h2>Every template.<br />Every plan. No gates.</h2>
          <p className="section-sub">
            {TEMPLATES.length} professionally designed starting points — all included,
            even on the free plan. Pick one, and make it unrecognizable.
          </p>
        </div>

        <div className="filters" role="tablist" aria-label="Filter templates by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              className={`filter-chip${cat === c ? ' active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
              {c !== 'All' && (
                <i>{TEMPLATES.filter((t) => t.tag === c).length}</i>
              )}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {filtered.map((t) => (
            <TemplateCard t={t} key={t.name} />
          ))}
        </div>
      </section>
    </div>
  )
}
