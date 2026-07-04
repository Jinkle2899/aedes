/* Site storage — localStorage-backed, no backend needed for the prototype */

const KEY = 'aedes:sites'

export const uid = () => Math.random().toString(36).slice(2, 10)

export function loadSites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function saveSites(sites) {
  localStorage.setItem(KEY, JSON.stringify(sites))
}

export function saveSite(site) {
  const sites = loadSites()
  const i = sites.findIndex((s) => s.id === site.id)
  if (i === -1) sites.unshift(site)
  else sites[i] = site
  saveSites(sites)
}

/* ---------------- Block definitions ---------------- */

export const BLOCK_DEFS = {
  navbar: {
    label: 'Navbar',
    hint: 'Brand + links up top',
    defaults: {
      brand: 'Your brand',
      links: ['Work', 'About', 'Contact'],
      button: 'Say hello',
    },
  },
  hero: {
    label: 'Hero',
    hint: 'Big opening statement',
    defaults: {
      heading: 'Make something people remember',
      sub: 'One clear sentence about what you do and why it matters.',
      button: 'Get started',
      align: 'center',
      tone: 'light',
    },
  },
  canvas: {
    label: 'Freeform',
    hint: 'Place anything anywhere',
    defaults: {
      height: 460,
      elements: [
        { id: 't1', kind: 'text', x: 8, y: 70, w: 55, text: 'Anything, anywhere.', size: 36, weight: 600, color: '#17171a' },
        { id: 't2', kind: 'text', x: 8, y: 140, w: 46, text: 'Drag to move. Double-click to edit. Pull the corner to resize. Add images of any size.', size: 16, weight: 400, color: '#6b7280' },
      ],
    },
  },
  section: {
    label: 'Section',
    hint: 'Holds other blocks',
    defaults: { tone: 'tint', pad: 'md' },
  },
  columns: {
    label: 'Columns',
    hint: 'Side-by-side layout',
    defaults: {},
  },
  column: {
    label: 'Column',
    internal: true,
    defaults: {},
  },
  text: {
    label: 'Text',
    hint: 'Heading + paragraph',
    defaults: {
      heading: 'A section heading',
      body: 'Use this space to tell your story — what you make, who it is for, and what makes it different.',
    },
  },
  image: {
    label: 'Image',
    hint: 'Media placeholder',
    defaults: { caption: 'A caption for this image', ratio: 'wide' },
  },
  gallery: {
    label: 'Gallery',
    hint: 'Three-up image grid',
    defaults: { caption: 'Selected work' },
  },
  features: {
    label: 'Features',
    hint: 'Three selling points',
    defaults: {
      items: [
        { t: 'Fast', d: 'Loads in a blink, everywhere.' },
        { t: 'Simple', d: 'No manual required.' },
        { t: 'Yours', d: 'Your name on it, not ours.' },
      ],
    },
  },
  stats: {
    label: 'Stats',
    hint: 'Big numbers row',
    defaults: {
      items: [
        { n: '12k+', l: 'Happy customers' },
        { n: '99.9%', l: 'Uptime' },
        { n: '4.9★', l: 'Average rating' },
      ],
    },
  },
  tabs: {
    label: 'Tabs',
    hint: 'Switchable panels',
    defaults: {
      items: [
        { t: 'Overview', d: 'What this is and why it matters — the short version.' },
        { t: 'Details', d: 'The specifics, for people who read the fine print.' },
        { t: 'FAQ', d: 'Answers to the questions everyone asks first.' },
      ],
    },
  },
  accordion: {
    label: 'Accordion',
    hint: 'Expandable Q&A',
    defaults: {
      items: [
        { q: 'How does it work?', a: 'Simply. You click, it does the thing, everyone is happy.' },
        { q: 'What does it cost?', a: 'Less than you expect. See the pricing section for details.' },
        { q: 'Can I cancel anytime?', a: 'Yes — no contracts, no exit interviews.' },
      ],
    },
  },
  countdown: {
    label: 'Countdown',
    hint: 'Ticking timer to a date',
    defaults: { heading: 'Something big is coming', target: '' },
  },
  rotator: {
    label: 'Animated text',
    hint: 'Cycling headline word',
    defaults: { prefix: 'We build', words: ['websites', 'brands', 'momentum'] },
  },
  quote: {
    label: 'Quote',
    hint: 'Testimonial or pull-quote',
    defaults: {
      text: '“They made us look like the company we always thought we were.”',
      author: 'Alex Rivera',
      role: 'Founder, Somewhere Co.',
    },
  },
  form: {
    label: 'Contact form',
    hint: 'Name, email, message',
    defaults: {
      heading: 'Get in touch',
      sub: "Tell us what you're thinking — we reply within a day.",
      button: 'Send message',
    },
  },
  cta: {
    label: 'Call to action',
    hint: 'Closing pitch + button',
    defaults: { heading: 'Ready when you are.', button: 'Start now' },
  },
  spacer: {
    label: 'Spacer',
    hint: 'Breathing room',
    defaults: { height: 72 },
  },
  footer: {
    label: 'Footer',
    hint: 'Brand, links, small print',
    defaults: {
      brand: 'Your brand',
      links: ['Instagram', 'Twitter', 'Email'],
      note: '© 2026 · All rights reserved',
    },
  },
}

export const BLOCK_TYPES = Object.keys(BLOCK_DEFS).filter((t) => !BLOCK_DEFS[t].internal)

export const emptyColumn = () => ({ id: uid(), type: 'column', props: {}, children: [] })

export function makeBlock(type) {
  const b = { id: uid(), type, props: JSON.parse(JSON.stringify(BLOCK_DEFS[type].defaults)) }
  if (type === 'section') b.children = []
  if (type === 'columns') b.children = [emptyColumn(), emptyColumn()]
  if (type === 'countdown') b.props.target = new Date(Date.now() + 14 * 864e5).toISOString()
  return b
}

export function starterBlocks() {
  const blocks = ['navbar', 'hero', 'canvas'].map(makeBlock)

  /* Showcase nesting: a section containing two columns of text */
  const section = makeBlock('section')
  const cols = makeBlock('columns')
  const t1 = makeBlock('text')
  t1.props = { ...t1.props, heading: 'Side by side', body: 'Columns can hold any block. Drag more in from the palette, or change the column count in the Inspector.' }
  const t2 = makeBlock('text')
  t2.props = { ...t2.props, heading: 'Fully nested', body: 'Sections contain blocks. Columns contain blocks. Drag things between them freely.' }
  cols.children[0].children.push(t1)
  cols.children[1].children.push(t2)
  section.children.push(cols)
  blocks.push(section)

  blocks.push(...['features', 'text', 'cta', 'footer'].map(makeBlock))
  return blocks
}

export function createSite(name = 'Untitled site') {
  const site = { id: uid(), name, updatedAt: Date.now(), blocks: starterBlocks() }
  saveSite(site)
  return site
}

/* Create a site seeded from a template recipe: [{ type, props }] */
export function createSiteFromRecipe(name, recipe, kind = null) {
  const blocks = recipe.map((r) => {
    const b = makeBlock(r.type)
    b.props = { ...b.props, ...JSON.parse(JSON.stringify(r.props || {})) }
    return b
  })
  const site = { id: uid(), name, kind, updatedAt: Date.now(), blocks }
  saveSite(site)
  return site
}

export function deleteSite(id) {
  saveSites(loadSites().filter((s) => s.id !== id))
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'my-site'
  )
}
