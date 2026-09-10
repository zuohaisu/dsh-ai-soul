export const RELATIONSHIP_FACT_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export function validateRelationshipFact(fact) {
  const errors = []

  if (!fact || typeof fact !== 'object' || Array.isArray(fact)) {
    return { valid: false, errors: ['relationship fact must be an object'] }
  }

  if (fact.version !== RELATIONSHIP_FACT_VERSION) errors.push(`version must be ${RELATIONSHIP_FACT_VERSION}`)
  if (!isNonEmptyString(fact.id)) errors.push('id must be a non-empty string')
  if (!isNonEmptyString(fact.subject?.type)) errors.push('subject.type must be a non-empty string')
  if (!isNonEmptyString(fact.subject?.id)) errors.push('subject.id must be a non-empty string')
  if (!isNonEmptyString(fact.predicate)) errors.push('predicate must be a non-empty string')
  if (!Object.hasOwn(fact, 'value')) errors.push('value is required')
  if (typeof fact.confidence !== 'number' || !Number.isFinite(fact.confidence) || fact.confidence < 0 || fact.confidence > 1) {
    errors.push('confidence must be a finite number between 0 and 1')
  }
  if (!fact.provenance || typeof fact.provenance !== 'object' || Array.isArray(fact.provenance)) {
    errors.push('provenance must be an object')
  }

  return { valid: errors.length === 0, errors }
}

export function createRelationshipFact({ id, subject, predicate, value, confidence, provenance } = {}) {
  const fact = {
    version: RELATIONSHIP_FACT_VERSION,
    id,
    subject: clone(subject),
    predicate,
    value: clone(value),
    confidence,
    provenance: clone(provenance),
  }
  const validation = validateRelationshipFact(fact)
  if (!validation.valid) {
    throw new TypeError(`invalid relationship fact: ${validation.errors.join('; ')}`)
  }
  return fact
}

export function getRelationshipFact(state, factId) {
  if (!isNonEmptyString(factId)) throw new TypeError('factId must be a non-empty string')
  const entries = state?.relationship?.state
  if (!Array.isArray(entries)) throw new TypeError('relationship.state must be an array')

  const matches = entries.filter((entry) => validateRelationshipFact(entry).valid && entry.id === factId)
  if (matches.length > 1) throw new TypeError(`ambiguous relationship fact id: ${factId}`)
  return matches.length === 1 ? clone(matches[0]) : null
}

export function projectRelationshipFacts(state) {
  const entries = state?.relationship?.state
  if (!Array.isArray(entries)) throw new TypeError('relationship.state must be an array')

  const facts = entries.filter((entry) => validateRelationshipFact(entry).valid)
  const seen = new Set()
  for (const fact of facts) {
    if (seen.has(fact.id)) throw new TypeError(`ambiguous relationship fact id: ${fact.id}`)
    seen.add(fact.id)
  }
  return clone(facts)
}
