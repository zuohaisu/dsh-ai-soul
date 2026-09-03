import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
  validateSoulState,
} from '../src/core/index.js'

function approvedProposal({ operation = 'append', value, previousValue } = {}) {
  const proposal = createStateTransitionProposal({
    id: `proposal:${operation}:${crypto.randomUUID()}`,
    at: '2026-09-04T00:00:00.000Z',
    target: 'userModel',
    operation,
    ...(operation !== 'retire' ? { value } : {}),
    ...(operation !== 'append' ? { previousValue } : {}),
    reason: 'capacity test',
    evidence: [{ id: 'experience:test' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'test-proposer',
  })
  return reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'human-reviewer',
    reason: 'approved for test',
    provenance: { source: 'test-review' },
  })
}

test('approved append succeeds below current-cognition capacity', () => {
  const state = createSoulState({ soulId: 'soul:capacity-below' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1 }, (_, index) => `claim-${index}`)
  const next = applyStateTransitionProposal(state, approvedProposal({ value: 'claim-new' }))
  assert.equal(next.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN)
  assert.equal(state.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1)
})

test('approved append fails closed at current-cognition capacity', () => {
  const state = createSoulState({ soulId: 'soul:capacity-full' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `claim-${index}`)
  assert.throws(
    () => applyStateTransitionProposal(state, approvedProposal({ value: 'claim-overflow' })),
    /current cognition is at capacity/,
  )
  assert.equal(state.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN)
})

test('replace remains available at capacity', () => {
  const state = createSoulState({ soulId: 'soul:capacity-replace' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `claim-${index}`)
  const next = applyStateTransitionProposal(state, approvedProposal({
    operation: 'replace',
    previousValue: 'claim-0',
    value: 'claim-revised',
  }))
  assert.equal(next.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN)
  assert.equal(next.userModel[0], 'claim-revised')
})

test('retire remains available at capacity and frees room for later append', () => {
  const state = createSoulState({ soulId: 'soul:capacity-retire' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `claim-${index}`)
  const retired = applyStateTransitionProposal(state, approvedProposal({
    operation: 'retire',
    previousValue: 'claim-0',
  }))
  assert.equal(retired.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1)
  const appended = applyStateTransitionProposal(retired, approvedProposal({ value: 'claim-new' }))
  assert.equal(appended.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN)
})

test('legacy over-capacity state remains valid without truncation', () => {
  const state = createSoulState({ soulId: 'soul:legacy-over-capacity' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN + 3 }, (_, index) => `legacy-${index}`)
  assert.equal(validateSoulState(state).valid, true)
  assert.equal(state.userModel.length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN + 3)
  assert.throws(
    () => applyStateTransitionProposal(state, approvedProposal({ value: 'new-claim' })),
    /current cognition is at capacity/,
  )
})
