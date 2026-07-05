import { describe, expect, it, vi } from 'vitest'
import { createEditor } from '../bus.js'
import { applyCommand, cmd } from '../commands.js'
import { fromNested, toNested } from '../../document/projection.js'
import { fixtureBlocks } from '../../test/fixtures.js'
import { insertAt, removeById, updateProps } from '../../lib/tree.js'

const baseDoc = () => fromNested(fixtureBlocks(), { id: 'site-1', name: 'Fixture site' })

function expectInvertible(command) {
  const before = baseDoc()
  const applied = applyCommand(before, command)
  const restored = applyCommand(applied.doc, applied.inverse)
  expect(restored.doc).toEqual(before)
}

describe('commands', () => {
  it('returns exact inverses for every mutation command', () => {
    expectInvertible(cmd.insert({ id: 'new-text', type: 'text', props: { heading: 'New', body: 'Body' } }, null, 2))
    expectInvertible(cmd.remove('text-a'))
    expectInvertible(cmd.move('text-a', 'col-b', 1))
    expectInvertible(cmd.update('hero', { heading: 'Changed' }))
    expectInvertible(cmd.setColumns('cols', 3))
    expectInvertible(cmd.insertMany([{ id: 'quote-1', type: 'quote', props: { quote: 'Nice', by: 'User' } }], null, 2))
    expectInvertible(cmd.patchMeta({ name: 'Renamed' }))
  })

  it('matches equivalent legacy tree operations after projection', () => {
    const inserted = { id: 'new-text', type: 'text', props: { heading: 'New', body: 'Body' } }
    let legacy = fixtureBlocks()
    let doc = baseDoc()

    legacy = insertAt(legacy, null, 2, inserted)
    doc = applyCommand(doc, cmd.insert(inserted, null, 2)).doc
    expect(toNested(doc)).toEqual(legacy)

    legacy = updateProps(legacy, 'new-text', { heading: 'Updated' })
    doc = applyCommand(doc, cmd.update('new-text', { heading: 'Updated' })).doc
    expect(toNested(doc)).toEqual(legacy)

    const legacyRemoved = removeById(legacy, 'text-b')
    legacy = legacyRemoved[0]
    doc = applyCommand(doc, cmd.remove('text-b')).doc
    expect(toNested(doc)).toEqual(legacy)
  })

  it('undoes, redoes, and coalesces rapid same-field prop updates into one undo entry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)

    const editor = createEditor(baseDoc(), { coalesceMs: 600 })
    editor.dispatch(cmd.update('hero', { heading: 'L' }))
    vi.setSystemTime(1100)
    editor.dispatch(cmd.update('hero', { heading: 'La' }))
    vi.setSystemTime(1200)
    editor.dispatch(cmd.update('hero', { heading: 'Lau' }))

    expect(editor.getDoc().byId.hero.props.heading).toBe('Lau')
    expect(editor.undo()).toBe(true)
    expect(editor.getDoc().byId.hero.props.heading).toBe('Launch faster')
    expect(editor.redo()).toBe(true)
    expect(editor.getDoc().byId.hero.props.heading).toBe('Lau')
  })

  it('does not move a node into itself or its descendants', () => {
    const before = baseDoc()
    const result = applyCommand(before, cmd.move('section', 'text-a', 0))

    expect(result.doc).toBe(before)
    expect(result.inverse).toEqual({ type: 'Noop' })
  })
})
