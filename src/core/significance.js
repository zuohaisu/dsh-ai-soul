export const SIGNIFICANCE_ASSESSMENT_VERSION = 1

export const SIGNIFICANCE_LEVELS = Object.freeze([
  'low',
  'medium',
  'high',
])

function clone(value) {
  return structuredClone(value)
}

export function validateSignificanceAssessment(assessment) {
  const errors = []

  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
    errors.push('significance assessment must be an object')
  }
  if (assessment?.version !== SIGNIFICANCE_ASSESSMENT_VERSION) {
    errors.push(`version must be ${SIGNIFICANCE_ASSESSMENT_VERSION}`)
  }
  if (!assessment?.id || typeof assessment.id !== 'string') errors.push('id is required')
  if (!assessment?.experienceId || typeof assessment.experienceId !== 'string') {
    errors.push('experienceId is required')
  }
  if (!assessment?.assessedAt || typeof assessment.assessedAt !== 'string') {
    errors.push('assessedAt is required')
  }
  if (!SIGNIFICANCE_LEVELS.includes(assessment?.level)) {
    errors.push(`level must be one of: ${SIGNIFICANCE_LEVELS.join(', ')}`)
  }
  if (!assessment?.rationale || typeof assessment.rationale !== 'string') {
    errors.push('rationale is required')
  }
  if (typeof assessment?.confidence !== 'number' || !Number.isFinite(assessment.confidence)) {
    errors.push('confidence must be a finite number')
  } else if (assessment.confidence < 0 || assessment.confidence > 1) {
    errors.push('confidence must be between 0 and 1')
  }
  if (!assessment?.provenance || typeof assessment.provenance !== 'object' || Array.isArray(assessment.provenance)) {
    errors.push('provenance is required')
  }
  if (typeof assessment?.recommendPromotion !== 'boolean') {
    errors.push('recommendPromotion must be a boolean')
  }

  return { valid: errors.length === 0, errors }
}

export function createSignificanceAssessment({
  id = crypto.randomUUID(),
  experienceId,
  assessedAt = new Date().toISOString(),
  level,
  rationale,
  confidence,
  provenance,
  recommendPromotion = false,
} = {}) {
  const assessment = {
    version: SIGNIFICANCE_ASSESSMENT_VERSION,
    id,
    experienceId,
    assessedAt,
    level,
    rationale,
    confidence,
    provenance: clone(provenance),
    recommendPromotion,
  }

  const validation = validateSignificanceAssessment(assessment)
  if (!validation.valid) {
    throw new TypeError(`invalid significance assessment: ${validation.errors.join('; ')}`)
  }

  return assessment
}
