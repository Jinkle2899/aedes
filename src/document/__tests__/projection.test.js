import { describe, expect, it } from 'vitest'
import { buildNested, getChildIds, getNode, indexOf, isDescendant, parentOf, siblingsOf } from '../model.js'
import { fromNested, toNested, toSite } from '../projection.js'
import { fixtureBlocks } from '../../test/fixtures.js'

describe('document model and projection', () => {
  it('round-trips nested blocks through the normalized document', () => {
    const blocks = fixtureBlocks()
    const doc = fromNested(blocks, { id: 'site-1', name: 'Fixture site' })

    expect(toNested(doc)).toEqual(blocks)
    expect(toSite(doc)).toEqual({ id: 'site-1', name: 'Fixture site', blocks })
  })

  it('exposes stable selectors over the normalized graph', () => {
    const doc = fromNested(fixtureBlocks())

    expect(getNode(doc, 'text-a').type).toBe('text')
    expect(getChildIds(doc, 'cols')).toEqual(['col-a', 'col-b'])
    expect(parentOf(doc, 'text-a')).toBe('col-a')
    expect(siblingsOf(doc, 'text-a')).toEqual(['text-a'])
    expect(indexOf(doc, 'footer')).toBe(3)
    expect(isDescendant(doc, 'section', 'text-b')).toBe(true)
    expect(isDescendant(doc, 'text-b', 'section')).toBe(false)
    expect(buildNested(doc, 'col-a')).toEqual(fixtureBlocks()[2].children[0].children[0])
  })
})
