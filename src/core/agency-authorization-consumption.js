import { validateAgencyAuthorizationDecision } from './agency-authorization-decision.js'

export const AGENCY_AUTHORIZATION_CONSUMPTION_VERSION = 2
export const AGENCY_AUTHORIZATION_CONSUMPTION_LEGACY_VERSION = 1
export const AGENCY_AUTHORIZATION_CONSUMPTION_MAX_ACTOR_ID_LENGTH = 160
export const AGENCY_AUTHORIZATION_CONSUMPTION_MAX_ACTOR_ROLE_LENGTH = 120
export const AGENCY_AUTHORIZATION_CONSUMPTION_MAX_REASON_LENGTH = 500

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function validateBoundedString(value, name, maxLength, errors) {
  if (!value || typeof value !== 'string') errors.push(`${name} is required`)
  else if (value.length > maxLength) errors.push(`${name} must be <= ${maxLength} characters`)
}

function validateGrounding(consumption, errors) {
  if (consumption.version === AGENCY_AUTHORIZATION_CONSUMPTION_LEGACY_VERSION) return
  if (!['grounded', 'legacy-ungrounded'].includes(consumption.groundingMode)) {
    errors.push('groundingMode must be grounded or legacy-ungrounded')
    return
  }
  if (!consumption.intentId || typeof consumption.intentId !== 'string') errors.push('intentId is required')
  if (!consumption.requestId || typeof consumption.requestId !== 'string') errors.push('requestId is required')
  if (consumption.groundingMode === 'grounded') {
    if (!isRecord(consumption.initiationGrounding)) {
      errors.push('initiationGrounding is required for grounded authorization consumptions')
      return
    }
    const grounding = consumption.initiationGrounding
    if (!grounding.evidenceId || typeof grounding.evidenceId !== 'string') errors.push('initiationGrounding.evidenceId is required')
    if (!grounding.evidenceType || typeof grounding.evidenceType !== 'string') errors.push('initiationGrounding.evidenceType is required')
    if (!isRecord(grounding.source)) errors.push('initiationGrounding.source is required')
    if (!isRecord(grounding.provenance)) errors.push('initiationGrounding.provenance is required')
  } else if (Object.hasOwn(consumption, 'initiationGrounding')) {
    errors.push('legacy-ungrounded authorization consumptions must not invent initiationGrounding')
  }
}

export function validateAgencyAuthorizationConsumption(consumption) {
  const errors = []
  if (!isRecord(consumption)) return { valid: false, errors: ['agency authorization consumption must be an object'] }
  if (![AGENCY_AUTHORIZATION_CONSUMPTION_LEGACY_VERSION, AGENCY_AUTHORIZATION_CONSUMPTION_VERSION].includes(consumption.version)) errors.push(`version must be ${AGENCY_AUTHORIZATION_CONSUMPTION_LEGACY_VERSION} or ${AGENCY_AUTHORIZATION_CONSUMPTION_VERSION}`)
  if (!consumption.id || typeof consumption.id !== 'string') errors.push('id is required')
  if (!consumption.consumedAt || typeof consumption.consumedAt !== 'string' || !Number.isFinite(Date.parse(consumption.consumedAt))) errors.push('consumedAt must be a valid timestamp')
  if (!consumption.decisionId || typeof consumption.decisionId !== 'string') errors.push('decisionId is required')
  if (!consumption.soulId || typeof consumption.soulId !== 'string') errors.push('soulId is required')
  if (!consumption.capability || typeof consumption.capability !== 'string') errors.push('capability is required')
  if (!consumption.scope || typeof consumption.scope !== 'string') errors.push('scope is required')
  validateBoundedString(consumption.consumer?.id, 'consumer.id', AGENCY_AUTHORIZATION_CONSUMPTION_MAX_ACTOR_ID_LENGTH, errors)
  validateBoundedString(consumption.consumer?.role, 'consumer.role', AGENCY_AUTHORIZATION_CONSUMPTION_MAX_ACTOR_ROLE_LENGTH, errors)
  validateBoundedString(consumption.reason, 'reason', AGENCY_AUTHORIZATION_CONSUMPTION_MAX_REASON_LENGTH, errors)
  if (!isRecord(consumption.provenance)) errors.push('provenance is required')
  validateGrounding(consumption, errors)
  for (const forbidden of ['executed', 'execution', 'scheduled', 'schedule', 'toolCall', 'actuator', 'result', 'success', 'failure']) {
    if (Object.hasOwn(consumption, forbidden)) errors.push(`${forbidden} is not allowed on agency authorization consumption evidence`)
  }
  return { valid: errors.length === 0, errors }
}

export function createAgencyAuthorizationConsumption({
  id = crypto.randomUUID(),
  consumedAt = new Date().toISOString(),
  decision,
  consumer,
  reason,
  provenance,
} = {}) {
  const validation = validateAgencyAuthorizationDecision(decision)
  if (!validation.valid) throw new TypeError(`invalid agency authorization decision: ${validation.errors.join('; ')}`)
  if (decision.decision !== 'approved' || decision.authority !== 'authorized') throw new TypeError('only an approved authorization decision may be consumed')
  if (!isRecord(provenance)) throw new TypeError('authorization consumption provenance is required')
  if (Object.hasOwn(provenance, 'triggerEvidence') || Object.hasOwn(provenance, 'initiationGrounding')) {
    throw new TypeError('authorization consumption provenance must not replace initiation grounding')
  }

  const grounded = decision.version !== 1 && decision.groundingMode === 'grounded'
  const consumption = {
    version: AGENCY_AUTHORIZATION_CONSUMPTION_VERSION,
    id,
    consumedAt,
    decisionId: decision.id,
    intentId: decision.intentId,
    requestId: decision.requestId,
    soulId: decision.soulId,
    capability: decision.capability,
    scope: decision.scope,
    consumer: clone(consumer),
    reason,
    provenance: clone(provenance),
    groundingMode: grounded ? 'grounded' : 'legacy-ungrounded',
    ...(grounded ? { initiationGrounding: clone(decision.initiationGrounding) } : {}),
  }
  const consumptionValidation = validateAgencyAuthorizationConsumption(consumption)
  if (!consumptionValidation.valid) throw new TypeError(`invalid agency authorization consumption: ${consumptionValidation.errors.join('; ')}`)
  return consumption
}

export function deriveConsumedAuthorizationDecisionIds(consumptions = []) {
  if (!Array.isArray(consumptions)) throw new TypeError('consumptions must be an array')
  const ids = new Set()
  for (const consumption of consumptions) {
    const validation = validateAgencyAuthorizationConsumption(consumption)
    if (!validation.valid) throw new TypeError(`invalid agency authorization consumption: ${validation.errors.join('; ')}`)
    ids.add(consumption.decisionId)
  }
  return [...ids].sort()
}
