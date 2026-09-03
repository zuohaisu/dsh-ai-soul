import { createCandidateClaim } from '../core/candidate-claim.js'
import { createSignificanceAssessment } from '../core/significance.js'

export const EXPLICIT_DURABLE_PREFERENCE_POLICY = Object.freeze({
  id: 'explicit-durable-user-preference-v1',
  version: 1,
  target: 'userModel',
})

const MAX_PREFERENCE_TEXT_CHARS = 400
const PATTERNS = Object.freeze([
  /^please\s+remember(?:\s+that)?\s+i\s+prefer\s+(.+)$/i,
  /^from\s+now\s+on\s*,?\s*i\s+prefer\s+(.+)$/i,
])

function normalizedObservation(experience) {
  const observation = experience?.payload?.observation
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return ''
  return typeof observation.text === 'string' ? observation.text.trim() : ''
}

function extractExplicitPreference(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null

  for (const pattern of PATTERNS) {
    const match = observation.match(pattern)
    if (!match) continue
    const preference = match[1].trim().replace(/[.!?]+$/u, '').trim()
    if (!preference || preference.length > MAX_PREFERENCE_TEXT_CHARS) return null
    return preference
  }

  return null
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

  const assessment = createSignificanceAssessment({
    id: `significance:${EXPLICIT_DURABLE_PREFERENCE_POLICY.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'medium',
    rationale: 'The human explicitly expressed persistence intent for a first-person future collaboration preference.',
    confidence: 0.98,
    provenance: {
      assessor: 'dsh-ai-soul',
      method: 'deterministic-explicit-durable-preference',
      policy: structuredClone(EXPLICIT_DURABLE_PREFERENCE_POLICY),
      experienceId: experience.id,
    },
    recommendPromotion: true,
  })

  const candidateClaim = createCandidateClaim({
    experience,
    significanceAssessment: assessment,
    id: `candidate:${EXPLICIT_DURABLE_PREFERENCE_POLICY.id}:${encodeURIComponent(experience.id)}`,
    createdAt: experience.at,
    target: 'userModel',
    statement: `The user prefers ${preference}.`,
    confidence: 0.95,
    provenance: {
      extractor: 'dsh-ai-soul',
      method: 'deterministic-explicit-durable-preference',
      policy: structuredClone(EXPLICIT_DURABLE_PREFERENCE_POLICY),
      experienceId: experience.id,
      significanceAssessmentId: assessment.id,
    },
  })

  return Object.freeze({
    significanceAssessment: assessment,
    candidateClaim,
  })
}
