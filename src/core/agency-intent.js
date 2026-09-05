export const AGENCY_INTENT_VERSION = 1
export const AGENCY_INTENT_MAX_ACTION_LENGTH = 500
export const AGENCY_INTENT_KINDS = Object.freeze(['communicate', 'reflect', 'prepare', 'request'])

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function validateAgencyIntent(intent) {
  const errors = []

  if (!isRecord(intent)) return { valid: false, errors: ['agency intent must be an object'] }
  if (intent.version !== AGENCY_INTENT_VERSION) errors.push(`version must be ${AGENCY_INTENT_VERSION}`)
  if (!intent.id || typeof intent.id !== 'string') errors.push('id is required')
  if (!intent.at || typeof intent.at !== 'string') errors.push('at is required')
  if (!intent.soulId || typeof intent.soulId !== 'string') errors.push('soulId is required')
  if (!AGENCY_INTENT_KINDS.includes(intent.kind)) errors.push(`kind must be one of: ${AGENCY_INTENT_KINDS.join(', ')}`)
  if (!intent.reason || typeof intent.reason !== 'string') errors.push('reason is required')

  if (!intent.proposedAction || typeof intent.proposedAction !== 'string') {
    errors.push('proposedAction is required')
  } else if (intent.proposedAction.length > AGENCY_INTENT_MAX_ACTION_LENGTH) {
    errors.push(`proposedAction must be <= ${AGENCY_INTENT_MAX_ACTION_LENGTH} characters`)
  }

  if (!Array.isArray(intent.contextRefs) || intent.contextRefs.length === 0) {
    errors.push('contextRefs must be a non-empty array')
  } else {
    intent.contextRefs.forEach((ref, index) => {
      if (!isRecord(ref)) errors.push(`contextRefs[${index}] must be an object`)
      else {
        if (!ref.type || typeof ref.type !== 'string') errors.push(`contextRefs[${index}].type is required`)
        if (!ref.id || typeof ref.id !== 'string') errors.push(`contextRefs[${index}].id is required`)
      }
    })
  }

  if (!isRecord(intent.provenance)) errors.push('provenance is required')
  if (intent.authority !== 'none') errors.push('authority must be none')

  for (const forbidden of ['approved', 'executed', 'scheduled', 'execution', 'schedule', 'toolCall', 'actuator']) {
    if (Object.hasOwn(intent, forbidden)) errors.push(`${forbidden} is not allowed on an agency intent`)
  }

  return { valid: errors.length === 0, errors }
}

export function createAgencyIntent({
  id = crypto.randomUUID(),
  at = new Date().toISOString(),
  soulId,
  kind,
  reason,
  proposedAction,
  contextRefs,
  provenance,
} = {}) {
  const intent = {
    version: AGENCY_INTENT_VERSION,
    id,
    at,
    soulId,
    kind,
    reason,
    proposedAction,
    contextRefs: clone(contextRefs),
    provenance: clone(provenance),
    authority: 'none',
  }

  const validation = validateAgencyIntent(intent)
  if (!validation.valid) throw new TypeError(`invalid agency intent: ${validation.errors.join('; ')}`)
  return intent
}
