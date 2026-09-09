import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  assessCognitionCapacityPreflight,
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function proposal({ operation = 'append', value = 'new claim', previousValue } = {}) {
  return createStateTransitionProposal({
    id: `proposal:preflight:${operation}`,
    at: '2026-09-09T03:00:00.000Z',
    target: 'userModel',
    operation,
    ...(operation !== 'retire' ? { value } : {}),
    ...(operation !== 'append' ? { previousValue } : {}),
    reason: 'capacity preflight test',
    evidence: [{ id: 'experience:preflight' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'test-proposer',
  })
}

function approve(input) {
  return reviewStateTransitionProposal(input, {
    decision: 'approved',
    reviewer: 'human-reviewer',
    reason: 'approved for test',
    provenance: { source: 'test-review' },
  })
}

test('append preflight reports fits below canonical capacity without mutation', () => {
  const state = createSoulState({ soulId: 'soul:preflight-fits' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1 }, (_, index) => `claim-${index}`)
  const before = structuredClone(state)

  assert.deepEqual(assessCognitionCapacityPreflight({ state, proposal: proposal() }), {
    status: 'fits',
    target: 'userModel',
    count: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1,
    capacity: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  })
  assert.deepEqual(state, before)
})

test('append preflight reports consolidation-required at canonical capacity without mutation', () => {
  const state = createSoulState({ soulId: 'soul:preflight-full' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `claim-${index}`)
  const before = structuredClone(state)

  assert.deepEqual(assessCognitionCapacityPreflight({ state, proposal: proposal() }), {
    status: 'consolidation-required',
    target: 'userModel',
    count: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
    capacity: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  })
  assert.deepEqual(state, before)
})

test('non-append operations do not claim append capacity safety', () => {
  const state = createSoulState({ soulId: 'soul:preflight-replace' })
  state.userModel = ['old claim']
  assert.deepEqual(assessCognitionCapacityPreflight({
    state,
    proposal: proposal({ operation: 'replace', previousValue: 'old claim', value: 'revised claim' }),
  }), { status: 'not-applicable', target: 'userModel' })
})

test('stale fits preflight never authorizes a later over-capacity append', () => {
  const state = createSoulState({ soulId: 'soul:preflight-stale' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1 }, (_, index) => `claim-${index}`)
  const pending = proposal()
  assert.equal(assessCognitionCapacityPreflight({ state, proposal: pending }).status, 'fits')

  state.userModel.push('concurrent-claim')
  assert.throws(
    () => applyStateTransitionProposal(state, approve(pending)),
    /current cognition is at capacity/,
  )
})
