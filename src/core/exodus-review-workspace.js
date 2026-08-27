import { validateExodusCandidateClaim } from './exodus-candidate-claim.js'
import { validateLifecycleImportReconciliation } from './lifecycle-import-reconciliation.js'

export const EXODUS_REVIEW_WORKSPACE_VERSION = 1
export const EXODUS_REVIEW_STATES = Object.freeze([
  'unreviewed',
  'accepted-for-promotion',
  'rejected',
  'needs-more-evidence',
])
export const EXODUS_CLAIM_RELATIONSHIPS = Object.freeze(['conflict', 'coexistence'])
export const EXODUS_RECONCILIATION_DISPOSITIONS = Object.freeze([
  'conflict',
  'coexistence',
  'uncertain',
  'not-applicable',
])

function deepClone(value) {
  return structuredClone(value)
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  return value
}

function validateClaim(claim) {
  const result = validateExodusCandidateClaim(claim)
  if (!result.valid) throw new TypeError(`invalid Exodus candidate claim: ${result.errors.join('; ')}`)
  return claim
}

function claimIndex(claims) {
  const index = new Map()
  for (const claim of claims) {
    validateClaim(claim)
    if (index.has(claim.id)) throw new TypeError(`duplicate claim id: ${claim.id}`)
    index.set(claim.id, claim)
  }
  return index
}

export function createExodusReviewWorkspace({ id, claims, createdAt, createdBy }) {
  if (!Array.isArray(claims) || claims.length === 0) {
    throw new TypeError('claims must be a non-empty array')
  }
  claimIndex(claims)

  return deepFreeze(deepClone({
    workspaceVersion: EXODUS_REVIEW_WORKSPACE_VERSION,
    id: nonEmptyString(id, 'id'),
    createdAt: nonEmptyString(createdAt, 'createdAt'),
    createdBy: nonEmptyString(createdBy, 'createdBy'),
    claimIds: claims.map((claim) => claim.id),
    relationships: [],
    decisions: [],
    reconciliationReviews: [],
    canonicalMutation: false,
  }))
}

function validateWorkspaceAndClaims(workspace, claims) {
  const validation = validateExodusReviewWorkspace(workspace)
  if (!validation.valid) throw new TypeError(`invalid Exodus review workspace: ${validation.errors.join('; ')}`)
  const index = claimIndex(claims)
  for (const claimId of workspace.claimIds) {
    if (!index.has(claimId)) throw new TypeError(`workspace references unknown claim: ${claimId}`)
  }
  return index
}

export function addExodusClaimRelationship(workspace, claims, {
  leftClaimId,
  rightClaimId,
  relationship,
  recordedBy,
  recordedAt,
  rationale,
}) {
  const index = validateWorkspaceAndClaims(workspace, claims)
  nonEmptyString(leftClaimId, 'leftClaimId')
  nonEmptyString(rightClaimId, 'rightClaimId')
  if (leftClaimId === rightClaimId) throw new TypeError('claim relationship must reference two different claims')
  if (!index.has(leftClaimId)) throw new TypeError(`unknown left claim: ${leftClaimId}`)
  if (!index.has(rightClaimId)) throw new TypeError(`unknown right claim: ${rightClaimId}`)
  if (!EXODUS_CLAIM_RELATIONSHIPS.includes(relationship)) {
    throw new TypeError(`relationship must be one of: ${EXODUS_CLAIM_RELATIONSHIPS.join(', ')}`)
  }

  const record = {
    leftClaimId,
    rightClaimId,
    relationship,
    recordedBy: nonEmptyString(recordedBy, 'recordedBy'),
    recordedAt: nonEmptyString(recordedAt, 'recordedAt'),
    rationale: nonEmptyString(rationale, 'rationale'),
  }

  return deepFreeze(deepClone({
    ...workspace,
    relationships: [...workspace.relationships, record],
    canonicalMutation: false,
  }))
}

export function appendExodusReviewDecision(workspace, claims, {
  claimId,
  state,
  reviewer,
  reviewedAt,
  rationale,
}) {
  const index = validateWorkspaceAndClaims(workspace, claims)
  nonEmptyString(claimId, 'claimId')
  if (!index.has(claimId)) throw new TypeError(`unknown claim: ${claimId}`)
  if (!EXODUS_REVIEW_STATES.includes(state)) {
    throw new TypeError(`state must be one of: ${EXODUS_REVIEW_STATES.join(', ')}`)
  }

  const decision = {
    claimId,
    state,
    reviewer: nonEmptyString(reviewer, 'reviewer'),
    reviewedAt: nonEmptyString(reviewedAt, 'reviewedAt'),
    rationale: nonEmptyString(rationale, 'rationale'),
  }

  return deepFreeze(deepClone({
    ...workspace,
    decisions: [...workspace.decisions, decision],
    canonicalMutation: false,
  }))
}

