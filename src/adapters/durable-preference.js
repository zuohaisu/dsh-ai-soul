import { createCandidateClaim } from '../core/candidate-claim.js'
import { createSignificanceAssessment } from '../core/significance.js'

export const EXPLICIT_DURABLE_PREFERENCE_POLICY = Object.freeze({
  id: 'explicit-durable-user-preference-v1',
  version: 1,
  target: 'userModel',
})

export const EXPLICIT_DURABLE_PREFERENCE_REVISION_POLICY = Object.freeze({
  id: 'explicit-durable-user-preference-revision-v1',
  version: 1,
  target: 'userModel',
})

const MAX_PREFERENCE_TEXT_CHARS = 400
const PATTERNS = Object.freeze([
  /^please\s+remember(?:\s+that)?\s+i\s+prefer\s+(.+)$/i,
  /^from\s+now\s+on\s*,?\s*i\s+prefer\s+(.+)$/i,
])
const REVISION_PATTERN = /^i\s+used\s+to\s+prefer\s+(.+?),\s*but\s+from\s+now\s+on\s+i\s+prefer\s+(.+)$/i

function normalizedObservation(experience) {
  const observation = experience?.payload?.observation
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return ''
  return typeof observation.text === 'string' ? observation.text.trim() : ''
}

function normalizePreferenceText(value) {
  if (typeof value !== 'string') return null
  const preference = value.trim().replace(/[.!?]+$/u, '').trim()
  if (!preference || preference.length > MAX_PREFERENCE_TEXT_CHARS) return null
  return preference
}

function preferenceClaim(preference) {
  return `The user prefers ${preference}.`
}

function extractExplicitPreference(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null

  for (const pattern of PATTERNS) {
    const match = observation.match(pattern)
    if (!match) continue
    return normalizePreferenceText(match[1])
  }

  return null
}

function extractExplicitPreferenceRevision(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null
  const match = observation.match(REVISION_PATTERN)
  if (!match) return null

  const previousPreference = normalizePreferenceText(match[1])
  const nextPreference = normalizePreferenceText(match[2])
  if (!previousPreference || !nextPreference || previousPreference === nextPreference) return null
  return { previousPreference, nextPreference }
}

function createPreferenceAssessment(experience, policy, method, rationale) {
  return createSignificanceAssessment({
    id: `significance:${policy.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'medium',
    rationale,
    confidence: 0.98,
    provenance: {
      assessor: 'dsh-ai-soul',
      method,
      policy: structuredClone(policy),
      experienceId: experience.id,
    },
    recommendPromotion: true,
  })
}

function createPreferenceCandidate(experience, assessment, policy, method, preference, provenance = {}) {
  return createCandidateClaim({
    experience,
    significanceAssessment: assessment,
    id: `candidate:${policy.id}:${encodeURIComponent(experience.id)}`,
    createdAt: experience.at,
    target: 'userModel',
    statement: preferenceClaim(preference),
    confidence: 0.95,
    provenance: {
      extractor: 'dsh-ai-soul',
      method,
      policy: structuredClone(policy),
      experienceId: experience.id,
      significanceAssessmentId: assessment.id,
      ...structuredClone(provenance),
    },
  })
}

/**
 * Infer only explicit, first-person durable preference intent.
 *
 * This is intentionally deterministic and narrow. A bare `I prefer ...` is not
 * enough: the human must explicitly ask for persistence (`please remember`) or
 * declare a forward-looking preference (`from now on`). The result remains a
 * non-authoritative Candidate Claim and grants no mutation authority.
 */
export function inferExplicitDurableUserPreference(experience) {
  if (!experience?.id || typeof experience.id !== 'string') {
    throw new TypeError('Experience with id is required')
  }

  const preference = extractExplicitPreference(experience)
  if (!preference) return null

  const assessment = createPreferenceAssessment(
    experience,
    EXPLICIT_DURABLE_PREFERENCE_POLICY,
    'deterministic-explicit-durable-preference',
    'The human explicitly expressed persistence intent for a first-person future collaboration preference.',
  )
  const candidateClaim = createPreferenceCandidate(
    experience,
    assessment,
    EXPLICIT_DURABLE_PREFERENCE_POLICY,
    'deterministic-explicit-durable-preference',
    preference,
  )

  return Object.freeze({
    significanceAssessment: assessment,
    candidateClaim,
  })
}

/**
 * Infer an explicit preference revision only when the stated old preference
 * resolves to exactly one current canonical userModel value.
 *
 * Matching is deliberately exact. Missing, duplicate, or structurally richer
 * values fail closed rather than attempting semantic reconciliation.
 */
export function inferExplicitDurableUserPreferenceRevision(experience, currentState) {
  if (!experience?.id || typeof experience.id !== 'string') {
    throw new TypeError('Experience with id is required')
  }
  if (!currentState || typeof currentState !== 'object' || Array.isArray(currentState)) {
    throw new TypeError('Current Soul state is required')
  }
  if (!Array.isArray(currentState.userModel)) return null

  const revision = extractExplicitPreferenceRevision(experience)
  if (!revision) return null

  const previousValue = { claim: preferenceClaim(revision.previousPreference) }
  const matches = currentState.userModel.filter((entry) => (
    entry
    && typeof entry === 'object'
    && !Array.isArray(entry)
    && Object.keys(entry).length === 1
    && entry.claim === previousValue.claim
  ))
  if (matches.length !== 1) return null

  const assessment = createPreferenceAssessment(
    experience,
    EXPLICIT_DURABLE_PREFERENCE_REVISION_POLICY,
    'deterministic-explicit-durable-preference-revision',
    'The human explicitly superseded one uniquely matching durable first-person collaboration preference.',
  )
  const candidateClaim = createPreferenceCandidate(
    experience,
    assessment,
    EXPLICIT_DURABLE_PREFERENCE_REVISION_POLICY,
    'deterministic-explicit-durable-preference-revision',
    revision.nextPreference,
    { previousValue },
  )

  return Object.freeze({
    significanceAssessment: assessment,
    candidateClaim,
    transitionIntent: Object.freeze({
      operation: 'replace',
      previousValue: structuredClone(previousValue),
    }),
  })
}
