import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TemplateCard from '../components/TemplateCard.jsx'
import { FEATURES, TEMPLATES } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

const ROTATE_WORDS = ['business', 'café', 'studio', 'boutique', 'portfolio']

export default function Home() {
  const rootRef = useRef(null)
  const rotatorRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    /* Rotating headline word */
    let wordIndex = 0
    const rotate = () => {
      const el = rotatorRef.current
      if (!el) return
      gsap.to(el, {
        yPercent: -120,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          wordIndex = (wordIndex + 1) % ROTATE_WORDS.length
          el.textContent = ROTATE_WORDS[wordIndex]
          gsap.fromTo(
            el,
            { yPercent: 120, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
          )
        },
      })
    }
    const rotateTimer = setInterval(rotate, 2600)

    /* Mouse parallax on floating hero cards */
    const cards = gsap.utils.toArray('.float-card')
    const setters = cards.map((c) => ({
      x: gsap.quickTo(c, 'x', { duration: 0.9, ease: 'power3' }),
      y: gsap.quickTo(c, 'y', { duration: 0.9, ease: 'power3' }),
      depth: parseFloat(c.dataset.depth || 1),
    }))
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      setters.forEach((s) => {
        s.x(nx * 70 * s.depth)
        s.y(ny * 44 * s.depth)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const ctx = gsap.context(() => {
      /* Hero intro */
      gsap.fromTo(
        '.hero-line > span',
        { yPercent: 115 },
        { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out', delay: 0.2 }
      )
      gsap.fromTo(
        ['.hero-eyebrow', '.hero-sub', '.hero-cta-row', '.scroll-hint'],
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: 'power3.out', delay: 0.75 }
      )
      gsap.fromTo(
        '.float-card',
        { opacity: 0, scale: 0.85, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 1 }
      )

      /* Hero exit parallax — layers leave at different speeds */
      gsap.to('.hero-inner', {
        yPercent: -30,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true },
      })
      gsap.utils.toArray('.float-card').forEach((c, i) => {
        gsap.to(c, {
          yPercent: -60 - i * 25,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 45%', scrub: true },
        })
      })

      /* How-it-works steps: scroll-scrubbed rise */
      gsap.utils.toArray('.step').forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 90, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: `top ${96 - i * 2}%`, end: 'top 55%', scrub: 0.6 },
          }
        )
      })

      /* Connecting line between steps draws itself */
      gsap.fromTo(
        '.steps-line span',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'top 30%', scrub: 0.6 },
        }
      )

      /* Pricing cards: staggered scrubbed rise */
      gsap.utils.toArray('.price-card').forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 110 + i * 40, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.pricing-grid', start: 'top 95%', end: 'top 40%', scrub: 0.6 },
          }
        )
      })

      /* Generic reveals */
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 56, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          }
        )
      })

      /* Gallery cards */
      gsap.fromTo(
        '.tpl',
        { y: 72, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.gallery-grid', start: 'top 85%' },
        }
      )
    }, rootRef)

    return () => {
      ctx.revert()
      clearInterval(rotateTimer)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div ref={rootRef}>
      {/* ---------------- Hero ---------------- */}
      <section className="hero">
        <div className="float-card fc-1" data-depth="1.4" aria-hidden="true">
          <span className="chip">Template · Café</span>
          <span className="sk sk-hero" />
          <span className="sk sk-line w70" />
          <span className="sk sk-line w45" />
        </div>
        <div className="float-card fc-2" data-depth="0.9" aria-hidden="true">
          <span className="chip">Your brand</span>
          <div className="swatches">
            <span /><span /><span /><span />
          </div>
          <span className="sk sk-line w70" />
        </div>
        <div className="float-card fc-3" data-depth="1.8" aria-hidden="true">
          <span className="live-dot" />
          <div className="live-text">
            <strong>yoursite.com</strong>
            <span>Published · just now</span>
          </div>
        </div>

        <div className="hero-inner">
          <p className="hero-eyebrow">The modern website builder — premium quality, honest price</p>
          <h1>
            <span className="hero-line"><span>The website your</span></span>
            <span className="hero-line rotator-line">
              <span><em ref={rotatorRef} className="rotator">business</em></span>
            </span>
            <span className="hero-line"><span>deserves.</span></span>
          </h1>
          <p className="hero-sub">
            The design quality of the expensive builders — at a price that isn't.
            AI drafts your site, you make it yours, and it's live in minutes.
          </p>
          <div className="hero-cta-row">
            <Link className="btn" to="/app">Start building — it's free</Link>
            <Link className="btn btn-ghost" to="/templates">Browse templates</Link>
          </div>
        </div>
        <div className="scroll-hint">
          <span className="scroll-hint-line" />
          scroll
        </div>
      </section>

      {/* ---------------- Feature marquee ---------------- */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div className="marquee-group" key={dup}>
              {FEATURES.map((f) => (
                <span key={f}><i>◆</i>{f}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- How it works ---------------- */}
      <section className="how" id="how">
        <p className="section-label" data-reveal>How it works</p>
        <h2 data-reveal>Live in three steps.</h2>
        <p className="section-sub" data-reveal>
          From blank page to published site in an afternoon — without touching code.
        </p>

        <div className="steps">
          <div className="steps-line"><span /></div>
          <article className="step">
            <div className="step-icon">
              <svg viewBox="0 0 48 48" className="icon-spark">
                <path d="M24 6 L28 20 L42 24 L28 28 L24 42 L20 28 L6 24 L20 20 Z" />
              </svg>
            </div>
            <span className="step-num">01</span>
            <h3>AI-assisted setup</h3>
            <p>Answer three questions about your business. Aedes drafts the whole site — pages, layout, copy — in about a minute.</p>
          </article>

          <article className="step">
            <div className="step-icon">
              <div className="icon-drag">
                <span className="icon-drag-frame" />
                <span className="icon-drag-block" />
              </div>
            </div>
            <span className="step-num">02</span>
            <h3>Drag-and-drop editing</h3>
            <p>Move anything, anywhere. Every element snaps to a real design grid, so it stays polished no matter what you touch.</p>
          </article>

          <article className="step">
            <div className="step-icon">
              <div className="icon-publish">
                <span className="icon-publish-dot" />
                <span className="icon-publish-ring" />
                <span className="icon-publish-ring r2" />
              </div>
            </div>
            <span className="step-num">03</span>
            <h3>Publish live</h3>
            <p>One click. Global hosting, SSL, and your custom domain included — not sold back to you as add-ons.</p>
          </article>
        </div>
      </section>

      {/* ---------------- Pricing teaser ---------------- */}
      <section className="pricing" id="pricing">
        <p className="section-label" data-reveal>Pricing</p>
        <h2 data-reveal>Same quality.<br />A fraction of the price.</h2>

        <div className="pricing-grid">
          <article className="price-card">
            <h3>Agency build</h3>
            <div className="price"><span className="amount">$3,000+</span><span className="per">one-off</span></div>
            <ul>
              <li>Weeks of back-and-forth</li>
              <li>Beautiful result, agency invoice</li>
              <li>Every change costs extra</li>
              <li>You don't own the process</li>
            </ul>
          </article>

          <article className="price-card">
            <h3>Typical builder</h3>
            <div className="price"><span className="amount">$29</span><span className="per">/month</span></div>
            <ul>
              <li>Solid drag-and-drop tools</li>
              <li>Best templates gated to top plans</li>
              <li>Price climbs every renewal</li>
              <li>Their badge on your footer</li>
            </ul>
          </article>

          <article className="price-card featured">
            <span className="pill">Aedes</span>
            <h3>Everything, included</h3>
            <div className="price"><span className="amount">$9</span><span className="per">/month</span></div>
            <ul>
              <li>AI setup + every template</li>
              <li>Custom domain, SSL &amp; hosting</li>
              <li>E-commerce built in</li>
              <li>No badge. No upsells. Yours.</li>
            </ul>
            <Link className="btn btn-invert" to="/app">Start free</Link>
          </article>
        </div>
        <p className="section-more" data-reveal>
          <Link to="/pricing">See full pricing &amp; plan comparison →</Link>
        </p>
      </section>

      {/* ---------------- Templates teaser ---------------- */}
      <section className="gallery" id="templates">
        <p className="section-label" data-reveal>Templates</p>
        <h2 data-reveal>Templates that don't<br />look like templates.</h2>

        <div className="gallery-grid">
          {TEMPLATES.slice(0, 6).map((t) => (
            <TemplateCard t={t} key={t.name} />
          ))}
        </div>
        <p className="section-more" data-reveal>
          <Link to="/templates">View all {TEMPLATES.length} templates →</Link>
        </p>
      </section>
    </div>
  )
}
