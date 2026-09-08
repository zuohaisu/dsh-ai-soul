import { validateAgencyExecutionAttempt } from './agency-execution-attempt.js'

export const AGENCY_EXECUTION_OUTCOME_VERSION = 2
export const AGENCY_EXECUTION_OUTCOME_LEGACY_VERSION = 1
export const AGENCY_EXECUTION_OUTCOME_STATUSES = Object.freeze(['succeeded', 'failed'])
export const AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ID_LENGTH = 160
export const AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ROLE_LENGTH = 120
export const AGENCY_EXECUTION_OUTCOME_MAX_CHANNEL_LENGTH = 160
export const AGENCY_EXECUTION_OUTCOME_MAX_SUMMARY_LENGTH = 1000

function clone(value) { return structuredClone(value) }
function isRecord(value) { return value != null && typeof value === 'object' && !Array.isArray(value) }
function bounded(value, name, max, errors) { if (!value || typeof value !== 'string') errors.push(`${name} is required`); else if (value.length > max) errors.push(`${name} must be <= ${max} characters`) }
function validateGrounding(outcome, errors) {
  if (outcome.version === AGENCY_EXECUTION_OUTCOME_LEGACY_VERSION) return
  if (!['grounded', 'legacy-ungrounded'].includes(outcome.groundingMode)) { errors.push('groundingMode must be grounded or legacy-ungrounded'); return }
  if (outcome.groundingMode === 'grounded') {
    for (const field of ['intentId', 'requestId']) if (!outcome[field] || typeof outcome[field] !== 'string') errors.push(`${field} is required for grounded execution outcomes`)
    if (!isRecord(outcome.initiationGrounding)) { errors.push('initiationGrounding is required for grounded execution outcomes'); return }
    const grounding = outcome.initiationGrounding
    if (!grounding.evidenceId || typeof grounding.evidenceId !== 'string') errors.push('initiationGrounding.evidenceId is required')
    if (!grounding.evidenceType || typeof grounding.evidenceType !== 'string') errors.push('initiationGrounding.evidenceType is required')
    if (!isRecord(grounding.source)) errors.push('initiationGrounding.source is required')
    if (!isRecord(grounding.provenance)) errors.push('initiationGrounding.provenance is required')
  } else {
    if (Object.hasOwn(outcome, 'initiationGrounding')) errors.push('legacy-ungrounded execution outcomes must not invent initiationGrounding')
    for (const field of ['intentId', 'requestId']) if (Object.hasOwn(outcome, field) && outcome[field] !== undefined && typeof outcome[field] !== 'string') errors.push(`${field} must be a string when present`)
  }
}

export function validateAgencyExecutionOutcome(outcome) {
  const errors = []
  if (!isRecord(outcome)) return { valid: false, errors: ['agency execution outcome must be an object'] }
  if (![AGENCY_EXECUTION_OUTCOME_LEGACY_VERSION, AGENCY_EXECUTION_OUTCOME_VERSION].includes(outcome.version)) errors.push(`version must be ${AGENCY_EXECUTION_OUTCOME_LEGACY_VERSION} or ${AGENCY_EXECUTION_OUTCOME_VERSION}`)
  for (const field of ['id', 'attemptId', 'consumptionId', 'decisionId', 'soulId', 'capability', 'scope']) if (!outcome[field] || typeof outcome[field] !== 'string') errors.push(`${field} is required`)
  if (!outcome.recordedAt || typeof outcome.recordedAt !== 'string' || !Number.isFinite(Date.parse(outcome.recordedAt))) errors.push('recordedAt must be a valid timestamp')
  if (!AGENCY_EXECUTION_OUTCOME_STATUSES.includes(outcome.status)) errors.push(`status must be one of: ${AGENCY_EXECUTION_OUTCOME_STATUSES.join(', ')}`)
  bounded(outcome.reporter?.id, 'reporter.id', AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ID_LENGTH, errors); bounded(outcome.reporter?.role, 'reporter.role', AGENCY_EXECUTION_OUTCOME_MAX_ACTOR_ROLE_LENGTH, errors); bounded(outcome.channel, 'channel', AGENCY_EXECUTION_OUTCOME_MAX_CHANNEL_LENGTH, errors); bounded(outcome.summary, 'summary', AGENCY_EXECUTION_OUTCOME_MAX_SUMMARY_LENGTH, errors)
  if (!isRecord(outcome.provenance)) errors.push('provenance is required')
  validateGrounding(outcome, errors)
  for (const forbidden of ['authority', 'authorized', 'approved', 'scheduled', 'schedule', 'toolCall', 'toolPayload', 'actuator', 'actuatorPayload', 'retry', 'retryAt']) if (Object.hasOwn(outcome, forbidden)) errors.push(`${forbidden} is not allowed on agency execution-outcome evidence`)
  return { valid: errors.length === 0, errors }
}

