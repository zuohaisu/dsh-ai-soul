import { createCandidateClaim } from '../core/candidate-claim.js'
import { createSignificanceAssessment } from '../core/significance.js'

export const EXPLICIT_RELATIONSHIP_STATE_POLICY = Object.freeze({
  id: 'explicit-relationship-state-v1',
  version: 1,
  target: 'relationship.state',
})

const MAX_RELATIONSHIP_STATE_CHARS = 350
const PATTERNS = Object.freeze([
  /^please\s+remember(?:\s+that)?\s+our\s+relationship\s+is\s+(.+)$/i,
  /^please\s+remember(?:\s+that)?\s+i\s+see\s+our\s+relationship\s+as\s+(.+)$/i,
  /^from\s+now\s+on\s*,?\s*our\s+relationship\s+is\s+(.+)$/i,
  /^from\s+now\s+on\s*,?\s*i\s+see\s+our\s+relationship\s+as\s+(.+)$/i,
])

function normalizedObservation(experience) {
  const observation = experience?.payload?.observation
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return ''
  return typeof observation.text === 'string' ? observation.text.trim() : ''
}

function extractExplicitRelationshipState(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null

  for (const pattern of PATTERNS) {
    const match = observation.match(pattern)
    if (!match) continue
    const relationshipState = match[1].trim().replace(/[.!?]+$/u, '').trim()
    if (!relationshipState || relationshipState.length > MAX_RELATIONSHIP_STATE_CHARS) return null
    return relationshipState
  }

  return null
}

/**
 * Infer only explicit, durable human declarations about the current dyadic
 * relationship state.
 *
 * This deliberately recognizes the structural phrase `our relationship`, not
 * archetype keywords such as friend, partner, assistant, or collaborator. The
 * human must also explicitly request persistence or make a forward-looking
 * declaration. The result is evidence for governance only: it remains a
 * non-authoritative Candidate Claim and cannot mutate covenants or identity.
 */
export function inferExplicitRelationshipState(experience) {
  if (!experience?.id || typeof experience.id !== 'string') {
    throw new TypeError('Experience with id is required')
  }

  const relationshipState = extractExplicitRelationshipState(experience)
  if (!relationshipState) return null

  const assessment = createSignificanceAssessment({
    id: `significance:${EXPLICIT_RELATIONSHIP_STATE_POLICY.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'high',
    rationale: 'The human explicitly expressed durable intent for how the dyadic relationship should be understood.',
    confidence: 0.99,
    provenance: {
      assessor: 'dsh-ai-soul',
      method: 'deterministic-explicit-relationship-state',
      policy: structuredClone(EXPLICIT_RELATIONSHIP_STATE_POLICY),
      experienceId: experience.id,
    },
    recommendPromotion: true,
  })

  const candidateClaim = createCandidateClaim({
    experience,
    significanceAssessment: assessment,
    id: `candidate:${EXPLICIT_RELATIONSHIP_STATE_POLICY.id}:${encodeURIComponent(experience.id)}`,
    createdAt: experience.at,
    target: 'relationship.state',
    statement: `The human explicitly defines the relationship as ${relationshipState}.`,
    confidence: 0.97,
    provenance: {
      extractor: 'dsh-ai-soul',
      method: 'deterministic-explicit-relationship-state',
      policy: structuredClone(EXPLICIT_RELATIONSHIP_STATE_POLICY),
      experienceId: experience.id,
      significanceAssessmentId: assessment.id,
    },
  })

  return Object.freeze({
    significanceAssessment: assessment,
    candidateClaim,
  })
}
