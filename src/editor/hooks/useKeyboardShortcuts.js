import { useEffect } from 'react'

/* Global editor shortcuts (⌘K/⌘L/⌘G, ⌘Z/⌘⇧Z, "/") and the Horizon ghost keys
   (Tab / arrows / Esc). Extracted verbatim from EditorInner. */
export function useKeyboardShortcuts({
  editor,
  palette,
  setPalette,
  preview,
  ghostVisible,
  prediction,
  ghostCycle,
  acceptGhost,
  cycleGhost,
  dismissGhost,
}) {
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
  }, [palette, preview, editor, setPalette])

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
}
