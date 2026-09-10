import { APPRAISAL_RESULT_VERSION, APPRAISAL_DIMENSIONS, APPRAISAL_DIMENSION_LEVELS } from './appraisal-result.js'
import { createAgencyIntent } from './agency-intent.js'

const FORBIDDEN_AUTHORITY_FIELDS = Object.freeze([
  'approved',
  'executed',
  'scheduled',
  'execution',
  'schedule',
  'toolCall',
  'actuator',
  'authority',
])

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${label} must be a non-empty string`)
}

function validateAppraisalResult(appraisal) {
  if (!isRecord(appraisal)) throw new TypeError('appraisal must be an AppraisalResult object')
  if (appraisal.version !== APPRAISAL_RESULT_VERSION) {
    throw new TypeError(`unsupported AppraisalResult version: ${appraisal.version}`)
  }
  requireNonEmptyString(appraisal.soulId, 'appraisal.soulId')
  requireNonEmptyString(appraisal.eventId, 'appraisal.eventId')
  if (!isRecord(appraisal.source)) throw new TypeError('appraisal.source is required')
  if (!isRecord(appraisal.source.eventProvenance)) throw new TypeError('appraisal.source.eventProvenance is required')
  if (!isRecord(appraisal.dimensions) || Object.keys(appraisal.dimensions).length === 0) {
    throw new TypeError('appraisal.dimensions must be non-empty')
  }

  for (const [dimension, value] of Object.entries(appraisal.dimensions)) {
    if (!APPRAISAL_DIMENSIONS.includes(dimension)) throw new TypeError(`unsupported appraisal dimension: ${dimension}`)
    if (!isRecord(value)) throw new TypeError(`appraisal dimension ${dimension} must be an object`)
    if (!APPRAISAL_DIMENSION_LEVELS.includes(value.level)) throw new TypeError(`invalid appraisal level for ${dimension}`)
    if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
      throw new TypeError(`appraisal dimension ${dimension} must include evidence`)
    }
  }
}

function rejectAuthorityFields(intent) {
  for (const field of FORBIDDEN_AUTHORITY_FIELDS) {
    if (Object.hasOwn(intent, field)) throw new TypeError(`${field} is not allowed on an appraised agency intent`)
  }
}

export function createAppraisedAgencyIntent({ appraisal, soulId, contextRefs = [], provenance, ...intent } = {}) {
  validateAppraisalResult(appraisal)
  requireNonEmptyString(soulId, 'soulId')
  if (soulId !== appraisal.soulId) throw new TypeError('soulId must match appraisal.soulId')
  rejectAuthorityFields(intent)

  const appraisalRef = {
    type: 'appraisal-result',
    id: `${appraisal.soulId}:${appraisal.eventId}`,
    eventId: appraisal.eventId,
    dimensions: structuredClone(appraisal.dimensions),
    eventProvenance: structuredClone(appraisal.source.eventProvenance),
  }

  return createAgencyIntent({
    ...intent,
    soulId,
    contextRefs: [appraisalRef, ...structuredClone(contextRefs)],
    provenance: {
      ...structuredClone(provenance),
      appraisal: {
        version: appraisal.version,
        soulId: appraisal.soulId,
        eventId: appraisal.eventId,
        eventProvenance: structuredClone(appraisal.source.eventProvenance),
      },
    },
  })
}
