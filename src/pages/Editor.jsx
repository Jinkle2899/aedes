import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { makeBlock, emptyColumn, slugify } from '../lib/store.js'
import { getSite, upsertSite } from '../lib/db.js'
import { cloudEnabled } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { findById, findParent, findPath, removeById, insertAt, updateProps, regenIds } from '../lib/tree.js'
import { predict, predictAt, gapSeams } from '../lib/predict.js'
import { loadMeta, recordUse, toggleFav, setPredictOn } from '../lib/blockMeta.js'
import { EdCtx } from '../editor/context.js'
import TopBar from '../editor/components/TopBar.jsx'
import Rail from '../editor/components/Rail.jsx'
import { Children } from '../editor/components/BlockNode.jsx'
import HorizonGhost from '../editor/components/HorizonGhost.jsx'
import CommandPalette from '../editor/components/CommandPalette.jsx'
import BrowseDrawer from '../editor/components/BrowseDrawer.jsx'
import Inspector from '../editor/inspector/Inspector.jsx'

/* ---------------- Loader: fetch the site, then mount the editor ---------------- */
export default function Editor() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const { session, ready } = useAuth()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (cloudEnabled && !session) {
      navigate('/app', { replace: true })
      return
    }
    let alive = true
    getSite(siteId, session)
      .then((s) => {
        if (!alive) return
        if (!s) navigate('/app', { replace: true })
        else setSite(s)
        setLoading(false)
      })
      .catch(() => {
        if (alive) navigate('/app', { replace: true })
      })
    return () => {
      alive = false
    }
  }, [siteId, session, ready, navigate])

  if (loading || !site) {
    return (
      <div className="editor">
        <div className="ed-loading">Loading site…</div>
      </div>
    )
  }
  return <EditorInner initialSite={site} session={session} />
}

