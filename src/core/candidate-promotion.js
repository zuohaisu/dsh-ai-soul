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
  operation = 'append',
  previousValue,
  previousValues,
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
  if (!['append', 'replace', 'retire', 'consolidate'].includes(operation)) {
    throw new TypeError('candidate promotion operation must be append, replace, retire, or consolidate')
  }
  if ((operation === 'replace' || operation === 'retire') && !isRecord(previousValue)) {
    throw new TypeError('previousValue is required for candidate replacement or retirement')
  }
  if (operation !== 'replace' && operation !== 'retire' && previousValue !== undefined) {
    throw new TypeError('previousValue is only valid for candidate replacement or retirement')
  }
  if (operation === 'consolidate' && (!Array.isArray(previousValues) || previousValues.length < 2)) {
    throw new TypeError('previousValues must contain at least two values for candidate consolidation')
  }
  if (operation !== 'consolidate' && previousValues !== undefined) {
    throw new TypeError('previousValues is only valid for candidate consolidation')
  }

  return createStateTransitionProposal({
    id,
    at,
    target: candidate.target,
    operation,
    ...((operation === 'replace' || operation === 'retire') ? { previousValue: clone(previousValue) } : {}),
    ...(operation === 'consolidate' ? { previousValues: clone(previousValues) } : {}),
    ...(operation === 'retire' ? {} : { value: { claim: candidate.statement } }),
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
