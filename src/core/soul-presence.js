export const SOUL_PRESENCE_VERSION = 1
export const SOUL_PRESENCE_STATES = Object.freeze(['present', 'absent', 'detached'])

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(value, field, errors) {
  if (!value || typeof value !== 'string') errors.push(`${field} is required`)
}

export function validateSoulPresence(presence) {
  const errors = []
  if (!isRecord(presence)) return { valid: false, errors: ['soul presence must be an object'] }

  if (presence.version !== SOUL_PRESENCE_VERSION) errors.push(`version must be ${SOUL_PRESENCE_VERSION}`)
  requiredString(presence.soulId, 'soulId', errors)
  requiredString(presence.runtimeId, 'runtimeId', errors)
  requiredString(presence.surfaceId, 'surfaceId', errors)
  requiredString(presence.observedAt, 'observedAt', errors)
  if (!SOUL_PRESENCE_STATES.includes(presence.state)) {
    errors.push(`state must be one of: ${SOUL_PRESENCE_STATES.join(', ')}`)
  }
  if (presence.authority !== 'none') errors.push('authority must be none')

  for (const forbidden of [
    'transcript', 'history', 'messages', 'attention', 'significance', 'experience',
    'memory', 'memoryCandidate', 'proposal', 'review', 'approval', 'mutation',
    'execution', 'schedule', 'toolCall', 'actuator',
  ]) {
    if (Object.hasOwn(presence, forbidden)) errors.push(`${forbidden} is not allowed on Soul Presence`)
  }

  return { valid: errors.length === 0, errors }
}

export function createSoulPresence({
  soulId,
  runtimeId,
  surfaceId,
  state,
  observedAt = new Date().toISOString(),
} = {}) {
  const presence = {
    version: SOUL_PRESENCE_VERSION,
    soulId,
    runtimeId,
    surfaceId,
    state,
    observedAt,
    authority: 'none',
  }
  const validation = validateSoulPresence(presence)
  if (!validation.valid) throw new TypeError(`invalid Soul Presence: ${validation.errors.join('; ')}`)
  return presence
}

export function validateSoulPresenceBinding(presence, { soulId, runtimeId, surfaceId } = {}) {
  const validation = validateSoulPresence(presence)
  const errors = [...validation.errors]
  if (validation.valid) {
    if (soulId != null && presence.soulId !== soulId) errors.push('soulId does not match bound Soul')
    if (runtimeId != null && presence.runtimeId !== runtimeId) errors.push('runtimeId does not match bound runtime')
    if (surfaceId != null && presence.surfaceId !== surfaceId) errors.push('surfaceId does not match bound surface')
  }
  return { valid: errors.length === 0, errors }
}
