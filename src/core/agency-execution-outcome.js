import { validateAgencyExecutionAttempt } from './agency-execution-attempt.js'

export const AGENCY_EXECUTION_OUTCOME_VERSION = 1
export const AGENCY_EXECUTION_OUTCOME_STATUSES = Object.freeze(['succeeded', 'failed'])
export const AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ID_LENGTH = 160
export const AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ROLE_LENGTH = 120
export const AGENCY_EXECUTION_OUTCOME_MAX_CHANNEL_LENGTH = 160
export const AGENCY_EXECUTION_OUTCOME_MAX_SUMMARY_LENGTH = 1000

function clone(value) { return structuredClone(value) }
function isRecord(value) { return value != null && typeof value === 'object' && !Array.isArray(value) }
function bounded(value, name, max, errors) {
  if (!value || typeof value !== 'string') errors.push(`${name} is required`)
  else if (value.length > max) errors.push(`${name} must be <= ${max} characters`)
}

export function validateAgencyExecutionOutcome(outcome) {
  const errors = []
  if (!isRecord(outcome)) return { valid: false, errors: ['agency execution outcome must be an object'] }
  if (outcome.version !== AGENCY_EXECUTION_OUTCOME_VERSION) errors.push(`version must be ${AGENCY_EXECUTION_OUTCOME_VERSION}`)
  for (const field of ['id', 'attemptId', 'consumptionId', 'decisionId', 'soulId', 'capability', 'scope']) {
    if (!outcome[field] || typeof outcome[field] !== 'string') errors.push(`${field} is required`)
  }
  if (!outcome.recordedAt || typeof outcome.recordedAt !== 'string' || !Number.isFinite(Date.parse(outcome.recordedAt))) errors.push('recordedAt must be a valid timestamp')
  if (!AGENCY_EXECUTION_OUTCOME_STATUSES.includes(outcome.status)) errors.push(`status must be one of: ${AGENCY_EXECUTION_OUTCOME_STATUSES.join(', ')}`)
  bounded(outcome.reporter?.id, 'reporter.id', AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ID_LENGTH, errors)
  bounded(outcome.reporter?.role, 'reporter.role', AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ROLE_LENGTH, errors)
  bounded(outcome.channel, 'channel', AGENCY_EXECUTION_OUTCOME_MAX_CHANNEL_LENGTH, errors)
  bounded(outcome.summary, 'summary', AGENCY_EXECUTION_OUTCOME_MAX_SUMMARY_LENGTH, errors)
  if (!isRecord(outcome.provenance)) errors.push('provenance is required')
  for (const forbidden of ['authority', 'authorized', 'approved', 'scheduled', 'schedule', 'toolCall', 'toolPayload', 'actuator', 'actuatorPayload', 'retry', 'retryAt']) {
    if (Object.hasOwn(outcome, forbidden)) errors.push(`${forbidden} is not allowed on agency execution-outcome evidence`)
  }
  return { valid: errors.length === 0, errors }
}

export function createAgencyExecutionOutcome({ id = crypto.randomUUID(), recordedAt = new Date().toISOString(), attempt, status, reporter, channel, summary, provenance } = {}) {
  const validation = validateAgencyExecutionAttempt(attempt)
  if (!validation.valid) throw new TypeError(`invalid agency execution attempt: ${validation.errors.join('; ')}`)
  const outcome = {
    version: AGENCY_EXECUTION_OUTCOME_VERSION,
    id,
    recordedAt,
    attemptId: attempt.id,
    consumptionId: attempt.consumptionId,
    decisionId: attempt.decisionId,
    soulId: attempt.soulId,
    capability: attempt.capability,
    scope: attempt.scope,
    status,
    reporter: clone(reporter),
    channel,
    summary,
    provenance: clone(provenance),
  }
  const outcomeValidation = validateAgencyExecutionOutcome(outcome)
  if (!outcomeValidation.valid) throw new TypeError(`invalid agency execution outcome: ${outcomeValidation.errors.join('; ')}`)
  return outcome
}

export function validateAgencyExecutionOutcomeLineage(outcome, attempt) {
  const outcomeValidation = validateAgencyExecutionOutcome(outcome)
  if (!outcomeValidation.valid) return outcomeValidation
  const attemptValidation = validateAgencyExecutionAttempt(attempt)
  if (!attemptValidation.valid) return { valid: false, errors: attemptValidation.errors.map((error) => `attempt: ${error}`) }
  const errors = []
  const pairs = [['attemptId', 'id'], ['consumptionId', 'consumptionId'], ['decisionId', 'decisionId'], ['soulId', 'soulId'], ['capability', 'capability'], ['scope', 'scope']]
  for (const [outcomeField, attemptField] of pairs) if (outcome[outcomeField] !== attempt[attemptField]) errors.push(`${outcomeField} does not match execution attempt`)
  return { valid: errors.length === 0, errors }
}