export function createAgencyExecutionOutcome({ id = crypto.randomUUID(), recordedAt = new Date().toISOString(), attempt, status, reporter, channel, summary, provenance } = {}) {
  const validation = validateAgencyExecutionAttempt(attempt)
  if (!validation.valid) throw new TypeError(`invalid agency execution attempt: ${validation.errors.join('; ')}`)
  if (!isRecord(provenance)) throw new TypeError('execution outcome provenance is required')
  if (Object.hasOwn(provenance, 'triggerEvidence') || Object.hasOwn(provenance, 'initiationGrounding')) throw new TypeError('execution outcome provenance must not replace initiation grounding')
  const grounded = attempt.version !== 1 && attempt.groundingMode === 'grounded'
  const outcome = { version: AGENCY_EXECUTION_OUTCOME_VERSION, id, recordedAt, attemptId: attempt.id, consumptionId: attempt.consumptionId, decisionId: attempt.decisionId, ...(attempt.intentId !== undefined ? { intentId: attempt.intentId } : {}), ...(attempt.requestId !== undefined ? { requestId: attempt.requestId } : {}), soulId: attempt.soulId, capability: attempt.capability, scope: attempt.scope, status, reporter: clone(reporter), channel, summary, provenance: clone(provenance), groundingMode: grounded ? 'grounded' : 'legacy-ungrounded', ...(grounded ? { initiationGrounding: clone(attempt.initiationGrounding) } : {}) }
  const outcomeValidation = validateAgencyExecutionOutcome(outcome)
  if (!outcomeValidation.valid) throw new TypeError(`invalid agency execution outcome: ${outcomeValidation.errors.join('; ')}`)
  return outcome
}

export function validateAgencyExecutionOutcomeLineage(outcome, attempt) {
  const outcomeValidation = validateAgencyExecutionOutcome(outcome); if (!outcomeValidation.valid) return outcomeValidation
  const attemptValidation = validateAgencyExecutionAttempt(attempt); if (!attemptValidation.valid) return { valid: false, errors: attemptValidation.errors.map((error) => `attempt: ${error}`) }
  const errors = []
  for (const [outcomeField, attemptField] of [['attemptId', 'id'], ['consumptionId', 'consumptionId'], ['decisionId', 'decisionId'], ['soulId', 'soulId'], ['capability', 'capability'], ['scope', 'scope']]) if (outcome[outcomeField] !== attempt[attemptField]) errors.push(`${outcomeField} does not match execution attempt`)
  if (outcome.version !== 1 && attempt.version !== 1) {
    if (outcome.intentId !== attempt.intentId) errors.push('intentId does not match execution attempt')
    if (outcome.requestId !== attempt.requestId) errors.push('requestId does not match execution attempt')
    if (outcome.groundingMode !== attempt.groundingMode) errors.push('groundingMode does not match execution attempt')
    if (JSON.stringify(outcome.initiationGrounding) !== JSON.stringify(attempt.initiationGrounding)) errors.push('initiationGrounding does not match execution attempt')
  }
  return { valid: errors.length === 0, errors }
}
