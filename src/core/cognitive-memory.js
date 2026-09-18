import { validateExperienceRecord } from './experience.js'
import { validateSignificanceAssessment } from './significance.js'

export const COGNITIVE_MEMORY_RECORD_VERSION = 1
export const MAX_COGNITIVE_MEMORY_CONTENT_CHARS = 1200
export const MAX_COGNITIVE_MEMORY_RECALL_KEYS = 8
export const MAX_COGNITIVE_MEMORY_RECALL_KEY_CHARS = 128
export const COGNITIVE_MEMORY_RECALL_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/

const FORBIDDEN_AUTHORITY_FIELDS = new Set([
  'approved', 'authorization', 'authorized', 'canonicalMutation', 'execution',
  'memoryWrite', 'permission', 'scheduled', 'toolCall',
])

function clone(value) {
  return structuredClone(value)
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
}

function recallKeyErrors(value) {
  const errors = []
  if (!Array.isArray(value)) {
    errors.push('recallKeys must be an array when provided')
    return errors
  }
  if (value.length === 0) errors.push(`recallKeys must contain at least 1 key`)
  if (value.length > MAX_COGNITIVE_MEMORY_RECALL_KEYS) errors.push(`recallKeys must contain <= ${MAX_COGNITIVE_MEMORY_RECALL_KEYS} keys`)
  const seen = new Set()
  for (const key of value) {
    if (typeof key !== 'string' || key.length === 0 || key.length > MAX_COGNITIVE_MEMORY_RECALL_KEY_CHARS) {
      errors.push(`each recall key must be a non-empty string <= ${MAX_COGNITIVE_MEMORY_RECALL_KEY_CHARS} characters`)
      continue
    }
    if (!COGNITIVE_MEMORY_RECALL_KEY_PATTERN.test(key)) errors.push(`recall key must match ${COGNITIVE_MEMORY_RECALL_KEY_PATTERN}: ${key}`)
    if (seen.has(key)) errors.push(`recall keys must not contain duplicates: ${key}`)
    seen.add(key)
  }
  return errors
}

export function validateRecallKeys(value) {
  const errors = recallKeyErrors(value)
  if (errors.length > 0) throw new TypeError(`invalid cognitive memory recall keys: ${errors.join('; ')}`)
  return Object.freeze(structuredClone(value))
}

/**
 * Deterministic recall keys derived only from explicit structured evidence that
 * the canonical Experience boundary already carries. Today that evidence is the
 * payload participant identity; message text is never inspected and no key is
 * invented when the evidence is absent or malformed.
 */
export function deriveRecallKeysFromExperience(experience) {
  const validation = validateExperienceRecord(experience)
  if (!validation.valid) {
    throw new TypeError(`invalid experience record: ${validation.errors.join('; ')}`)
  }
  const participantId = experience.payload?.participant?.id
  if (typeof participantId !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(participantId)) {
    return Object.freeze([])
  }
  return Object.freeze([`participant:${participantId}`])
}

export function validateCognitiveMemoryRecord(record) {
  const errors = []
  if (!record || typeof record !== 'object' || Array.isArray(record)) errors.push('cognitive memory must be an object')
  if (record?.version !== COGNITIVE_MEMORY_RECORD_VERSION) errors.push(`version must be ${COGNITIVE_MEMORY_RECORD_VERSION}`)
  if (!record?.id || typeof record.id !== 'string') errors.push('id is required')
  if (!record?.soulId || typeof record.soulId !== 'string') errors.push('soulId is required')
  if (!record?.experienceId || typeof record.experienceId !== 'string') errors.push('experienceId is required')
  if (!record?.significanceAssessmentId || typeof record.significanceAssessmentId !== 'string') errors.push('significanceAssessmentId is required')
  if (!record?.formedAt || typeof record.formedAt !== 'string') errors.push('formedAt is required')
  if (!record?.content || typeof record.content !== 'string') errors.push('content is required')
  else if (record.content.length > MAX_COGNITIVE_MEMORY_CONTENT_CHARS) errors.push(`content must be <= ${MAX_COGNITIVE_MEMORY_CONTENT_CHARS} characters`)
  if (typeof record?.confidence !== 'number' || !Number.isFinite(record.confidence) || record.confidence < 0 || record.confidence > 1) errors.push('confidence must be between 0 and 1')
  if (!record?.provenance || typeof record.provenance !== 'object' || Array.isArray(record.provenance)) errors.push('provenance is required')
  if (record?.canonical !== false) errors.push('canonical must be false')
  if (record?.authority !== 'none') errors.push('authority must be none')
  if (record?.recallKeys !== undefined) errors.push(...recallKeyErrors(record.recallKeys))
  return { valid: errors.length === 0, errors }
}

export function createCognitiveMemoryRecord({
  id = crypto.randomUUID(),
  soulId,
  experience,
  significanceAssessment,
  content,
  confidence,
  formedAt = new Date().toISOString(),
  provenance,
  recallKeys,
  ...extra
} = {}) {
  for (const key of FORBIDDEN_AUTHORITY_FIELDS) {
    if (Object.hasOwn(extra, key)) throw new TypeError(`cognitive memory rejects authority-bearing field: ${key}`)
  }

  const experienceValidation = validateExperienceRecord(experience)
  if (!experienceValidation.valid) throw new TypeError(`invalid source experience: ${experienceValidation.errors.join('; ')}`)
  const significanceValidation = validateSignificanceAssessment(significanceAssessment)
  if (!significanceValidation.valid) throw new TypeError(`invalid significance assessment: ${significanceValidation.errors.join('; ')}`)
  if (significanceAssessment.experienceId !== experience.id) throw new TypeError('significance assessment must reference the source experience')
  if (significanceAssessment.recommendPromotion !== true || significanceAssessment.level !== 'high') {
    throw new TypeError('cognitive memory requires an explicitly high-significance promotable assessment')
  }
  if (!soulId || typeof soulId !== 'string') throw new TypeError('soulId is required')
  if (!content || typeof content !== 'string' || content.length > MAX_COGNITIVE_MEMORY_CONTENT_CHARS) {
    throw new TypeError(`content must be a non-empty string <= ${MAX_COGNITIVE_MEMORY_CONTENT_CHARS} characters`)
  }
  assertObject(provenance, 'provenance')
  const safeRecallKeys = recallKeys === undefined ? undefined : validateRecallKeys(recallKeys)

  const record = {
    version: COGNITIVE_MEMORY_RECORD_VERSION,
    id,
    soulId,
    experienceId: experience.id,
    significanceAssessmentId: significanceAssessment.id,
    formedAt,
    content,
    confidence,
    provenance: clone(provenance),
    canonical: false,
    authority: 'none',
  }
  if (safeRecallKeys !== undefined) record.recallKeys = safeRecallKeys
  const validation = validateCognitiveMemoryRecord(record)
  if (!validation.valid) throw new TypeError(`invalid cognitive memory: ${validation.errors.join('; ')}`)
  return Object.freeze(record)
}
