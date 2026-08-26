import { appendTransition, validateSoulState } from './soul-state.js'

export const STATE_TRANSITION_PROPOSAL_VERSION = 1
export const STATE_TRANSITION_TARGETS = Object.freeze([
  'selfModel',
  'userModel',
  'relationship.state',
  'beliefs',
])
export const STATE_TRANSITION_DECISIONS = Object.freeze(['approved', 'rejected'])

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function validateStateTransitionProposal(proposal) {
  const errors = []

  if (!isRecord(proposal)) {
    return { valid: false, errors: ['proposal must be an object'] }
  }

  if (proposal.version !== STATE_TRANSITION_PROPOSAL_VERSION) {
    errors.push(`version must be ${STATE_TRANSITION_PROPOSAL_VERSION}`)
  }
  if (!proposal.id || typeof proposal.id !== 'string') errors.push('id is required')
  if (!proposal.at || typeof proposal.at !== 'string') errors.push('at is required')
  if (!STATE_TRANSITION_TARGETS.includes(proposal.target)) errors.push('target is not mutable through the generic transition pipeline')
  if (proposal.operation !== 'append') errors.push('operation must be append')
  if (!Object.prototype.hasOwnProperty.call(proposal, 'value')) errors.push('value is required')
  if (!proposal.reason || typeof proposal.reason !== 'string') errors.push('reason is required')
  if (!Array.isArray(proposal.evidence) || proposal.evidence.length === 0) errors.push('evidence must be a non-empty array')
  if (!isRecord(proposal.provenance)) errors.push('provenance is required')
  if (!Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1) {
    errors.push('confidence must be between 0 and 1')
  }
  if (!proposal.proposer || typeof proposal.proposer !== 'string') errors.push('proposer is required')

  if (proposal.review != null) {
    if (!isRecord(proposal.review)) {
      errors.push('review must be an object')
    } else {
      if (!STATE_TRANSITION_DECISIONS.includes(proposal.review.decision)) errors.push('review.decision is invalid')
      if (!proposal.review.reviewer || typeof proposal.review.reviewer !== 'string') errors.push('review.reviewer is required')
      if (!proposal.review.reason || typeof proposal.review.reason !== 'string') errors.push('review.reason is required')
      if (!proposal.review.at || typeof proposal.review.at !== 'string') errors.push('review.at is required')
      if (!isRecord(proposal.review.provenance)) errors.push('review.provenance is required')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function createStateTransitionProposal(input = {}) {
  if (!Object.prototype.hasOwnProperty.call(input, 'value')) {
    throw new TypeError('value is required')
  }

  const proposal = {
    version: STATE_TRANSITION_PROPOSAL_VERSION,
    id: input.id ?? crypto.randomUUID(),
    at: input.at ?? new Date().toISOString(),
    target: input.target,
    operation: input.operation ?? 'append',
    value: clone(input.value),
    reason: input.reason,
    evidence: clone(input.evidence),
    provenance: clone(input.provenance),
    confidence: input.confidence,
    proposer: input.proposer,
    review: null,
  }

  const validation = validateStateTransitionProposal(proposal)
  if (!validation.valid) {
    throw new TypeError(`invalid state transition proposal: ${validation.errors.join('; ')}`)
  }

  return proposal
}

export function reviewStateTransitionProposal(proposal, {
  decision,
  reviewer,
  reason,
  provenance,
  at = new Date().toISOString(),
} = {}) {
  const validation = validateStateTransitionProposal(proposal)
  if (!validation.valid) {
    throw new TypeError(`invalid state transition proposal: ${validation.errors.join('; ')}`)
  }
  if (proposal.review != null) {
    throw new TypeError('proposal has already been reviewed')
  }

  const reviewed = clone(proposal)
  reviewed.review = { decision, reviewer, reason, provenance: clone(provenance), at }

  const reviewedValidation = validateStateTransitionProposal(reviewed)
  if (!reviewedValidation.valid) {
    throw new TypeError(`invalid state transition review: ${reviewedValidation.errors.join('; ')}`)
  }

  return reviewed
}

function mutableTarget(state, target) {
  switch (target) {
    case 'selfModel': return state.selfModel
    case 'userModel': return state.userModel
    case 'beliefs': return state.beliefs
    case 'relationship.state': return state.relationship.state
    default: throw new TypeError('target is not mutable through the generic transition pipeline')
  }
}

export function applyStateTransitionProposal(state, proposal) {
  const stateValidation = validateSoulState(state)
  if (!stateValidation.valid) {
    throw new TypeError(`invalid Soul state: ${stateValidation.errors.join('; ')}`)
  }

  const proposalValidation = validateStateTransitionProposal(proposal)
  if (!proposalValidation.valid) {
    throw new TypeError(`invalid state transition proposal: ${proposalValidation.errors.join('; ')}`)
  }
  if (proposal.review == null) throw new TypeError('proposal must be reviewed before application')
  if (proposal.review.decision !== 'approved') throw new TypeError('only approved proposals may be applied')

  const next = clone(state)
  mutableTarget(next, proposal.target).push(clone(proposal.value))

  return appendTransition(next, {
    kind: 'governed-state-transition',
    reason: proposal.reason,
    provenance: {
      proposalId: proposal.id,
      proposal: clone(proposal.provenance),
      evidence: clone(proposal.evidence),
      review: {
        reviewer: proposal.review.reviewer,
        at: proposal.review.at,
        reason: proposal.review.reason,
        provenance: clone(proposal.review.provenance),
      },
    },
    change: {
      target: proposal.target,
      operation: proposal.operation,
      value: clone(proposal.value),
      confidence: proposal.confidence,
      proposer: proposal.proposer,
    },
  })
}
