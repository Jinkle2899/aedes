import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { timeAgo, slugify } from '../lib/store.js'
import { listSites, removeSite, upsertSite, createNewSite } from '../lib/db.js'
import { cloudEnabled } from '../lib/supabase.js'
import { useAuth, signOut } from '../lib/auth.jsx'
import SignIn from '../components/SignIn.jsx'

function MiniPreview({ blocks }) {
  return (
    <div className="mini-page" aria-hidden="true">
      {blocks.slice(0, 5).map((b) => (
        <span key={b.id} className={`mini mini-${b.type}`} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const { session, ready } = useAuth()
  const [sites, setSites] = useState(null) // null = loading
  const [renaming, setRenaming] = useState(null)
  const [confirming, setConfirming] = useState(null) // site id pending delete confirm

  const authed = !cloudEnabled || !!session

  useEffect(() => {
    document.title = 'Sites — Aedes'
  }, [])

  useEffect(() => {
    if (!ready || !authed) return
    let alive = true
    listSites(session)
      .then((s) => alive && setSites(s))
      .catch(() => alive && setSites([]))
    return () => {
      alive = false
    }
  }, [ready, authed, session])

  useEffect(() => {
    if (!sites) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ['.dash-head > *', '.site-card'],
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out' }
      )
    }, rootRef)
    return () => ctx.revert()
  }, [sites])

  if (!ready) return <div className="dash" />
  if (!authed) return <SignIn />

  const onNew = async () => {
    const site = await createNewSite(session)
    navigate(`/app/editor/${site.id}`)
  }

  const onDelete = async (site) => {
    await removeSite(site.id, session)
    setConfirming(null)
    setSites(await listSites(session))
  }

  const onRename = async (site, name) => {
    const next = { ...site, name: name.trim() || site.name, updatedAt: Date.now() }
    await upsertSite(next, session)
    setSites(await listSites(session))
    setRenaming(null)
  }

  return (
    <div className="dash" ref={rootRef}>
      <nav className="dash-top">
        <Link className="logo" to="/">
          <span className="logo-mark">A</span>
          <span className="logo-word">Aedes</span>
        </Link>
        <span className="dash-crumb">Sites</span>
        {cloudEnabled && session ? (
          <div className="dash-account">
            <span className="dash-email">{session.user.email}</span>
            <button type="button" className="dash-signout" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <div className="dash-account">
            <span className="dash-local" title="Sites are stored in this browser. Configure Supabase to sync.">
              Local mode
            </span>
          </div>
        )}
      </nav>

      <div className="dash-body">
        <div className="dash-head">
          <h1>Your sites</h1>
          <p>
            {sites === null
              ? 'Loading…'
              : sites.length === 0
                ? 'Nothing here yet — create your first site.'
                : `${sites.length} site${sites.length > 1 ? 's' : ''} · ${cloudEnabled && session ? 'synced to your account' : 'saved in this browser'}`}
          </p>
        </div>

        <div className="site-grid">
          <button type="button" className="site-card new-site" onClick={onNew}>
            <span className="new-plus">+</span>
            <strong>New site</strong>
            <span className="new-hint">Start with AI-drafted blocks</span>
            <span
              className="new-tpl-link"
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                navigate('/templates')
              }}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/templates')}
            >
              or pick a template →
            </span>
          </button>

          {(sites || []).map((site) => (
            <div className="site-card" key={site.id}>
              <button
                type="button"
                className="site-preview"
                onClick={() => navigate(`/app/editor/${site.id}`)}
                title="Open in editor"
              >
                <MiniPreview blocks={site.blocks} />
                <span className="site-open">Open editor →</span>
              </button>
              <div className="site-meta">
                <div className="site-name-row">
                  {renaming === site.id ? (
                    <input
                      autoFocus
                      defaultValue={site.name}
                      onBlur={(e) => onRename(site, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur()
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                    />
                  ) : (
                    <strong onDoubleClick={() => setRenaming(site.id)}>{site.name}</strong>
                  )}
                  <span className="site-domain">{slugify(site.name)}.aedes.site</span>
                </div>
                <div className="site-actions">
                  {confirming === site.id ? (
                    <>
                      <span className="site-confirm">Delete “{site.name}”?</span>
                      <button type="button" className="danger" onClick={() => onDelete(site)} title="Confirm delete">
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} title="Cancel">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="site-time">{timeAgo(site.updatedAt)}</span>
                      <button type="button" onClick={() => setRenaming(site.id)} title="Rename">✎</button>
                      <button type="button" onClick={() => setConfirming(site.id)} title="Delete">🗑</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
