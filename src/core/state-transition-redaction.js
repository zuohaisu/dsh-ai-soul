import { createHash } from 'node:crypto'
import { validateStateTransitionProposal } from './state-transition.js'

export const STATE_TRANSITION_REDACTED_ARCHIVE_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function containsExperienceId(value, experienceId) {
  if (Array.isArray(value)) return value.some((entry) => containsExperienceId(entry, experienceId))
  if (!isRecord(value)) return false
  if (value.experienceId === experienceId || value.sourceExperienceId === experienceId) return true
  return Object.values(value).some((entry) => containsExperienceId(entry, experienceId))
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function digestField(source, field, output) {
  if (Object.prototype.hasOwnProperty.call(source, field)) {
    output[field] = digest(source[field])
  }
}

export function archiveRedactedStateTransitionProposal(
  proposal,
  {
    experienceId,
    reason,
    provenance,
    at = new Date().toISOString(),
  } = {},
) {
  if (isRecord(proposal) && proposal.archiveVersion === STATE_TRANSITION_REDACTED_ARCHIVE_VERSION) {
    throw new TypeError('proposal is already a redacted archive')
  }

  const validation = validateStateTransitionProposal(proposal)
  if (!validation.valid) {
    throw new TypeError(`invalid state transition proposal: ${validation.errors.join('; ')}`)
  }
  if (proposal.review == null) {
    throw new TypeError('proposal must have a terminal review before archival redaction')
  }
  if (typeof experienceId !== 'string' || experienceId.trim() === '') {
    throw new TypeError('experienceId is required')
  }
  if (!containsExperienceId(proposal, experienceId)) {
    throw new TypeError('proposal does not structurally reference experienceId')
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new TypeError('redaction reason is required')
  }
  if (!isRecord(provenance)) {
    throw new TypeError('redaction provenance is required')
  }
  if (typeof at !== 'string' || at.trim() === '') {
    throw new TypeError('redaction at is required')
  }

  const proposalDigests = {}
  for (const field of ['value', 'previousValue', 'previousValues', 'reason', 'evidence', 'provenance']) {
    digestField(proposal, field, proposalDigests)
  }

  const reviewDigests = {}
  for (const field of ['reason', 'provenance', 'conflicts', 'conflictResolution']) {
    digestField(proposal.review, field, reviewDigests)
  }

  return clone({
    archiveVersion: STATE_TRANSITION_REDACTED_ARCHIVE_VERSION,
    archival: true,
    executable: false,
    sourceProposal: {
      version: proposal.version,
      id: proposal.id,
      at: proposal.at,
      target: proposal.target,
      operation: proposal.operation,
      confidence: proposal.confidence,
      proposer: proposal.proposer,
    },
    review: {
      decision: proposal.review.decision,
      reviewer: proposal.review.reviewer,
      at: proposal.review.at,
      policy: clone(proposal.review.policy),
      proposalFingerprintDigest: digest(proposal.review.proposalFingerprint),
      reviewFingerprintDigest: digest(proposal.review.reviewFingerprint),
    },
    redaction: {
      experienceId,
      at,
      reason,
      provenance: clone(provenance),
      proposalFieldDigests: proposalDigests,
      reviewFieldDigests: reviewDigests,
    },
    limitations: [
      'this archive is non-executable and must not be passed to proposal review/apply machinery',
      'original fingerprint strings may contain derived plaintext and are represented only by digests in this archive',
      'archival redaction does not undo an approved canonical state transition',
      'evolution history, logs, backups, caches, external stores, and semantic copies are not erased by this transformation',
    ],
  })
}
