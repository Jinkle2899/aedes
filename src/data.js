export const FEATURES = [
  'AI setup', 'Drag & drop', 'Custom domains', 'E-commerce', 'SEO built in',
  'Global hosting', 'Free SSL', 'Analytics', 'No badge on your site',
]

export const TEMPLATES = [
  { name: 'Slate', tag: 'Studio', variant: 'a' },
  { name: 'Ember', tag: 'Café & food', variant: 'b' },
  { name: 'Nova', tag: 'Portfolio', variant: 'c' },
  { name: 'Isle', tag: 'Boutique', variant: 'a' },
  { name: 'Form', tag: 'Agency', variant: 'b' },
  { name: 'Pico', tag: 'SaaS', variant: 'c' },
  { name: 'Arc', tag: 'Studio', variant: 'c' },
  { name: 'Fern', tag: 'Café & food', variant: 'a' },
  { name: 'Mono', tag: 'Portfolio', variant: 'b' },
  { name: 'Loom', tag: 'Boutique', variant: 'c' },
  { name: 'Grid', tag: 'Agency', variant: 'a' },
  { name: 'Beam', tag: 'SaaS', variant: 'b' },
]

export const CATEGORIES = ['All', 'Studio', 'Café & food', 'Portfolio', 'Boutique', 'Agency', 'SaaS']

/* Block recipe per template — what "Use template" seeds the editor with */
export function templateRecipe(t) {
  const n = t.name
  const base = (() => {
    switch (t.tag) {
    case 'Studio':
      return [
        { type: 'hero', props: { heading: `${n} is a design studio`, sub: 'We make brands worth looking at twice.', button: 'See our work', align: 'left', tone: 'light' } },
        { type: 'gallery', props: { caption: 'Selected work' } },
        { type: 'text', props: { heading: 'About the studio', body: 'A small team with strong opinions about type, color, and whitespace. We take on a handful of projects a year and give each one everything.' } },
        { type: 'quote', props: { text: '“The rare studio that listens first and designs second.”', author: 'A very happy client', role: 'CEO, Actual Company' } },
        { type: 'cta', props: { heading: "Let's make something together.", button: 'Start a project' } },
      ]
    case 'Café & food':
      return [
        { type: 'hero', props: { heading: `${n} — coffee & mornings`, sub: 'Small-batch roasts, fresh pastry, and a corner table with your name on it.', button: 'See the menu', align: 'center', tone: 'dark' } },
        { type: 'features', props: { items: [
          { t: 'Roasted here', d: 'Beans roasted in-house every Tuesday.' },
          { t: 'Baked at 6am', d: 'Croissants gone by nine. You know why.' },
          { t: 'Open late', d: 'Weekends until midnight, decaf after ten.' },
        ] } },
        { type: 'image', props: { caption: 'The room, on a slow Sunday', ratio: 'wide' } },
        { type: 'cta', props: { heading: 'Find us on the corner.', button: 'Get directions' } },
      ]
    case 'Portfolio':
      return [
        { type: 'hero', props: { heading: `Hi, I'm ${n}.`, sub: 'Photographer & art director. I shoot people, places, and the occasional sandwich.', button: 'View portfolio', align: 'left', tone: 'tint' } },
        { type: 'gallery', props: { caption: 'Recent work' } },
        { type: 'gallery', props: { caption: 'Personal projects' } },
        { type: 'cta', props: { heading: 'Booking for next season.', button: 'Get in touch' } },
      ]
    case 'Boutique':
      return [
        { type: 'hero', props: { heading: `${n} — made to keep`, sub: 'Small objects, honestly made. New pieces every first Friday.', button: 'Shop new arrivals', align: 'center', tone: 'tint' } },
        { type: 'gallery', props: { caption: 'New this month' } },
        { type: 'features', props: { items: [
          { t: 'Small runs', d: 'Never more than fifty of anything.' },
          { t: 'Fair made', d: 'Every maker named, every price fair.' },
          { t: 'Ships slow', d: 'Packed by hand, worth the wait.' },
        ] } },
        { type: 'cta', props: { heading: 'Join the first-Friday list.', button: 'Subscribe' } },
      ]
    case 'Agency':
      return [
        { type: 'hero', props: { heading: `${n} moves brands forward`, sub: 'Strategy, identity, and campaigns for companies that mean it.', button: 'Work with us', align: 'left', tone: 'dark' } },
        { type: 'text', props: { heading: 'What we do', body: 'We help ambitious teams figure out what to say and how to look saying it. Positioning, identity systems, launch campaigns — the whole arc.' } },
        { type: 'features', props: { items: [
          { t: 'Strategy', d: 'Positioning that survives contact with reality.' },
          { t: 'Identity', d: 'Systems, not just logos.' },
          { t: 'Campaigns', d: 'Launches people actually notice.' },
        ] } },
        { type: 'cta', props: { heading: 'Tell us about your project.', button: 'Start a conversation' } },
      ]
    case 'SaaS':
    default:
      return [
        { type: 'hero', props: { heading: `${n} does the busywork`, sub: 'The tool your team already wishes it had. Set up in minutes, not quarters.', button: 'Start free trial', align: 'center', tone: 'light' } },
        { type: 'features', props: { items: [
          { t: 'Automate', d: 'The repetitive stuff, gone by Friday.' },
          { t: 'Integrate', d: 'Plays nice with your whole stack.' },
          { t: 'Scale', d: 'From two seats to two thousand.' },
        ] } },
        { type: 'image', props: { caption: 'The dashboard your team will live in', ratio: 'wide' } },
        { type: 'form', props: { heading: 'Book a demo', sub: 'Fifteen minutes, no slides, real answers.', button: 'Request demo' } },
        { type: 'cta', props: { heading: 'Free for 14 days. No card.', button: 'Get started' } },
      ]
    }
  })()
  return [
    { type: 'navbar', props: { brand: n } },
    ...base,
    { type: 'footer', props: { brand: n } },
  ]
}
