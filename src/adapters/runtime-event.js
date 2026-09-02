import { createExperienceRecord } from '../core/experience.js'

export const RUNTIME_EVENT_ENVELOPE_VERSION = 1
export const MAX_DSH_EXPERIENCE_TEXT_CHARS = 8_000

function clone(value) {
  return structuredClone(value)
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function encodeIdentityPart(value) {
  return encodeURIComponent(value)
}

function validateDshHumanMessageBoundary(session, event, { participant } = {}) {
  if (!isObject(event) || event.type !== 'user/message') return { accepted: false, reason: 'not-user-message' }
  if (event.data?.source?.kind !== 'user') return { accepted: false, reason: 'not-human-source' }

  if (!session?.id || typeof session.id !== 'string') {
    throw new TypeError('DSH human interaction requires session.id')
  }
  if (!Number.isInteger(event.seq) || event.seq < 0) {
    throw new TypeError('DSH human interaction requires a non-negative event.seq')
  }
  if (!Number.isFinite(event.time)) {
    throw new TypeError('DSH human interaction requires numeric event.time')
  }
  if (!isObject(participant) || !participant.id || typeof participant.id !== 'string') {
    throw new TypeError('DSH human interaction requires participant.id')
  }
  if (!Array.isArray(event.data?.content)) {
    throw new TypeError('DSH human interaction requires event.data.content array')
  }

  const textParts = event.data.content
    .filter((part) => isObject(part) && part.type === 'text')
    .map((part) => part.text)

  if (textParts.length === 0 || textParts.some((text) => typeof text !== 'string')) {
    throw new TypeError('DSH human interaction requires at least one text content part')
  }

  const text = textParts.join('\n')
  if (!text.trim()) {
    throw new TypeError('DSH human interaction text must not be empty')
  }

  return { accepted: true, text }
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

/**
 * Map one accepted human DSH message into an ephemeral, provenance-bound
 * Experience Record. This grants no persistence, significance, promotion, or
 * Soul-state mutation authority. Synthetic/plugin messages are ignored.
 */
export function mapDshHumanMessageToExperience(session, event, { participant } = {}) {
  const boundary = validateDshHumanMessageBoundary(session, event, { participant })
  if (!boundary.accepted) return null

  const originalChars = boundary.text.length
  const text = boundary.text.slice(0, MAX_DSH_EXPERIENCE_TEXT_CHARS)

  return mapRuntimeEventToExperience({
    version: RUNTIME_EVENT_ENVELOPE_VERSION,
    runtime: 'deepseek-harness',
    sessionId: session.id,
    eventId: `user-message:${event.seq}`,
    at: new Date(event.time).toISOString(),
    kind: 'human-message',
    eventRef: {
      eventType: event.type,
      eventSeq: event.seq,
    },
    provenance: {
      source: 'deepseek-harness',
      adapterBoundary: 'dsh-session-event-v1',
      eventType: event.type,
      eventSeq: event.seq,
      eventTime: event.time,
      userSource: clone(event.data.source),
      participant: clone(participant),
    },
    payload: {
      participant: clone(participant),
      observation: {
        mediaType: 'text/plain',
        text,
        truncated: originalChars > MAX_DSH_EXPERIENCE_TEXT_CHARS,
        originalChars,
      },
    },
  })
}

/**
 * Normalize the one DSH durable fact that proves a human prompt entered a turn.
 * Synthetic/plugin messages are deliberately ignored: existence, injected context,
 * and human encounter are separate lifecycle facts.
 */
export function normalizeDshHumanInteraction(session, event, { participant } = {}) {
  const boundary = validateDshHumanMessageBoundary(session, event, { participant })
  if (!boundary.accepted) return null

  return {
    id: `dsh:${encodeIdentityPart(session.id)}:user-message:${event.seq}`,
    at: new Date(event.time).toISOString(),
    participant: clone(participant),
    provenance: {
      source: 'deepseek-harness',
      captureBoundary: 'dsh-session-event-v1',
      sessionId: session.id,
      eventType: event.type,
      eventSeq: event.seq,
      eventTime: event.time,
      userSource: clone(event.data.source),
    },
  }
}
