import { appendTransition, validateSoulState } from './soul-state.js'

function clone(value) {
  return structuredClone(value)
}

function requireProvenance(provenance) {
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new TypeError('provenance is required')
  }
}

export function recordFirstEncounter(state, {
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  participant,
  note = null,
  provenance,
} = {}) {
  const validation = validateSoulState(state)
  if (!validation.valid) throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  if (!participant || typeof participant !== 'object' || Array.isArray(participant)) {
    throw new TypeError('participant is required')
  }
  requireProvenance(provenance)
  if (note != null && typeof note !== 'string') throw new TypeError('note must be a string when provided')
  if (state.autobiography.some((event) => event?.kind === 'first-encounter')) {
    throw new Error('first encounter already recorded')
  }

  const next = clone(state)
  next.relationship.participants.push(clone(participant))
  next.autobiography.push({
    id,
    experiencedAt: at,
    kind: 'first-encounter',
    payload: { participant: clone(participant), note },
    provenance: clone(provenance),
  })

  return appendTransition(next, {
    id: `${id}:transition`,
    at,
    kind: 'first-encounter',
    reason: 'Record the Soul\'s first encounter independently from Genesis.',
    provenance: clone(provenance),
    change: {
      relationship: ['participants'],
      autobiography: ['first-encounter'],
    },
  })
}

export function recordNamingEvent(state, {
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  name,
  initiatedBy = null,
  note = null,
  provenance,
} = {}) {
  const validation = validateSoulState(state)
  if (!validation.valid) throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  if (typeof name !== 'string' || name.trim() === '') throw new TypeError('name is required')
  requireProvenance(provenance)
  if (note != null && typeof note !== 'string') throw new TypeError('note must be a string when provided')

  const next = clone(state)
  const previousName = next.identity.name ?? null
  next.identity.name = name
  next.autobiography.push({
    id,
    experiencedAt: at,
    kind: 'naming',
    payload: {
      previousName,
      name,
      initiatedBy,
      note,
    },
    provenance: clone(provenance),
  })

  return appendTransition(next, {
    id: `${id}:transition`,
    at,
    kind: 'naming',
    reason: previousName == null ? 'Record the Soul receiving a name.' : 'Record a Soul name change.',
    provenance: clone(provenance),
    change: {
      identity: ['name'],
      autobiography: ['naming'],
    },
  })
}
