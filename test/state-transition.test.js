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

function conflict(overrides = {}) {
  return {
    id: 'conflict-1',
    reason: 'An existing working-model claim points in the opposite direction.',
    provenance: { source: 'selfModel', ref: 'claim-existing' },
    ...overrides,
  }
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
  assert.equal(reviewed.review.policy.minimumConfidence, 0.6)
  assert.equal(typeof reviewed.review.proposalFingerprint, 'string')
  assert.equal(typeof reviewed.review.reviewFingerprint, 'string')
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
    conflicts: [conflict()],
  })

  assert.equal(rejected.review.conflicts.length, 1)
  assert.equal(rejected.review.conflictResolution, null)
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

test('application is bound to the exact review contents', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const approved = reviewStateTransitionProposal(proposal(), {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Approved as submitted.',
    provenance: { reviewId: 'review-integrity' },
  })

  approved.review.policy.minimumConfidence = 0

  assert.throws(
    () => applyStateTransitionProposal(soul, approved),
    /review contents changed after review/,
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
    policy: { minimumConfidence: 0.75 },
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
  assert.equal(next.evolution[0].provenance.review.policy.minimumConfidence, 0.75)
  assert.deepEqual(next.evolution[0].provenance.review.conflicts, [])
  assert.equal(typeof next.evolution[0].provenance.review.reviewFingerprint, 'string')
  assert.equal(next.evolution[0].change.target, 'userModel')
  assert.equal(next.evolution[0].change.confidence, 0.82)
})

test('approval is blocked when confidence is below active review policy', () => {
  const pending = proposal({ confidence: 0.55 })

  assert.throws(
    () => reviewStateTransitionProposal(pending, {
      decision: 'approved',
      reviewer: 'governance:test',
      reason: 'Attempting approval despite weak evidence.',
      provenance: { reviewId: 'review-low-confidence' },
    }),
    /confidence is below review policy threshold/,
  )

  const rejected = reviewStateTransitionProposal(pending, {
    decision: 'rejected',
    reviewer: 'governance:test',
    reason: 'Confidence is below the policy threshold.',
    provenance: { reviewId: 'review-low-confidence-reject' },
  })
  assert.equal(rejected.review.decision, 'rejected')
})

test('approved proposal with declared conflicts requires explicit coexist resolution', () => {
  const pending = proposal()
  const conflicts = [conflict()]

  assert.throws(
    () => reviewStateTransitionProposal(pending, {
      decision: 'approved',
      reviewer: 'governance:test',
      reason: 'Conflict was noticed but not resolved.',
      provenance: { reviewId: 'review-conflict-missing-resolution' },
      conflicts,
    }),
    /requires conflict resolution/,
  )

  const approved = reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Both claims are retained as competing working hypotheses.',
    provenance: { reviewId: 'review-conflict-coexist' },
    conflicts,
    conflictResolution: {
      disposition: 'coexist',
      reason: 'Evidence is strong enough to retain both claims without pretending the conflict is settled.',
      provenance: { resolutionId: 'resolution-1', method: 'explicit-review' },
    },
  })

  const next = applyStateTransitionProposal(createSoulState({ soulId: 'soul-1', name: 'Soul One' }), approved)
  const review = next.evolution[0].provenance.review
  assert.equal(review.conflicts[0].id, 'conflict-1')
  assert.equal(review.conflictResolution.disposition, 'coexist')
  assert.equal(review.conflictResolution.provenance.resolutionId, 'resolution-1')
})

test('conflict declarations and review policy are validated', () => {
  assert.throws(
    () => reviewStateTransitionProposal(proposal(), {
      decision: 'approved',
      reviewer: 'governance:test',
      reason: 'bad policy',
      provenance: { reviewId: 'review-bad-policy' },
      policy: { minimumConfidence: 2 },
    }),
    /minimumConfidence must be between 0 and 1/,
  )

  assert.throws(
    () => reviewStateTransitionProposal(proposal(), {
      decision: 'approved',
      reviewer: 'governance:test',
      reason: 'bad conflict evidence',
      provenance: { reviewId: 'review-bad-conflict' },
      conflicts: [{ id: 'c', reason: 'known conflict' }],
      conflictResolution: {
        disposition: 'coexist',
        reason: 'retain both',
        provenance: { resolutionId: 'r' },
      },
    }),
    /review\.conflicts\[0\]\.provenance is required/,
  )
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
