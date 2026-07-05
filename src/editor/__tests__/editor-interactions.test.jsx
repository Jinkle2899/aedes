import React, { useMemo, useReducer, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cmd } from '../../commands/commands.js'
import { createEditor } from '../../commands/bus.js'
import { buildNested } from '../../document/model.js'
import { fromNested, toNested } from '../../document/projection.js'
import { EdCtx, EditorStoreCtx, DocCtx } from '../context.js'
import { createEditorStore, useStore } from '../store/editorStore.js'
import { useNode } from '../store/useDoc.js'
import { Children } from '../components/BlockNode.jsx'
import Inspector from '../inspector/Inspector.jsx'
import { fixtureBlocks } from '../../test/fixtures.js'
import { findPath, regenIds } from '../../lib/tree.js'

function Harness() {
  const [, force] = useReducer((n) => n + 1, 0)
  const editorRef = useRef(null)
  const storeRef = useRef(null)

  if (!editorRef.current) editorRef.current = createEditor(fromNested(fixtureBlocks()), { coalesceMs: 600 })
  if (!storeRef.current) {
    storeRef.current = createEditorStore({
      selected: null,
      seamOpen: null,
      preview: false,
      dropTarget: null,
      meta: { counts: {}, favs: [], recents: [] },
    })
  }

  const editor = editorRef.current
  const store = storeRef.current
  React.useEffect(() => editor.subscribe(() => force()), [editor])
  const selected = useStore(store, (s) => s.selected)
  const doc = editor.getDoc()
  const nested = useMemo(() => toNested(doc), [doc])
  const selectedBlock = selected && doc.byId[selected] ? buildNested(doc, selected) : null
  const selectedPath = selected ? findPath(nested, selected) : []

  const setSelected = (id) => store.setState({ selected: id })
  const ctx = {
    setSelected,
    setSeamOpen: (seamOpen) => store.setState({ seamOpen }),
    overBlock: () => () => {},
    startBlockDrag: () => () => {},
    endDrag: () => {},
    nudge: (id, dir) => {
      const parent = doc.parentOf[id]
      const siblings = parent === null ? doc.rootIds : doc.byId[parent].childIds
      const index = siblings.indexOf(id)
      editor.dispatch(cmd.move(id, parent, index + dir, true))
    },
    duplicate: (id) => {
      const parent = doc.parentOf[id]
      const siblings = parent === null ? doc.rootIds : doc.byId[parent].childIds
      const index = siblings.indexOf(id)
      const copy = regenIds(buildNested(doc, id))
      editor.dispatch(cmd.insert(copy, parent, index + 1))
      setSelected(copy.id)
    },
    remove: (id) => {
      editor.dispatch(cmd.remove(id))
      setSelected(null)
    },
  }

  return (
    <DocCtx.Provider value={editor}>
      <EditorStoreCtx.Provider value={store}>
        <EdCtx.Provider value={ctx}>
          <div>
            <button type="button" onClick={() => editor.undo()}>
              Undo
            </button>
            <button type="button" onClick={() => editor.redo()}>
              Redo
            </button>
            <section aria-label="Canvas">
              <Children parentId={null} emptyHint="" />
            </section>
            <aside aria-label="Inspector">
              <Inspector
                block={selectedBlock}
                path={selectedPath}
                onProp={(id, patch) => editor.dispatch(cmd.update(id, patch))}
                setColumnsCount={(id, count) => editor.dispatch(cmd.setColumns(id, count))}
                onSelect={setSelected}
              />
            </aside>
          </div>
        </EdCtx.Provider>
      </EditorStoreCtx.Provider>
    </DocCtx.Provider>
  )
}

describe('editor integration', () => {
  it('selects a block and edits inspector fields through the command bus', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByText('Plan visually'))
    const heading = screen.getByLabelText('Heading')
    await user.clear(heading)
    await user.type(heading, 'Plan with confidence')

    expect(screen.getByText('Plan with confidence')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Plan visually')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Redo' }))
    expect(screen.getByText('Plan with confidence')).toBeInTheDocument()
  })

  it('changes columns between two and three children from the inspector', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByText('Plan visually'))
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    await user.click(screen.getByRole('button', { name: '3' }))

    expect(screen.getByRole('button', { name: '3' })).toHaveClass('active')

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('active')
  })

  it('duplicates, nudges, and deletes selected blocks', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByText('Plan visually'))
    await user.click(screen.getByRole('button', { name: 'Duplicate' }))
    expect(screen.getAllByText('Plan visually')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Move down' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getAllByText('Plan visually')).toHaveLength(1)
  })

  it('does not re-render unrelated root nodes for nested prop edits', async () => {
    const counts = { text: 0, footer: 0 }
    const editor = createEditor(fromNested(fixtureBlocks()))

    function Probe({ id, name }) {
      useNode(id)
      counts[name] += 1
      return null
    }

    render(
      <DocCtx.Provider value={editor}>
        <Probe id="text-a" name="text" />
        <Probe id="footer" name="footer" />
      </DocCtx.Provider>
    )

    const beforeFooter = counts.footer
    editor.dispatch(cmd.update('text-a', { heading: 'Focused edit' }))

    expect(counts.text).toBeGreaterThan(1)
    expect(counts.footer).toBe(beforeFooter)
  })
})
