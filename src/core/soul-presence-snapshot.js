import { validateSoulPresence } from './soul-presence.js'

export const SOUL_PRESENCE_SNAPSHOT_VERSION = 1
export const MAX_SOUL_PRESENCE_SURFACES = 32

export function createSoulPresenceSnapshot({ soulId, presences } = {}) {
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('soulId is required')
  }
  if (!Array.isArray(presences)) {
    throw new TypeError('presences must be an array')
  }
  if (presences.length > MAX_SOUL_PRESENCE_SURFACES) {
    throw new TypeError(`presences must contain at most ${MAX_SOUL_PRESENCE_SURFACES} records`)
  }

  const bindings = new Set()
  const projected = presences.map((presence, index) => {
    const validation = validateSoulPresence(presence)
    if (!validation.valid) {
      throw new TypeError(`invalid Soul Presence at index ${index}: ${validation.errors.join('; ')}`)
    }
    if (presence.soulId !== soulId) {
      throw new TypeError(`presence at index ${index} belongs to a different soulId`)
    }

    const binding = `${presence.runtimeId}\u0000${presence.surfaceId}`
    if (bindings.has(binding)) {
      throw new TypeError(`duplicate Presence binding at index ${index}`)
    }
    bindings.add(binding)
    return Object.freeze({ ...presence })
  })

  return Object.freeze({
    version: SOUL_PRESENCE_SNAPSHOT_VERSION,
    soulId,
    presences: Object.freeze(projected),
    authority: 'none',
  })
}
