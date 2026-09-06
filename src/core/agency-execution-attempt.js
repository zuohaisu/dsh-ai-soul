import { validateAgencyAuthorizationConsumption } from './agency-authorization-consumption.js'

export const AGENCY_EXECUTION_ATTEMPT_VERSION = 1
export const AGENCY_EXECUTION_ATTEMPT_MAX_ACTOR_ID_LENGTH = 160
export const AGENCY_EXECUTION_ATTEMPT_MAX_ACTOR_ROLE_LENGTH = 120
export const AGENCY_EXECUTION_ATTEMPT_MAX_CHANNEL_LENGTH = 160
export const AGENCY_EXECUTION_ATTEMPT_MAX_REASON_LENGTH = 500

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

export function validateAgencyExecutionAttempt(attempt) {
  const errors = []
  if (!isRecord(attempt)) return { valid: false, errors: ['agency execution attempt must be an object'] }

  if (attempt.version !== AGENCY_EXECUTION_ATTEMPT_VERSION) errors.push(`version must be ${AGENCY_EXECUTION_ATTEMPT_VERSION}`)
  if (!attempt.id || typeof attempt.id !== 'string') errors.push('id is required')
  if (!attempt.attemptedAt || typeof attempt.attemptedAt !== 'string' || !Number.isFinite(Date.parse(attempt.attemptedAt))) errors.push('attemptedAt must be a valid timestamp')
  if (!attempt.consumptionId || typeof attempt.consumptionId !== 'string') errors.push('consumptionId is required')
  if (!attempt.decisionId || typeof attempt.decisionId !== 'string') errors.push('decisionId is required')
  if (!attempt.soulId || typeof attempt.soulId !== 'string') errors.push('soulId is required')
  if (!attempt.capability || typeof attempt.capability !== 'string') errors.push('capability is required')
  if (!attempt.scope || typeof attempt.scope !== 'string') errors.push('scope is required')
  validateBoundedString(attempt.executor?.id, 'executor.id', AGENCY_EXECUTION_ATTEMPT_MAX_ACTOR_ID_LENGTH, errors)
  validateBoundedString(attempt.executor?.role, 'executor.role', AGENCY_EXECUTION_ATTEMPT_MAX_ACTOR_ROLE_LENGTH, errors)
  validateBoundedString(attempt.channel, 'channel', AGENCY_EXECUTION_ATTEMPT_MAX_CHANNEL_LENGTH, errors)
  validateBoundedString(attempt.reason, 'reason', AGENCY_EXECUTION_ATTEMPT_MAX_REASON_LENGTH, errors)
  if (!isRecord(attempt.provenance)) errors.push('provenance is required')

  for (const forbidden of ['result', 'outcome', 'success', 'failure', 'completed', 'completion', 'scheduled', 'schedule', 'toolCall', 'toolPayload', 'actuator', 'actuatorPayload']) {
    if (Object.hasOwn(attempt, forbidden)) errors.push(`${forbidden} is not allowed on agency execution-attempt evidence`)
  }

  return { valid: errors.length === 0, errors }
}

export function createAgencyExecutionAttempt({
  id = crypto.randomUUID(),
  attemptedAt = new Date().toISOString(),
  consumption,
  executor,
  channel,
  reason,
  provenance,
} = {}) {
  const validation = validateAgencyAuthorizationConsumption(consumption)
  if (!validation.valid) throw new TypeError(`invalid agency authorization consumption: ${validation.errors.join('; ')}`)

  const attempt = {
    version: AGENCY_EXECUTION_ATTEMPT_VERSION,
    id,
    attemptedAt,
    consumptionId: consumption.id,
    decisionId: consumption.decisionId,
    soulId: consumption.soulId,
    capability: consumption.capability,
    scope: consumption.scope,
    executor: clone(executor),
    channel,
    reason,
    provenance: clone(provenance),
  }

  const attemptValidation = validateAgencyExecutionAttempt(attempt)
  if (!attemptValidation.valid) throw new TypeError(`invalid agency execution attempt: ${attemptValidation.errors.join('; ')}`)
  return attempt
}

export function validateAgencyExecutionAttemptLineage(attempt, consumption) {
  const attemptValidation = validateAgencyExecutionAttempt(attempt)
  if (!attemptValidation.valid) return attemptValidation

  const consumptionValidation = validateAgencyAuthorizationConsumption(consumption)
  if (!consumptionValidation.valid) return { valid: false, errors: consumptionValidation.errors.map((error) => `consumption: ${error}`) }

  const errors = []
  if (attempt.consumptionId !== consumption.id) errors.push('consumptionId does not match authorization consumption')
  if (attempt.decisionId !== consumption.decisionId) errors.push('decisionId does not match authorization consumption')
  if (attempt.soulId !== consumption.soulId) errors.push('soulId does not match authorization consumption')
  if (attempt.capability !== consumption.capability) errors.push('capability does not match authorization consumption')
  if (attempt.scope !== consumption.scope) errors.push('scope does not match authorization consumption')

  return { valid: errors.length === 0, errors }
}
