import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  createLifecycleImportReconciliation,
  validateExodusCandidateClaim,
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

export async function reconcileLifecycleImportClaim({
  importDir,
  reviewDir,
  claimId,
  reconciliationId,
  targetPath,
  proposedValue,
  rationale,
  recordedBy,
  recordedAt,
}) {
  if (!importDir) throw new TypeError('importDir is required')
  if (!reviewDir) throw new TypeError('reviewDir is required')
  if (!claimId) throw new TypeError('claimId is required')

  const targetPathname = join(importDir, 'target.json')
  const baselinePathname = join(importDir, 'target-baseline.json')
  const claimsPathname = join(reviewDir, 'claims.json')
  const [targetBytes, baselineBytes, claimsBytes] = await Promise.all([
    readFile(targetPathname),
    readFile(baselinePathname),
    readFile(claimsPathname),
  ])

  const targetBinding = parseJson(targetBytes, 'target.json')
  const claims = normalizeClaims(parseJson(claimsBytes, 'claims.json'))
  const claim = claims.find((entry) => entry.id === claimId)
  if (!claim) throw new TypeError(`unknown claim: ${claimId}`)

  const reconciliation = createLifecycleImportReconciliation({
    id: reconciliationId,
    targetBinding,
    baselineBytes,
    claim,
    targetPath,
    proposedValue,
    rationale,
    recordedBy,
    recordedAt,
  })

  const reconciliationsDir = join(importDir, 'reconciliations')
  const reconciliationFile = join(reconciliationsDir, `${reconciliation.id}.json`)
  await mkdir(reconciliationsDir, { recursive: true })
  await writeFile(reconciliationFile, `${JSON.stringify(reconciliation, null, 2)}\n`, { flag: 'wx' })

  return {
    importDir,
    reviewDir,
    reconciliationFile,
    reconciliation,
    canonicalMutation: false,
    profileMutation: false,
  }
}
