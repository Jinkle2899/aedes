/* Site-wide font options (Google Fonts, loaded on demand) */
import { registry } from '../blocks/index.js'

export const FONTS = ['Inter', 'Space Grotesk', 'Poppins', 'DM Sans', 'Sora', 'Playfair Display', 'Lora', 'JetBrains Mono']

/* Browse-drawer categories — derived from each block's `category` in the registry. */
export const CATS = registry.toCategories()

/* Style-panel color presets */
export const BG_SWATCHES = [null, '#ffffff', '#f2f4f7', '#17171a', '#0a0a0b', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3']
export const TEXT_SWATCHES = [null, '#17171a', '#6b7280', '#ffffff', '#b45309', '#1d4ed8']
