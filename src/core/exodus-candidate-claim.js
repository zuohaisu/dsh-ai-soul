export const EXODUS_CANDIDATE_CLAIM_VERSION = 1

export const RUNTIME_PHENOTYPE_RISKS = Object.freeze([
  'none',
  'low',
  'medium',
  'high',
  'unknown',
])

function deepClone(value) {
  return value === undefined ? undefined : structuredClone(value)
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`)
  }
  return value
}

function validateNormalizedEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    throw new TypeError('normalizedEvidence must be an object')
  }
  if (evidence.canonicalMutation !== false) {
    throw new TypeError('normalizedEvidence must have canonicalMutation=false')
  }
  if (!evidence.sourceRef || typeof evidence.sourceRef !== 'object') {
    throw new TypeError('normalizedEvidence.sourceRef is required')
  }
  nonEmptyString(evidence.sourceRef.sourceId, 'normalizedEvidence.sourceRef.sourceId')
  nonEmptyString(evidence.sourceRef.algorithm, 'normalizedEvidence.sourceRef.algorithm')
  nonEmptyString(evidence.sourceRef.digest, 'normalizedEvidence.sourceRef.digest')
  if (!Array.isArray(evidence.units)) {
    throw new TypeError('normalizedEvidence.units must be an array')
  }

  const unitIds = new Set()
  for (const unit of evidence.units) {
    nonEmptyString(unit?.unitId, 'normalizedEvidence unitId')
    if (unitIds.has(unit.unitId)) {
      throw new TypeError(`duplicate normalized evidence unitId: ${unit.unitId}`)
    }
    unitIds.add(unit.unitId)
    if (unit.canonicalMutation !== false) {
      throw new TypeError(`normalized evidence unit ${unit.unitId} must have canonicalMutation=false`)
    }
    if (unit.sourceRef?.sourceId !== evidence.sourceRef.sourceId || unit.sourceRef?.digest !== evidence.sourceRef.digest) {
      throw new TypeError(`normalized evidence unit ${unit.unitId} sourceRef does not match document sourceRef`)
    }
    if (!Number.isInteger(unit.lineStart) || !Number.isInteger(unit.lineEnd) || unit.lineStart < 1 || unit.lineEnd < unit.lineStart) {
      throw new TypeError(`normalized evidence unit ${unit.unitId} has invalid line range`)
    }
  }

  return unitIds
}

function resolveUnitReference(normalizedEvidence, unitIndex, reference, field) {
  if (!reference || typeof reference !== 'object') {
    throw new TypeError(`${field} entry must be an object`)
  }
  const unitId = nonEmptyString(reference.unitId, `${field}.unitId`)
  if (!unitIndex.has(unitId)) {
    throw new TypeError(`${field} references unknown evidence unit: ${unitId}`)
  }
  const unit = normalizedEvidence.units.find((entry) => entry.unitId === unitId)
  const support = nonEmptyString(reference.support, `${field}.support`)

  return {
    sourceId: normalizedEvidence.sourceRef.sourceId,
    algorithm: normalizedEvidence.sourceRef.algorithm,
    digest: normalizedEvidence.sourceRef.digest,
    unitId,
    lineStart: unit.lineStart,
    lineEnd: unit.lineEnd,
    headingPath: Array.isArray(unit.headingPath) ? [...unit.headingPath] : [],
    support,
  }
}

function normalizeCounterEvidence(normalizedEvidence, unitIndex, entries) {
  if (!Array.isArray(entries)) throw new TypeError('counterEvidence must be an array')

  return entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError(`counterEvidence[${index}] must be an object`)
    }
    if (entry.unitId !== undefined) {
      return {
        kind: 'evidence',
        ...resolveUnitReference(normalizedEvidence, unitIndex, entry, `counterEvidence[${index}]`),
      }
    }
    return {
      kind: 'note',
      note: nonEmptyString(entry.note, `counterEvidence[${index}].note`),
    }
  })
}

function normalizeConfidence(confidence) {
  if (!confidence || typeof confidence !== 'object') {
    throw new TypeError('confidence is required')
  }
  if (typeof confidence.score !== 'number' || !Number.isFinite(confidence.score) || confidence.score < 0 || confidence.score > 1) {
    throw new TypeError('confidence.score must be a number between 0 and 1')
  }
  return {
    score: confidence.score,
    rationale: nonEmptyString(confidence.rationale, 'confidence.rationale'),
  }
}

export function createExodusCandidateClaim({
  normalizedEvidence,
  id,
  claimType,
  statement,
  interpretation = null,
  evidence = [],
  counterEvidence = [],
  confidence,
  runtimePhenotypeRisk = 'unknown',
  notes = null,
}) {
  const unitIndex = validateNormalizedEvidence(normalizedEvidence)
  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new TypeError('evidence must contain at least one normalized evidence unit reference')
  }
  if (!RUNTIME_PHENOTYPE_RISKS.includes(runtimePhenotypeRisk)) {
    throw new TypeError(`runtimePhenotypeRisk must be one of: ${RUNTIME_PHENOTYPE_RISKS.join(', ')}`)
  }
  if (interpretation !== null) nonEmptyString(interpretation, 'interpretation')
  if (notes !== null) nonEmptyString(notes, 'notes')

  const claim = {
    claimVersion: EXODUS_CANDIDATE_CLAIM_VERSION,
    id: nonEmptyString(id, 'id'),
    claimType: nonEmptyString(claimType, 'claimType'),
    statement: nonEmptyString(statement, 'statement'),
    interpretation,
    evidence: evidence.map((reference, index) => resolveUnitReference(
      normalizedEvidence,
      unitIndex,
      reference,
      `evidence[${index}]`,
    )),
    counterEvidence: normalizeCounterEvidence(normalizedEvidence, unitIndex, counterEvidence),
    confidence: normalizeConfidence(confidence),
    canonicalStatus: 'candidate',
    runtimePhenotypeRisk,
    notes,
    canonicalMutation: false,
  }

  return deepFreeze(deepClone(claim))
}

export function validateExodusCandidateClaim(claim) {
  const errors = []
  if (!claim || typeof claim !== 'object') return { valid: false, errors: ['claim must be an object'] }
  if (claim.claimVersion !== EXODUS_CANDIDATE_CLAIM_VERSION) errors.push(`claimVersion must be ${EXODUS_CANDIDATE_CLAIM_VERSION}`)
  for (const field of ['id', 'claimType', 'statement']) {
    if (typeof claim[field] !== 'string' || claim[field].trim() === '') errors.push(`${field} must be a non-empty string`)
  }
  if (!Array.isArray(claim.evidence) || claim.evidence.length === 0) errors.push('evidence must be a non-empty array')
  if (!Array.isArray(claim.counterEvidence)) errors.push('counterEvidence must be an array')
  if (typeof claim.confidence?.score !== 'number' || claim.confidence.score < 0 || claim.confidence.score > 1) errors.push('confidence.score must be between 0 and 1')
  if (typeof claim.confidence?.rationale !== 'string' || claim.confidence.rationale.trim() === '') errors.push('confidence.rationale is required')
  if (claim.canonicalStatus !== 'candidate') errors.push('canonicalStatus must remain candidate')
  if (claim.canonicalMutation !== false) errors.push('canonicalMutation must remain false')
  if (!RUNTIME_PHENOTYPE_RISKS.includes(claim.runtimePhenotypeRisk)) errors.push('runtimePhenotypeRisk is invalid')

  for (const [index, reference] of (Array.isArray(claim.evidence) ? claim.evidence : []).entries()) {
    for (const field of ['sourceId', 'algorithm', 'digest', 'unitId', 'support']) {
      if (typeof reference?.[field] !== 'string' || reference[field].trim() === '') errors.push(`evidence[${index}].${field} is required`)
    }
    if (!Number.isInteger(reference?.lineStart) || !Number.isInteger(reference?.lineEnd) || reference.lineStart < 1 || reference.lineEnd < reference.lineStart) {
      errors.push(`evidence[${index}] has invalid line range`)
    }
  }

  return { valid: errors.length === 0, errors }
}
