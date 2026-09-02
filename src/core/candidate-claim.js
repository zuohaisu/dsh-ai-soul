import { validateExperienceRecord } from './experience.js'
import { validateSignificanceAssessment } from './significance.js'

export const CANDIDATE_CLAIM_VERSION = 1
export const CANDIDATE_CLAIM_TARGETS = Object.freeze(['userModel'])
export const CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH = 500

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return structuredClone(value)
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function nonEmptyBoundedString(value, field, maximum) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  if (value.length > maximum) {
    throw new TypeError(`${field} must be at most ${maximum} characters`)
  }
  return value
}

export function validateCandidateClaim(claim) {
  const errors = []

  if (!isRecord(claim)) return { valid: false, errors: ['candidate claim must be an object'] }
  if (claim.version !== CANDIDATE_CLAIM_VERSION) errors.push(`version must be ${CANDIDATE_CLAIM_VERSION}`)
  if (typeof claim.id !== 'string' || claim.id.trim() === '') errors.push('id is required')
  if (typeof claim.createdAt !== 'string' || claim.createdAt.trim() === '') errors.push('createdAt is required')
  if (!CANDIDATE_CLAIM_TARGETS.includes(claim.target)) errors.push('target is not supported for candidate claims')
  if (typeof claim.statement !== 'string' || claim.statement.trim() === '') {
    errors.push('statement is required')
  } else if (claim.statement.length > CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH) {
    errors.push(`statement must be at most ${CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH} characters`)
  }
  if (!Number.isFinite(claim.confidence) || claim.confidence < 0 || claim.confidence > 1) {
    errors.push('confidence must be between 0 and 1')
  }
  if (!isRecord(claim.provenance)) errors.push('provenance is required')
  if (claim.status !== 'candidate') errors.push('status must remain candidate')
  if (claim.canonicalMutation !== false) errors.push('canonicalMutation must remain false')

  if (!isRecord(claim.source)) {
    errors.push('source is required')
  } else {
    if (typeof claim.source.experienceId !== 'string' || claim.source.experienceId.trim() === '') errors.push('source.experienceId is required')
    if (typeof claim.source.experienceAt !== 'string' || claim.source.experienceAt.trim() === '') errors.push('source.experienceAt is required')
    if (typeof claim.source.experienceKind !== 'string' || claim.source.experienceKind.trim() === '') errors.push('source.experienceKind is required')
    if (!isRecord(claim.source.experienceProvenance)) errors.push('source.experienceProvenance is required')
    if (typeof claim.source.significanceAssessmentId !== 'string' || claim.source.significanceAssessmentId.trim() === '') {
      errors.push('source.significanceAssessmentId is required')
    }
    if (typeof claim.source.significanceLevel !== 'string' || claim.source.significanceLevel.trim() === '') {
      errors.push('source.significanceLevel is required')
    }
    if (!Number.isFinite(claim.source.significanceConfidence)
      || claim.source.significanceConfidence < 0
      || claim.source.significanceConfidence > 1) {
      errors.push('source.significanceConfidence must be between 0 and 1')
    }
    if (!isRecord(claim.source.significanceProvenance)) errors.push('source.significanceProvenance is required')
  }

  return { valid: errors.length === 0, errors }
}

export function createCandidateClaim({
  experience,
  significanceAssessment,
  id = crypto.randomUUID(),
  createdAt = new Date().toISOString(),
  target = 'userModel',
  statement,
  confidence,
  provenance,
} = {}) {
  const experienceValidation = validateExperienceRecord(experience)
  if (!experienceValidation.valid) {
    throw new TypeError(`invalid experience record: ${experienceValidation.errors.join('; ')}`)
  }

  const assessmentValidation = validateSignificanceAssessment(significanceAssessment)
  if (!assessmentValidation.valid) {
    throw new TypeError(`invalid significance assessment: ${assessmentValidation.errors.join('; ')}`)
  }
  if (significanceAssessment.experienceId !== experience.id) {
    throw new TypeError('significance assessment experienceId must match experience.id')
  }
  if (significanceAssessment.recommendPromotion !== true) {
    throw new TypeError('candidate claim requires recommendPromotion=true')
  }
  if (!CANDIDATE_CLAIM_TARGETS.includes(target)) {
    throw new TypeError(`target must be one of: ${CANDIDATE_CLAIM_TARGETS.join(', ')}`)
  }
  nonEmptyBoundedString(statement, 'statement', CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH)
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new TypeError('confidence must be between 0 and 1')
  }
  if (!isRecord(provenance)) throw new TypeError('provenance is required')

  const claim = {
    version: CANDIDATE_CLAIM_VERSION,
    id,
    createdAt,
    target,
    statement,
    confidence,
    source: {
      experienceId: experience.id,
      experienceAt: experience.at,
      experienceKind: experience.kind,
      experienceProvenance: clone(experience.provenance),
      significanceAssessmentId: significanceAssessment.id,
      significanceLevel: significanceAssessment.level,
      significanceConfidence: significanceAssessment.confidence,
      significanceProvenance: clone(significanceAssessment.provenance),
    },
    provenance: clone(provenance),
    status: 'candidate',
    canonicalMutation: false,
  }

  const validation = validateCandidateClaim(claim)
  if (!validation.valid) {
    throw new TypeError(`invalid candidate claim: ${validation.errors.join('; ')}`)
  }

  return deepFreeze(clone(claim))
}
