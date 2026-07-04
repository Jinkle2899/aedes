import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

const PLANS = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    blurb: 'For trying things out',
    features: ['1 site on an aedes.site subdomain', 'Every template + AI setup', 'Up to 5 pages', 'Community support'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    monthly: 9,
    yearly: 7.5,
    blurb: 'For going live properly',
    featured: true,
    features: ['Custom domain, SSL & hosting', 'Unlimited pages', 'E-commerce (up to 50 products)', 'Analytics & SEO tools', 'No badge. No upsells.'],
    cta: 'Start with Pro',
  },
  {
    name: 'Business',
    monthly: 19,
    yearly: 16,
    blurb: 'For growing teams',
    features: ['Everything in Pro', 'Unlimited products', '3 team seats', 'Advanced analytics', 'Priority support'],
    cta: 'Start with Business',
  },
]

const COMPARISON = [
  ['Monthly price', '$9', '$29–49', '$3,000+ one-off'],
  ['AI site setup', '✓', 'Higher plans only', '—'],
  ['All templates included', '✓', 'Best ones gated', 'Custom'],
  ['Custom domain + SSL', '✓', '✓', '✓'],
  ['E-commerce', '✓', 'Extra fee', 'Extra scope'],
  ['Badge-free on every plan', '✓', 'Paid plans only', '✓'],
  ['Time to launch', 'Minutes', 'Days', 'Weeks'],
]

const FAQS = [
  ['Is the free plan actually free?', 'Yes — no card, no trial clock. You get a full site on an aedes.site subdomain with every template and the AI setup. You only pay when you want a custom domain or e-commerce.'],
  ['Can I bring my own domain?', 'Yes. Connect any domain you already own on Pro or Business, or register a new one during setup. SSL is provisioned automatically either way.'],
  ['Will the price go up at renewal?', 'No. The price you sign up at is the price you keep — no first-year discounts that double later. That is kind of the whole point of Aedes.'],
  ['What happens if I cancel?', 'Your site stays exported and yours. Download a full static copy of your pages any time — we do not hold your website hostage.'],
  ['Do you put a badge on my site?', 'Never, on any plan — including Free. Your site looks like yours, not like an ad for us.'],
]

export default function Pricing() {
  const rootRef = useRef(null)
  const [yearly, setYearly] = useState(true)
  const [open, setOpen] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ['.page-head > *', '.billing-toggle', '.plan-card'],
        { y: 44, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      )
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 56, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }
        )
      })
      gsap.utils.toArray('.cmp-table tr').forEach((row, i) => {
        gsap.fromTo(
          row,
          { opacity: 0, x: -24 },
          { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.04, scrollTrigger: { trigger: '.cmp-table', start: 'top 85%' } }
        )
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      <section className="page pricing-page">
        <div className="page-head">
          <p className="section-label">Pricing</p>
          <h2>Simple pricing.<br />Nothing gated.</h2>
          <p className="section-sub">
            Every template, the AI builder, and real support on every plan.
            The price you join at is the price you keep.
          </p>
        </div>

        <div className="billing-toggle" role="group" aria-label="Billing period">
          <button type="button" className={!yearly ? 'active' : ''} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" className={yearly ? 'active' : ''} onClick={() => setYearly(true)}>
            Yearly <i>2 months free</i>
          </button>
        </div>

        <div className="pricing-grid plans-grid">
          {PLANS.map((p) => (
            <article className={`price-card plan-card${p.featured ? ' featured' : ''}`} key={p.name}>
              {p.featured && <span className="pill">Most popular</span>}
              <h3>{p.name}</h3>
              <p className="plan-blurb">{p.blurb}</p>
              <div className="price">
                <span className="amount">${yearly ? p.yearly : p.monthly}</span>
                <span className="per">/month{yearly && p.monthly > 0 ? ', billed yearly' : ''}</span>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link className={`btn ${p.featured ? 'btn-invert' : 'btn-ghost'}`} to="/app">{p.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="compare">
        <p className="section-label" data-reveal>The honest comparison</p>
        <h2 data-reveal>Where the money goes.</h2>
        <div className="cmp-wrap" data-reveal>
          <table className="cmp-table">
            <thead>
              <tr>
                <th></th>
                <th className="cmp-us">Aedes Pro</th>
                <th>Typical builder</th>
                <th>Agency</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([label, us, them, agency]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="cmp-us">{us}</td>
                  <td>{them}</td>
                  <td>{agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="faq">
        <p className="section-label" data-reveal>FAQ</p>
        <h2 data-reveal>Fair questions.</h2>
        <div className="faq-list" data-reveal>
          {FAQS.map(([q, a], i) => (
            <div className={`faq-item${open === i ? ' open' : ''}`} key={q}>
              <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {q}
                <span className="faq-x" aria-hidden="true">+</span>
              </button>
              <div className="faq-body">
                <p>{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
