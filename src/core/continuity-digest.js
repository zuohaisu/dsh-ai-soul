import { validateSoulState } from './soul-state.js'

export const MAX_CONTINUITY_DIGEST_ENTRIES = 12
export const MAX_CONTINUITY_DIGEST_ENTRY_CHARS = 240

function renderValue(value) {
  let text
  if (typeof value === 'string') text = value
  else if (value && typeof value === 'object' && typeof value.claim === 'string') text = value.claim
  else if (value && typeof value === 'object' && typeof value.summary === 'string') text = value.summary
  else text = JSON.stringify(value)
  if (text.length <= MAX_CONTINUITY_DIGEST_ENTRY_CHARS) return text
  return `${text.slice(0, MAX_CONTINUITY_DIGEST_ENTRY_CHARS - 1)}…`
}

function add(entries, sourcePath, value) {
  if (value == null || value === '') return
  entries.push({ sourcePath, text: renderValue(value) })
}

function addArray(entries, sourcePath, values) {
  if (!Array.isArray(values)) return
  for (let index = 0; index < values.length; index += 1) {
    add(entries, `${sourcePath}[${index}]`, values[index])
  }
}

export function projectContinuityDigest(state) {
  const validation = validateSoulState(state)
  if (!validation.valid) throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)

  const entries = []
  add(entries, 'identity.name', state.identity.name)
  add(entries, 'identity.nickname', state.identity.nickname)
  add(entries, 'identity.birthday', state.identity.birthday)
  add(entries, 'identity.origin', state.identity.origin)
  addArray(entries, 'identity.invariants', state.identity.invariants)
  addArray(entries, 'relationship.covenants', state.relationship.covenants)
  addArray(entries, 'selfModel', state.selfModel)
  addArray(entries, 'userModel', state.userModel)
  addArray(entries, 'worldModel', state.worldModel ?? [])
  addArray(entries, 'beliefs', state.beliefs)

  return {
    soulId: state.soulId,
    entries: entries.slice(0, MAX_CONTINUITY_DIGEST_ENTRIES),
    omittedEntryCount: Math.max(0, entries.length - MAX_CONTINUITY_DIGEST_ENTRIES),
  }
}
