import { createSoulPresenceSnapshot } from '../core/soul-presence-snapshot.js'
import { DSH_SOUL_PRESENCE_RUNTIME_ID, DSH_SOUL_PRESENCE_SURFACES } from './soul-presence.js'

function commandSuccess(text) {
  return { kind: 'success', text }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function validateContext(context, expectedSoulId) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    throw new TypeError('DSH Soul status command requires a Soul context object')
  }
  if (typeof context.soulId !== 'string' || !context.soulId) {
    throw new TypeError('DSH Soul status command requires context.soulId')
  }
  if (context.soulId !== expectedSoulId) {
    throw new TypeError(`DSH Soul status context mismatch: expected ${expectedSoulId}, received ${context.soulId}`)
  }
  return context
}

function validatePresenceSnapshot(snapshot, expectedSoulId) {
  if (snapshot == null) return null
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new TypeError('DSH Soul status presence snapshot must be an object')
  }
  if (snapshot.soulId !== expectedSoulId) {
    throw new TypeError(`DSH Soul status presence mismatch: expected ${expectedSoulId}, received ${snapshot.soulId}`)
  }

  const validated = createSoulPresenceSnapshot({ soulId: snapshot.soulId, presences: snapshot.presences })
  for (const presence of validated.presences) {
    if (presence.runtimeId !== DSH_SOUL_PRESENCE_RUNTIME_ID) {
      throw new TypeError(`DSH Soul status does not accept runtimeId=${presence.runtimeId}`)
    }
    if (!DSH_SOUL_PRESENCE_SURFACES.includes(presence.surfaceId)) {
      throw new TypeError(`DSH Soul status does not accept surfaceId=${presence.surfaceId}`)
    }
  }
  return validated
}

function renderPresence(snapshot) {
  const states = new Map(snapshot?.presences.map((presence) => [presence.surfaceId, presence.state]) ?? [])
  return DSH_SOUL_PRESENCE_SURFACES.map((surfaceId) => {
    const label = surfaceId === 'tui' ? 'TUI' : 'Web'
    return `DSH ${label} presence: ${states.get(surfaceId) ?? 'unknown'}`
  })
}

export function renderDshSoulStatus(context, expectedSoulId = context?.soulId, presenceSnapshot = null) {
  const current = validateContext(context, expectedSoulId)
  const presence = validatePresenceSnapshot(presenceSnapshot, expectedSoulId)
  const name = typeof current.identity?.name === 'string' && current.identity.name.trim()
    ? current.identity.name.trim()
    : null

  return [
    'AI Soul status',
    `Soul ID: ${current.soulId}`,
    `Name: ${name ?? '(unnamed)'}`,
    `Naming state: ${name ? 'named' : 'unnamed'}`,
    ...renderPresence(presence),
    'Attention: not asserted',
    'Memory capture: not implied by presence',
    `Relationship participants: ${asArray(current.relationship?.participants).length}`,
    `Current SELF entries: ${asArray(current.selfModel).length}`,
    `Current OTHER entries: ${asArray(current.userModel).length}`,
    `Current RELATIONAL entries: ${asArray(current.relationship?.state).length}`,
    `Current WORLD entries: ${asArray(current.worldModel).length}`,
    `Current belief entries: ${asArray(current.beliefs).length}`,
    '',
    'This is a bounded, read-only status projection of the currently loaded Soul. Existence is not surface presence; presence is not attention, memory capture, mutation authority, or permission to act.',
  ].join('\n')
}

export function createDshSoulStatusCommand({ soulId, getContext, getPresenceSnapshot } = {}) {
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('DSH Soul status command requires soulId')
  }
  if (typeof getContext !== 'function') {
    throw new TypeError('DSH Soul status command requires getContext()')
  }
  if (getPresenceSnapshot !== undefined && typeof getPresenceSnapshot !== 'function') {
    throw new TypeError('DSH Soul status command getPresenceSnapshot must be a function when supplied')
  }

  return Object.freeze({
    name: 'soul-status',
    description: 'show read-only continuity and explicit DSH surface presence for the currently loaded AI Soul',
    input: { hint: '' },
    recordInput: false,
    async handler() {
      const presenceSnapshot = getPresenceSnapshot ? getPresenceSnapshot() : null
      return commandSuccess(renderDshSoulStatus(getContext(), soulId, presenceSnapshot))
    },
  })
}

export function registerDshSoulStatusCommand(ctx, options = {}) {
  const commands = typeof ctx?.get === 'function' ? ctx.get('commands') : ctx?.commands
  if (!commands) return { status: 'unavailable' }
  if (typeof commands.register !== 'function') {
    throw new TypeError('DSH commands service must expose register()')
  }

  commands.register(createDshSoulStatusCommand(options))
  return { status: 'registered' }
}
