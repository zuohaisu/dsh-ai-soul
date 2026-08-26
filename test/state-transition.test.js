import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function proposal(overrides = {}) {
  return createStateTransitionProposal({
    id: 'proposal-1',
    at: '2026-08-27T06:40:00.000Z',
    target: 'selfModel',
    value: { claim: 'I prefer explicit evidence boundaries.' },
    reason: 'Repeated evidence supports this working self-model claim.',
    evidence: [{ type: 'archaeology-claim', id: 'claim-1' }],
    provenance: { source: 'samuel-archaeology' },
    confidence: 0.82,
    proposer: 'reflection:test',
    ...overrides,
  })
}

test('creating and reviewing a proposal do not mutate Soul State or the original proposal', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const soulBefore = structuredClone(soul)
  const pending = proposal()
  const pendingBefore = structuredClone(pending)

  const reviewed = reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Evidence and confidence are sufficient for this mutable domain.',
    provenance: { reviewId: 'review-1' },
    at: '2026-08-27T06:41:00.000Z',
  })

  assert.deepEqual(soul, soulBefore)
  assert.deepEqual(pending, pendingBefore)
  assert.equal(pending.review, null)
  assert.equal(reviewed.review.decision, 'approved')
  assert.equal(typeof reviewed.review.proposalFingerprint, 'string')
})

test('unreviewed and rejected proposals cannot be applied', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const pending = proposal()

  assert.throws(() => applyStateTransitionProposal(soul, pending), /must be reviewed/)

  const rejected = reviewStateTransitionProposal(pending, {
    decision: 'rejected',
    reviewer: 'governance:test',
    reason: 'Evidence is not strong enough.',
    provenance: { reviewId: 'review-reject' },
  })

  assert.throws(() => applyStateTransitionProposal(soul, rejected), /only approved proposals/)
})

test('review is bound to the exact proposal contents it approved', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const approved = reviewStateTransitionProposal(proposal(), {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Approved as submitted.',
    provenance: { reviewId: 'review-bound' },
  })

  approved.value.claim = 'A different claim inserted after review.'

  assert.throws(
    () => applyStateTransitionProposal(soul, approved),
    /review does not match current proposal contents/,
  )
})

test('generic proposals reject identity and covenant mutation targets', () => {
  assert.throws(
    () => proposal({ target: 'identity' }),
    /target is not mutable through the generic transition pipeline/,
  )
  assert.throws(
    () => proposal({ target: 'relationship.covenants' }),
    /target is not mutable through the generic transition pipeline/,
  )
})

test('approved proposal appends only to selected domain and records traceable evolution', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const soulBefore = structuredClone(soul)
  const pending = proposal({ target: 'userModel', value: { claim: 'The user values reusable system boundaries.' } })
  const approved = reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Supported by repeated dated collaboration evidence.',
    provenance: { reviewId: 'review-2', method: 'manual-evidence-review' },
    at: '2026-08-27T06:42:00.000Z',
  })

  const next = applyStateTransitionProposal(soul, approved)

  assert.deepEqual(soul, soulBefore)
  assert.equal(next.userModel.length, 1)
  assert.deepEqual(next.userModel[0], pending.value)
  assert.equal(next.selfModel.length, 0)
  assert.equal(next.beliefs.length, 0)
  assert.equal(next.relationship.state.length, 0)
  assert.equal(next.evolution.length, 1)
  assert.equal(next.evolution[0].kind, 'governed-state-transition')
  assert.equal(next.evolution[0].provenance.proposalId, 'proposal-1')
  assert.deepEqual(next.evolution[0].provenance.evidence, pending.evidence)
  assert.equal(next.evolution[0].provenance.review.decision, 'approved')
  assert.equal(next.evolution[0].provenance.review.reviewer, 'governance:test')
  assert.equal(next.evolution[0].change.target, 'userModel')
  assert.equal(next.evolution[0].change.confidence, 0.82)
})

test('proposal requires evidence, confidence, provenance, proposer, and explicit value', () => {
  assert.throws(() => proposal({ evidence: [] }), /evidence must be a non-empty array/)
  assert.throws(() => proposal({ confidence: 2 }), /confidence must be between 0 and 1/)
  assert.throws(() => proposal({ provenance: null }), /provenance is required/)
  assert.throws(() => proposal({ proposer: '' }), /proposer is required/)

  const input = {
    target: 'beliefs',
    reason: 'reason',
    evidence: [{ id: 'e' }],
    provenance: { source: 'test' },
    confidence: 0.5,
    proposer: 'test',
  }
  assert.throws(() => createStateTransitionProposal(input), /value is required/)
})