/* ---------------- The editor: state + orchestration ---------------- */
function EditorInner({ initialSite, session }) {
  const [site, setSite] = useState(initialSite)
  const [selected, setSelected] = useState(null)
  const [dropTarget, setDropTarget] = useState(null) // { parentId, index }
  const [device, setDevice] = useState('desktop')
  const [preview, setPreview] = useState(false)
  const [toast, setToast] = useState('')
  const [palette, setPalette] = useState(null) // null | 'command' | 'drawer'
  const [meta, setMeta] = useState(loadMeta)
  const [saveState, setSaveState] = useState('saved') // saved | saving | error
  const dragRef = useRef(null)
  const toastTimer = useRef(null)
  const saveTimer = useRef(null)
  const pendingRef = useRef(null)

  useEffect(() => {
    document.title = `${site.name} — Aedes Editor`
  }, [site.name])

  /* Load the chosen Google Font on demand */
  useEffect(() => {
    const f = site.font
    if (!f || f === 'Inter') return
    const id = `gfont-${f.replace(/ /g, '-')}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
    document.head.appendChild(link)
  }, [site.font])

  /* Entrance animations: run on scroll while previewing */
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

  /* flush pending save on unmount */
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current)
      if (pendingRef.current) upsertSite(pendingRef.current, session).catch(() => {})
    },
    [session]
  )

  /* ---- Persistence (debounced) ---- */
  const persist = (next) => {
    next.updatedAt = Date.now()
    setSite(next)
    pendingRef.current = next
    setSaveState('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await upsertSite(next, session)
        pendingRef.current = null
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, 700)
  }
  const patchSite = (patch) => persist({ ...site, ...patch })
  const setBlocks = (fn) => persist({ ...site, blocks: fn(site.blocks) })
  const onProp = (blockId, patch) => setBlocks((bs) => updateProps(bs, blockId, patch))

  /* ---- Tree operations ---- */
  const doInsert = (parentId, index, block) => {
    setBlocks((bs) => insertAt(bs, parentId, index, block))
    setSelected(block.id)
    setMeta(recordUse(block.type))
  }
  const doMove = (id, target) => {
    setBlocks((bs) => {
      const orig = findParent(bs, id)
      if (!orig) return bs
      const [tree, removed] = removeById(bs, id)
      if (!removed) return bs
      /* refuse to drop a container into itself */
      if (target.parentId !== null && (target.parentId === id || findById([removed], target.parentId))) return bs
      let idx = target.index
      if (orig.parentId === target.parentId && orig.index < target.index) idx -= 1
      return insertAt(tree, target.parentId, idx, removed)
    })
  }
  const nudge = (id, dir) => {
    setBlocks((bs) => {
      const loc = findParent(bs, id)
      if (!loc) return bs
      const siblings = loc.parentId === null ? bs : findById(bs, loc.parentId).children
      const j = loc.index + dir
      if (j < 0 || j >= siblings.length) return bs
      const [tree, removed] = removeById(bs, id)
      return insertAt(tree, loc.parentId, j, removed)
    })
  }
  const duplicate = (id) => {
    const loc = findParent(site.blocks, id)
    const orig = findById(site.blocks, id)
    if (!loc || !orig) return
    const copy = regenIds(orig)
    setBlocks((bs) => insertAt(bs, loc.parentId, loc.index + 1, copy))
    setSelected(copy.id)
  }
  const remove = (id) => {
    setBlocks((bs) => removeById(bs, id)[0])
    if (selected === id) setSelected(null)
  }
  const setColumnsCount = (id, n) => {
    const mapBlocks = (arr) =>
      arr.map((b) => {
        if (b.id === id) {
          let ch = [...b.children]
          while (ch.length < n) ch.push(emptyColumn())
          if (ch.length > n) {
            const extra = ch.slice(n)
            ch = ch.slice(0, n)
            ch[n - 1] = { ...ch[n - 1], children: [...ch[n - 1].children, ...extra.flatMap((c) => c.children)] }
          }
          return { ...b, children: ch }
        }
        if (b.children) return { ...b, children: mapBlocks(b.children) }
        return b
      })
    setBlocks(mapBlocks)
  }

  /* ---- Drag & drop ---- */
  const startPaletteDrag = (type) => (e) => {
    dragRef.current = { kind: 'new', type }
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', type)
  }
  const startBlockDrag = (id) => (e) => {
    e.stopPropagation()
    dragRef.current = { kind: 'move', id }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  const overBlock = (parentId, index) => (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    setDropTarget({ parentId, index: e.clientY < r.top + r.height / 2 ? index : index + 1 })
  }
  const overContainer = (parentId, count) => (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    e.stopPropagation()
    setDropTarget({ parentId, index: count })
  }
  const overRoot = (e) => {
    if (!dragRef.current) return
    e.preventDefault()
    setDropTarget({ parentId: null, index: site.blocks.length })
  }
  const drop = (e) => {
    e.preventDefault()
    const d = dragRef.current
    if (d && dropTarget) {
      if (d.kind === 'new') doInsert(dropTarget.parentId, dropTarget.index, makeBlock(d.type))
      else doMove(d.id, dropTarget)
    }
    dragRef.current = null
    setDropTarget(null)
  }
  const endDrag = () => {
    dragRef.current = null
    setDropTarget(null)
  }

  /* ---- Horizon prediction (Layer 1) ---- */
  const blocksSig = site.blocks.map((b) => b.id).join(',')
  const predictOn = meta.predictOn !== false
  const prediction = useMemo(
    () => predict(site.blocks, site.kind, meta.counts),
    [site.blocks, site.kind, meta.counts]
  )
  const [ghostCycle, setGhostCycle] = useState(0)
  const [ghostSuppressed, setGhostSuppressed] = useState(null)
  useEffect(() => setGhostCycle(0), [blocksSig])
  const ghostVisible = !preview && predictOn && prediction.show && ghostSuppressed !== blocksSig
  const togglePredict = () => setMeta(setPredictOn(!predictOn))

  /* ---- Seams + gap detection (Layer 2) ---- */
  const [seamOpen, setSeamOpen] = useState(null)
  const [dismissedGaps, setDismissedGaps] = useState([])
  useEffect(() => setSeamOpen(null), [blocksSig])
  const gapList = useMemo(
    () => gapSeams(site.blocks).filter((g) => !dismissedGaps.includes(g.segment)),
    [site.blocks, dismissedGaps]
  )
  const gapAt = (index) => gapList.find((g) => g.index === index) || null
  const predictAtIndex = (index) => predictAt(site.blocks, index, site.kind, meta.counts)
  const insertAtSeam = (index, type) => {
    doInsert(null, index, makeBlock(type))
    setSeamOpen(null)
  }
  const dismissGap = (segment) => setDismissedGaps((d) => [...d, segment])

  const acceptGhost = (type) => doInsert(null, site.blocks.length, makeBlock(type))
  const dismissGhost = () => setGhostSuppressed(blocksSig)
  const cycleGhost = (dir) =>
    setGhostCycle((c) => (c + dir + prediction.candidates.length) % prediction.candidates.length)

  /* ---- Palette / drawer (Layer 3) ---- */
  const paletteTarget = () => {
    if (selected) {
      const i = site.blocks.findIndex((b) => b.id === selected || !!findById([b], selected))
      if (i >= 0) return i + 1
    }
    return site.blocks.length
  }
  const insertFromPalette = (type, keepOpen) => {
    doInsert(null, paletteTarget(), makeBlock(type))
    if (!keepOpen) setPalette(null)
  }
  const toggleFavorite = (type) => setMeta(toggleFav(type))
  const closePalette = () => setPalette(null)
  const openDrawer = () => setPalette('drawer')

  /* ---- Keyboard: ⌘K / ⌘L / "/" ---- */
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => (p === 'command' ? null : 'command'))
        return
      }
      if (mod && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setPalette((p) => (p === 'drawer' ? null : 'drawer'))
        return
      }
      const a = document.activeElement
      const editing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)
      if (e.key === '/' && !editing && !palette && !preview) {
        e.preventDefault()
        setPalette('command')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [palette, preview])

  /* ---- Keyboard: ghost Tab / arrows / Esc ---- */
  useEffect(() => {
    if (!ghostVisible || palette) return
    const onKey = (e) => {
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
      if (e.key === 'Tab') {
        e.preventDefault()
        const cand = prediction.candidates[ghostCycle % prediction.candidates.length]
        if (cand) acceptGhost(cand.type)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        cycleGhost(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        cycleGhost(-1)
      } else if (e.key === 'Escape') {
        dismissGhost()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ---- Publish (prototype) ---- */
  const publish = () => {
    setToast(`${slugify(site.name)}.aedes.site is live`)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3200)
  }

  const selBlock = selected ? findById(site.blocks, selected) : null
  const railFavs = meta.favs
  const railRecents = meta.recents.filter((t) => !railFavs.includes(t)).slice(0, 4)
  const railStarter =
    railFavs.length + railRecents.length === 0 ? ['hero', 'text', 'image', 'features', 'cta'] : null

  const ctxValue = {
    selected,
    setSelected,
    preview,
    onProp,
    dropTarget,
    overBlock,
    overContainer,
    startBlockDrag,
    endDrag,
    nudge,
    duplicate,
    remove,
    seamOpen,
    setSeamOpen,
    gapAt,
    predictAtIndex,
    insertAtSeam,
    dismissGap,
    meta,
    toggleFavorite,
    paletteTarget,
    insertFromPalette,
    closePalette,
    openDrawer,
    paletteDrag: startPaletteDrag,
  }

  return (
    <EdCtx.Provider value={ctxValue}>
      <div className={`editor${preview ? ' previewing' : ''}`}>
        <TopBar
          site={site}
          patchSite={patchSite}
          saveState={saveState}
          device={device}
          setDevice={setDevice}
          predictOn={predictOn}
          togglePredict={togglePredict}
          preview={preview}
          onTogglePreview={() => {
            setPreview(!preview)
            setSelected(null)
          }}
          publish={publish}
        />

        <Rail
          sections={[
            ['Pinned', railFavs],
            ['Recent', railRecents],
            ['Starter', railStarter || []],
          ]}
          onSearch={() => setPalette('command')}
          onAll={() => setPalette('drawer')}
          startPaletteDrag={startPaletteDrag}
          endDrag={endDrag}
          insertFromPalette={insertFromPalette}
        />

        {/* ---- Center: canvas ---- */}
        <div
          className={`ed-canvas-wrap${dropTarget ? ' dragging' : ''}`}
          onDragOver={overRoot}
          onDrop={drop}
          onClick={() => {
            setSelected(null)
            setSeamOpen(null)
          }}
        >
          <div
            className={`ed-canvas ${device}`}
            style={site.font && site.font !== 'Inter' ? { fontFamily: `'${site.font}', 'Inter', sans-serif` } : undefined}
          >
            {site.blocks.length === 0 && !ghostVisible && (
              <div className="ed-empty">Drag your first block here</div>
            )}
            <Children blocks={site.blocks} parentId={null} emptyHint="" />
            {ghostVisible && (
              <HorizonGhost
                candidates={prediction.candidates}
                cycle={ghostCycle}
                onCycle={cycleGhost}
                onAccept={acceptGhost}
                onDismiss={dismissGhost}
              />
            )}
          </div>
        </div>

        {/* ---- Right: inspector ---- */}
        <aside className="ed-right" onClick={(e) => e.stopPropagation()}>
          <p className="ed-panel-title">Inspector</p>
          <Inspector
            block={selBlock}
            path={selected ? findPath(site.blocks, selected) : []}
            onProp={onProp}
            setColumnsCount={setColumnsCount}
            onSelect={setSelected}
          />
        </aside>

        {toast && (
          <div className="ed-toast">
            <span className="ed-toast-dot" /> {toast}
          </div>
        )}

        {palette === 'command' && <CommandPalette />}
        {palette === 'drawer' && <BrowseDrawer />}
      </div>
    </EdCtx.Provider>
  )
}
