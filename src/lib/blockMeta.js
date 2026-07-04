/* Per-user block memory: recents, favorites, usage counts (localStorage). */

const KEY = 'aedes:blockMeta'

export function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(KEY))
    return { recents: [], favs: [], counts: {}, ...(m || {}) }
  } catch {
    return { recents: [], favs: [], counts: {} }
  }
}

function save(m) {
  localStorage.setItem(KEY, JSON.stringify(m))
  return m
}

export function recordUse(type) {
  const m = loadMeta()
  m.recents = [type, ...m.recents.filter((t) => t !== type)].slice(0, 8)
  m.counts[type] = (m.counts[type] || 0) + 1
  return save(m)
}

export function toggleFav(type) {
  const m = loadMeta()
  m.favs = m.favs.includes(type) ? m.favs.filter((t) => t !== type) : [...m.favs, type].slice(0, 8)
  return save(m)
}

export function setPredictOn(on) {
  const m = loadMeta()
  m.predictOn = on
  return save(m)
}
