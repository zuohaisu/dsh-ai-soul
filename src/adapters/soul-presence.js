import { createSoulPresence } from '../core/soul-presence.js'

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
