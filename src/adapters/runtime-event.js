import { createExperienceRecord } from '../core/experience.js'

export const RUNTIME_EVENT_ENVELOPE_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function encodeIdentityPart(value) {
  return encodeURIComponent(value)
}

export function validateRuntimeEventEnvelope(event) {
  const errors = []

  if (!isObject(event)) errors.push('runtime event must be an object')
  if (event?.version !== RUNTIME_EVENT_ENVELOPE_VERSION) {
    errors.push(`version must be ${RUNTIME_EVENT_ENVELOPE_VERSION}`)
  }
  if (!event?.runtime || typeof event.runtime !== 'string') errors.push('runtime is required')
  if (!event?.sessionId || typeof event.sessionId !== 'string') errors.push('sessionId is required')
  if (!event?.eventId || typeof event.eventId !== 'string') errors.push('eventId is required')
  if (!event?.at || typeof event.at !== 'string') errors.push('at is required')
  if (!event?.kind || typeof event.kind !== 'string') errors.push('kind is required')
  if (!isObject(event?.provenance)) errors.push('provenance is required')
  if (!Object.prototype.hasOwnProperty.call(event ?? {}, 'payload') || event?.payload === undefined) {
    errors.push('payload is required')
  }
  if (event?.eventRef !== undefined && !isObject(event.eventRef)) {
    errors.push('eventRef must be an object when provided')
  }

  return { valid: errors.length === 0, errors }
}

export function mapRuntimeEventToExperience(event) {
  const validation = validateRuntimeEventEnvelope(event)
  if (!validation.valid) {
    throw new TypeError(`invalid runtime event: ${validation.errors.join('; ')}`)
  }

  const identity = [event.runtime, event.sessionId, event.eventId]
    .map(encodeIdentityPart)
    .join(':')

  return createExperienceRecord({
    id: `runtime-event:${identity}`,
    at: event.at,
    kind: event.kind,
    source: {
      runtime: event.runtime,
      sessionId: event.sessionId,
      eventId: event.eventId,
      eventRef: clone(event.eventRef ?? null),
    },
    provenance: {
      ...clone(event.provenance),
      captureBoundary: 'runtime-event-v1',
    },
    payload: clone(event.payload),
  })
}
