import { createHash } from 'node:crypto'

import { validateSoulState } from './soul-state.js'

export const AUTOBIOGRAPHY_DERIVED_CONTENT_REDACTION_VERSION = 1

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

function isRedacted(entry) {
  return Boolean(
    entry?.derivedContentRedaction
    && entry.derivedContentRedaction.version === AUTOBIOGRAPHY_DERIVED_CONTENT_REDACTION_VERSION,
  )
}

export function redactAutobiographyDerivedContent(state, {
  experienceId,
  reason,
  provenance,
  redactedAt = new Date().toISOString(),
} = {}) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }
  if (typeof experienceId !== 'string' || experienceId.trim() === '') {
    throw new TypeError('experienceId is required')
  }
  if (!reason || typeof reason !== 'string') {
    throw new TypeError('redaction reason is required')
  }
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new TypeError('redaction provenance is required')
  }
  if (!redactedAt || typeof redactedAt !== 'string') {
    throw new TypeError('redactedAt is required')
  }

  const matches = state.autobiography
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry?.sourceExperienceId === experienceId)

  if (matches.length === 0) {
    throw new TypeError(`no autobiography entry found for experienceId ${experienceId}`)
  }
  if (matches.length > 1) {
    throw new TypeError(`ambiguous autobiography entries for experienceId ${experienceId}`)
  }

  const [{ entry, index }] = matches
  if (isRedacted(entry)) {
    throw new TypeError('autobiography derived content is already redacted')
  }
  if (!entry?.promotion || typeof entry.promotion !== 'object' || Array.isArray(entry.promotion)) {
    throw new TypeError('autobiography entry promotion metadata is required')
  }

  const removed = {
    payload: clone(entry.payload ?? null),
    interpretation: clone(entry.interpretation ?? null),
    significanceAssessment: clone(entry.significanceAssessment ?? null),
    promotionReason: clone(entry.promotion.reason ?? null),
  }

  const next = clone(state)
  const nextEntry = next.autobiography[index]

  nextEntry.payload = null
  nextEntry.interpretation = null
  nextEntry.significanceAssessment = null
  nextEntry.promotion.reason = null
  nextEntry.derivedContentRedaction = {
    version: AUTOBIOGRAPHY_DERIVED_CONTENT_REDACTION_VERSION,
    algorithm: 'sha256',
    digests: {
      payload: digest(removed.payload),
      interpretation: digest(removed.interpretation),
      significanceAssessment: digest(removed.significanceAssessment),
      promotionReason: digest(removed.promotionReason),
    },
    redactedAt,
    reason,
    provenance: clone(provenance),
    sourceExperienceId: experienceId,
    scope: [
      'payload',
      'interpretation',
      'significanceAssessment',
      'promotion.reason',
    ],
  }

  return next
}
