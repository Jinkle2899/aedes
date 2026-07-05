import { describe, expect, it } from 'vitest'
import { generate, validateRecipe } from '../generate.js'
import { predict, predictAt } from '../predict.js'
import { searchBlocks } from '../blockSearch.js'
import { fixtureBlocks } from '../../test/fixtures.js'

describe('prediction and search', () => {
  it('returns deterministic ranked output for the same input', () => {
    const page = fixtureBlocks().slice(0, 2)

    expect(predict(page, 'SaaS')).toEqual(predict(page, 'SaaS'))
    expect(predictAt(page, 1, 'SaaS')).toEqual(predictAt(page, 1, 'SaaS'))
    expect(searchBlocks('hero')).toEqual(searchBlocks('hero'))
  })

  it('does not suggest singleton repeats or footer continuations', () => {
    const withHero = fixtureBlocks().slice(0, 2)
    expect(predict(withHero).candidates.map((c) => c.type)).not.toContain('hero')

    const complete = fixtureBlocks()
    expect(predict(complete)).toEqual({ show: false, candidates: [] })
  })
})

describe('layout generation and recipe validation', () => {
  it('repairs untrusted recipes and strips invalid props', () => {
    const recipe = validateRecipe(
      {
        blocks: [
          { type: 'unknown', props: { heading: 'Bad' } },
          { type: 'column', props: {} },
          { type: 'navbar', props: { brand: 'One', unexpected: 'drop' } },
          { type: 'navbar', props: { brand: 'Two' } },
          { type: 'hero', props: { align: 'diagonal', tone: 'dark', button: 'Go', bad: true } },
          { type: 'footer', props: { text: 'Bye', extra: 'drop' } },
        ],
      },
      { scope: 'page' }
    )

    expect(recipe.map((b) => b.type)).toEqual(['navbar', 'hero', 'footer'])
    expect(recipe[0].props).toEqual({ brand: 'One' })
    expect(recipe[1].props).toEqual({ tone: 'dark', button: 'Go' })
    expect(recipe[2].props).toEqual({ text: 'Bye' })
  })

  it('generates structurally valid pages that start with navbar and end with footer', () => {
    const result = generate({ prompt: 'SaaS app with proof and pricing CTA', scope: 'page' })

    expect(result.blocks[0].type).toBe('navbar')
    expect(result.blocks.at(-1).type).toBe('footer')
    expect(result.recipe[0].type).toBe('navbar')
    expect(result.recipe.at(-1).type).toBe('footer')
    expect(result.blocks.every((block) => block.id && block.props)).toBe(true)
  })
})
