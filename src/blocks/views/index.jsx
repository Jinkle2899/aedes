/*
 * Render registry: block type -> presentational view component.
 * The editor's BlockContent dispatches through this map. This layer is
 * intentionally separate from the pure-data descriptors (../types) so the
 * data registry (consumed by store/predict/search) stays React-free.
 */
import navbar from './navbar.jsx'
import hero from './hero.jsx'
import canvas from './canvas.jsx'
import section from './section.jsx'
import columns from './columns.jsx'
import text from './text.jsx'
import image from './image.jsx'
import gallery from './gallery.jsx'
import features from './features.jsx'
import stats from './stats.jsx'
import tabs from './tabs.jsx'
import accordion from './accordion.jsx'
import countdown from './countdown.jsx'
import rotator from './rotator.jsx'
import quote from './quote.jsx'
import form from './form.jsx'
import cta from './cta.jsx'
import spacer from './spacer.jsx'
import footer from './footer.jsx'

export const RENDERERS = {
  navbar, hero, canvas, section, columns, text, image, gallery, features,
  stats, tabs, accordion, countdown, rotator, quote, form, cta, spacer, footer,
}
