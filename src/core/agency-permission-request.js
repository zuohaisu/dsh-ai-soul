import { validateAgencyIntent } from './agency-intent.js'

export const AGENCY_PERMISSION_REQUEST_VERSION = 1
export const AGENCY_PERMISSION_REQUEST_MAX_CAPABILITY_LENGTH = 120
export const AGENCY_PERMISSION_REQUEST_MAX_SCOPE_LENGTH = 300
export const AGENCY_PERMISSION_REQUEST_MAX_JUSTIFICATION_LENGTH = 500

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

export function validateAgencyPermissionRequest(request) {
  const errors = []

  if (!isRecord(request)) return { valid: false, errors: ['agency permission request must be an object'] }
  if (request.version !== AGENCY_PERMISSION_REQUEST_VERSION) errors.push(`version must be ${AGENCY_PERMISSION_REQUEST_VERSION}`)
  if (!request.id || typeof request.id !== 'string') errors.push('id is required')
  if (!request.at || typeof request.at !== 'string') errors.push('at is required')
  if (!request.soulId || typeof request.soulId !== 'string') errors.push('soulId is required')
  if (!request.intentId || typeof request.intentId !== 'string') errors.push('intentId is required')

  validateBoundedString(request.capability, 'capability', AGENCY_PERMISSION_REQUEST_MAX_CAPABILITY_LENGTH, errors)
  validateBoundedString(request.scope, 'scope', AGENCY_PERMISSION_REQUEST_MAX_SCOPE_LENGTH, errors)
  validateBoundedString(request.justification, 'justification', AGENCY_PERMISSION_REQUEST_MAX_JUSTIFICATION_LENGTH, errors)

  if (!isRecord(request.provenance)) errors.push('provenance is required')
  if (request.status !== 'pending') errors.push('status must be pending')
  if (request.authority !== 'none') errors.push('authority must be none')

  for (const forbidden of [
    'approved',
    'authorized',
    'executed',
    'scheduled',
    'decision',
    'execution',
    'schedule',
    'toolCall',
    'actuator',
  ]) {
    if (Object.hasOwn(request, forbidden)) errors.push(`${forbidden} is not allowed on an agency permission request`)
  }

  return { valid: errors.length === 0, errors }
}

export function createAgencyPermissionRequest({
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  intent,
  capability,
  scope,
  justification,
  provenance,
} = {}) {
  const intentValidation = validateAgencyIntent(intent)
  if (!intentValidation.valid) {
    throw new TypeError(`invalid agency intent: ${intentValidation.errors.join('; ')}`)
  }

  const request = {
    version: AGENCY_PERMISSION_REQUEST_VERSION,
    id,
    at,
    soulId: intent.soulId,
    intentId: intent.id,
    capability,
    scope,
    justification,
    provenance: clone(provenance),
    status: 'pending',
    authority: 'none',
  }

  const validation = validateAgencyPermissionRequest(request)
  if (!validation.valid) throw new TypeError(`invalid agency permission request: ${validation.errors.join('; ')}`)
  return request
}
