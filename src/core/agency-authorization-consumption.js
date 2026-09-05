import { validateAgencyAuthorizationDecision } from './agency-authorization-decision.js'

export const AGENCY_AUTHORIZATION_CONSUMPTION_VERSION = 1
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

export function validateAgencyAuthorizationConsumption(consumption) {
  const errors = []
  if (!isRecord(consumption)) return { valid: false, errors: ['agency authorization consumption must be an object'] }
  if (consumption.version !== AGENCY_AUTHORIZATION_CONSUMPTION_VERSION) errors.push(`version must be ${AGENCY_AUTHORIZATION_CONSUMPTION_VERSION}`)
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

  const consumption = {
    version: AGENCY_AUTHORIZATION_CONSUMPTION_VERSION,
    id,
    consumedAt,
    decisionId: decision.id,
    soulId: decision.soulId,
    capability: decision.capability,
    scope: decision.scope,
    consumer: clone(consumer),
    reason,
    provenance: clone(provenance),
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
