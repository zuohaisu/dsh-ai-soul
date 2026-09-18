import { retrieveCognitiveMemories } from '../core/cognitive-memory-retrieval.js'
import { normalizeDshHumanInteraction } from './runtime-event.js'

export const DSH_COGNITIVE_MEMORY_SELECTOR_FIELD = 'aiSoulCognitiveMemorySelector'
export const DSH_COGNITIVE_MEMORY_SELECTION_FIELD = 'aiSoulCognitiveMemorySelection'

const PARTICIPANT_ID_PATTERN = /^[a-zA-Z0-9._-]+$/

function hasOwn(object, key) {
  return Object.hasOwn(object, key)
}

/**
 * Deterministic interaction-conditioned recall cue. The only evidence inspected
 * is the canonical DSH human-interaction boundary (user/message from a human
 * source) and its explicit participant identity — never message text, never
 * model output. Interactions outside the boundary, synthetic/plugin messages,
 * and participants whose identity is not a safe exact key yield no cue, so an
 * unrelated interaction can never recall anything. Malformed envelopes fail
 * closed through the shared boundary, exactly as Experience capture does.
 */
export function deriveDshInteractionRecallKey({ session, event, participant } = {}) {
  const interaction = normalizeDshHumanInteraction(session, event, { participant })
  if (!interaction) return null
  if (!PARTICIPANT_ID_PATTERN.test(interaction.participant.id)) return null
  return `participant:${interaction.participant.id}`
}

export async function resolveRequestScopedCognitiveMemorySelection({
  requestContext,
  store,
  soulId,
  limit = 8,
} = {}) {
  if (!requestContext || typeof requestContext !== 'object' || Array.isArray(requestContext)) return undefined

  const hasExplicitRecords = hasOwn(requestContext, DSH_COGNITIVE_MEMORY_SELECTION_FIELD)
  const hasSelector = hasOwn(requestContext, DSH_COGNITIVE_MEMORY_SELECTOR_FIELD)
  if (!hasSelector) return undefined
  if (hasExplicitRecords) {
    throw new TypeError('dsh-ai-soul request context error: explicit Cognitive Memory records and selector are mutually exclusive')
  }

  const selector = requestContext[DSH_COGNITIVE_MEMORY_SELECTOR_FIELD]
  return retrieveCognitiveMemories({ store, soulId, selector, limit })
}
