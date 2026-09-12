import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONTINUITY_DIGEST_DELTA_VERSION,
  MAX_CONTINUITY_DIGEST_ENTRIES,
  createSoulState,
  projectContinuityDigestDelta,
} from '../src/core/index.js'

function stateWithFacts(soulId = 'soul-continuity-delta') {
  const state = createSoulState({ soulId, name: 'Mira', origin: { phrase: 'first light' } })
  state.identity.invariants = ['continuity matters']
  state.relationship.covenants = [{ text: { en: 'Tell the truth about uncertainty.' } }]
  state.relationship.state = [{ opaque: 'do not interpret me' }]
  state.selfModel = [{ claim: 'I prefer careful reasoning.' }]
  state.userModel = [{ claim: 'The user values provenance.' }]
  state.worldModel = [{ claim: 'Project Atlas is active.' }]
  state.beliefs = [{ claim: 'Evidence precedes confidence.' }]
  return state
}

test('continuity digest delta is deterministic, attributable, and read-only', () => {
  const before = stateWithFacts()
  const after = structuredClone(before)
  after.userModel[0] = { claim: 'The user values falsifiability.' }
  const beforeSnapshot = structuredClone(before)
  const afterSnapshot = structuredClone(after)

  const first = projectContinuityDigestDelta({ before, after })
  const second = projectContinuityDigestDelta({ before, after })

  assert.deepEqual(first, second)
  assert.deepEqual(before, beforeSnapshot)
  assert.deepEqual(after, afterSnapshot)
  assert.equal(first.version, CONTINUITY_DIGEST_DELTA_VERSION)
  assert.equal(first.soulId, before.soulId)
  assert.equal(first.hasVisibleChanges, true)
  assert.deepEqual(first.added, [])
  assert.deepEqual(first.removed, [])
  assert.deepEqual(first.changed, [{
    sourcePath: 'userModel[0]',
    beforeText: 'The user values provenance.',
    afterText: 'The user values falsifiability.',
  }])
})

test('added and removed visible facts are classified by exact source path', () => {
  const before = stateWithFacts()
  before.beliefs = []
  const after = structuredClone(before)
  after.beliefs = [{ claim: 'Evidence precedes confidence.' }]

  const addition = projectContinuityDigestDelta({ before, after })
  assert.deepEqual(addition.added, [{
    sourcePath: 'beliefs[0]',
    text: 'Evidence precedes confidence.',
  }])
  assert.deepEqual(addition.removed, [])

  const removal = projectContinuityDigestDelta({ before: after, after: before })
  assert.deepEqual(removal.added, [])
  assert.deepEqual(removal.removed, [{
    sourcePath: 'beliefs[0]',
    text: 'Evidence precedes confidence.',
  }])
})

test('opaque relationship state cannot create a continuity digest delta', () => {
  const before = stateWithFacts()
  const after = structuredClone(before)
  after.relationship.state = [{ trust: 'absolute', inventedMeaning: 'soulmate' }]

  const delta = projectContinuityDigestDelta({ before, after })
  assert.equal(delta.hasVisibleChanges, false)
  assert.deepEqual(delta.added, [])
  assert.deepEqual(delta.removed, [])
  assert.deepEqual(delta.changed, [])
})

test('bounded omission metadata prevents no-delta from implying full-state equality', () => {
  const before = stateWithFacts()
  before.selfModel = Array.from({ length: MAX_CONTINUITY_DIGEST_ENTRIES + 10 }, (_, index) => ({
    claim: `visible-or-omitted-${index}`,
  }))
  const after = structuredClone(before)
  after.selfModel[after.selfModel.length - 1] = { claim: 'changed outside bounded projection' }

  const delta = projectContinuityDigestDelta({ before, after })
  assert.equal(delta.hasVisibleChanges, false)
  assert.ok(delta.beforeOmittedEntryCount > 0)
  assert.ok(delta.afterOmittedEntryCount > 0)
})

test('cross-Soul continuity digest comparison fails closed', () => {
  const before = stateWithFacts('soul-a')
  const after = stateWithFacts('soul-b')

  assert.throws(
    () => projectContinuityDigestDelta({ before, after }),
    /requires the same soulId/,
  )
})