export function appendExodusReconciliationReview(workspace, claims, reconciliation, {
  disposition,
  reviewer,
  reviewedAt,
  rationale,
}) {
  const index = validateWorkspaceAndClaims(workspace, claims)
  const reconciliationValidation = validateLifecycleImportReconciliation(reconciliation)
  if (!reconciliationValidation.valid) {
    throw new TypeError(`invalid lifecycle import reconciliation: ${reconciliationValidation.errors.join('; ')}`)
  }
  if (!index.has(reconciliation.claimId)) {
    throw new TypeError(`reconciliation references unknown claim: ${reconciliation.claimId}`)
  }
  if (!EXODUS_RECONCILIATION_DISPOSITIONS.includes(disposition)) {
    throw new TypeError(`disposition must be one of: ${EXODUS_RECONCILIATION_DISPOSITIONS.join(', ')}`)
  }

  const priorReviews = workspace.reconciliationReviews ?? []
  for (const prior of priorReviews) {
    if (prior.targetSoulId !== reconciliation.targetSoulId) {
      throw new TypeError('reconciliation target Soul does not match existing review context')
    }
    if (prior.baseline?.algorithm !== reconciliation.baseline.algorithm || prior.baseline?.digest !== reconciliation.baseline.digest) {
      throw new TypeError('reconciliation baseline does not match existing review context')
    }
  }

  const record = {
    reconciliationId: reconciliation.id,
    claimId: reconciliation.claimId,
    targetSoulId: reconciliation.targetSoulId,
    baseline: deepClone(reconciliation.baseline),
    targetPath: deepClone(reconciliation.targetPath),
    comparison: reconciliation.comparison,
    disposition,
    reviewer: nonEmptyString(reviewer, 'reviewer'),
    reviewedAt: nonEmptyString(reviewedAt, 'reviewedAt'),
    rationale: nonEmptyString(rationale, 'rationale'),
  }

  return deepFreeze(deepClone({
    ...workspace,
    reconciliationReviews: [...priorReviews, record],
    canonicalMutation: false,
  }))
}

export function getExodusClaimReviewState(workspace, claimId) {
  nonEmptyString(claimId, 'claimId')
  if (!workspace.claimIds?.includes(claimId)) throw new TypeError(`workspace references no claim: ${claimId}`)
  const decisions = workspace.decisions.filter((entry) => entry.claimId === claimId)
  return decisions.length === 0 ? 'unreviewed' : decisions.at(-1).state
}

export function validateExodusReviewWorkspace(workspace) {
  const errors = []
  if (!workspace || typeof workspace !== 'object') return { valid: false, errors: ['workspace must be an object'] }
  if (workspace.workspaceVersion !== EXODUS_REVIEW_WORKSPACE_VERSION) errors.push(`workspaceVersion must be ${EXODUS_REVIEW_WORKSPACE_VERSION}`)
  for (const field of ['id', 'createdAt', 'createdBy']) {
    if (typeof workspace[field] !== 'string' || workspace[field].trim() === '') errors.push(`${field} must be a non-empty string`)
  }
  if (!Array.isArray(workspace.claimIds) || workspace.claimIds.length === 0) errors.push('claimIds must be a non-empty array')
  if (Array.isArray(workspace.claimIds) && new Set(workspace.claimIds).size !== workspace.claimIds.length) errors.push('claimIds must be unique')
  if (!Array.isArray(workspace.relationships)) errors.push('relationships must be an array')
  if (!Array.isArray(workspace.decisions)) errors.push('decisions must be an array')
  if (workspace.reconciliationReviews !== undefined && !Array.isArray(workspace.reconciliationReviews)) errors.push('reconciliationReviews must be an array when present')
  if (workspace.canonicalMutation !== false) errors.push('canonicalMutation must remain false')

  for (const [index, entry] of (Array.isArray(workspace.relationships) ? workspace.relationships : []).entries()) {
    if (!workspace.claimIds?.includes(entry.leftClaimId)) errors.push(`relationships[${index}].leftClaimId is unknown`)
    if (!workspace.claimIds?.includes(entry.rightClaimId)) errors.push(`relationships[${index}].rightClaimId is unknown`)
    if (entry.leftClaimId === entry.rightClaimId) errors.push(`relationships[${index}] must reference different claims`)
    if (!EXODUS_CLAIM_RELATIONSHIPS.includes(entry.relationship)) errors.push(`relationships[${index}].relationship is invalid`)
    for (const field of ['recordedBy', 'recordedAt', 'rationale']) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') errors.push(`relationships[${index}].${field} is required`)
    }
  }

  for (const [index, entry] of (Array.isArray(workspace.decisions) ? workspace.decisions : []).entries()) {
    if (!workspace.claimIds?.includes(entry.claimId)) errors.push(`decisions[${index}].claimId is unknown`)
    if (!EXODUS_REVIEW_STATES.includes(entry.state)) errors.push(`decisions[${index}].state is invalid`)
    for (const field of ['reviewer', 'reviewedAt', 'rationale']) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') errors.push(`decisions[${index}].${field} is required`)
    }
  }

  for (const [index, entry] of (Array.isArray(workspace.reconciliationReviews) ? workspace.reconciliationReviews : []).entries()) {
    if (!workspace.claimIds?.includes(entry.claimId)) errors.push(`reconciliationReviews[${index}].claimId is unknown`)
    for (const field of ['reconciliationId', 'targetSoulId', 'reviewer', 'reviewedAt', 'rationale']) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') errors.push(`reconciliationReviews[${index}].${field} is required`)
    }
    if (entry.baseline?.algorithm !== 'sha256' || typeof entry.baseline?.digest !== 'string' || entry.baseline.digest.trim() === '') {
      errors.push(`reconciliationReviews[${index}].baseline digest is required`)
    }
    if (!Array.isArray(entry.targetPath) || entry.targetPath.length === 0) errors.push(`reconciliationReviews[${index}].targetPath is required`)
    if (!['absent', 'equal', 'different'].includes(entry.comparison)) errors.push(`reconciliationReviews[${index}].comparison is invalid`)
    if (!EXODUS_RECONCILIATION_DISPOSITIONS.includes(entry.disposition)) errors.push(`reconciliationReviews[${index}].disposition is invalid`)
  }

  return { valid: errors.length === 0, errors }
}
