import { validateExperienceRecord } from './experience.js'
import { validateSignificanceAssessment } from './significance.js'

export const COGNITIVE_MEMORY_RECORD_VERSION = 1
export const MAX_COGNITIVE_MEMORY_CONTENT_CHARS = 1200

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
  const validation = validateCognitiveMemoryRecord(record)
  if (!validation.valid) throw new TypeError(`invalid cognitive memory: ${validation.errors.join('; ')}`)
  return Object.freeze(record)
}
