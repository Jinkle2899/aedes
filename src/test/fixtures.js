export const fixtureBlocks = () => [
  {
    id: 'nav',
    type: 'navbar',
    props: { brand: 'Aedes', links: ['Work', 'Pricing', 'Contact'], cta: 'Start' },
  },
  {
    id: 'hero',
    type: 'hero',
    props: {
      heading: 'Launch faster',
      sub: 'Build polished pages without code.',
      button: 'Start now',
      align: 'center',
      tone: 'light',
    },
  },
  {
    id: 'section',
    type: 'section',
    props: { style: { pad: 'lg', width: 'wide' } },
    children: [
      {
        id: 'cols',
        type: 'columns',
        props: {},
        children: [
          {
            id: 'col-a',
            type: 'column',
            props: {},
            children: [
              {
                id: 'text-a',
                type: 'text',
                props: { heading: 'Plan visually', body: 'Drag blocks into place.' },
              },
            ],
          },
          {
            id: 'col-b',
            type: 'column',
            props: {},
            children: [
              {
                id: 'text-b',
                type: 'text',
                props: { heading: 'Publish confidently', body: 'Preview before launch.' },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'footer',
    type: 'footer',
    props: { text: 'Built with Aedes' },
  },
]

export const fixtureSite = () => ({
  id: 'site-1',
  name: 'Fixture site',
  kind: 'SaaS',
  updatedAt: 1720000000000,
  blocks: fixtureBlocks(),
})

export function normalizeIds(value) {
  const ids = new Map()
  let n = 0
  const next = (id) => {
    if (!ids.has(id)) ids.set(id, `id-${++n}`)
    return ids.get(id)
  }
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (key === 'id' && typeof val === 'string') return next(val)
      if ((key === 'parentId' || key === 'parentOf') && typeof val === 'string') return next(val)
      return val
    })
  )
}
