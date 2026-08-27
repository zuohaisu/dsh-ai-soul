import { randomUUID } from 'node:crypto'
import { basename, dirname, join } from 'node:path'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'

import {
  addExodusClaimRelationship,
  appendExodusReconciliationReview,
  appendExodusReviewDecision,
  validateExodusCandidateClaim,
  validateExodusReviewWorkspace,
  validateLifecycleImportReconciliation,
} from './core/index.js'

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new TypeError(`${label} must contain valid JSON: ${error.message}`)
  }
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

async function atomicReplaceJson(path, value) {
  const parent = dirname(path)
  await mkdir(parent, { recursive: true })
  const staging = join(parent, `.${basename(path)}.staging-${randomUUID()}`)
  const backup = join(parent, `.${basename(path)}.backup-${randomUUID()}`)
  await writeFile(staging, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
  await rename(path, backup)
  try {
    await rename(staging, path)
    await rm(backup, { force: true })
  } catch (error) {
    await rm(staging, { force: true })
    await rename(backup, path)
    throw error
  }
}

export async function updateExodusReviewWorkspace({ reviewDir, operation }) {
  if (!reviewDir) throw new TypeError('reviewDir is required')
  if (!operation || typeof operation !== 'object') throw new TypeError('operation is required')

  const claimsPath = join(reviewDir, 'claims.json')
  const workspacePath = join(reviewDir, 'review-workspace.json')
  const [claimsBytes, workspaceBytes] = await Promise.all([readFile(claimsPath), readFile(workspacePath)])
  const claims = normalizeClaims(parseJson(claimsBytes, 'claims.json'))
  const workspace = parseJson(workspaceBytes, 'review-workspace.json')
  const validation = validateExodusReviewWorkspace(workspace)
  if (!validation.valid) throw new TypeError(`invalid Exodus review workspace: ${validation.errors.join('; ')}`)

  let updated
  if (operation.type === 'relationship') {
    updated = addExodusClaimRelationship(workspace, claims, operation.value)
  } else if (operation.type === 'decision') {
    updated = appendExodusReviewDecision(workspace, claims, operation.value)
  } else if (operation.type === 'reconciliation-review') {
    if (!operation.reconciliationFile) throw new TypeError('operation.reconciliationFile is required')
    const reconciliation = parseJson(await readFile(operation.reconciliationFile), 'reconciliation file')
    const reconciliationValidation = validateLifecycleImportReconciliation(reconciliation)
    if (!reconciliationValidation.valid) {
      throw new TypeError(`invalid lifecycle import reconciliation: ${reconciliationValidation.errors.join('; ')}`)
    }
    updated = appendExodusReconciliationReview(workspace, claims, reconciliation, operation.value)
  } else {
    throw new TypeError('operation.type must be relationship, decision, or reconciliation-review')
  }

  await atomicReplaceJson(workspacePath, updated)
  return { reviewDir, workspaceFile: workspacePath, workspace: updated, canonicalMutation: false, profileMutation: false }
}
