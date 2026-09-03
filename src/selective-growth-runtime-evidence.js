const SURFACES = new Set(['tui', 'web'])

const REQUIRED_OBSERVATIONS = [
  'realHumanInteraction',
  'pendingProposalVisible',
  'independentHumanReview',
  'governedApplyPersisted',
  'sameSoulIdPreserved',
  'dynamicContextRefreshed',
  'nextTurnModelVisibleRecall',
]

function requiredString(record, key) {
  const value = record?.[key]
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${key} must be a non-empty string`)
  return value.trim()
}

export function evaluateSelectiveGrowthRuntimeEvidence(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError('selective-growth runtime evidence must be an object')

  const surface = requiredString(record, 'surface').toLowerCase()
  if (!SURFACES.has(surface)) throw new TypeError('surface must be one of: tui, web')

  const identity = {
    recordedAt: requiredString(record, 'recordedAt'),
    dshVersion: requiredString(record, 'dshVersion'),
    runtime: requiredString(record, 'runtime'),
    profile: requiredString(record, 'profile'),
    surface,
    soulId: requiredString(record, 'soulId'),
  }

  const linkage = {
    experienceId: requiredString(record, 'experienceId'),
    assessmentId: requiredString(record, 'assessmentId'),
    candidateId: requiredString(record, 'candidateId'),
    proposalId: requiredString(record, 'proposalId'),
    reviewerId: requiredString(record, 'reviewerId'),
    reviewDecision: requiredString(record, 'reviewDecision').toLowerCase(),
    provenanceRef: requiredString(record, 'provenanceRef'),
    persistedClaim: requiredString(record, 'persistedClaim'),
  }
  if (!['approve', 'reject'].includes(linkage.reviewDecision)) throw new TypeError('reviewDecision must be approve or reject')

  const observations = record.observations
  if (!observations || typeof observations !== 'object' || Array.isArray(observations)) throw new TypeError('observations must be an object')

  const missing = []
  const failures = []
  const checks = {}
  for (const key of REQUIRED_OBSERVATIONS) {
    const value = observations[key]
    checks[key] = value === true ? 'pass' : value === false ? 'fail' : 'missing'
    if (value !== true && value !== false) missing.push(key)
    else if (value === false) failures.push(key)
  }

  if (linkage.reviewDecision === 'reject') {
    const mutationChecks = ['governedApplyPersisted', 'dynamicContextRefreshed', 'nextTurnModelVisibleRecall']
    for (const key of mutationChecks) {
      if (observations[key] === true) failures.push(`rejected-review-must-not-${key}`)
    }
  }

  const complete = missing.length === 0
  const verified = complete && failures.length === 0

  return {
    verified,
    complete,
    identity,
    linkage,
    checks,
    missing,
    failures,
    deviations: Array.isArray(record.deviations)
      ? record.deviations.filter((item) => typeof item === 'string' && item.trim() !== '').map((item) => item.trim())
      : [],
  }
}
