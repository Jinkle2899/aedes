import { describe, expect, it } from 'vitest'
import { blockStyleClass, blockStyleInline } from '../../editor/style.js'
import { computeStyle, getMode } from '../index.js'

describe('layout engine', () => {
  it('defaults containers to flow mode', () => {
    expect(getMode(null)).toBe('flow')
    expect(getMode({ layout: { mode: 'grid' } })).toBe('grid')
  })

  it('produces flow output identical to legacy editor style helpers', () => {
    const node = {
      id: 'hero',
      type: 'hero',
      props: {
        style: {
          bg: '#fff',
          color: '#111',
          align: 'center',
          pad: 'lg',
          width: 'narrow',
          border: 'thin',
          radius: 'md',
          shadow: 'soft',
          gap: 'sm',
          size: 'l',
          anim: 'fade',
        },
      },
    }

    const computed = computeStyle(node, { parentMode: 'flow' })
    expect(computed).toEqual({
      className: blockStyleClass(node.props.style),
      style: blockStyleInline(node.props.style),
      dataAnim: 'fade',
      box: null,
    })
  })
})
