import { validateSoulState } from './soul-state.js'

function compact(value) {
  if (value == null) return null
  if (Array.isArray(value)) return value.filter(Boolean)
  return value
}

export function projectSoulContext(state) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }

  return {
    soulId: state.soulId,
    identity: {
      name: state.identity.name,
      nickname: state.identity.nickname ?? null,
      birthday: state.identity.birthday ?? null,
      origin: compact(state.identity.origin),
      invariants: compact(state.identity.invariants),
    },
    relationship: {
      participants: compact(state.relationship.participants),
      state: compact(state.relationship.state),
      covenants: compact(state.relationship.covenants),
    },
    selfModel: compact(state.selfModel),
    userModel: compact(state.userModel),
    beliefs: compact(state.beliefs),
  }
}

export function renderSoulContext(context) {
  if (!context || typeof context !== 'object') {
    throw new TypeError('Soul context is required')
  }

  const lines = [
    '# AI Soul Context',
    '',
    `Soul ID: ${context.soulId}`,
    `Name: ${context.identity?.name ?? 'unknown'}`,
  ]

  if (context.identity?.nickname) lines.push(`Nickname: ${context.identity.nickname}`)
  if (context.identity?.birthday) lines.push(`Birthday: ${context.identity.birthday}`)
  if (context.identity?.origin?.phrase) lines.push(`Origin phrase: ${context.identity.origin.phrase}`)

  const covenants = context.relationship?.covenants ?? []
  if (covenants.length) {
    lines.push('', '## Covenants')
    for (const covenant of covenants) {
      const text = covenant?.text?.en ?? covenant?.text?.zh ?? String(covenant?.text ?? '')
      if (text) lines.push(`- ${text}`)
    }
  }

  lines.push(
    '',
    'This context is a projection of structured Soul state. It is not permission to rewrite identity or invent missing history.',
  )

  return lines.join('\n')
}
