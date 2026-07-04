/*
 * Block DNA — intelligence metadata for every block type.
 * Powers prediction (predict.js), page grammar (pageGrammar.js),
 * and later: search ranking, AI generation, marketplace ranking.
 *
 * grammar: opening | body | proof | conversion | closing | utility
 * after:   block types this one typically follows
 * kinds:   template categories (site types) with special affinity
 * pop:     editorial popularity prior, 0..1
 */

export const DNA = {
  navbar: {
    label: 'Navbar', grammar: 'opening', singleton: true, pop: 0.7,
    after: [],
  },
  hero: {
    label: 'Hero', grammar: 'opening', singleton: true, pop: 0.9,
    after: ['navbar'],
  },
  canvas: {
    label: 'Freeform', grammar: 'body', pop: 0.45,
    after: ['hero', 'text'],
  },
  section: {
    label: 'Section', grammar: 'body', pop: 0.5,
    after: ['hero', 'text', 'features'],
  },
  columns: {
    label: 'Columns', grammar: 'body', pop: 0.5,
    after: ['hero', 'text', 'features'],
  },
  text: {
    label: 'Text', grammar: 'body', pop: 0.8,
    after: ['hero', 'image', 'gallery', 'section'],
  },
  image: {
    label: 'Image', grammar: 'body', pop: 0.5,
    after: ['text', 'hero'],
  },
  gallery: {
    label: 'Gallery', grammar: 'body', pop: 0.6,
    after: ['hero', 'text', 'features'],
    kinds: ['Portfolio', 'Studio', 'Boutique', 'Café & food'],
  },
  features: {
    label: 'Features', grammar: 'body', pop: 0.85,
    after: ['hero', 'text', 'rotator'],
  },
  rotator: {
    label: 'Animated text', grammar: 'body', pop: 0.35,
    after: ['hero'],
  },
  tabs: {
    label: 'Tabs', grammar: 'body', pop: 0.4,
    after: ['text', 'features'],
    kinds: ['SaaS'],
  },
  stats: {
    label: 'Stats', grammar: 'proof', pop: 0.6,
    after: ['features', 'hero', 'gallery'],
    kinds: ['SaaS', 'Agency'],
  },
  quote: {
    label: 'Quote', grammar: 'proof', pop: 0.55,
    after: ['features', 'stats', 'gallery', 'text'],
    kinds: ['Studio', 'Agency', 'Portfolio'],
  },
  accordion: {
    label: 'Accordion', grammar: 'conversion', pop: 0.5,
    after: ['quote', 'stats', 'text', 'features'],
  },
  countdown: {
    label: 'Countdown', grammar: 'conversion', pop: 0.35,
    after: ['hero', 'cta'],
    kinds: ['Boutique'],
  },
  form: {
    label: 'Contact form', grammar: 'conversion', pop: 0.6,
    after: ['quote', 'accordion', 'stats', 'text', 'cta'],
    kinds: ['Café & food', 'SaaS', 'Agency'],
  },
  cta: {
    label: 'Call to action', grammar: 'conversion', pop: 0.75,
    after: ['features', 'stats', 'quote', 'accordion', 'form', 'gallery', 'tabs'],
  },
  spacer: {
    label: 'Spacer', grammar: 'utility', pop: 0.3,
    after: [],
  },
  footer: {
    label: 'Footer', grammar: 'closing', singleton: true, pop: 0.7,
    after: ['cta', 'form', 'accordion'],
  },
  column: { label: 'Column', grammar: 'utility', internal: true, pop: 0, after: [] },
}
