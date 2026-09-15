import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  STATE_TRANSITION_TARGETS,
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
  validateSoulState,
} from '../src/core/index.js'

function targetArray(state, target) {
  switch (target) {
    case 'selfModel': return state.selfModel
    case 'userModel': return state.userModel
    case 'relationship.state': return state.relationship.state
    case 'beliefs': return state.beliefs
    case 'worldModel': return state.worldModel
    default: throw new TypeError(`unsupported test target: ${target}`)
  }
}

function approvedProposal({ target, operation = 'append', value, previousValue } = {}) {
  const proposal = createStateTransitionProposal({
    id: `proposal:${target}:${operation}:${crypto.randomUUID()}`,
    at: '2026-09-15T00:00:00.000Z',
    target,
    operation,
    ...(operation !== 'retire' ? { value } : {}),
    ...(operation !== 'append' ? { previousValue } : {}),
    reason: 'cross-domain capacity falsification',
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

for (const target of STATE_TRANSITION_TARGETS) {
  test(`${target}: append is bounded, fail-closed, and retire reopens capacity`, () => {
    const state = createSoulState({ soulId: `soul:capacity:${target}` })
    const values = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `${target}-claim-${index}`)
    targetArray(state, target).push(...values)
    const before = structuredClone(state)

    assert.throws(
      () => applyStateTransitionProposal(state, approvedProposal({ target, value: `${target}-overflow` })),
      /current cognition is at capacity/,
    )
    assert.deepEqual(state, before)

    const retired = applyStateTransitionProposal(state, approvedProposal({
      target,
      operation: 'retire',
      previousValue: values[0],
    }))
    assert.equal(targetArray(retired, target).length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1)

    const appended = applyStateTransitionProposal(retired, approvedProposal({ target, value: `${target}-replacement` }))
    assert.equal(targetArray(appended, target).length, MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN)
  })

  test(`${target}: legacy over-capacity state is preserved but cannot grow`, () => {
    const state = createSoulState({ soulId: `soul:legacy-capacity:${target}` })
    targetArray(state, target).push(...Array.from(
      { length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN + 2 },
      (_, index) => `${target}-legacy-${index}`,
    ))
    const before = structuredClone(state)

    assert.equal(validateSoulState(state).valid, true)
    assert.throws(
      () => applyStateTransitionProposal(state, approvedProposal({ target, value: `${target}-new` })),
      /current cognition is at capacity/,
    )
    assert.deepEqual(state, before)
  })
}
