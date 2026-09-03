import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function reviewedRetirement(previousValue) {
  const pending = createStateTransitionProposal({
    id: 'proposal-retire',
    at: '2026-09-04T04:00:00.000Z',
    target: 'userModel',
    operation: 'retire',
    previousValue,
    reason: 'The user explicitly asked that this current preference no longer be retained.',
    evidence: [{ type: 'experience', id: 'experience-forget-1' }],
    provenance: { source: 'privacy:test' },
    confidence: 1,
    proposer: 'privacy:test',
  })

  return reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Explicit exact-claim retirement request.',
    provenance: { reviewId: 'review-retire' },
    at: '2026-09-04T04:01:00.000Z',
  })
}

test('approved retirement removes exactly one current claim and preserves retirement provenance', () => {
  const current = { claim: 'The user prefers concise answers.' }
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  soul.userModel.push(current)

  const next = applyStateTransitionProposal(soul, reviewedRetirement(current))

  assert.equal(next.userModel.length, 0)
  assert.equal(next.evolution.at(-1).change.operation, 'retire')
  assert.deepEqual(next.evolution.at(-1).change.previousValue, current)
  assert.equal(Object.prototype.hasOwnProperty.call(next.evolution.at(-1).change, 'value'), false)
  assert.equal(next.evolution.at(-1).provenance.review.decision, 'approved')
})

test('retirement is exact-match fail-closed for missing or ambiguous current claims', () => {
  const current = { claim: 'The user prefers concise answers.' }
  const approved = reviewedRetirement(current)

  assert.throws(
    () => applyStateTransitionProposal(createSoulState({ soulId: 'soul-1' }), approved),
    /retire previousValue does not match current state/,
  )

  const ambiguous = createSoulState({ soulId: 'soul-1' })
  ambiguous.userModel.push(structuredClone(current), structuredClone(current))
  assert.throws(
    () => applyStateTransitionProposal(ambiguous, approved),
    /retire previousValue matches multiple current values/,
  )
})

test('retirement requires previousValue and forbids replacement value', () => {
  const base = {
    target: 'userModel',
    operation: 'retire',
    reason: 'forget',
    evidence: [{ id: 'e' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'test',
  }

  assert.throws(
    () => createStateTransitionProposal(base),
    /previousValue is required for replace or retire/,
  )
  assert.throws(
    () => createStateTransitionProposal({ ...base, previousValue: { claim: 'A' }, value: { claim: 'B' } }),
    /value is not valid for retire/,
  )
})

test('retirement remains review-bound to the exact previous value', () => {
  const approved = reviewedRetirement({ claim: 'A' })
  approved.previousValue.claim = 'B'
  const soul = createSoulState({ soulId: 'soul-1' })
  soul.userModel.push({ claim: 'A' })

  assert.throws(
    () => applyStateTransitionProposal(soul, approved),
    /review does not match current proposal contents/,
  )
})

test('unreviewed retirement has no mutation authority', () => {
  const current = { claim: 'A' }
  const soul = createSoulState({ soulId: 'soul-1' })
  soul.userModel.push(current)
  const pending = createStateTransitionProposal({
    target: 'userModel', operation: 'retire', previousValue: current,
    reason: 'forget', evidence: [{ id: 'e' }], provenance: { source: 'test' }, confidence: 1, proposer: 'test',
  })

  assert.throws(() => applyStateTransitionProposal(soul, pending), /must be reviewed/)
  assert.deepEqual(soul.userModel, [current])
})
