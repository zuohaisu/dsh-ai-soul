import { renderSoulContext } from '../core/context-projection.js'

function commandSuccess(text) {
  return { kind: 'success', text }
}

function validateContext(context, expectedSoulId) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    throw new TypeError('DSH Soul context command requires a Soul context object')
  }
  if (typeof context.soulId !== 'string' || !context.soulId) {
    throw new TypeError('DSH Soul context command requires context.soulId')
  }
  if (context.soulId !== expectedSoulId) {
    throw new TypeError(`DSH Soul context mismatch: expected ${expectedSoulId}, received ${context.soulId}`)
  }
  return context
}

export function renderDshSoulContext(context, expectedSoulId = context?.soulId) {
  const current = validateContext(context, expectedSoulId)
  return [
    renderSoulContext(current),
    '',
    'This surface shows bounded current cognition only. It is not interaction history, Experience evidence, governance history, mutation authority, or permission to act.',
  ].join('\n')
}

export function createDshSoulContextCommand({ soulId, getContext } = {}) {
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('DSH Soul context command requires soulId')
  }
  if (typeof getContext !== 'function') {
    throw new TypeError('DSH Soul context command requires getContext()')
  }

  return Object.freeze({
    name: 'soul-context',
    description: 'show bounded read-only current cognition for the currently loaded AI Soul',
    input: { hint: '' },
    recordInput: false,
    async handler() {
      return commandSuccess(renderDshSoulContext(getContext(), soulId))
    },
  })
}

export function registerDshSoulContextCommand(ctx, options = {}) {
  const commands = typeof ctx?.get === 'function' ? ctx.get('commands') : ctx?.commands
  if (!commands) return { status: 'unavailable' }
  if (typeof commands.register !== 'function') {
    throw new TypeError('DSH commands service must expose register()')
  }

  commands.register(createDshSoulContextCommand(options))
  return { status: 'registered' }
}
