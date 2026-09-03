const SURFACES = new Set(['tui', 'web'])

const REQUIRED_OBSERVATIONS = [
  'realHumanInteraction',
  'pendingProposalVisible',
  'independentHumanReview',
  'persistedUserModelMutation',
  'sameSoulIdAfterCommit',
  'dynamicContextRefreshed',
  'nextTurnContextContainedClaim',
  'nextTurnModelDemonstratedRecall',
]

const REQUIRED_LINKAGE = [
  'experienceId',
  'candidateId',
  'proposalId',
  'reviewId',
  'reviewerId',
  'stateCommitId',
  'contextAssemblyId',
  'provenanceSource',
]

function requiredString(record, key) {
  const value = record?.[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${key} must be a non-empty string`)
  }
  return value.trim()
}

function evidenceString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

export function evaluateSelectiveGrowthRuntimeEvidence(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('selective-growth runtime evidence must be an object')
  }

  const surface = requiredString(record, 'surface').toLowerCase()
  if (!SURFACES.has(surface)) throw new TypeError('surface must be one of: tui, web')

  const identity = {
    recordedAt: requiredString(record, 'recordedAt'),
    dshVersion: requiredString(record, 'dshVersion'),
    runtime: requiredString(record, 'runtime'),
    profile: requiredString(record, 'profile'),
    soulId: requiredString(record, 'soulId'),
    surface,
  }

  const observations = record.observations
  if (!observations || typeof observations !== 'object' || Array.isArray(observations)) {
    throw new TypeError('observations must be an object')
  }

  const linkage = record.linkage
  if (!linkage || typeof linkage !== 'object' || Array.isArray(linkage)) {
    throw new TypeError('linkage must be an object')
  }

  const missing = []
  const failures = []
  const checks = {}

  for (const key of REQUIRED_OBSERVATIONS) {
    const value = observations[key]
    checks[key] = value === true ? 'pass' : value === false ? 'fail' : 'missing'
    if (value !== true && value !== false) missing.push(`observations.${key}`)
    else if (value === false) failures.push(`observations.${key}`)
  }

  const normalizedLinkage = {}
  for (const key of REQUIRED_LINKAGE) {
    const value = evidenceString(linkage[key])
    normalizedLinkage[key] = value
    if (!value) missing.push(`linkage.${key}`)
  }

  if (normalizedLinkage.reviewerId && normalizedLinkage.reviewerId === evidenceString(linkage.proposerId)) {
    failures.push('linkage.independentReviewer')
  }

  const mutation = record.mutation
  if (!mutation || typeof mutation !== 'object' || Array.isArray(mutation)) {
    missing.push('mutation')
  }

  const normalizedMutation = {
    target: evidenceString(mutation?.target),
    claim: evidenceString(mutation?.claim),
    persistedClaimCountDelta: Number.isInteger(mutation?.persistedClaimCountDelta)
      ? mutation.persistedClaimCountDelta
      : null,
    rawInteractionStoredInCanonicalState: typeof mutation?.rawInteractionStoredInCanonicalState === 'boolean'
      ? mutation.rawInteractionStoredInCanonicalState
      : null,
  }

  if (!normalizedMutation.target) missing.push('mutation.target')
  else if (normalizedMutation.target !== 'userModel') failures.push('mutation.target=userModel')
  if (!normalizedMutation.claim) missing.push('mutation.claim')
  if (normalizedMutation.persistedClaimCountDelta === null) missing.push('mutation.persistedClaimCountDelta')
  else if (normalizedMutation.persistedClaimCountDelta !== 1) failures.push('mutation.persistedClaimCountDelta=1')
  if (normalizedMutation.rawInteractionStoredInCanonicalState === null) missing.push('mutation.rawInteractionStoredInCanonicalState')
  else if (normalizedMutation.rawInteractionStoredInCanonicalState !== false) failures.push('mutation.rawInteractionStoredInCanonicalState=false')

  const evidence = record.evidence && typeof record.evidence === 'object' && !Array.isArray(record.evidence)
    ? record.evidence
    : {}
  const requiredEvidence = ['interaction', 'proposalSnapshot', 'review', 'persistedState', 'nextTurnContext', 'nextTurnResponse']
  const normalizedEvidence = {}
  for (const key of requiredEvidence) {
    normalizedEvidence[key] = evidenceString(evidence[key])
    if (!normalizedEvidence[key]) missing.push(`evidence.${key}`)
  }

  const complete = missing.length === 0
  const verified = complete && failures.length === 0

  return {
    verified,
    complete,
    identity,
    checks,
    linkage: {
      proposerId: evidenceString(linkage.proposerId),
      ...normalizedLinkage,
    },
    mutation: normalizedMutation,
    evidence: normalizedEvidence,
    missing,
    failures,
    deviations: Array.isArray(record.deviations)
      ? record.deviations.filter((item) => typeof item === 'string' && item.trim() !== '').map((item) => item.trim())
      : [],
  }
}
