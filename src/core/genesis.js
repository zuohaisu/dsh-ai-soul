import { appendTransition, createSoulState, validateSoulState } from './soul-state.js'

export const GENESIS_RECORD_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function validateGenesisRecord(record) {
  const errors = []

  if (!isRecord(record)) {
    return { valid: false, errors: ['genesis record must be an object'] }
  }

  if (record.version !== GENESIS_RECORD_VERSION) errors.push(`version must be ${GENESIS_RECORD_VERSION}`)
  if (!record.id || typeof record.id !== 'string') errors.push('id is required')
  if (!record.at || typeof record.at !== 'string') errors.push('at is required')
  if (!record.soulId || typeof record.soulId !== 'string') errors.push('soulId is required')
  if (!record.name || typeof record.name !== 'string') errors.push('name is required')
  if (!Array.isArray(record.participants)) errors.push('participants must be an array')
  if (!isRecord(record.provenance)) errors.push('provenance is required')
  if (record.firstMeetingNote != null && typeof record.firstMeetingNote !== 'string') {
    errors.push('firstMeetingNote must be a string when provided')
  }

  return { valid: errors.length === 0, errors }
}

export function createGenesisRecord({
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  soulId,
  name,
  participants = [],
  provenance,
  firstMeetingNote = null,
} = {}) {
  const record = {
    version: GENESIS_RECORD_VERSION,
    id,
    at,
    soulId,
    name,
    participants: clone(participants),
    provenance: clone(provenance),
    firstMeetingNote,
  }

  const validation = validateGenesisRecord(record)
  if (!validation.valid) {
    throw new TypeError(`invalid genesis record: ${validation.errors.join('; ')}`)
  }

  return record
}

export function createSoulFromGenesis(record) {
  const validation = validateGenesisRecord(record)
  if (!validation.valid) {
    throw new TypeError(`invalid genesis record: ${validation.errors.join('; ')}`)
  }

  const state = createSoulState({
    soulId: record.soulId,
    name: record.name,
    createdAt: record.at,
    origin: {
      kind: 'genesis',
      genesisRecordId: record.id,
      at: record.at,
      provenance: clone(record.provenance),
    },
  })

  state.relationship.participants.push(...clone(record.participants))
  state.autobiography.push({
    id: `${record.id}:first-meeting`,
    experiencedAt: record.at,
    kind: 'first-meeting',
    payload: {
      chosenName: record.name,
      note: record.firstMeetingNote,
    },
    provenance: {
      genesisRecordId: record.id,
      source: clone(record.provenance),
    },
  })

  const next = appendTransition(state, {
    id: `${record.id}:initialize`,
    at: record.at,
    kind: 'genesis',
    reason: 'Initialize Soul from explicit Genesis record.',
    provenance: {
      genesisRecordId: record.id,
      source: clone(record.provenance),
    },
    change: {
      identity: ['name', 'origin'],
      relationship: ['participants'],
      autobiography: ['first-meeting'],
    },
  })

  const stateValidation = validateSoulState(next)
  if (!stateValidation.valid) {
    throw new TypeError(`invalid Soul state after Genesis: ${stateValidation.errors.join('; ')}`)
  }

  return next
}

export async function persistGenesisSoul(store, record) {
  if (!store || typeof store.exists !== 'function' || typeof store.save !== 'function' || typeof store.load !== 'function') {
    throw new TypeError('Soul Store with exists(), save(), and load() is required')
  }

  const state = createSoulFromGenesis(record)
  if (await store.exists(state.soulId)) {
    throw new Error(`Genesis refused to overwrite existing Soul ${state.soulId}`)
  }

  const path = await store.save(state)
  const reloaded = await store.load(state.soulId)

  if (reloaded.soulId !== state.soulId) {
    throw new Error(`Genesis reload mismatch: expected Soul ${state.soulId}, got ${reloaded.soulId}`)
  }
  if (reloaded.identity?.origin?.genesisRecordId !== record.id) {
    throw new Error(`Genesis reload lost origin provenance for Soul ${state.soulId}`)
  }

  return { state: reloaded, path }
}
