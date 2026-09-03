const SOUL_STATE_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

export function createSoulState({
  soulId,
  name = null,
  createdAt = new Date().toISOString(),
  origin = null,
} = {}) {
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('soulId is required')
  }
  if (name != null && (typeof name !== 'string' || name.trim() === '')) {
    throw new TypeError('name must be a non-empty string when provided')
  }

  return {
    schemaVersion: SOUL_STATE_VERSION,
    soulId,
    identity: {
      name,
      createdAt,
      origin,
      invariants: [],
    },
    autobiography: [],
    selfModel: [],
    userModel: [],
    worldModel: [],
    relationship: {
      participants: [],
      state: [],
      covenants: [],
    },
    beliefs: [],
    evolution: [],
  }
}

export function validateSoulState(state) {
  const errors = []

  if (!state || typeof state !== 'object') errors.push('state must be an object')
  if (state?.schemaVersion !== SOUL_STATE_VERSION) errors.push(`schemaVersion must be ${SOUL_STATE_VERSION}`)
  if (!state?.soulId || typeof state.soulId !== 'string') errors.push('soulId is required')
  if (state?.identity?.name != null && (typeof state.identity.name !== 'string' || state.identity.name.trim() === '')) {
    errors.push('identity.name must be a non-empty string when provided')
  }

  for (const key of ['autobiography', 'selfModel', 'userModel', 'beliefs', 'evolution']) {
    if (!Array.isArray(state?.[key])) errors.push(`${key} must be an array`)
  }
  if (state?.worldModel != null && !Array.isArray(state.worldModel)) errors.push('worldModel must be an array when provided')

  for (const key of ['participants', 'state', 'covenants']) {
    if (!Array.isArray(state?.relationship?.[key])) errors.push(`relationship.${key} must be an array`)
  }

  return { valid: errors.length === 0, errors }
}

export function appendTransition(state, transition) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }
  if (!transition?.kind || !transition?.reason || !transition?.provenance) {
    throw new TypeError('transition requires kind, reason, and provenance')
  }

  const next = clone(state)
  next.evolution.push({
    id: transition.id ?? crypto.randomUUID(),
    at: transition.at ?? new Date().toISOString(),
    kind: transition.kind,
    reason: transition.reason,
    provenance: clone(transition.provenance),
    change: clone(transition.change ?? null),
  })

  return next
}

export { SOUL_STATE_VERSION }
