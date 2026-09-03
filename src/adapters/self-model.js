import { createCandidateClaim } from '../core/candidate-claim.js'
import { createSignificanceAssessment } from '../core/significance.js'

export const EXPLICIT_SELF_MODEL_POLICY = Object.freeze({
  id: 'explicit-self-model-v1',
  version: 1,
  target: 'selfModel',
})

const MAX_SELF_MODEL_CHARS = 350
const PATTERNS = Object.freeze([
  /^please\s+remember(?:\s+that)?\s+you\s+understand\s+yourself\s+as\s+(.+)$/i,
  /^from\s+now\s+on\s*,?\s*understand\s+yourself\s+as\s+(.+)$/i,
])

function normalizedObservation(experience) {
  const observation = experience?.payload?.observation
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return ''
  return typeof observation.text === 'string' ? observation.text.trim() : ''
}

function extractExplicitSelfModel(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null

  for (const pattern of PATTERNS) {
    const match = observation.match(pattern)
    if (!match) continue
    const selfModel = match[1].trim().replace(/[.!?]+$/u, '').trim()
    if (!selfModel || selfModel.length > MAX_SELF_MODEL_CHARS) return null
    return selfModel
  }

  return null
}

/**
 * Infer only explicit durable human declarations about the Soul's mutable
 * self-model. This is not trait inference or identity assignment: ordinary
 * descriptions, praise, criticism, names, and task instructions fail closed.
 * The result has no mutation authority and must pass independent governance.
 */
export function inferExplicitSelfModel(experience) {
  if (!experience?.id || typeof experience.id !== 'string') {
    throw new TypeError('Experience with id is required')
  }

  const selfModel = extractExplicitSelfModel(experience)
  if (!selfModel) return null

  const assessment = createSignificanceAssessment({
    id: `significance:${EXPLICIT_SELF_MODEL_POLICY.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'high',
    rationale: 'The human explicitly requested durable consideration of a bounded mutable self-model claim.',
    confidence: 0.98,
    provenance: {
      assessor: 'dsh-ai-soul',
      method: 'deterministic-explicit-self-model',
      policy: structuredClone(EXPLICIT_SELF_MODEL_POLICY),
      experienceId: experience.id,
    },
    recommendPromotion: true,
  })

  const candidateClaim = createCandidateClaim({
    experience,
    significanceAssessment: assessment,
    id: `candidate:${EXPLICIT_SELF_MODEL_POLICY.id}:${encodeURIComponent(experience.id)}`,
    createdAt: experience.at,
    target: 'selfModel',
    statement: `The Soul should consider this mutable self-understanding: ${selfModel}.`,
    confidence: 0.95,
    provenance: {
      extractor: 'dsh-ai-soul',
      method: 'deterministic-explicit-self-model',
      policy: structuredClone(EXPLICIT_SELF_MODEL_POLICY),
      experienceId: experience.id,
      significanceAssessmentId: assessment.id,
    },
  })

  return Object.freeze({ significanceAssessment: assessment, candidateClaim })
}
