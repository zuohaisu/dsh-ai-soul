import { retrieveCognitiveMemories } from '../core/cognitive-memory-retrieval.js'

export const DSH_COGNITIVE_MEMORY_SELECTOR_FIELD = 'aiSoulCognitiveMemorySelector'
export const DSH_COGNITIVE_MEMORY_SELECTION_FIELD = 'aiSoulCognitiveMemorySelection'

function hasOwn(object, key) {
  return Object.hasOwn(object, key)
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
