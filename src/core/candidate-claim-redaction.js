import { createHash } from 'node:crypto'

import { validateCandidateClaim } from './candidate-claim.js'

export const CANDIDATE_CLAIM_DERIVED_CONTENT_REDACTION_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

function digest(value) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex')
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function isRedacted(claim) {
  return Boolean(
    claim?.derivedContentRedaction
    && claim.derivedContentRedaction.version === CANDIDATE_CLAIM_DERIVED_CONTENT_REDACTION_VERSION,
  )
}

export function redactCandidateClaimDerivedContent(candidateClaims, {
  experienceId,
  reason,
  provenance,
  redactedAt = new Date().toISOString(),
} = {}) {
  if (!Array.isArray(candidateClaims)) {
    throw new TypeError('candidateClaims must be an array')
  }
  if (typeof experienceId !== 'string' || experienceId.trim() === '') {
    throw new TypeError('experienceId is required')
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new TypeError('redaction reason is required')
  }
  if (!isRecord(provenance)) {
    throw new TypeError('redaction provenance is required')
  }
  if (typeof redactedAt !== 'string' || redactedAt.trim() === '') {
    throw new TypeError('redactedAt is required')
  }

  for (const claim of candidateClaims) {
    if (isRedacted(claim)) continue
    const validation = validateCandidateClaim(claim)
    if (!validation.valid) {
      throw new TypeError(`invalid candidate claim: ${validation.errors.join('; ')}`)
    }
  }

  const matches = candidateClaims
    .map((claim, index) => ({ claim, index }))
    .filter(({ claim }) => claim?.source?.experienceId === experienceId)

  if (matches.length === 0) {
    throw new TypeError(`no candidate claim found for experienceId ${experienceId}`)
  }
  if (matches.length > 1) {
    throw new TypeError(`ambiguous candidate claims for experienceId ${experienceId}`)
  }

  const [{ claim, index }] = matches
  if (isRedacted(claim)) {
    throw new TypeError('candidate claim derived content is already redacted')
  }

  const removed = {
    statement: clone(claim.statement),
    provenance: clone(claim.provenance),
  }

  const next = clone(candidateClaims)
  const nextClaim = next[index]
  nextClaim.statement = null
  nextClaim.provenance = null
  nextClaim.derivedContentRedaction = {
    version: CANDIDATE_CLAIM_DERIVED_CONTENT_REDACTION_VERSION,
    algorithm: 'sha256',
    digests: {
      statement: digest(removed.statement),
      provenance: digest(removed.provenance),
    },
    redactedAt,
    reason,
    provenance: clone(provenance),
    sourceExperienceId: experienceId,
    scope: ['statement', 'provenance'],
  }

  return next
}
