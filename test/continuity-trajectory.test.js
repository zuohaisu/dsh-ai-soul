import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/index.js'
import { verifyGovernedContinuityTrajectory } from '../src/core/continuity-trajectory.js'

function approvedProposal(id, target, value) {
  const pending = createStateTransitionProposal({
    id,
    at: '2026-09-13T04:30:00.000Z',
    target,
    operation: 'append',
    value,
    reason: 'trajectory test evidence',
    evidence: [{ kind: 'test', id }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'reflection:test',
  })
  return reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'approved for trajectory test',
    provenance: { source: 'test-review' },
    at: '2026-09-13T04:31:00.000Z',
  })
}

function grow(state, id, target = 'selfModel', value = { claim: id }) {
  return applyStateTransitionProposal(state, approvedProposal(id, target, value))
}

test('verifies a valid multi-step governed continuity trajectory without mutating checkpoints', () => {
  const first = createSoulState({ soulId: 'trajectory-soul' })
  const second = grow(first, 'proposal-1')
  const third = grow(second, 'proposal-2', 'userModel', { claim: 'bounded evidence matters' })
  const checkpoints = [first, second, third]
  const before = structuredClone(checkpoints)

  const result = verifyGovernedContinuityTrajectory({ checkpoints })

  assert.equal(result.verified, true)
  assert.equal(result.legacyUnsupported, 0)
  assert.deepEqual(result.steps.map((step) => step.status), ['verified', 'verified'])
  assert.deepEqual(checkpoints, before)
})

test('fails closed on tampered continuity evidence and duplicate governed proposal evidence', () => {
  const first = createSoulState({ soulId: 'trajectory-tamper' })
  const second = grow(first, 'proposal-1')
  const third = grow(second, 'proposal-2')

  const tampered = structuredClone(second)
  tampered.evolution.at(-1).continuityImpact.hasVisibleChanges = false
  assert.throws(() => verifyGovernedContinuityTrajectory({ checkpoints: [first, tampered] }), /continuity impact mismatch/)

  const duplicate = structuredClone(third)
  duplicate.evolution.at(-1).provenance.proposalId = 'proposal-1'
  assert.throws(() => verifyGovernedContinuityTrajectory({ checkpoints: [first, second, duplicate] }), /duplicate proposalId/)
})

test('fails closed on missing or rewritten evolution lineage and cross-Soul checkpoints', () => {
  const first = createSoulState({ soulId: 'trajectory-lineage' })
  const second = grow(first, 'proposal-1')
  const third = grow(second, 'proposal-2')

  assert.throws(() => verifyGovernedContinuityTrajectory({ checkpoints: [first, third] }), /exactly one evolution entry/)

  const rewritten = structuredClone(third)
  rewritten.evolution[0].reason = 'rewritten history'
  assert.throws(() => verifyGovernedContinuityTrajectory({ checkpoints: [second, rewritten] }), /homeostasis violation/)

  const other = createSoulState({ soulId: 'other-soul' })
  assert.throws(() => verifyGovernedContinuityTrajectory({ checkpoints: [first, other] }), /homeostasis violation|soulId mismatch/)
})

test('accepts an opaque canonical relationship mutation as a verified zero-visible step', () => {
  const first = createSoulState({ soulId: 'trajectory-opaque' })
  const second = grow(first, 'proposal-opaque', 'relationship.state', { predicate: 'opaque', value: 'x' })

  const result = verifyGovernedContinuityTrajectory({ checkpoints: [first, second] })

  assert.equal(result.verified, true)
  assert.equal(result.steps[0].delta.hasVisibleChanges, false)
})

test('reports legacy continuity evidence as unsupported instead of invalidating the Soul', () => {
  const first = createSoulState({ soulId: 'trajectory-legacy' })
  const second = grow(first, 'proposal-legacy')
  const legacy = structuredClone(second)
  delete legacy.evolution.at(-1).continuityImpact

  const result = verifyGovernedContinuityTrajectory({ checkpoints: [first, legacy] })

  assert.equal(result.verified, false)
  assert.equal(result.legacyUnsupported, 1)
  assert.equal(result.steps[0].status, 'legacy-unsupported')
})
