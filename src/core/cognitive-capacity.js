export const MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN = 8

export const CURRENT_COGNITION_TARGETS = Object.freeze([
  'selfModel',
  'userModel',
  'relationship.state',
  'beliefs',
  'worldModel',
])

export function getCurrentCognitionCapacity(target) {
  if (!CURRENT_COGNITION_TARGETS.includes(target)) {
    throw new TypeError('target is not a bounded current-cognition domain')
  }
  return MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN
}

export function assertCurrentCognitionAppendCapacity(target, entries) {
  if (!Array.isArray(entries)) throw new TypeError('current cognition entries must be an array')
  const capacity = getCurrentCognitionCapacity(target)
  if (entries.length >= capacity) {
    const error = new TypeError(`${target} current cognition is at capacity; consolidate, replace, or retire before append`)
    error.code = 'SOUL_CURRENT_COGNITION_CAPACITY_EXCEEDED'
    error.capacity = Object.freeze({ target, capacity, currentEntries: entries.length })
    throw error
  }
  return true
}
