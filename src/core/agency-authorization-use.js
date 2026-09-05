import { validateAgencyAuthorizationDecision } from './agency-authorization-decision.js'

export const AGENCY_AUTHORIZATION_USE_EVALUATION_VERSION = 1

function asIdSet(value) {
  if (value == null) return new Set()
  if (value instanceof Set) return new Set(value)
  if (Array.isArray(value)) return new Set(value)
  throw new TypeError('authorization id collection must be an array or Set')
}

export function evaluateAgencyAuthorizationUse({
  decision,
  soulId,
  capability,
  scope,
  evaluatedAt,
  maxAgeMs,
  consumedDecisionIds = [],
  revokedDecisionIds = [],
} = {}) {
  const reasons = []
  const validation = validateAgencyAuthorizationDecision(decision)
  if (!validation.valid) {
    return {
      version: AGENCY_AUTHORIZATION_USE_EVALUATION_VERSION,
      eligible: false,
      reasons: ['invalid-authorization-decision'],
    }
  }

  if (decision.decision !== 'approved' || decision.authority !== 'authorized') reasons.push('authorization-not-approved')
  if (!soulId || soulId !== decision.soulId) reasons.push('soul-mismatch')
  if (!capability || capability !== decision.capability) reasons.push('capability-mismatch')
  if (!scope || scope !== decision.scope) reasons.push('scope-mismatch')

  const consumed = asIdSet(consumedDecisionIds)
  const revoked = asIdSet(revokedDecisionIds)
  if (consumed.has(decision.id)) reasons.push('authorization-consumed')
  if (revoked.has(decision.id)) reasons.push('authorization-revoked')

  const evaluatedAtMs = Date.parse(evaluatedAt)
  const decisionAtMs = Date.parse(decision.at)
  if (!Number.isFinite(evaluatedAtMs)) reasons.push('invalid-evaluation-time')
  if (!Number.isFinite(decisionAtMs)) reasons.push('invalid-decision-time')
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) reasons.push('invalid-max-age')
  if (Number.isFinite(evaluatedAtMs) && Number.isFinite(decisionAtMs) && Number.isFinite(maxAgeMs) && maxAgeMs >= 0) {
    if (evaluatedAtMs < decisionAtMs) reasons.push('evaluation-precedes-decision')
    else if (evaluatedAtMs - decisionAtMs > maxAgeMs) reasons.push('authorization-expired')
  }

  return {
    version: AGENCY_AUTHORIZATION_USE_EVALUATION_VERSION,
    eligible: reasons.length === 0,
    reasons,
    decisionId: decision.id,
    soulId: decision.soulId,
    capability: decision.capability,
    scope: decision.scope,
    evaluatedAt,
  }
}
