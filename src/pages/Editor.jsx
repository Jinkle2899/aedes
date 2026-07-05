import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { makeBlock, slugify } from '../lib/store.js'
import { getSite, upsertSite } from '../lib/db.js'
import { cloudEnabled } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'
import { findById, regenIds } from '../lib/tree.js'
import { buildNested } from '../document/model.js'
import { fromNested, toSite } from '../document/projection.js'
import { createEditor } from '../commands/bus.js'
import { cmd } from '../commands/commands.js'
import { predict, predictAt, gapSeams } from '../lib/predict.js'
import { generate as aiGenerate } from '../lib/generate.js'
import { loadMeta, recordUse, toggleFav, setPredictOn } from '../lib/blockMeta.js'
import { EdCtx, EditorStoreCtx, DocCtx } from '../editor/context.js'
import { createEditorStore, useStore } from '../editor/store/editorStore.js'
import InspectorPanel from '../editor/inspector/InspectorPanel.jsx'
import TopBar from '../editor/components/TopBar.jsx'
import Rail from '../editor/components/Rail.jsx'
import { Children } from '../editor/components/BlockNode.jsx'
import HorizonGhost from '../editor/components/HorizonGhost.jsx'
import CommandPalette from '../editor/components/CommandPalette.jsx'
import ComposePalette from '../editor/components/ComposePalette.jsx'
import BrowseDrawer from '../editor/components/BrowseDrawer.jsx'

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
  const [, forceRender] = useReducer((n) => n + 1, 0)
  const storeRef = useRef(null)
  if (!storeRef.current)
    storeRef.current = createEditorStore({ selected: null, seamOpen: null, preview: false, dropTarget: null, meta: loadMeta() })
  const store = storeRef.current
  const setSelected = (id) => store.setState({ selected: id })
  const setSeamOpen = (v) => store.setState({ seamOpen: v })
  const setDropTarget = (v) => store.setState({ dropTarget: v })
  const setPreview = (v) => store.setState({ preview: v })
  const setMeta = (m) => store.setState({ meta: m })
  const preview = useStore(store, (s) => s.preview)
  const dropTarget = useStore(store, (s) => s.dropTarget)
  const meta = useStore(store, (s) => s.meta)
  const [device, setDevice] = useState('desktop')
  const [toast, setToast] = useState('')
  const [palette, setPalette] = useState(null) // null | 'command' | 'compose' | 'drawer'
  const [saveState, setSaveState] = useState('saved') // saved | saving | error
  const dragRef = useRef(null)
  const toastTimer = useRef(null)
  const saveRef = useRef(setSaveState)
  saveRef.current = setSaveState

  /* Document + command bus — the V2 mutation path. `site` is a projection of the
     normalized doc, so all downstream UI (renderers/inspector/prediction) is
     unchanged. Every edit is an invertible command → undo/redo for free. */
  const editorRef = useRef(null)
  if (!editorRef.current) {
    editorRef.current = createEditor(
      fromNested(initialSite.blocks, {
        id: initialSite.id,
        name: initialSite.name,
        kind: initialSite.kind ?? null,
        font: initialSite.font ?? null,
        updatedAt: initialSite.updatedAt,
      }),
      {
        persist: async (d) => {
          saveRef.current('saving')
          try {
            await upsertSite(toSite({ ...d, meta: { ...d.meta, updatedAt: Date.now() } }), session)
            saveRef.current('saved')
          } catch {
            saveRef.current('error')
          }
        },
      }
    )
  }
  const editor = editorRef.current
  useEffect(() => editor.subscribe(() => forceRender()), [editor])
  const doc = editor.getDoc()
  const site = useMemo(() => toSite(doc), [doc])

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
  useEffect(() => () => editor.flush(), [editor])

  /* ---- Mutations: every edit is a command ---- */
  const patchSite = (patch) => editor.dispatch(cmd.patchMeta(patch))
  const onProp = (blockId, patch) => editor.dispatch(cmd.update(blockId, patch))

  const doInsert = (parentId, index, block) => {
    editor.dispatch(cmd.insert(block, parentId, index))
    setSelected(block.id)
    setMeta(recordUse(block.type))
  }
  const doMove = (id, target) => editor.dispatch(cmd.move(id, target.parentId, target.index))
  const nudge = (id, dir) => {
    const d = editor.getDoc()
    const parent = d.parentOf[id]
    const sibs = parent === null ? d.rootIds : d.byId[parent].childIds
    const i = sibs.indexOf(id)
    const j = i + dir
    if (j < 0 || j >= sibs.length) return
    editor.dispatch(cmd.move(id, parent, j, true))
  }
  const duplicate = (id) => {
    const d = editor.getDoc()
    const parent = d.parentOf[id]
    if (parent === undefined) return
    const sibs = parent === null ? d.rootIds : d.byId[parent].childIds
    const i = sibs.indexOf(id)
    if (i < 0) return
    const copy = regenIds(buildNested(d, id))
    editor.dispatch(cmd.insert(copy, parent, i + 1))
    setSelected(copy.id)
  }
  const remove = (id) => {
    editor.dispatch(cmd.remove(id))
    if (store.getState().selected === id) setSelected(null)
  }
  const setColumnsCount = (id, n) => editor.dispatch(cmd.setColumns(id, n))

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
    const dt = store.getState().dropTarget
    if (d && dt) {
      if (d.kind === 'new') doInsert(dt.parentId, dt.index, makeBlock(d.type))
      else doMove(d.id, dt)
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
    const selected = store.getState().selected
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
  const openCompose = () => setPalette('compose')

  /* ---- AI Compose (Tier 0 deterministic; LLM tiers plug in behind generate()) ---- */
  const composePreview = (prompt, scope) =>
    aiGenerate({ prompt, scope, siteKind: site.kind, existingTypes: site.blocks.map((b) => b.type) })
  const compose = (prompt, scope) => {
    const { blocks } = composePreview(prompt, scope)
    if (!blocks.length) return
    const d = editor.getDoc()
    const idx = scope === 'page' ? d.rootIds.length : paletteTarget()
    editor.dispatch(cmd.insertMany(blocks, null, idx))
    setSelected(blocks[0].id)
    setMeta(recordUse(blocks[0].type))
    setPalette(null)
  }

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
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setPalette((p) => (p === 'compose' ? null : 'compose'))
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        const a = document.activeElement
        const editing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)
        if (editing) return // let native text undo handle it
        e.preventDefault()
        if (e.shiftKey) editor.redo()
        else editor.undo()
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

  const railFavs = meta.favs
  const railRecents = meta.recents.filter((t) => !railFavs.includes(t)).slice(0, 4)
  const railStarter =
    railFavs.length + railRecents.length === 0 ? ['hero', 'text', 'image', 'features', 'cta'] : null

  /* Stable actions context: canvas consumers read reactive state from the store,
     so this object keeps a stable identity across edits (a prop edit re-renders
     only the edited node, not the canvas). Each wrapper delegates to the latest
     implementation, so no closure ever goes stale. */
  const impl = {
    setSelected,
    onProp,
    overBlock,
    overContainer,
    startBlockDrag,
    endDrag,
    nudge,
    duplicate,
    remove,
    setSeamOpen,
    gapAt,
    predictAtIndex,
    insertAtSeam,
    dismissGap,
    toggleFavorite,
    paletteTarget,
    insertFromPalette,
    closePalette,
    openDrawer,
    openCompose,
    compose,
    composePreview,
    paletteDrag: startPaletteDrag,
  }
  const implRef = useRef(impl)
  implRef.current = impl
  const ctxRef = useRef(null)
  if (!ctxRef.current) {
    ctxRef.current = {}
    for (const k of Object.keys(impl)) ctxRef.current[k] = (...args) => implRef.current[k](...args)
  }
  const ctxValue = ctxRef.current

  return (
    <DocCtx.Provider value={editor}>
    <EditorStoreCtx.Provider value={store}>
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
            <Children parentId={null} emptyHint="" />
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

        {/* ---- Right: inspector (subscribes to selection itself) ---- */}
        <InspectorPanel
          store={store}
          blocks={site.blocks}
          onProp={onProp}
          setColumnsCount={setColumnsCount}
          onSelect={setSelected}
        />

        {toast && (
          <div className="ed-toast">
            <span className="ed-toast-dot" /> {toast}
          </div>
        )}

        {palette === 'command' && <CommandPalette />}
        {palette === 'compose' && <ComposePalette />}
        {palette === 'drawer' && <BrowseDrawer />}
      </div>
    </EdCtx.Provider>
    </EditorStoreCtx.Provider>
    </DocCtx.Provider>
  )
}
