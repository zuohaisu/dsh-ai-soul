import { createHash } from 'node:crypto'

import { validateSignificanceAssessment } from './significance.js'

export const SIGNIFICANCE_ASSESSMENT_DERIVED_CONTENT_REDACTION_VERSION = 1

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

function isRedacted(assessment) {
  return Boolean(
    assessment?.derivedContentRedaction
    && assessment.derivedContentRedaction.version === SIGNIFICANCE_ASSESSMENT_DERIVED_CONTENT_REDACTION_VERSION,
  )
}

export function redactSignificanceAssessmentDerivedContent(assessments, {
  experienceId,
  reason,
  provenance,
  redactedAt = new Date().toISOString(),
} = {}) {
  if (!Array.isArray(assessments)) throw new TypeError('assessments must be an array')
  if (typeof experienceId !== 'string' || experienceId.trim() === '') {
    throw new TypeError('experienceId is required')
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new TypeError('redaction reason is required')
  }
  if (!isRecord(provenance)) throw new TypeError('redaction provenance is required')
  if (typeof redactedAt !== 'string' || redactedAt.trim() === '') {
    throw new TypeError('redactedAt is required')
  }

  for (const assessment of assessments) {
    if (isRedacted(assessment)) continue
    const validation = validateSignificanceAssessment(assessment)
    if (!validation.valid) {
      throw new TypeError(`invalid significance assessment: ${validation.errors.join('; ')}`)
    }
  }

  const matches = assessments
    .map((assessment, index) => ({ assessment, index }))
    .filter(({ assessment }) => assessment?.experienceId === experienceId)

  if (matches.length === 0) {
    throw new TypeError(`no significance assessment found for experienceId ${experienceId}`)
  }
  if (matches.length > 1) {
    throw new TypeError(`ambiguous significance assessments for experienceId ${experienceId}`)
  }

  const [{ assessment, index }] = matches
  if (isRedacted(assessment)) {
    throw new TypeError('significance assessment derived content is already redacted')
  }

  const removed = {
    rationale: clone(assessment.rationale),
    provenance: clone(assessment.provenance),
  }

  const next = clone(assessments)
  const nextAssessment = next[index]
  nextAssessment.rationale = null
  nextAssessment.provenance = null
  nextAssessment.derivedContentRedaction = {
    version: SIGNIFICANCE_ASSESSMENT_DERIVED_CONTENT_REDACTION_VERSION,
    algorithm: 'sha256',
    digests: {
      rationale: digest(removed.rationale),
      provenance: digest(removed.provenance),
    },
    redactedAt,
    reason,
    provenance: clone(provenance),
    sourceExperienceId: experienceId,
    scope: ['rationale', 'provenance'],
  }

  return next
}
