const SURFACES = new Set(['tui', 'web'])

function requiredString(record, key) {
  const value = record?.[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${key} must be a non-empty string`)
  }
  return value.trim()
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function normalizeSurface(record, key) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError(`${key} must be an object`)
  }
  const surface = requiredString(record, 'surface').toLowerCase()
  if (!SURFACES.has(surface)) throw new TypeError(`${key}.surface must be one of: tui, web`)
  return {
    surface,
    profile: requiredString(record, 'profile'),
    runtime: requiredString(record, 'runtime'),
    dshVersion: requiredString(record, 'dshVersion'),
    soulId: requiredString(record, 'soulId'),
    storeAnchor: requiredString(record, 'storeAnchor'),
  }
}

export function evaluateCrossSurfaceRuntimeEvidence(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('cross-surface runtime evidence must be an object')
  }

  const source = normalizeSurface(record.source, 'source')
  const target = normalizeSurface(record.target, 'target')
  const missing = []
  const failures = []
  const checks = {}

  if (source.surface === target.surface) failures.push('surfaceBoundary.sourceAndTargetMustDiffer')
  if (source.soulId !== target.soulId) failures.push('continuity.sameSoulId')
  if (source.storeAnchor !== target.storeAnchor) failures.push('continuity.sameStoreAnchor')

  const observations = record.observations
  if (!observations || typeof observations !== 'object' || Array.isArray(observations)) {
    throw new TypeError('observations must be an object')
  }

  for (const key of [
    'realSourceRuntime',
    'sourceGovernedMutationPersisted',
    'realTargetRuntime',
    'targetLoadedAfterSourceCommit',
    'targetContextContainedClaim',
    'targetModelDemonstratedRecall',
  ]) {
    const value = observations[key]
    checks[key] = value === true ? 'pass' : value === false ? 'fail' : 'missing'
    if (value !== true && value !== false) missing.push(`observations.${key}`)
    else if (value === false) failures.push(`observations.${key}`)
  }

  const linkage = record.linkage && typeof record.linkage === 'object' && !Array.isArray(record.linkage)
    ? record.linkage
    : {}
  const normalizedLinkage = {}
  for (const key of ['stateCommitId', 'claimId', 'claim', 'targetLoadId', 'targetContextAssemblyId']) {
    normalizedLinkage[key] = optionalString(linkage[key])
    if (!normalizedLinkage[key]) missing.push(`linkage.${key}`)
  }

  const sourceCommitAt = optionalString(linkage.sourceCommitAt)
  const targetLoadAt = optionalString(linkage.targetLoadAt)
  normalizedLinkage.sourceCommitAt = sourceCommitAt
  normalizedLinkage.targetLoadAt = targetLoadAt
  if (!sourceCommitAt) missing.push('linkage.sourceCommitAt')
  if (!targetLoadAt) missing.push('linkage.targetLoadAt')
  if (sourceCommitAt && targetLoadAt) {
    const sourceTime = Date.parse(sourceCommitAt)
    const targetTime = Date.parse(targetLoadAt)
    if (!Number.isFinite(sourceTime)) failures.push('linkage.sourceCommitAt.validTimestamp')
    if (!Number.isFinite(targetTime)) failures.push('linkage.targetLoadAt.validTimestamp')
    if (Number.isFinite(sourceTime) && Number.isFinite(targetTime) && targetTime < sourceTime) {
      failures.push('linkage.targetLoadedAfterSourceCommit')
    }
  }

  const evidence = record.evidence && typeof record.evidence === 'object' && !Array.isArray(record.evidence)
    ? record.evidence
    : {}
  const normalizedEvidence = {}
  for (const key of ['sourceRuntime', 'sourceCommittedState', 'targetRuntime', 'targetLoadedState', 'targetContext', 'targetResponse']) {
    normalizedEvidence[key] = optionalString(evidence[key])
    if (!normalizedEvidence[key]) missing.push(`evidence.${key}`)
  }

  const evidenceKind = optionalString(record.evidenceKind)
  if (!evidenceKind) missing.push('evidenceKind')
  else if (evidenceKind !== 'real-dsh-runtime') failures.push('evidenceKind=real-dsh-runtime')

  const complete = missing.length === 0
  const verified = complete && failures.length === 0

  return {
    verified,
    complete,
    recordedAt: requiredString(record, 'recordedAt'),
    evidenceKind,
    source,
    target,
    checks,
    linkage: normalizedLinkage,
    evidence: normalizedEvidence,
    missing,
    failures,
    deviations: Array.isArray(record.deviations)
      ? record.deviations.filter((item) => typeof item === 'string' && item.trim() !== '').map((item) => item.trim())
      : [],
  }
}
