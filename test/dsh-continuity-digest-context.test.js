import assert from 'node:assert/strict'
import test from 'node:test'

import { createSoulState } from '../src/core/index.js'
import { renderDshContinuityDigest } from '../src/adapters/continuity-digest-context.js'

function stateWithFacts() {
  const state = createSoulState({ soulId: 'soul-dsh-digest', name: 'Mira', origin: { phrase: 'first light' } })
  state.identity.invariants = ['continuity matters']
  state.relationship.state = [{ inventedMeaning: 'must never surface' }]
  state.userModel = [{ claim: 'The user values provenance.' }]
  return state
}

test('DSH continuity digest rendering is deterministic and read-only', () => {
  const state = stateWithFacts()
  const before = structuredClone(state)
  const first = renderDshContinuityDigest(state)
  const second = renderDshContinuityDigest(state)
  assert.equal(first, second)
  assert.deepEqual(state, before)
  assert.match(first, /Soul Continuity Digest \(read-only\)/)
  assert.match(first, /\[identity\.name\] Mira/)
  assert.match(first, /\[userModel\[0\]\] The user values provenance\./)
})

test('opaque relationship state cannot alter DSH continuity digest', () => {
  const first = stateWithFacts()
  const second = stateWithFacts()
  second.relationship.state = [{ trust: 'absolute', inventedMeaning: 'soulmate' }]
  assert.equal(renderDshContinuityDigest(first), renderDshContinuityDigest(second))
  assert.doesNotMatch(renderDshContinuityDigest(first), /relationship\.state|must never surface/)
})

test('empty continuity digest is omitted rather than manufacturing claims', () => {
  const state = createSoulState({ soulId: 'empty-digest' })
  assert.equal(renderDshContinuityDigest(state), '')
})
