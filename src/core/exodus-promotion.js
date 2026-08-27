import { createStateTransitionProposal, STATE_TRANSITION_TARGETS } from './state-transition.js'
import { validateExodusCandidateClaim } from './exodus-candidate-claim.js'
import {
  getExodusClaimReviewState,
  validateExodusReviewWorkspace,
} from './exodus-review-workspace.js'

function clone(value) {
  return structuredClone(value)
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  return value
}

function validateClaim(claim) {
  const result = validateExodusCandidateClaim(claim)
  if (!result.valid) {
    throw new TypeError(`invalid Exodus candidate claim: ${result.errors.join('; ')}`)
  }
}

function validateWorkspace(workspace) {
  const result = validateExodusReviewWorkspace(workspace)
  if (!result.valid) {
    throw new TypeError(`invalid Exodus review workspace: ${result.errors.join('; ')}`)
  }
}

function latestDecision(workspace, claimId) {
  const indexed = workspace.decisions
    .map((decision, index) => ({ decision, index }))
    .filter(({ decision }) => decision.claimId === claimId)
  return indexed.length === 0 ? null : indexed.at(-1)
}

function unresolvedConflicts(workspace, claimId) {
  return workspace.relationships.filter((relationship) => (
    relationship.relationship === 'conflict'
    && (relationship.leftClaimId === claimId || relationship.rightClaimId === claimId)
  ))
}

function normalizeTargetMapping(mapping) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new TypeError('targetMapping must be an object')
  }
  const target = nonEmptyString(mapping.target, 'targetMapping.target')
  const path = nonEmptyString(mapping.path, 'targetMapping.path')
  if (!STATE_TRANSITION_TARGETS.includes(target)) {
    throw new TypeError('targetMapping.target is not mutable through the generic transition pipeline')
  }
  if (path !== target) {
    throw new TypeError('targetMapping.path must explicitly match the selected mutable target')
  }
  if (!Object.prototype.hasOwnProperty.call(mapping, 'value')) {
    throw new TypeError('targetMapping.value is required')
  }
  return { target, path, value: clone(mapping.value) }
}

export function createExodusPromotionProposal({
  workspace,
  claims,
  claimId,
  targetMapping,
  proposer,
  proposalId,
  at,
}) {
  validateWorkspace(workspace)
  if (!Array.isArray(claims) || claims.length === 0) {
    throw new TypeError('claims must be a non-empty array')
  }
  const claimById = new Map()
  for (const claim of claims) {
    validateClaim(claim)
    if (claimById.has(claim.id)) throw new TypeError(`duplicate claim id: ${claim.id}`)
    claimById.set(claim.id, claim)
  }

  const id = nonEmptyString(claimId, 'claimId')
  if (!workspace.claimIds.includes(id)) throw new TypeError(`workspace references no claim: ${id}`)
  const claim = claimById.get(id)
  if (!claim) throw new TypeError(`unknown claim: ${id}`)

  const state = getExodusClaimReviewState(workspace, id)
  if (state !== 'accepted-for-promotion') {
    throw new TypeError(`claim ${id} is not accepted-for-promotion (latest state: ${state})`)
  }

  const review = latestDecision(workspace, id)
  if (!review) throw new TypeError(`claim ${id} has no review decision`)

  const conflicts = unresolvedConflicts(workspace, id)
  if (conflicts.length > 0) {
    throw new TypeError(`claim ${id} has unresolved declared conflict and cannot generate an overwrite-capable promotion proposal`)
  }

  const mapping = normalizeTargetMapping(targetMapping)
  const proposalReason = [
    `Generic Exodus promotion of reviewed candidate claim ${claim.id}.`,
    `Claim: ${claim.statement}`,
    `Review rationale: ${review.decision.rationale}`,
    `Target mapping was explicitly supplied by the caller as ${mapping.path}.`,
  ].join(' ')

  return createStateTransitionProposal({
    id: proposalId,
    at,
    target: mapping.target,
    operation: 'append',
    value: mapping.value,
    reason: proposalReason,
    evidence: claim.evidence.map((entry) => ({
      kind: 'exodus-source-evidence',
      ...clone(entry),
    })),
    provenance: {
      kind: 'generic-exodus-promotion',
      workspace: {
        id: workspace.id,
        createdAt: workspace.createdAt,
        createdBy: workspace.createdBy,
      },
      reviewDecision: {
        index: review.index,
        claimId: review.decision.claimId,
        state: review.decision.state,
        reviewer: review.decision.reviewer,
        reviewedAt: review.decision.reviewedAt,
        rationale: review.decision.rationale,
      },
      candidateClaim: {
        id: claim.id,
        claimType: claim.claimType,
        statement: claim.statement,
        interpretation: claim.interpretation,
        confidence: clone(claim.confidence),
        counterEvidence: clone(claim.counterEvidence),
        runtimePhenotypeRisk: claim.runtimePhenotypeRisk,
      },
      targetMapping: {
        target: mapping.target,
        path: mapping.path,
      },
      canonicalMutation: false,
    },
    confidence: claim.confidence.score,
    proposer: nonEmptyString(proposer, 'proposer'),
  })
}
