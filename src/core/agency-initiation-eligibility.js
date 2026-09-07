export const AGENCY_INITIATION_ELIGIBILITY_VERSION = 1

export const AGENCY_INITIATION_TRIGGER_CLASSES = Object.freeze([
  'explicit-user-request',
  'governed-commitment-due',
  'governed-safety-concern',
  'governed-reflection-result',
])

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function assessAgencyInitiationEligibility({
  soulId,
  candidateSoulId,
  triggerClass,
  reason,
  contextRefs,
  provenance,
} = {}) {
  const reasons = []

  if (!nonEmptyString(soulId)) reasons.push('soul-id-required')
  if (!nonEmptyString(candidateSoulId)) reasons.push('candidate-soul-id-required')
  if (nonEmptyString(soulId) && nonEmptyString(candidateSoulId) && soulId !== candidateSoulId) reasons.push('soul-mismatch')

  if (!AGENCY_INITIATION_TRIGGER_CLASSES.includes(triggerClass)) reasons.push('explicit-trigger-required')
  if (!nonEmptyString(reason)) reasons.push('reason-required')

  if (!Array.isArray(contextRefs) || contextRefs.length === 0) {
    reasons.push('context-required')
  } else if (contextRefs.some((ref) => !isRecord(ref) || !nonEmptyString(ref.type) || !nonEmptyString(ref.id))) {
    reasons.push('context-invalid')
  }

  if (!isRecord(provenance) || Object.keys(provenance).length === 0) reasons.push('provenance-required')

  return Object.freeze({
    version: AGENCY_INITIATION_ELIGIBILITY_VERSION,
    eligible: reasons.length === 0,
    reasons: Object.freeze(reasons),
    authority: 'none',
    effects: Object.freeze({
      permission: false,
      authorization: false,
      execution: false,
      scheduling: false,
      polling: false,
      memoryWrite: false,
      canonicalMutation: false,
    }),
  })
}
