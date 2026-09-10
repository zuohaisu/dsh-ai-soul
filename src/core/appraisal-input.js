import { validateSoulState } from './soul-state.js'

export const APPRAISAL_INPUT_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`)
  }
}

export function createAppraisalInput({
  state,
  eventId,
  eventType,
  observedAt,
  provenance,
  context = null,
} = {}) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }

  requireNonEmptyString(eventId, 'eventId')
  requireNonEmptyString(eventType, 'eventType')
  requireNonEmptyString(observedAt, 'observedAt')
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new TypeError('provenance must be an object')
  }
  if (context != null && (typeof context !== 'object' || Array.isArray(context))) {
    throw new TypeError('context must be an object when provided')
  }

  return {
    version: APPRAISAL_INPUT_VERSION,
    soulId: state.soulId,
    event: {
      id: eventId,
      type: eventType,
      observedAt,
      provenance: clone(provenance),
      context: clone(context),
    },
    cognition: {
      self: clone(state.selfModel),
      other: clone(state.userModel),
      participants: clone(state.relationship.participants),
      relational: clone(state.relationship.state),
      world: clone(state.worldModel ?? []),
      beliefs: clone(state.beliefs),
    },
  }
}
