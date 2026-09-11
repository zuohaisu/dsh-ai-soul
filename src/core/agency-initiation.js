import { assessAgencyInitiationEligibility } from './agency-initiation-eligibility.js'
import { createAgencyIntent } from './agency-intent.js'

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function assertAuthorityFreeInput(input) {
  if (!isRecord(input)) throw new TypeError('agency initiation input must be an object')
  for (const field of ['authority', 'approved', 'authorized', 'executed', 'scheduled', 'execution', 'schedule', 'toolCall', 'actuator']) {
    if (Object.hasOwn(input, field)) throw new TypeError(`agency initiation input must not carry ${field}`)
  }
}

export function createAgencyIntentFromTriggerEvidence({
  soulId,
  triggerEvidence,
  kind = 'request',
  reason,
  proposedAction,
  contextRefs,
  provenance,
  id,
  at,
  ...extra
} = {}) {
  assertAuthorityFreeInput(extra)

  const triggerClass = triggerEvidence?.triggerClass
  const eligibility = assessAgencyInitiationEligibility({
    soulId,
    candidateSoulId: triggerEvidence?.soulId,
    triggerClass,
    triggerEvidence,
    reason,
    contextRefs,
    provenance,
  })

  if (!eligibility.eligible) {
    throw new TypeError(`agency initiation is not eligible: ${eligibility.reasons.join('; ')}`)
  }

  const intentProvenance = {
    ...structuredClone(provenance),
    triggerEvidence: {
      id: triggerEvidence.id,
      type: triggerEvidence.type,
      triggerClass: triggerEvidence.triggerClass,
      source: structuredClone(triggerEvidence.source),
      provenance: structuredClone(triggerEvidence.provenance),
    },
  }

  return createAgencyIntent({
    ...(id == null ? {} : { id }),
    ...(at == null ? {} : { at }),
    soulId,
    kind,
    reason,
    proposedAction,
    contextRefs,
    provenance: intentProvenance,
  })
}

export function createAgencyIntentFromExplicitUserRequest(input = {}) {
  if (input?.triggerEvidence?.triggerClass !== 'explicit-user-request') {
    throw new TypeError('agency initiation is not eligible: explicit-user-request trigger required')
  }
  return createAgencyIntentFromTriggerEvidence(input)
}
