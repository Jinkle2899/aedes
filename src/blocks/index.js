/*
 * Assembled block registry. Import { registry } here; legacy modules
 * (store BLOCK_DEFS, blockDNA DNA, constants CATS, blockSearch ALIASES)
 * derive their tables from it. To add a block: drop a descriptor in
 * ./types and add it to MODULES below — one place.
 *
 * MODULES order = drawer/category order (drives CATS). It intentionally
 * differs from the historical BLOCK_TYPES order; see docs/block-registry-design.md.
 */
import { buildRegistry } from './registry.js'
import section from './types/section.js'
import columns from './types/columns.js'
import canvas from './types/canvas.js'
import spacer from './types/spacer.js'
import navbar from './types/navbar.js'
import footer from './types/footer.js'
import text from './types/text.js'
import rotator from './types/rotator.js'
import tabs from './types/tabs.js'
import accordion from './types/accordion.js'
import image from './types/image.js'
import gallery from './types/gallery.js'
import hero from './types/hero.js'
import features from './types/features.js'
import stats from './types/stats.js'
import quote from './types/quote.js'
import cta from './types/cta.js'
import countdown from './types/countdown.js'
import form from './types/form.js'
import col from './types/column.js'

export const MODULES = [section, columns, canvas, spacer, navbar, footer, text, rotator, tabs, accordion, image, gallery, hero, features, stats, quote, cta, countdown, form, col]

export const registry = buildRegistry(MODULES)
