/*
 * Block Registry — the single source of truth for every block type.
 *
 * Each block ships one descriptor module (see ./types/*.js). This core
 * assembles them and exposes both a direct lookup (get/all/blockTypes) and
 * *derived* views that reproduce the legacy tables the rest of the app still
 * imports (BLOCK_DEFS, DNA, CATS, ALIASES). Those legacy modules now re-export
 * these derivations, so adding a block is a one-file change here — not six.
 *
 * Descriptor shape:
 *   { type, label, hint?, category?, aliases?, internal?, defaults,
 *     dna: { grammar, after, pop, singleton?, kinds?, internal? },
 *     render?, fields? }   // render/fields consumed in later phases
 */

export function buildRegistry(modules) {
  const byType = {}
  for (const m of modules) {
    if (byType[m.type]) throw new Error(`Duplicate block type registered: ${m.type}`)
    byType[m.type] = m
  }

  const blockTypes = modules.filter((m) => !m.internal).map((m) => m.type)

  return {
    /* ---- direct access ---- */
    get: (type) => byType[type],
    all: () => modules,
    blockTypes,

    /* ---- containment capabilities (generalizes hardcoded section/columns) ---- */
    isContainer: (type) => !!(byType[type] && byType[type].container),
    canContain: (parentType, childType) => {
      const p = byType[parentType]
      if (!p || !p.container) return false
      const child = byType[childType]
      if (!child || child.internal) return childType === 'column' // only columns place internal columns
      return p.canContain ? p.canContain.includes(childType) : true
    },

    /* ---- derived legacy views (reproduce the old hand-written tables) ---- */
    toBlockDefs() {
      const out = {}
      for (const m of modules) {
        const def = { label: m.label }
        if (m.hint !== undefined) def.hint = m.hint
        def.defaults = m.defaults
        if (m.internal) def.internal = true
        out[m.type] = def
      }
      return out
    },
    toDNA() {
      const out = {}
      for (const m of modules) out[m.type] = { label: m.label, ...m.dna }
      return out
    },
    toCategories() {
      const out = {}
      for (const m of modules) {
        if (m.internal || !m.category) continue
        ;(out[m.category] ||= []).push(m.type)
      }
      return out
    },
    toAliases() {
      const out = {}
      for (const m of modules) out[m.type] = m.aliases || []
      return out
    },
  }
}
