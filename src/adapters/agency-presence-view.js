function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`DSH agency presence view requires ${label}`)
  return value
}

export function createDshAgencyPresenceView(presence, { soulId } = {}) {
  if (!isRecord(presence)) throw new TypeError('DSH agency presence view requires a presence object')
  if (presence.kind !== 'agency-intent') throw new TypeError('DSH agency presence view requires kind=agency-intent')
  if (presence.authority !== 'none') throw new TypeError('DSH agency presence view requires authority=none')

  const expectedSoulId = requireString(soulId, 'soulId')
  const presenceSoulId = requireString(presence.soulId, 'presence.soulId')
  if (presenceSoulId !== expectedSoulId) throw new TypeError('DSH agency presence view soulId mismatch')

  const provenance = presence.provenance
  if (!isRecord(provenance) || Object.keys(provenance).length === 0) {
    throw new TypeError('DSH agency presence view requires non-empty provenance')
  }

  return Object.freeze({
    kind: 'agency-presence',
    soulId: presenceSoulId,
    intentId: requireString(presence.intentId, 'presence.intentId'),
    reason: requireString(presence.reason, 'presence.reason'),
    proposedAction: structuredClone(presence.proposedAction),
    provenance: structuredClone(provenance),
    runtime: isRecord(presence.runtime) ? structuredClone(presence.runtime) : null,
    authority: 'none',
    attention: 'not-asserted',
    memoryCapture: 'not-implied',
  })
}

export function renderDshAgencyPresence(view) {
  if (!isRecord(view) || view.kind !== 'agency-presence' || view.authority !== 'none') {
    throw new TypeError('DSH agency presence renderer requires an authority-free agency-presence view')
  }
  requireString(view.soulId, 'view.soulId')
  requireString(view.intentId, 'view.intentId')
  requireString(view.reason, 'view.reason')

  return [
    'AI Soul presence',
    `Soul ID: ${view.soulId}`,
    `Intent ID: ${view.intentId}`,
    `Reason: ${view.reason}`,
    'Authority: none',
    'Attention: not asserted',
    'Memory capture: not implied by presence',
    '',
    'This expresses a reason-grounded Soul intent only. It is not permission, authorization, scheduling, tool execution, background attention, or memory capture.',
  ].join('\n')
}
