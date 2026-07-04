/*
 * Block DNA — intelligence metadata for every block type.
 * Powers prediction (predict.js), page grammar (pageGrammar.js),
 * and later: search ranking, AI generation, marketplace ranking.
 *
 * DNA is now DERIVED from the Block Registry (src/blocks) so a block's
 * intelligence lives beside its definition. Shape is unchanged for consumers:
 *   grammar: opening | body | proof | conversion | closing | utility
 *   after:   block types this one typically follows
 *   kinds:   template categories (site types) with special affinity
 *   pop:     editorial popularity prior, 0..1
 */
import { registry } from '../blocks/index.js'

export const DNA = registry.toDNA()
