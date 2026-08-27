import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'

import { validateExodusCandidateClaim } from './exodus-candidate-claim.js'
import { validateSoulState } from './soul-state.js'

export const LIFECYCLE_IMPORT_RECONCILIATION_VERSION = 1
export const LIFECYCLE_IMPORT_COMPARISON_STATES = Object.freeze([
  'absent',
  'equal',
  'different',
])

function clone(value) {
  return value === undefined ? undefined : structuredClone(value)
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

function normalizePath(targetPath) {
  if (!Array.isArray(targetPath) || targetPath.length === 0) {
    throw new TypeError('targetPath must be a non-empty array')
  }
  return targetPath.map((segment, index) => {
    if (typeof segment === 'string' && segment.trim() !== '') return segment
    if (Number.isInteger(segment) && segment >= 0) return segment
    throw new TypeError(`targetPath[${index}] must be a non-empty string or non-negative integer`)
  })
}

function resolvePath(root, path) {
  let current = root
  for (const segment of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return { found: false, value: undefined }
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return { found: false, value: undefined }
    }
    current = current[segment]
  }
  return { found: true, value: current }
}

function parseAndVerifyBaseline(targetBinding, baselineBytes) {
  if (!targetBinding || typeof targetBinding !== 'object') {
    throw new TypeError('targetBinding is required')
  }
  nonEmptyString(targetBinding.targetSoulId, 'targetBinding.targetSoulId')
  if (targetBinding.canonicalMutation !== false) {
    throw new TypeError('targetBinding must have canonicalMutation=false')
  }
  if (targetBinding.baseline?.algorithm !== 'sha256') {
    throw new TypeError('targetBinding.baseline.algorithm must be sha256')
  }
  const expectedDigest = nonEmptyString(targetBinding.baseline?.digest, 'targetBinding.baseline.digest')
  if (!Buffer.isBuffer(baselineBytes) && !(baselineBytes instanceof Uint8Array)) {
    throw new TypeError('baselineBytes must be Buffer or Uint8Array')
  }
  const actualDigest = createHash('sha256').update(baselineBytes).digest('hex')
  if (actualDigest !== expectedDigest) {
    throw new TypeError('target baseline digest does not match target binding')
  }

  let baseline
  try {
    baseline = JSON.parse(Buffer.from(baselineBytes).toString('utf8'))
  } catch {
    throw new TypeError('target baseline must contain valid JSON')
  }
  const validation = validateSoulState(baseline)
  if (!validation.valid) {
    throw new TypeError(`invalid target baseline Soul state: ${validation.errors.join('; ')}`)
  }
  if (baseline.soulId !== targetBinding.targetSoulId) {
    throw new TypeError('target baseline soulId does not match target binding')
  }
  return baseline
}

export function createLifecycleImportReconciliation({
  id,
  targetBinding,
  baselineBytes,
  claim,
  targetPath,
  proposedValue,
  rationale,
  recordedBy,
  recordedAt = new Date().toISOString(),
}) {
  const claimValidation = validateExodusCandidateClaim(claim)
  if (!claimValidation.valid) {
    throw new TypeError(`invalid candidate claim: ${claimValidation.errors.join('; ')}`)
  }
  const baseline = parseAndVerifyBaseline(targetBinding, baselineBytes)
  const path = normalizePath(targetPath)
  const resolved = resolvePath(baseline, path)
  const comparison = !resolved.found
    ? 'absent'
    : isDeepStrictEqual(resolved.value, proposedValue)
      ? 'equal'
      : 'different'

  const record = {
    reconciliationVersion: LIFECYCLE_IMPORT_RECONCILIATION_VERSION,
    id: nonEmptyString(id, 'id'),
    targetSoulId: targetBinding.targetSoulId,
    baseline: {
      algorithm: 'sha256',
      digest: targetBinding.baseline.digest,
      capturedAt: targetBinding.baseline.capturedAt ?? null,
    },
    claimId: claim.id,
    targetPath: path,
    baselineValue: resolved.found ? clone(resolved.value) : null,
    baselineValuePresent: resolved.found,
    proposedValue: clone(proposedValue),
    comparison,
    rationale: nonEmptyString(rationale, 'rationale'),
    provenance: {
      recordedBy: nonEmptyString(recordedBy, 'recordedBy'),
      recordedAt: nonEmptyString(recordedAt, 'recordedAt'),
      claimEvidence: clone(claim.evidence),
    },
    canonicalMutation: false,
  }

  return deepFreeze(record)
}

export function validateLifecycleImportReconciliation(record) {
  const errors = []
  if (!record || typeof record !== 'object') return { valid: false, errors: ['record must be an object'] }
  if (record.reconciliationVersion !== LIFECYCLE_IMPORT_RECONCILIATION_VERSION) errors.push(`reconciliationVersion must be ${LIFECYCLE_IMPORT_RECONCILIATION_VERSION}`)
  for (const field of ['id', 'targetSoulId', 'claimId', 'rationale']) {
    if (typeof record[field] !== 'string' || record[field].trim() === '') errors.push(`${field} is required`)
  }
  if (!LIFECYCLE_IMPORT_COMPARISON_STATES.includes(record.comparison)) errors.push('comparison is invalid')
  if (!Array.isArray(record.targetPath) || record.targetPath.length === 0) errors.push('targetPath must be a non-empty array')
  if (record.baseline?.algorithm !== 'sha256' || typeof record.baseline?.digest !== 'string' || record.baseline.digest.trim() === '') errors.push('baseline digest is required')
  if (typeof record.provenance?.recordedBy !== 'string' || record.provenance.recordedBy.trim() === '') errors.push('provenance.recordedBy is required')
  if (typeof record.provenance?.recordedAt !== 'string' || record.provenance.recordedAt.trim() === '') errors.push('provenance.recordedAt is required')
  if (record.canonicalMutation !== false) errors.push('canonicalMutation must remain false')
  return { valid: errors.length === 0, errors }
}
