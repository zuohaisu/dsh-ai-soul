import { validateCognitiveMemoryRecord } from './cognitive-memory.js'

export const MAX_COGNITIVE_MEMORY_RETRIEVAL_RESULTS = 32

const SELECTOR_FIELDS = new Set(['experienceId', 'significanceAssessmentId'])

function assertIdentifier(value, label) {
  if (!value || typeof value !== 'string') throw new TypeError(`${label} is required`)
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} contains unsupported characters`)
  return value
}

function validateSelector(selector) {
  if (!selector || typeof selector !== 'object' || Array.isArray(selector)) {
    throw new TypeError('selector must be an object')
  }
  const entries = Object.entries(selector)
  if (entries.length === 0) throw new TypeError('selector must contain at least one criterion')
  for (const [key, value] of entries) {
    if (!SELECTOR_FIELDS.has(key)) throw new TypeError(`unsupported cognitive memory selector field: ${key}`)
    assertIdentifier(value, `selector.${key}`)
  }
  return structuredClone(selector)
}

function validateLimit(limit) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_COGNITIVE_MEMORY_RETRIEVAL_RESULTS) {
    throw new TypeError(`limit must be an integer between 1 and ${MAX_COGNITIVE_MEMORY_RETRIEVAL_RESULTS}`)
  }
  return limit
}

function compareRecords(left, right) {
  const formedAt = left.formedAt.localeCompare(right.formedAt)
  return formedAt || left.id.localeCompare(right.id)
}

function matches(record, selector) {
  return Object.entries(selector).every(([key, value]) => record[key] === value)
}

export async function retrieveCognitiveMemories({ store, soulId, selector, limit = 8 } = {}) {
  if (!store || typeof store.list !== 'function') throw new TypeError('store with list(soulId) is required')
  assertIdentifier(soulId, 'soulId')
  const safeSelector = validateSelector(selector)
  const safeLimit = validateLimit(limit)
  const records = await store.list(soulId)
  if (!Array.isArray(records)) throw new TypeError('cognitive memory store list() must return an array')

  const matchesForSoul = []
  for (const record of records) {
    const validation = validateCognitiveMemoryRecord(record)
    if (!validation.valid) throw new TypeError(`invalid retrieved cognitive memory: ${validation.errors.join('; ')}`)
    if (record.soulId !== soulId) throw new TypeError('retrieved cognitive memory belongs to another Soul')
    if (matches(record, safeSelector)) matchesForSoul.push(structuredClone(record))
  }

  return matchesForSoul.sort(compareRecords).slice(0, safeLimit)
}
