const TARGET_TYPE = 'cognitive-memory'

function requiredString(value, label) {
  if (!value || typeof value !== 'string') throw new TypeError(`${label} is required`)
  return value
}

function exactTarget(target) {
  if (!target || typeof target !== 'object') throw new TypeError('target is required')
  if (target.type !== TARGET_TYPE) throw new TypeError('unsupported privacy erasure target type')
  return Object.freeze({
    type: TARGET_TYPE,
    soulId: requiredString(target.soulId, 'target.soulId'),
    memoryId: requiredString(target.memoryId, 'target.memoryId'),
  })
}

export function createPrivacyErasureRequest({ id, target, requester, reason, provenance }) {
  if (!provenance || typeof provenance !== 'object') throw new TypeError('provenance is required')
  return Object.freeze({
    version: 1,
    id: requiredString(id, 'id'),
    kind: 'privacy-erasure-request',
    target: exactTarget(target),
    requester: requiredString(requester, 'requester'),
    reason: requiredString(reason, 'reason'),
    provenance: structuredClone(provenance),
    authority: 'none',
  })
}

export function decidePrivacyErasure({ request, decision, decidedBy, reason }) {
  if (!request || request.kind !== 'privacy-erasure-request' || request.authority !== 'none') {
    throw new TypeError('valid non-authoritative privacy erasure request is required')
  }
  if (decision !== 'approved' && decision !== 'rejected') throw new TypeError('decision must be approved or rejected')
  return Object.freeze({
    version: 1,
    kind: 'privacy-erasure-decision',
    requestId: request.id,
    target: exactTarget(request.target),
    decision,
    decidedBy: requiredString(decidedBy, 'decidedBy'),
    reason: requiredString(reason, 'reason'),
    authority: decision === 'approved' ? 'erase-exact-target' : 'none',
  })
}

export async function executePrivacyErasure({ request, decision, store }) {
  if (!store || typeof store.erase !== 'function') throw new TypeError('store.erase is required')
  if (!request || request.kind !== 'privacy-erasure-request') throw new TypeError('valid privacy erasure request is required')
  if (!decision || decision.kind !== 'privacy-erasure-decision') throw new TypeError('explicit privacy erasure decision is required')
  if (decision.requestId !== request.id) throw new TypeError('privacy erasure decision does not authorize this request')
  if (decision.decision !== 'approved' || decision.authority !== 'erase-exact-target') {
    return Object.freeze({ executed: false, requestId: request.id, target: exactTarget(request.target), reason: 'not-authorized' })
  }
  const target = exactTarget(request.target)
  const authorizedTarget = exactTarget(decision.target)
  if (target.soulId !== authorizedTarget.soulId || target.memoryId !== authorizedTarget.memoryId) {
    throw new TypeError('privacy erasure decision target does not match request target')
  }

  const receipt = await store.erase(target.soulId, target.memoryId)
  return Object.freeze({
    executed: true,
    requestId: request.id,
    target,
    erasure: receipt,
    cascade: false,
    canonicalSoulMutation: false,
  })
}
