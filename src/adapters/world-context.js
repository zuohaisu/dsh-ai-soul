import { createCandidateClaim } from '../core/candidate-claim.js'
import { createSignificanceAssessment } from '../core/significance.js'

export const EXPLICIT_WORLD_CONTEXT_POLICY = Object.freeze({
  id: 'explicit-world-context-v1',
  version: 1,
  target: 'worldModel',
})

const MAX_WORLD_CONTEXT_CHARS = 350
const PATTERNS = Object.freeze([
  {
    kind: 'active-project',
    pattern: /^please\s+remember(?:\s+that)?\s+(.+?)\s+is\s+an?\s+active\s+project\s+(?:we(?:'re|\s+are)\s+working\s+on|we\s+work\s+on)$/i,
  },
  {
    kind: 'active-project',
    pattern: /^please\s+remember(?:\s+that)?\s+we(?:'re|\s+are)\s+actively\s+working\s+on\s+(.+)$/i,
  },
  {
    kind: 'durable-commitment',
    pattern: /^please\s+remember(?:\s+that)?\s+we(?:'re|\s+are)\s+committed\s+to\s+(.+)$/i,
  },
  {
    kind: 'durable-commitment',
    pattern: /^from\s+now\s+on\s*,?\s*we(?:'re|\s+are)\s+committed\s+to\s+(.+)$/i,
  },
])

function normalizedObservation(experience) {
  const observation = experience?.payload?.observation
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) return ''
  return typeof observation.text === 'string' ? observation.text.trim() : ''
}

function cleanStatement(value) {
  return value.trim().replace(/[.!?]+$/u, '').trim()
}

function extractExplicitWorldContext(experience) {
  const observation = normalizedObservation(experience)
  if (!observation) return null

  for (const { kind, pattern } of PATTERNS) {
    const match = observation.match(pattern)
    if (!match) continue
    const value = cleanStatement(match[1])
    if (!value || value.length > MAX_WORLD_CONTEXT_CHARS) return null
    return { kind, value }
  }

  return null
}

/**
 * Infer only explicit, durable shared external context suitable for the compact
 * current WORLD model. Mentioning a project, place, person, task, or fact is
 * intentionally insufficient: the human must request persistence or state a
 * forward-looking shared commitment.
 *
 * The result is governance evidence only. It never writes canonical WORLD
 * state directly and does not turn raw interaction history into worldModel.
 */
export function inferExplicitWorldContext(experience) {
  if (!experience?.id || typeof experience.id !== 'string') {
    throw new TypeError('Experience with id is required')
  }

  const extracted = extractExplicitWorldContext(experience)
  if (!extracted) return null

  const assessment = createSignificanceAssessment({
    id: `significance:${EXPLICIT_WORLD_CONTEXT_POLICY.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'high',
    rationale: 'The human explicitly requested durable retention of shared external context relevant to the Soul and human.',
    confidence: 0.99,
    provenance: {
      assessor: 'dsh-ai-soul',
      method: 'deterministic-explicit-world-context',
      policy: structuredClone(EXPLICIT_WORLD_CONTEXT_POLICY),
      kind: extracted.kind,
      experienceId: experience.id,
    },
    recommendPromotion: true,
  })

  const statement = extracted.kind === 'active-project'
    ? `Active shared project: ${extracted.value}.`
    : `Shared durable commitment: ${extracted.value}.`

  const candidateClaim = createCandidateClaim({
    experience,
    significanceAssessment: assessment,
    id: `candidate:${EXPLICIT_WORLD_CONTEXT_POLICY.id}:${encodeURIComponent(experience.id)}`,
    createdAt: experience.at,
    target: 'worldModel',
    statement,
    confidence: 0.97,
    provenance: {
      extractor: 'dsh-ai-soul',
      method: 'deterministic-explicit-world-context',
      policy: structuredClone(EXPLICIT_WORLD_CONTEXT_POLICY),
      kind: extracted.kind,
      experienceId: experience.id,
      significanceAssessmentId: assessment.id,
    },
  })

  return Object.freeze({
    significanceAssessment: assessment,
    candidateClaim,
  })
}
