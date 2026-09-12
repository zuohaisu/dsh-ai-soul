import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_CONTINUITY_DIGEST_ENTRIES,
  MAX_CONTINUITY_DIGEST_ENTRY_CHARS,
  createSoulState,
  projectContinuityDigest,
} from '../src/core/index.js'

function stateWithFacts() {
  const state = createSoulState({ soulId: 'soul-digest', name: 'Mira', origin: { phrase: 'first light' } })
  state.identity.invariants = ['continuity matters']
  state.relationship.covenants = [{ text: { en: 'Tell the truth about uncertainty.' } }]
  state.relationship.state = [{ opaque: 'do not interpret me' }]
  state.selfModel = [{ claim: 'I prefer careful reasoning.' }]
  state.userModel = [{ claim: 'The user values provenance.' }]
  state.worldModel = [{ claim: 'Project Atlas is active.' }]
  state.beliefs = [{ claim: 'Evidence precedes confidence.' }]
  return state
}

test('continuity digest is deterministic, attributed, and read-only', () => {
  const state = stateWithFacts()
  const before = structuredClone(state)
  const first = projectContinuityDigest(state)
  const second = projectContinuityDigest(state)

  assert.deepEqual(first, second)
  assert.deepEqual(state, before)
  assert.equal(first.soulId, state.soulId)
  assert.ok(first.entries.every((entry) => typeof entry.sourcePath === 'string' && entry.sourcePath.length > 0))
})

test('opaque relationship state cannot manufacture continuity claims', () => {
  const firstState = stateWithFacts()
  const secondState = stateWithFacts()
  secondState.relationship.state = [{ trust: 'absolute', inventedMeaning: 'soulmate' }]

  assert.deepEqual(projectContinuityDigest(firstState), projectContinuityDigest(secondState))
  assert.ok(projectContinuityDigest(firstState).entries.every((entry) => !entry.sourcePath.startsWith('relationship.state')))
})

test('digest is bounded by entry count and per-entry character limit', () => {
  const state = stateWithFacts()
  state.selfModel = Array.from({ length: MAX_CONTINUITY_DIGEST_ENTRIES + 10 }, (_, index) => ({
    claim: `${index}:${'x'.repeat(MAX_CONTINUITY_DIGEST_ENTRY_CHARS + 100)}`,
  }))

  const digest = projectContinuityDigest(state)
  assert.ok(digest.entries.length <= MAX_CONTINUITY_DIGEST_ENTRIES)
  assert.ok(digest.omittedEntryCount > 0)
  assert.ok(digest.entries.every((entry) => entry.text.length <= MAX_CONTINUITY_DIGEST_ENTRY_CHARS))
})

test('a supported governed fact changes only its attributed digest entry', () => {
  const before = stateWithFacts()
  const after = stateWithFacts()
  after.userModel[0] = { claim: 'The user values falsifiability.' }

  const beforeDigest = projectContinuityDigest(before)
  const afterDigest = projectContinuityDigest(after)
  const changed = beforeDigest.entries
    .map((entry, index) => ({ before: entry, after: afterDigest.entries[index] }))
    .filter(({ before: left, after: right }) => JSON.stringify(left) !== JSON.stringify(right))

  assert.equal(changed.length, 1)
  assert.equal(changed[0].before.sourcePath, 'userModel[0]')
  assert.equal(changed[0].after.sourcePath, 'userModel[0]')
})
