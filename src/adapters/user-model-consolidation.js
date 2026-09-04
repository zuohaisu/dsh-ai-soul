import { createCandidateClaim } from '../core/candidate-claim.js'
import { createSignificanceAssessment } from '../core/significance.js'

export const EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY = Object.freeze({
  id: 'explicit-user-model-consolidation-v1',
  version: 1,
  target: 'userModel',
})

const MAX_PREFERENCE_TEXT_CHARS = 400
const CONSOLIDATION_PATTERN = /^please\s+consolidate\s+my\s+preferences\s+"([^"]+)"\s+and\s+"([^"]+)"\s+into\s+"([^"]+)"[.!?]*$/i

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

function preferenceValue(preference) {
  return { claim: `The user prefers ${preference}.` }
}

function exactCurrentValue(currentState, preference) {
  if (!Array.isArray(currentState?.userModel)) return null
  const expected = preferenceValue(preference)
  const matches = currentState.userModel.filter((entry) => (
    entry
    && typeof entry === 'object'
    && !Array.isArray(entry)
    && Object.keys(entry).length === 1
    && entry.claim === expected.claim
  ))
  return matches.length === 1 ? expected : null
}

function extractExplicitConsolidation(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null
  const match = observation.match(CONSOLIDATION_PATTERN)
  if (!match) return null

  const sourceA = normalizePreferenceText(match[1])
  const sourceB = normalizePreferenceText(match[2])
  const result = normalizePreferenceText(match[3])
  if (!sourceA || !sourceB || !result || sourceA === sourceB) return null
  return { sources: [sourceA, sourceB], result }
}

export function inferExplicitUserModelConsolidation(experience, currentState) {
  if (!experience?.id || typeof experience.id !== 'string') throw new TypeError('Experience with id is required')
  if (!currentState || typeof currentState !== 'object' || Array.isArray(currentState)) throw new TypeError('Current Soul state is required')

  const requested = extractExplicitConsolidation(experience)
  if (!requested) return null

  const previousValues = requested.sources.map((source) => exactCurrentValue(currentState, source))
  if (previousValues.some((value) => !value)) return null

  const significanceAssessment = createSignificanceAssessment({
    id: `significance:${EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'medium',
    rationale: 'The human explicitly requested consolidation of two uniquely matching current durable preferences into a supplied compact preference.',
    confidence: 0.99,
    provenance: {
      assessor: 'dsh-ai-soul',
      method: 'deterministic-explicit-user-model-consolidation',
      policy: structuredClone(EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY),
      experienceId: experience.id,
    },
    recommendPromotion: true,
  })

  const candidateClaim = createCandidateClaim({
    experience,
    significanceAssessment,
    id: `candidate:${EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY.id}:${encodeURIComponent(experience.id)}`,
    createdAt: experience.at,
    target: 'userModel',
    statement: `The user prefers ${requested.result}.`,
    confidence: 0.96,
    provenance: {
      extractor: 'dsh-ai-soul',
      method: 'deterministic-explicit-user-model-consolidation',
      policy: structuredClone(EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY),
      experienceId: experience.id,
      significanceAssessmentId: significanceAssessment.id,
      previousValues: structuredClone(previousValues),
    },
  })

  return Object.freeze({
    significanceAssessment,
    candidateClaim,
    transitionIntent: Object.freeze({ operation: 'consolidate', previousValues: structuredClone(previousValues) }),
  })
}
