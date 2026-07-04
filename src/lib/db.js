/*
 * Data layer — one async API, two drivers:
 *   cloud (Supabase, when configured AND signed in)  |  local (localStorage)
 * Components never know which one they're talking to.
 */
import { supabase, cloudEnabled } from './supabase.js'
import { loadSites, saveSites, saveSite, uid, starterBlocks, makeBlock } from './store.js'

const useCloud = (session) => cloudEnabled && !!session

const fromRow = (r) => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  font: r.font || null,
  updatedAt: new Date(r.updated_at).getTime(),
  blocks: r.blocks || [],
})
const toRow = (s) => ({
  id: s.id,
  name: s.name,
  kind: s.kind ?? null,
  font: s.font ?? null,
  updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
  blocks: s.blocks,
})

export async function listSites(session) {
  if (useCloud(session)) {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data.map(fromRow)
  }
  return loadSites()
}

export async function getSite(id, session) {
  if (useCloud(session)) {
    const { data, error } = await supabase.from('sites').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? fromRow(data) : null
  }
  return loadSites().find((s) => s.id === id) || null
}

export async function upsertSite(site, session) {
  if (useCloud(session)) {
    const { error } = await supabase.from('sites').upsert(toRow(site))
    if (error) throw error
    return site
  }
  saveSite(site)
  return site
}

export async function removeSite(id, session) {
  if (useCloud(session)) {
    const { error } = await supabase.from('sites').delete().eq('id', id)
    if (error) throw error
    return
  }
  saveSites(loadSites().filter((s) => s.id !== id))
}

/* ---- builders (save through the active driver) ---- */

export async function createNewSite(session) {
  const site = { id: uid(), name: 'Untitled site', kind: null, updatedAt: Date.now(), blocks: starterBlocks() }
  await upsertSite(site, session)
  return site
}

export async function createFromTemplate(name, recipe, kind, session) {
  const blocks = recipe.map((r) => {
    const b = makeBlock(r.type)
    b.props = { ...b.props, ...JSON.parse(JSON.stringify(r.props || {})) }
    return b
  })
  const site = { id: uid(), name, kind, updatedAt: Date.now(), blocks }
  await upsertSite(site, session)
  return site
}
