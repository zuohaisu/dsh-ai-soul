import { APPRAISAL_INPUT_VERSION } from './appraisal-input.js'

export const APPRAISAL_RESULT_VERSION = 1
export const APPRAISAL_DIMENSIONS = Object.freeze([
  'relevance',
  'goalCongruence',
  'novelty',
  'uncertainty',
  'relationalSignificance',
])
export const APPRAISAL_DIMENSION_LEVELS = Object.freeze(['low', 'medium', 'high'])

function clone(value) {
  return structuredClone(value)
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`)
  }
}

function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('input must be an AppraisalInput object')
  }
  if (input.version !== APPRAISAL_INPUT_VERSION) {
    throw new TypeError(`unsupported AppraisalInput version: ${input.version}`)
  }
  requireNonEmptyString(input.soulId, 'input.soulId')
  if (!input.event || typeof input.event !== 'object' || Array.isArray(input.event)) {
    throw new TypeError('input.event must be an object')
  }
  requireNonEmptyString(input.event.id, 'input.event.id')
  if (!input.event.provenance || typeof input.event.provenance !== 'object' || Array.isArray(input.event.provenance)) {
    throw new TypeError('input.event.provenance must be an object')
  }
  if (!input.cognition || typeof input.cognition !== 'object' || Array.isArray(input.cognition)) {
    throw new TypeError('input.cognition must be an object')
  }
}

function validateEvidenceReference(reference, dimension) {
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
    throw new TypeError(`${dimension}.evidence entries must be objects`)
  }
  requireNonEmptyString(reference.path, `${dimension}.evidence.path`)
  if (!reference.path.startsWith('cognition.') && !reference.path.startsWith('event.')) {
    throw new TypeError(`${dimension}.evidence.path must reference cognition.* or event.*`)
  }
}

export function createAppraisalResult({ input, assessment } = {}) {
  validateInput(input)
  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
    throw new TypeError('assessment must be an object')
  }

  const unsupported = Object.keys(assessment).filter((key) => !APPRAISAL_DIMENSIONS.includes(key))
  if (unsupported.length > 0) {
    throw new TypeError(`unsupported appraisal dimension(s): ${unsupported.join(', ')}`)
  }
  if (Object.keys(assessment).length === 0) {
    throw new TypeError('assessment must declare at least one appraisal dimension')
  }

  const dimensions = {}
  for (const dimension of APPRAISAL_DIMENSIONS) {
    if (!(dimension in assessment)) continue
    const value = assessment[dimension]
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`${dimension} assessment must be an object`)
    }
    if (!APPRAISAL_DIMENSION_LEVELS.includes(value.level)) {
      throw new TypeError(`${dimension}.level must be one of: ${APPRAISAL_DIMENSION_LEVELS.join(', ')}`)
    }
    if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
      throw new TypeError(`${dimension}.evidence must contain at least one reference`)
    }
    value.evidence.forEach((reference) => validateEvidenceReference(reference, dimension))
    dimensions[dimension] = {
      level: value.level,
      evidence: clone(value.evidence),
    }
  }

  return {
    version: APPRAISAL_RESULT_VERSION,
    soulId: input.soulId,
    eventId: input.event.id,
    source: {
      appraisalInputVersion: input.version,
      eventProvenance: clone(input.event.provenance),
    },
    dimensions,
  }
}
