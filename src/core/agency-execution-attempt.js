import { validateAgencyAuthorizationConsumption } from './agency-authorization-consumption.js'

export const AGENCY_EXECUTION_ATTEMPT_VERSION = 2
export const AGENCY_EXECUTION_ATTEMPT_LEGACY_VERSION = 1
export const AGENCY_EXECUTION_ATTEMPT_MAX_ACTOR_ID_LENGTH = 160
export const AGENCY_EXECUTION_ATTEMPT_MAX_ACTOR_ROLE_LENGTH = 120
export const AGENCY_EXECUTION_ATTEMPT_MAX_CHANNEL_LENGTH = 160
export const AGENCY_EXECUTION_ATTEMPT_MAX_REASON_LENGTH = 500

function clone(value) { return structuredClone(value) }
function isRecord(value) { return value != null && typeof value === 'object' && !Array.isArray(value) }
function validateBoundedString(value, name, maxLength, errors) {
  if (!value || typeof value !== 'string') errors.push(`${name} is required`)
  else if (value.length > maxLength) errors.push(`${name} must be <= ${maxLength} characters`)
}
function validateGrounding(attempt, errors) {
  if (attempt.version === AGENCY_EXECUTION_ATTEMPT_LEGACY_VERSION) return
  if (!['grounded', 'legacy-ungrounded'].includes(attempt.groundingMode)) {
    errors.push('groundingMode must be grounded or legacy-ungrounded')
    return
  }
  if (!attempt.intentId || typeof attempt.intentId !== 'string') errors.push('intentId is required')
  if (!attempt.requestId || typeof attempt.requestId !== 'string') errors.push('requestId is required')
  if (attempt.groundingMode === 'grounded') {
    if (!isRecord(attempt.initiationGrounding)) {
      errors.push('initiationGrounding is required for grounded execution attempts')
      return
    }
    const grounding = attempt.initiationGrounding
    if (!grounding.evidenceId || typeof grounding.evidenceId !== 'string') errors.push('initiationGrounding.evidenceId is required')
    if (!grounding.evidenceType || typeof grounding.evidenceType !== 'string') errors.push('initiationGrounding.evidenceType is required')
    if (!isRecord(grounding.source)) errors.push('initiationGrounding.source is required')
    if (!isRecord(grounding.provenance)) errors.push('initiationGrounding.provenance is required')
  } else if (Object.hasOwn(attempt, 'initiationGrounding')) {
    errors.push('legacy-ungrounded execution attempts must not invent initiationGrounding')
  }
}

export function validateAgencyExecutionAttempt(attempt) {
  const errors = []
  if (!isRecord(attempt)) return { valid: false, errors: ['agency execution attempt must be an object'] }
  if (![AGENCY_EXECUTION_ATTEMPT_LEGACY_VERSION, AGENCY_EXECUTION_ATTEMPT_VERSION].includes(attempt.version)) errors.push(`version must be ${AGENCY_EXECUTION_ATTEMPT_LEGACY_VERSION} or ${AGENCY_EXECUTION_ATTEMPT_VERSION}`)
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
  validateGrounding(attempt, errors)
  for (const forbidden of ['result', 'outcome', 'success', 'failure', 'completed', 'completion', 'scheduled', 'schedule', 'toolCall', 'toolPayload', 'actuator', 'actuatorPayload']) {
    if (Object.hasOwn(attempt, forbidden)) errors.push(`${forbidden} is not allowed on agency execution-attempt evidence`)
  }
  return { valid: errors.length === 0, errors }
}

export function createAgencyExecutionAttempt({ id = crypto.randomUUID(), attemptedAt = new Date().toISOString(), consumption, executor, channel, reason, provenance } = {}) {
  const validation = validateAgencyAuthorizationConsumption(consumption)
  if (!validation.valid) throw new TypeError(`invalid agency authorization consumption: ${validation.errors.join('; ')}`)
  if (!isRecord(provenance)) throw new TypeError('execution attempt provenance is required')
  if (Object.hasOwn(provenance, 'triggerEvidence') || Object.hasOwn(provenance, 'initiationGrounding')) throw new TypeError('execution attempt provenance must not replace initiation grounding')
  const grounded = consumption.version !== 1 && consumption.groundingMode === 'grounded'
  const attempt = {
    version: AGENCY_EXECUTION_ATTEMPT_VERSION,
    id, attemptedAt,
    consumptionId: consumption.id,
    decisionId: consumption.decisionId,
    intentId: consumption.intentId,
    requestId: consumption.requestId,
    soulId: consumption.soulId,
    capability: consumption.capability,
    scope: consumption.scope,
    executor: clone(executor), channel, reason, provenance: clone(provenance),
    groundingMode: grounded ? 'grounded' : 'legacy-ungrounded',
    ...(grounded ? { initiationGrounding: clone(consumption.initiationGrounding) } : {}),
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
  if (attempt.version !== 1 && consumption.version !== 1) {
    if (attempt.intentId !== consumption.intentId) errors.push('intentId does not match authorization consumption')
    if (attempt.requestId !== consumption.requestId) errors.push('requestId does not match authorization consumption')
    if (attempt.groundingMode !== consumption.groundingMode) errors.push('groundingMode does not match authorization consumption')
    if (JSON.stringify(attempt.initiationGrounding) !== JSON.stringify(consumption.initiationGrounding)) errors.push('initiationGrounding does not match authorization consumption')
  }
  return { valid: errors.length === 0, errors }
}
