import { createHash } from 'node:crypto'
import { appendTransition, validateSoulState } from './soul-state.js'

export const EVOLUTION_HISTORY_DERIVED_CONTENT_REDACTION_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function requireGovernance({ reason, provenance, at }) {
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new TypeError('redaction reason is required')
  }
  if (!isRecord(provenance)) {
    throw new TypeError('redaction provenance is required')
  }
  if (at != null && (typeof at !== 'string' || at.trim() === '')) {
    throw new TypeError('redaction at must be a non-empty string when provided')
  }
}

function evidenceIds(evidence) {
  if (!Array.isArray(evidence)) return []
  return evidence
    .map((item) => item?.id)
    .filter((id) => typeof id === 'string' && id.length > 0)
}

function redactEntry(entry, { reason, provenance, at }) {
  if (entry.kind !== 'governed-state-transition') {
    throw new TypeError('only governed-state-transition evolution entries may be redacted')
  }
  if (entry.redaction != null) {
    throw new TypeError('evolution entry has already been redacted')
  }

  const review = entry?.provenance?.review ?? {}
  const change = entry?.change ?? {}
  const evidence = entry?.provenance?.evidence ?? []
  const removed = {}

  const remove = (name, value) => {
    if (value !== undefined && value !== null) removed[name] = { sha256: digest(value) }
  }

  remove('reason', entry.reason)
  remove('proposalProvenance', entry?.provenance?.proposal)
  remove('evidence', evidence)
  remove('change.value', change.value)
  remove('change.previousValue', change.previousValue)
  remove('change.previousValues', change.previousValues)
  remove('review.reason', review.reason)
  remove('review.provenance', review.provenance)
  remove('review.conflicts', review.conflicts)
  remove('review.conflictResolution', review.conflictResolution)
  remove('review.proposalFingerprint', review.proposalFingerprint)
  remove('review.reviewFingerprint', review.reviewFingerprint)

  const redacted = {
    id: entry.id,
    at: entry.at,
    kind: entry.kind,
    reason: '[redacted]',
    provenance: {
      proposalId: entry?.provenance?.proposalId ?? null,
      evidenceIds: evidenceIds(evidence),
      review: {
        decision: review.decision ?? null,
        reviewer: review.reviewer ?? null,
        at: review.at ?? null,
        policy: clone(review.policy ?? null),
      },
    },
    change: {
      target: change.target ?? null,
      operation: change.operation ?? null,
      confidence: change.confidence ?? null,
      proposer: change.proposer ?? null,
    },
    redaction: {
      version: EVOLUTION_HISTORY_DERIVED_CONTENT_REDACTION_VERSION,
      at: at ?? new Date().toISOString(),
      reason,
      provenance: clone(provenance),
      removed,
    },
  }

  return redacted
}

export function redactEvolutionHistoryDerivedContent(
  state,
  { evolutionEntryId, reason, provenance, at } = {},
) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }
  if (typeof evolutionEntryId !== 'string' || evolutionEntryId.trim() === '') {
    throw new TypeError('evolutionEntryId is required')
  }
  requireGovernance({ reason, provenance, at })

  const matches = state.evolution
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry?.id === evolutionEntryId)

  if (matches.length === 0) throw new TypeError('evolution entry not found')
  if (matches.length > 1) throw new TypeError('evolution entry id is ambiguous')

  const next = clone(state)
  const { entry, index } = matches[0]
  const redacted = redactEntry(entry, { reason, provenance, at })
  next.evolution[index] = redacted

  const withAudit = appendTransition(next, {
    at: redacted.redaction.at,
    kind: 'privacy-redaction',
    reason,
    provenance: clone(provenance),
    change: {
      target: 'evolution',
      operation: 'redact-derived-content',
      evolutionEntryId,
      redactionVersion: EVOLUTION_HISTORY_DERIVED_CONTENT_REDACTION_VERSION,
    },
  })

  const nextValidation = validateSoulState(withAudit)
  if (!nextValidation.valid) {
    throw new TypeError(`redacted Soul state is invalid: ${nextValidation.errors.join('; ')}`)
  }
  return withAudit
}
