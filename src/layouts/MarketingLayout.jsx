import { useEffect, useRef } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export default function MarketingLayout() {
  const lenisRef = useRef(null)
  const { pathname } = useLocation()

  /* Smooth scroll — marketing pages only */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  /* On route change: jump to top, re-attach magnetic buttons, footer reveal */
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    ScrollTrigger.refresh()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const magnets = gsap.utils.toArray('.btn').map((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3' })
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3' })
      const move = (e) => {
        const r = btn.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28)
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      btn.addEventListener('mousemove', move)
      btn.addEventListener('mouseleave', leave)
      return { btn, move, leave }
    })

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-big',
        { yPercent: 30, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'top 35%', scrub: 0.6 },
        }
      )
    })

    return () => {
      ctx.revert()
      magnets.forEach(({ btn, move, leave }) => {
        btn.removeEventListener('mousemove', move)
        btn.removeEventListener('mouseleave', leave)
      })
    }
  }, [pathname])

  return (
    <div>
      {/* Ambient background: grid + drifting glows + grain */}
      <div className="bg" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-glow g1" />
        <div className="bg-glow g2" />
        <div className="bg-noise" />
      </div>

      <nav className="nav">
        <Link className="logo" to="/">
          <span className="logo-mark">A</span>
          <span className="logo-word">Aedes</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/templates">Templates</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
        </div>
        <Link className="btn btn-sm" to="/app">Start free</Link>
      </nav>

      <main id="top">
        <Outlet />

        {/* ---------------- Shared footer CTA ---------------- */}
        <footer className="footer" id="footer">
          <h2 className="footer-big">Build something<br /><em>great</em>.</h2>
          <Link className="btn btn-lg" to="/app">Start building — it's free</Link>
          <p className="footer-note">Free to start. No credit card. Your site stays yours.</p>
          <div className="footer-bar">
            <span className="logo-word">Aedes</span>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/templates">Templates</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <span>© 2026 Aedes</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
