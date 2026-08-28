import { appendTransition, createSoulState, validateSoulState } from './soul-state.js'

export const LEGACY_GENESIS_RECORD_VERSION = 1
export const GENESIS_RECORD_VERSION = 2

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

  if (![LEGACY_GENESIS_RECORD_VERSION, GENESIS_RECORD_VERSION].includes(record.version)) {
    errors.push(`version must be ${LEGACY_GENESIS_RECORD_VERSION} or ${GENESIS_RECORD_VERSION}`)
  }
  if (!record.id || typeof record.id !== 'string') errors.push('id is required')
  if (!record.at || typeof record.at !== 'string') errors.push('at is required')
  if (!record.soulId || typeof record.soulId !== 'string') errors.push('soulId is required')
  if (!isRecord(record.provenance)) errors.push('provenance is required')

  if (record.version === LEGACY_GENESIS_RECORD_VERSION) {
    if (!record.name || typeof record.name !== 'string') errors.push('name is required for Genesis Record v1')
    if (!Array.isArray(record.participants)) errors.push('participants must be an array for Genesis Record v1')
    if (record.firstMeetingNote != null && typeof record.firstMeetingNote !== 'string') {
      errors.push('firstMeetingNote must be a string when provided')
    }
  }

  if (record.version === GENESIS_RECORD_VERSION) {
    if (record.name != null && (typeof record.name !== 'string' || record.name.trim() === '')) {
      errors.push('name must be a non-empty string when provided')
    }
    if (record.participants != null && (!Array.isArray(record.participants) || record.participants.length !== 0)) {
      errors.push('Genesis Record v2 does not create relationship participants')
    }
    if (record.firstMeetingNote != null) {
      errors.push('Genesis Record v2 does not contain first-meeting evidence')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function createGenesisRecord({
  version = GENESIS_RECORD_VERSION,
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  soulId,
  name = null,
  participants,
  provenance,
  firstMeetingNote,
} = {}) {
  const record = {
    version,
    id,
    at,
    soulId,
    name,
    provenance: clone(provenance),
  }

  if (version === LEGACY_GENESIS_RECORD_VERSION) {
    record.participants = clone(participants ?? [])
    record.firstMeetingNote = firstMeetingNote ?? null
  } else {
    if (participants != null) record.participants = clone(participants)
    if (firstMeetingNote != null) record.firstMeetingNote = firstMeetingNote
  }

  const validation = validateGenesisRecord(record)
  if (!validation.valid) {
    throw new TypeError(`invalid genesis record: ${validation.errors.join('; ')}`)
  }

  return record
}

function createOrigin(record) {
  return {
    kind: 'genesis',
    genesisRecordId: record.id,
    recordVersion: record.version,
    at: record.at,
    provenance: clone(record.provenance),
  }
}

function createActivationHistory(record) {
  return {
    id: `${record.id}:genesis`,
    experiencedAt: record.at,
    kind: 'genesis',
    payload: { activated: true },
    provenance: {
      genesisRecordId: record.id,
      source: clone(record.provenance),
    },
  }
}

export function createSoulFromGenesis(record) {
  const validation = validateGenesisRecord(record)
  if (!validation.valid) {
    throw new TypeError(`invalid genesis record: ${validation.errors.join('; ')}`)
  }

  const state = createSoulState({
    soulId: record.soulId,
    name: record.name ?? null,
    createdAt: record.at,
    origin: createOrigin(record),
  })

  if (record.version === LEGACY_GENESIS_RECORD_VERSION) {
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
  } else {
    state.autobiography.push(createActivationHistory(record))
  }

  const change = record.version === LEGACY_GENESIS_RECORD_VERSION
    ? {
        identity: ['name', 'origin'],
        relationship: ['participants'],
        autobiography: ['first-meeting'],
      }
    : {
        identity: ['origin', ...(record.name ? ['name'] : [])],
        autobiography: ['genesis'],
      }

  const next = appendTransition(state, {
    id: `${record.id}:initialize`,
    at: record.at,
    kind: 'genesis',
    reason: record.version === LEGACY_GENESIS_RECORD_VERSION
      ? 'Initialize Soul from legacy Genesis v1 first-meeting record.'
      : 'Activate a persistent Soul from Genesis v2 record.',
    provenance: {
      genesisRecordId: record.id,
      source: clone(record.provenance),
    },
    change,
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
