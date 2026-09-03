import { validateSoulState } from './soul-state.js'
import { MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN } from './cognitive-capacity.js'

const MAX_CONTEXT_ENTRIES_PER_DOMAIN = MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN
const MAX_CONTEXT_ENTRY_CHARS = 400

function compact(value) {
  if (value == null) return null
  if (Array.isArray(value)) return value.filter(Boolean)
  return value
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

function renderEntry(value) {
  let text
  if (typeof value === 'string') text = value
  else if (value && typeof value === 'object' && typeof value.claim === 'string') text = value.claim
  else if (value && typeof value === 'object' && typeof value.summary === 'string') text = value.summary
  else text = stableJson(value)

  if (text.length <= MAX_CONTEXT_ENTRY_CHARS) return text
  return `${text.slice(0, MAX_CONTEXT_ENTRY_CHARS - 1)}…`
}

function renderSection(lines, title, values) {
  if (!Array.isArray(values) || values.length === 0) return
  lines.push('', `## ${title}`)
  for (const value of values.slice(0, MAX_CONTEXT_ENTRIES_PER_DOMAIN)) lines.push(`- ${renderEntry(value)}`)
  const omitted = values.length - MAX_CONTEXT_ENTRIES_PER_DOMAIN
  if (omitted > 0) lines.push(`- [${omitted} additional entries omitted from runtime context]`)
}

export function projectSoulContext(state) {
  const validation = validateSoulState(state)
  if (!validation.valid) throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)

  return {
    soulId: state.soulId,
    identity: {
      name: state.identity.name ?? null,
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
    worldModel: compact(state.worldModel ?? []),
    beliefs: compact(state.beliefs),
  }
}

export function renderSoulContext(context) {
  if (!context || typeof context !== 'object') throw new TypeError('Soul context is required')

  const lines = ['# AI Soul Context', '', `Soul ID: ${context.soulId}`]
  if (context.identity?.name) lines.push(`Name: ${context.identity.name}`)
  if (context.identity?.nickname) lines.push(`Nickname: ${context.identity.nickname}`)
  if (context.identity?.birthday) lines.push(`Birthday: ${context.identity.birthday}`)
  if (context.identity?.origin?.phrase) lines.push(`Origin phrase: ${context.identity.origin.phrase}`)

  renderSection(lines, 'Identity Invariants', context.identity?.invariants)
  const covenants = context.relationship?.covenants ?? []
  if (covenants.length) {
    lines.push('', '## Covenants')
    for (const covenant of covenants.slice(0, MAX_CONTEXT_ENTRIES_PER_DOMAIN)) {
      const text = covenant?.text?.en ?? covenant?.text?.zh ?? String(covenant?.text ?? '')
      if (text) lines.push(`- ${renderEntry(text)}`)
    }
    const omitted = covenants.length - MAX_CONTEXT_ENTRIES_PER_DOMAIN
    if (omitted > 0) lines.push(`- [${omitted} additional entries omitted from runtime context]`)
  }

  renderSection(lines, 'Relationship Participants', context.relationship?.participants)
  renderSection(lines, 'Relationship State', context.relationship?.state)
  renderSection(lines, 'Self Model', context.selfModel)
  renderSection(lines, 'User Model', context.userModel)
  renderSection(lines, 'World Model', context.worldModel)
  renderSection(lines, 'Beliefs', context.beliefs)

  lines.push('', 'This context is a bounded, read-only projection of structured Soul state. It is not permission to rewrite identity, invent missing history, or treat omitted entries as absent from canonical state.')
  return lines.join('\n')
}
