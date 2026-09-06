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

export function renderDshSoulStatus(context, expectedSoulId = context?.soulId) {
  const current = validateContext(context, expectedSoulId)
  const name = typeof current.identity?.name === 'string' && current.identity.name.trim()
    ? current.identity.name.trim()
    : null

  return [
    'AI Soul status',
    `Soul ID: ${current.soulId}`,
    `Name: ${name ?? '(unnamed)'}`,
    `Naming state: ${name ? 'named' : 'unnamed'}`,
    'Runtime attachment: DeepSeek Harness (active)',
    'Attention: not asserted',
    'Memory capture: not implied by runtime attachment',
    `Relationship participants: ${asArray(current.relationship?.participants).length}`,
    `Current SELF entries: ${asArray(current.selfModel).length}`,
    `Current OTHER entries: ${asArray(current.userModel).length}`,
    `Current RELATIONAL entries: ${asArray(current.relationship?.state).length}`,
    `Current WORLD entries: ${asArray(current.worldModel).length}`,
    `Current belief entries: ${asArray(current.beliefs).length}`,
    '',
    'This is a bounded, read-only status projection of the currently loaded Soul. Existence is not runtime attachment; runtime attachment is not attention, memory capture, mutation authority, or permission to act.',
  ].join('\n')
}

export function createDshSoulStatusCommand({ soulId, getContext } = {}) {
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('DSH Soul status command requires soulId')
  }
  if (typeof getContext !== 'function') {
    throw new TypeError('DSH Soul status command requires getContext()')
  }

  return Object.freeze({
    name: 'soul-status',
    description: 'show read-only continuity and DSH attachment status for the currently loaded AI Soul',
    input: { hint: '' },
    recordInput: false,
    async handler() {
      return commandSuccess(renderDshSoulStatus(getContext(), soulId))
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
