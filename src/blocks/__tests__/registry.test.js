import { describe, expect, it } from 'vitest'
import { MODULES, registry } from '../index.js'
import { RENDERERS } from '../views/index.jsx'
import { BLOCK_DEFS } from '../../lib/store.js'
import { DNA } from '../../lib/blockDNA.js'
import { CATS } from '../../editor/constants.js'

describe('block registry', () => {
  it('derives the legacy metadata tables from descriptors', () => {
    expect(registry.toBlockDefs()).toEqual(BLOCK_DEFS)
    expect(registry.toDNA()).toEqual(DNA)
    expect(registry.toCategories()).toEqual(CATS)

    for (const mod of MODULES) {
      expect(registry.toAliases()[mod.type]).toEqual(mod.aliases || [])
    }
  })

  it('has fields and renderers for every non-internal block', () => {
    for (const mod of MODULES.filter((m) => !m.internal)) {
      expect(mod.fields, `${mod.type} fields`).toBeDefined()
      expect(Array.isArray(mod.fields), `${mod.type} fields`).toBe(true)
      expect(RENDERERS[mod.type], `${mod.type} renderer`).toBeDefined()
    }
  })
})
