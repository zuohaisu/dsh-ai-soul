import { createHash } from 'node:crypto'

import { validateSignificanceAssessment } from './significance.js'
import { validateSoulState } from './soul-state.js'

export const EXPERIENCE_RECORD_VERSION = 1
export const EXPERIENCE_PAYLOAD_REDACTION_VERSION = 1

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

function payloadDigest(payload) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)))
    .digest('hex')
}

function isRedactedPayload(payload) {
  return Boolean(
    payload
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && payload.redacted === true
    && payload.redaction?.version === EXPERIENCE_PAYLOAD_REDACTION_VERSION,
  )
}

export function validateExperienceRecord(record) {
  const errors = []

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    errors.push('experience must be an object')
  }
  if (record?.version !== EXPERIENCE_RECORD_VERSION) errors.push(`version must be ${EXPERIENCE_RECORD_VERSION}`)
  if (!record?.id || typeof record.id !== 'string') errors.push('id is required')
  if (!record?.at || typeof record.at !== 'string') errors.push('at is required')
  if (!record?.kind || typeof record.kind !== 'string') errors.push('kind is required')
  if (!record?.source || typeof record.source !== 'object' || Array.isArray(record.source)) errors.push('source is required')
  if (!record?.provenance || typeof record.provenance !== 'object' || Array.isArray(record.provenance)) errors.push('provenance is required')
  if (!Object.prototype.hasOwnProperty.call(record ?? {}, 'payload') || record?.payload === undefined) {
    errors.push('payload is required')
  }

  if (isRedactedPayload(record?.payload)) {
    const redaction = record.payload.redaction
    if (redaction.algorithm !== 'sha256') errors.push('redacted payload algorithm must be sha256')
    if (!/^[a-f0-9]{64}$/.test(redaction.digest ?? '')) errors.push('redacted payload digest must be sha256 hex')
    if (!redaction.redactedAt || typeof redaction.redactedAt !== 'string') errors.push('redactedAt is required')
    if (!redaction.reason || typeof redaction.reason !== 'string') errors.push('redaction reason is required')
    if (!redaction.provenance || typeof redaction.provenance !== 'object' || Array.isArray(redaction.provenance)) {
      errors.push('redaction provenance is required')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function createExperienceRecord({
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  kind,
  source,
  provenance,
  payload,
} = {}) {
  const record = {
    version: EXPERIENCE_RECORD_VERSION,
    id,
    at,
    kind,
    source: clone(source),
    provenance: clone(provenance),
    payload: clone(payload),
  }

  const validation = validateExperienceRecord(record)
  if (!validation.valid) {
    throw new TypeError(`invalid experience record: ${validation.errors.join('; ')}`)
  }

  return record
}

export function redactExperiencePayload(experience, {
  reason,
  provenance,
  redactedAt = new Date().toISOString(),
} = {}) {
  const validation = validateExperienceRecord(experience)
  if (!validation.valid) {
    throw new TypeError(`invalid experience record: ${validation.errors.join('; ')}`)
  }
  if (isRedactedPayload(experience.payload)) {
    throw new TypeError('experience payload is already redacted')
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

  const next = clone(experience)
  next.payload = {
    redacted: true,
    redaction: {
      version: EXPERIENCE_PAYLOAD_REDACTION_VERSION,
      algorithm: 'sha256',
      digest: payloadDigest(experience.payload),
      redactedAt,
      reason,
      provenance: clone(provenance),
    },
  }

  return next
}

export function promoteExperienceToAutobiography(state, experience, {
  reason,
  provenance,
  interpretation = null,
  significance = undefined,
  significanceAssessment = null,
  promotedAt = new Date().toISOString(),
} = {}) {
  const stateValidation = validateSoulState(state)
  if (!stateValidation.valid) {
    throw new TypeError(`invalid Soul state: ${stateValidation.errors.join('; ')}`)
  }

  const experienceValidation = validateExperienceRecord(experience)
  if (!experienceValidation.valid) {
    throw new TypeError(`invalid experience record: ${experienceValidation.errors.join('; ')}`)
  }

  if (!reason || typeof reason !== 'string') {
    throw new TypeError('promotion reason is required')
  }
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new TypeError('promotion provenance is required')
  }
  if (significance !== undefined) {
    throw new TypeError('raw significance is not supported; use significanceAssessment')
  }

  if (significanceAssessment !== null) {
    const assessmentValidation = validateSignificanceAssessment(significanceAssessment)
    if (!assessmentValidation.valid) {
      throw new TypeError(`invalid significance assessment: ${assessmentValidation.errors.join('; ')}`)
    }
    if (significanceAssessment.experienceId !== experience.id) {
      throw new TypeError('significance assessment experienceId must match experience.id')
    }
  }

  const next = clone(state)
  next.autobiography.push({
    id: `autobiography:${experience.id}`,
    experiencedAt: experience.at,
    promotedAt,
    kind: experience.kind,
    sourceExperienceId: experience.id,
    payload: clone(experience.payload),
    interpretation: clone(interpretation),
    significanceAssessment: clone(significanceAssessment),
    promotion: {
      reason,
      provenance: clone(provenance),
    },
    experienceProvenance: clone(experience.provenance),
  })

  return next
}
