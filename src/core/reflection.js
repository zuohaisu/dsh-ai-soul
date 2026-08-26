import { validateStateTransitionProposal } from './state-transition.js'

export const REFLECTION_RESULT_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function validateSourceRef(source, index) {
  const errors = []
  if (!isRecord(source)) return [`sources[${index}] must be an object`]
  if (!source.experienceId || typeof source.experienceId !== 'string') {
    errors.push(`sources[${index}].experienceId is required`)
  }
  if (source.significanceAssessmentId != null && typeof source.significanceAssessmentId !== 'string') {
    errors.push(`sources[${index}].significanceAssessmentId must be a string`)
  }
  if (!isRecord(source.provenance)) errors.push(`sources[${index}].provenance is required`)
  return errors
}

export function validateReflectionResult(result) {
  const errors = []

  if (!isRecord(result)) {
    return { valid: false, errors: ['reflection result must be an object'] }
  }

  if (result.version !== REFLECTION_RESULT_VERSION) errors.push(`version must be ${REFLECTION_RESULT_VERSION}`)
  if (!result.id || typeof result.id !== 'string') errors.push('id is required')
  if (!result.at || typeof result.at !== 'string') errors.push('at is required')

  if (!Array.isArray(result.sources) || result.sources.length === 0) {
    errors.push('sources must be a non-empty array')
  } else {
    result.sources.forEach((source, index) => errors.push(...validateSourceRef(source, index)))
  }

  if (!Array.isArray(result.observations)) errors.push('observations must be an array')
  if (!Array.isArray(result.proposals)) {
    errors.push('proposals must be an array')
  } else {
    result.proposals.forEach((proposal, index) => {
      const validation = validateStateTransitionProposal(proposal)
      if (!validation.valid) {
        errors.push(`proposals[${index}] is invalid: ${validation.errors.join('; ')}`)
      } else if (proposal.review != null) {
        errors.push(`proposals[${index}] must be unreviewed`)
      }
    })
  }

  if (!isRecord(result.provenance)) errors.push('provenance is required')

  return { valid: errors.length === 0, errors }
}

export function createReflectionResult({
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  sources,
  observations = [],
  proposals = [],
  provenance,
} = {}) {
  const result = {
    version: REFLECTION_RESULT_VERSION,
    id,
    at,
    sources: clone(sources),
    observations: clone(observations),
    proposals: clone(proposals),
    provenance: clone(provenance),
  }

  const validation = validateReflectionResult(result)
  if (!validation.valid) {
    throw new TypeError(`invalid reflection result: ${validation.errors.join('; ')}`)
  }

  return result
}
