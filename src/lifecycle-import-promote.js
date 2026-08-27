import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  createExodusPromotionProposal,
  validateExodusCandidateClaim,
  validateExodusReviewWorkspace,
  validateStateTransitionProposal,
} from './core/index.js'

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new TypeError(`${label} must contain valid JSON: ${error.message}`)
  }
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  return value
}

function normalizeClaims(document) {
  const claims = Array.isArray(document) ? document : document?.claims
  if (!Array.isArray(claims) || claims.length === 0) {
    throw new TypeError('claims.json must contain a non-empty claims array')
  }
  for (const claim of claims) {
    const validation = validateExodusCandidateClaim(claim)
    if (!validation.valid) throw new TypeError(`invalid Exodus candidate claim: ${validation.errors.join('; ')}`)
  }
  return claims
}

function validateTargetBinding(target) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    throw new TypeError('target.json must contain a target binding object')
  }
  if (target.bindingVersion !== 1) throw new TypeError('target.json bindingVersion must be 1')
  nonEmptyString(target.targetSoulId, 'target.json targetSoulId')
  if (!target.baseline || typeof target.baseline !== 'object' || Array.isArray(target.baseline)) {
    throw new TypeError('target.json baseline is required')
  }
  if (target.baseline.algorithm !== 'sha256') throw new TypeError('target.json baseline algorithm must be sha256')
  nonEmptyString(target.baseline.digest, 'target.json baseline digest')
  nonEmptyString(target.baseline.capturedAt, 'target.json baseline capturedAt')
  if (target.canonicalMutation !== false) throw new TypeError('target.json must retain canonicalMutation: false')
  return target
}

export async function createLifecycleImportPromotionProposal({
  importDir,
  reviewDir,
  claimId,
  target,
  path,
  value,
  proposer,
  proposalId,
  at,
}) {
  if (!importDir) throw new TypeError('importDir is required')
  if (!reviewDir) throw new TypeError('reviewDir is required')

  const [targetBytes, claimsBytes, workspaceBytes] = await Promise.all([
    readFile(join(importDir, 'target.json')),
    readFile(join(reviewDir, 'claims.json')),
    readFile(join(reviewDir, 'review-workspace.json')),
  ])

  const targetBinding = validateTargetBinding(parseJson(targetBytes, 'target.json'))
  const claims = normalizeClaims(parseJson(claimsBytes, 'claims.json'))
  const workspace = parseJson(workspaceBytes, 'review-workspace.json')
  const workspaceValidation = validateExodusReviewWorkspace(workspace)
  if (!workspaceValidation.valid) {
    throw new TypeError(`invalid Exodus review workspace: ${workspaceValidation.errors.join('; ')}`)
  }

  const proposal = createExodusPromotionProposal({
    workspace,
    claims,
    claimId: nonEmptyString(claimId, 'claimId'),
    targetMapping: {
      target: nonEmptyString(target, 'target'),
      path: nonEmptyString(path, 'path'),
      value,
    },
    proposer: nonEmptyString(proposer, 'proposer'),
    proposalId: nonEmptyString(proposalId, 'proposalId'),
    at,
  })

  const lifecycleProposal = structuredClone(proposal)
  lifecycleProposal.provenance.lifecycleImportTarget = {
    targetSoulId: targetBinding.targetSoulId,
    baseline: structuredClone(targetBinding.baseline),
  }
  lifecycleProposal.provenance.canonicalMutation = false
  lifecycleProposal.provenance.profileMutation = false

  const proposalValidation = validateStateTransitionProposal(lifecycleProposal)
  if (!proposalValidation.valid) {
    throw new TypeError(`invalid lifecycle import promotion proposal: ${proposalValidation.errors.join('; ')}`)
  }

  const proposalsDir = join(importDir, 'proposals')
  const proposalFile = join(proposalsDir, `${lifecycleProposal.id}.json`)
  await mkdir(proposalsDir, { recursive: true })
  await writeFile(proposalFile, `${JSON.stringify(lifecycleProposal, null, 2)}\n`, { flag: 'wx', mode: 0o600 })

  return {
    importDir,
    reviewDir,
    proposalFile,
    proposal: lifecycleProposal,
    canonicalMutation: false,
    profileMutation: false,
  }
}
