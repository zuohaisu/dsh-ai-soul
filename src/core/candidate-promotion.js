import { validateCandidateClaim } from './candidate-claim.js'
import { createStateTransitionProposal } from './state-transition.js'

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function createCandidatePromotionProposal(candidate, {
  id,
  at,
  reason,
  proposer,
  provenance,
} = {}) {
  const validation = validateCandidateClaim(candidate)
  if (!validation.valid) {
    throw new TypeError(`invalid candidate claim: ${validation.errors.join('; ')}`)
  }
  if (candidate.status !== 'candidate' || candidate.canonicalMutation !== false) {
    throw new TypeError('candidate claim must remain non-authoritative')
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new TypeError('reason is required')
  }
  if (typeof proposer !== 'string' || proposer.trim() === '') {
    throw new TypeError('proposer is required')
  }
  if (!isRecord(provenance)) {
    throw new TypeError('provenance is required')
  }

  return createStateTransitionProposal({
    id,
    at,
    target: candidate.target,
    operation: 'append',
    value: {
      claim: candidate.statement,
    },
    reason,
    evidence: [{
      type: 'candidate-claim-v1',
      id: candidate.id,
      createdAt: candidate.createdAt,
      target: candidate.target,
      source: clone(candidate.source),
      provenance: clone(candidate.provenance),
    }],
    provenance: {
      ...clone(provenance),
      candidateClaimId: candidate.id,
      experienceId: candidate.source.experienceId,
      significanceAssessmentId: candidate.source.significanceAssessmentId,
    },
    confidence: candidate.confidence,
    proposer,
  })
}
