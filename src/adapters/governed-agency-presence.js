import { createAgencyIntentFromTriggerEvidence } from '../core/agency-initiation.js'
import { projectAgencyIntentToDshPresence } from './agency-presence.js'

const FORBIDDEN_AUTHORITY_FIELDS = new Set([
  'approved',
  'authorization',
  'authorized',
  'execution',
  'permission',
  'scheduled',
  'toolCall',
  'memoryWrite',
  'canonicalMutation',
])

function assertAuthorityFreeCompositionInput(input) {
  for (const key of FORBIDDEN_AUTHORITY_FIELDS) {
    if (Object.hasOwn(input, key)) {
      throw new TypeError(`governed DSH agency presence rejects authority-bearing field: ${key}`)
    }
  }
}

/**
 * Compose already-governed trigger evidence through the canonical AgencyIntent
 * boundary into a non-authoritative DSH presence projection.
 *
 * This helper deliberately owns no trigger derivation, permission, scheduling,
 * authorization, execution, persistence, or canonical-state mutation semantics.
 */
export function composeGovernedAgencyPresenceForDsh({
  soulId,
  triggerEvidence,
  id,
  kind = 'request',
  reason,
  proposedAction,
  contextRefs,
  at,
  provenance,
  sessionId = null,
  surface = null,
  ...extra
} = {}) {
  assertAuthorityFreeCompositionInput(extra)

  const intent = createAgencyIntentFromTriggerEvidence({
    soulId,
    triggerEvidence,
    id,
    kind,
    reason,
    proposedAction,
    contextRefs,
    at,
    provenance,
  })

  return projectAgencyIntentToDshPresence(intent, { soulId, sessionId, surface })
}
