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

function arrayEntries(sourcePath, values) {
  const entries = []
  if (!Array.isArray(values)) return entries
  for (let index = 0; index < values.length; index += 1) {
    add(entries, `${sourcePath}[${index}]`, values[index])
  }
  return entries
}

function takeRoundRobin(groups, limit) {
  const entries = []
  for (let index = 0; entries.length < limit; index += 1) {
    let added = false
    for (const group of groups) {
      if (index < group.length) {
        entries.push(group[index])
        added = true
        if (entries.length === limit) break
      }
    }
    if (!added) break
  }
  return entries
}

export function projectContinuityDigest(state) {
  const validation = validateSoulState(state)
  if (!validation.valid) throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)

  const identityEntries = []
  add(identityEntries, 'identity.name', state.identity.name)
  add(identityEntries, 'identity.nickname', state.identity.nickname)
  add(identityEntries, 'identity.birthday', state.identity.birthday)
  add(identityEntries, 'identity.origin', state.identity.origin)
  identityEntries.push(...arrayEntries('identity.invariants', state.identity.invariants))
  identityEntries.push(...arrayEntries('relationship.covenants', state.relationship.covenants))

  const mutableGroups = [
    arrayEntries('selfModel', state.selfModel),
    arrayEntries('userModel', state.userModel),
    arrayEntries('worldModel', state.worldModel ?? []),
    arrayEntries('beliefs', state.beliefs),
  ]
  const allEntryCount = identityEntries.length + mutableGroups.reduce((total, group) => total + group.length, 0)
  const entries = identityEntries.slice(0, MAX_CONTINUITY_DIGEST_ENTRIES)
  if (entries.length < MAX_CONTINUITY_DIGEST_ENTRIES) {
    entries.push(...takeRoundRobin(mutableGroups, MAX_CONTINUITY_DIGEST_ENTRIES - entries.length))
  }

  return {
    soulId: state.soulId,
    entries,
    omittedEntryCount: Math.max(0, allEntryCount - entries.length),
  }
}
