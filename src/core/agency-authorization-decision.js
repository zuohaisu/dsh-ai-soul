import { validateAgencyPermissionRequest } from './agency-permission-request.js'

export const AGENCY_AUTHORIZATION_DECISION_VERSION = 1
export const AGENCY_AUTHORIZATION_DECISIONS = ['approved', 'rejected']
export const AGENCY_AUTHORIZATION_DECISION_MAX_ACTOR_ID_LENGTH = 160
export const AGENCY_AUTHORIZATION_DECISION_MAX_ACTOR_ROLE_LENGTH = 120
export const AGENCY_AUTHORIZATION_DECISION_MAX_REASON_LENGTH = 500

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

export function validateAgencyAuthorizationDecision(decision) {
  const errors = []
  if (!isRecord(decision)) return { valid: false, errors: ['agency authorization decision must be an object'] }
  if (decision.version !== AGENCY_AUTHORIZATION_DECISION_VERSION) errors.push(`version must be ${AGENCY_AUTHORIZATION_DECISION_VERSION}`)
  if (!decision.id || typeof decision.id !== 'string') errors.push('id is required')
  if (!decision.at || typeof decision.at !== 'string') errors.push('at is required')
  if (!decision.soulId || typeof decision.soulId !== 'string') errors.push('soulId is required')
  if (!decision.intentId || typeof decision.intentId !== 'string') errors.push('intentId is required')
  if (!decision.requestId || typeof decision.requestId !== 'string') errors.push('requestId is required')
  if (!AGENCY_AUTHORIZATION_DECISIONS.includes(decision.decision)) errors.push('decision must be approved or rejected')
  validateBoundedString(decision.decisionMaker?.id, 'decisionMaker.id', AGENCY_AUTHORIZATION_DECISION_MAX_ACTOR_ID_LENGTH, errors)
  validateBoundedString(decision.decisionMaker?.role, 'decisionMaker.role', AGENCY_AUTHORIZATION_DECISION_MAX_ACTOR_ROLE_LENGTH, errors)
  validateBoundedString(decision.reason, 'reason', AGENCY_AUTHORIZATION_DECISION_MAX_REASON_LENGTH, errors)
  if (!decision.capability || typeof decision.capability !== 'string') errors.push('capability is required')
  if (!decision.scope || typeof decision.scope !== 'string') errors.push('scope is required')
  if (!isRecord(decision.provenance)) errors.push('provenance is required')
  if (decision.decision === 'approved' && decision.authority !== 'authorized') errors.push('approved decision authority must be authorized')
  if (decision.decision === 'rejected' && decision.authority !== 'none') errors.push('rejected decision authority must be none')
  for (const forbidden of ['executed', 'scheduled', 'execution', 'schedule', 'toolCall', 'actuator', 'result', 'evidence']) {
    if (Object.hasOwn(decision, forbidden)) errors.push(`${forbidden} is not allowed on an agency authorization decision`)
  }
  return { valid: errors.length === 0, errors }
}

export function createAgencyAuthorizationDecision({
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  request,
  decision,
  decisionMaker,
  reason,
  capability = request?.capability,
  scope = request?.scope,
  provenance,
} = {}) {
  const requestValidation = validateAgencyPermissionRequest(request)
  if (!requestValidation.valid) throw new TypeError(`invalid agency permission request: ${requestValidation.errors.join('; ')}`)
  if (capability !== request.capability) throw new TypeError('authorization capability must exactly match the permission request')
  if (scope !== request.scope) throw new TypeError('authorization scope must exactly match the permission request')

  const authorizationDecision = {
    version: AGENCY_AUTHORIZATION_DECISION_VERSION,
    id,
    at,
    soulId: request.soulId,
    intentId: request.intentId,
    requestId: request.id,
    decision,
    decisionMaker: clone(decisionMaker),
    reason,
    capability,
    scope,
    provenance: clone(provenance),
    authority: decision === 'approved' ? 'authorized' : 'none',
  }
  const validation = validateAgencyAuthorizationDecision(authorizationDecision)
  if (!validation.valid) throw new TypeError(`invalid agency authorization decision: ${validation.errors.join('; ')}`)
  return authorizationDecision
}
