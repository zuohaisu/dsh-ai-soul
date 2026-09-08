import { createSoulPresence } from '../core/soul-presence.js'
import { createSoulPresenceSnapshot } from '../core/soul-presence-snapshot.js'

export const DSH_SOUL_PRESENCE_RUNTIME_ID = 'deepseek-harness'
export const DSH_SOUL_PRESENCE_SURFACES = Object.freeze(['tui', 'web'])

function requireLoadedSoul(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new TypeError('DSH Soul Presence projection requires an already-loaded Soul state')
  }
  if (!state.soulId || typeof state.soulId !== 'string') {
    throw new TypeError('DSH Soul Presence projection requires loaded Soul state.soulId')
  }
  return state
}

export function projectDshSoulPresence(state, {
  surfaceId,
  presenceState = 'present',
  observedAt = new Date().toISOString(),
} = {}) {
  const loadedSoul = requireLoadedSoul(state)
  if (!DSH_SOUL_PRESENCE_SURFACES.includes(surfaceId)) {
    throw new TypeError(`DSH Soul Presence surfaceId must be one of: ${DSH_SOUL_PRESENCE_SURFACES.join(', ')}`)
  }

  return createSoulPresence({
    soulId: loadedSoul.soulId,
    runtimeId: DSH_SOUL_PRESENCE_RUNTIME_ID,
    surfaceId,
    state: presenceState,
    observedAt,
  })
}

export function composeDshSoulPresenceSnapshot(state, surfaceObservations = []) {
  const loadedSoul = requireLoadedSoul(state)
  if (!Array.isArray(surfaceObservations)) {
    throw new TypeError('DSH Soul Presence surface observations must be an array')
  }

  const presences = surfaceObservations.map((observation) => {
    if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
      throw new TypeError('DSH Soul Presence surface observation must be an object')
    }
    return projectDshSoulPresence(loadedSoul, {
      surfaceId: observation.surfaceId,
      presenceState: observation.state,
      observedAt: observation.observedAt,
    })
  })

  return createSoulPresenceSnapshot({ soulId: loadedSoul.soulId, presences })
}
