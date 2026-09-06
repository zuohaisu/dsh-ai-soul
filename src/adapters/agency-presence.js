import { validateAgencyIntent } from '../core/agency-intent.js'

export const DSH_AGENCY_PRESENCE_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Project one authority-free AgencyIntent into a DSH-visible presence signal.
 * This adapter is deliberately non-executing: it grants no permission,
 * authorization, scheduling, tool-call, or persistence authority.
 */
export function projectAgencyIntentToDshPresence(intent, { soulId, sessionId = null, surface = null } = {}) {
  const validation = validateAgencyIntent(intent)
  if (!validation.valid) {
    throw new TypeError(`invalid agency intent for DSH presence: ${validation.errors.join('; ')}`)
  }
  if (!soulId || typeof soulId !== 'string') throw new TypeError('DSH agency presence requires soulId')
  if (intent.soulId !== soulId) throw new TypeError('DSH agency presence soulId mismatch')
  if (!intent.reason.trim()) throw new TypeError('DSH agency presence requires non-empty reason')
  if (!isRecord(intent.provenance) || Object.keys(intent.provenance).length === 0) {
    throw new TypeError('DSH agency presence requires non-empty provenance')
  }
  if (sessionId !== null && (typeof sessionId !== 'string' || !sessionId)) {
    throw new TypeError('DSH agency presence sessionId must be a non-empty string when provided')
  }
  if (surface !== null && (typeof surface !== 'string' || !surface)) {
    throw new TypeError('DSH agency presence surface must be a non-empty string when provided')
  }

  return Object.freeze({
    version: DSH_AGENCY_PRESENCE_VERSION,
    kind: 'agency-intent',
    soulId,
    intentId: intent.id,
    intentKind: intent.kind,
    at: intent.at,
    reason: intent.reason,
    proposedAction: intent.proposedAction,
    contextRefs: clone(intent.contextRefs),
    provenance: {
      ...clone(intent.provenance),
      projectionBoundary: 'dsh-agency-presence-v1',
    },
    runtime: Object.freeze({
      name: 'deepseek-harness',
      sessionId,
      surface,
    }),
    authority: 'none',
  })
}
