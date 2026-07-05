import { describe, expect, it, vi } from 'vitest'
import { findById, findParent, findPath, insertAt, regenIds, removeById, updateProps } from '../tree.js'
import { fixtureBlocks } from '../../test/fixtures.js'

describe('tree helpers', () => {
  it('finds nodes, parents, and paths in a nested tree', () => {
    const blocks = fixtureBlocks()

    expect(findById(blocks, 'text-b').props.heading).toBe('Publish confidently')
    expect(findParent(blocks, 'text-b')).toEqual({ parentId: 'col-b', index: 0 })
    expect(findPath(blocks, 'text-b').map((b) => b.id)).toEqual(['section', 'cols', 'col-b', 'text-b'])
    expect(findById(blocks, 'missing')).toBeNull()
    expect(findPath(blocks, 'missing')).toEqual([])
  })

  it('immutably inserts, updates, and removes blocks', () => {
    const blocks = fixtureBlocks()
    const inserted = { id: 'quote', type: 'quote', props: { quote: 'Ship it', by: 'QA' } }

    const withInsert = insertAt(blocks, 'col-a', 1, inserted)
    expect(findById(withInsert, 'quote')).toEqual(inserted)
    expect(findById(blocks, 'quote')).toBeNull()

    const updated = updateProps(withInsert, 'text-a', { heading: 'Updated heading' })
    expect(findById(updated, 'text-a').props.heading).toBe('Updated heading')
    expect(findById(withInsert, 'text-a').props.heading).toBe('Plan visually')

    const [removedTree, removed] = removeById(updated, 'cols')
    expect(removed.id).toBe('cols')
    expect(findById(removedTree, 'cols')).toBeNull()
  })

  it('duplicates a subtree with fresh ids while preserving props and shape', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.111111111)
      .mockReturnValueOnce(0.222222222)

    const block = {
      id: 'parent',
      type: 'section',
      props: { style: { pad: 'lg' } },
      children: [{ id: 'child', type: 'text', props: { heading: 'Original' } }],
    }

    const copy = regenIds(block)
    expect(copy.id).not.toBe('parent')
    expect(copy.children[0].id).not.toBe('child')
    expect(copy.type).toBe(block.type)
    expect(copy.children[0].props).toEqual(block.children[0].props)

    copy.props.style.pad = 'sm'
    expect(block.props.style.pad).toBe('lg')
  })
})
