import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function approvedConsolidation(previousValues, value) {
  const pending = createStateTransitionProposal({
    id: 'proposal-consolidation-1',
    at: '2026-09-04T03:10:00.000Z',
    target: 'userModel',
    operation: 'consolidate',
    previousValues,
    value,
    reason: 'Several current observations support one more compact current understanding.',
    evidence: previousValues.map((_, index) => ({ type: 'experience', id: `experience-consolidation-${index + 1}` })),
    provenance: { source: 'test', policy: 'explicit-consolidation-v1' },
    confidence: 0.95,
    proposer: 'reflection:test',
  })

  return reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'The named source claims are suitable for consolidation.',
    provenance: { reviewId: 'review-consolidation-1' },
    at: '2026-09-04T03:11:00.000Z',
  })
}

test('approved consolidation atomically replaces multiple exact current values with one compact value', () => {
  const first = { claim: 'The user prefers concise status updates.' }
  const second = { claim: 'The user prefers explicit acceptance criteria.' }
  const unrelated = { claim: 'The user prefers source-of-truth evidence.' }
  const consolidated = { claim: 'The user prefers concise, falsifiable engineering communication.' }
  const soul = createSoulState({ soulId: 'soul-consolidation', name: 'Consolidation Soul' })
  soul.userModel.push(structuredClone(first), structuredClone(unrelated), structuredClone(second))

  const next = applyStateTransitionProposal(soul, approvedConsolidation([first, second], consolidated))

  assert.deepEqual(soul.userModel, [first, unrelated, second])
  assert.deepEqual(next.userModel, [consolidated, unrelated])
  assert.equal(next.evolution.at(-1).change.operation, 'consolidate')
  assert.deepEqual(next.evolution.at(-1).change.previousValues, [first, second])
  assert.deepEqual(next.evolution.at(-1).change.value, consolidated)
})

test('consolidation fails closed when any source is missing', () => {
  const first = { claim: 'first' }
  const missing = { claim: 'missing' }
  const soul = createSoulState({ soulId: 'soul-consolidation', name: 'Consolidation Soul' })
  soul.userModel.push(structuredClone(first))
  const before = structuredClone(soul)

  assert.throws(
    () => applyStateTransitionProposal(soul, approvedConsolidation([first, missing], { claim: 'combined' })),
    /does not match current state/,
  )
  assert.deepEqual(soul, before)
})

test('consolidation fails closed when any source is ambiguous', () => {
  const duplicated = { claim: 'duplicate' }
  const second = { claim: 'second' }
  const soul = createSoulState({ soulId: 'soul-consolidation', name: 'Consolidation Soul' })
  soul.userModel.push(structuredClone(duplicated), structuredClone(duplicated), structuredClone(second))
  const before = structuredClone(soul)

  assert.throws(
    () => applyStateTransitionProposal(soul, approvedConsolidation([duplicated, second], { claim: 'combined' })),
    /matches multiple current values/,
  )
  assert.deepEqual(soul, before)
})

test('consolidation proposal requires at least two distinct source values', () => {
  const common = {
    target: 'userModel',
    operation: 'consolidate',
    value: { claim: 'combined' },
    reason: 'reason',
    evidence: [{ id: 'evidence-1' }],
    provenance: { source: 'test' },
    confidence: 0.9,
    proposer: 'test',
  }

  assert.throws(
    () => createStateTransitionProposal({ ...common, previousValues: [{ claim: 'only one' }] }),
    /at least two values/,
  )
  assert.throws(
    () => createStateTransitionProposal({ ...common, previousValues: [{ claim: 'same' }, { claim: 'same' }] }),
    /must not contain duplicate values/,
  )
})

test('review integrity binds all consolidation source values', () => {
  const first = { claim: 'first' }
  const second = { claim: 'second' }
  const approved = approvedConsolidation([first, second], { claim: 'combined' })
  approved.previousValues[0].claim = 'tampered after review'

  const soul = createSoulState({ soulId: 'soul-consolidation', name: 'Consolidation Soul' })
  soul.userModel.push(structuredClone(first), structuredClone(second))

  assert.throws(
    () => applyStateTransitionProposal(soul, approved),
    /review does not match current proposal contents/,
  )
})

test('unreviewed consolidation has no mutation authority', () => {
  const first = { claim: 'first' }
  const second = { claim: 'second' }
  const soul = createSoulState({ soulId: 'soul-consolidation', name: 'Consolidation Soul' })
  soul.userModel.push(structuredClone(first), structuredClone(second))
  const pending = createStateTransitionProposal({
    target: 'userModel',
    operation: 'consolidate',
    previousValues: [first, second],
    value: { claim: 'combined' },
    reason: 'reason',
    evidence: [{ id: 'evidence-1' }],
    provenance: { source: 'test' },
    confidence: 0.9,
    proposer: 'test',
  })

  assert.throws(() => applyStateTransitionProposal(soul, pending), /must be reviewed/)
  assert.deepEqual(soul.userModel, [first, second])
})
