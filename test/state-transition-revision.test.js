import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function approvedReplace(previousValue, value) {
  const pending = createStateTransitionProposal({
    id: 'proposal-revision-1',
    at: '2026-09-04T02:10:00.000Z',
    target: 'userModel',
    operation: 'replace',
    previousValue,
    value,
    reason: 'The user explicitly revised a durable preference.',
    evidence: [{ type: 'experience', id: 'experience-revision-1' }],
    provenance: { source: 'test', policy: 'explicit-revision-v1' },
    confidence: 0.98,
    proposer: 'reflection:test',
  })

  return reviewStateTransitionProposal(pending, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'The new statement explicitly supersedes the current preference.',
    provenance: { reviewId: 'review-revision-1' },
    at: '2026-09-04T02:11:00.000Z',
  })
}

test('approved replace revises exactly one current mutable value and preserves old value in evolution history', () => {
  const oldPreference = { claim: 'The user prefers concise answers.' }
  const newPreference = { claim: 'The user prefers detailed answers.' }
  const soul = createSoulState({ soulId: 'soul-revision', name: 'Revision Soul' })
  soul.userModel.push(structuredClone(oldPreference))

  const next = applyStateTransitionProposal(soul, approvedReplace(oldPreference, newPreference))

  assert.deepEqual(soul.userModel, [oldPreference])
  assert.deepEqual(next.userModel, [newPreference])
  assert.equal(next.evolution.at(-1).change.operation, 'replace')
  assert.deepEqual(next.evolution.at(-1).change.previousValue, oldPreference)
  assert.deepEqual(next.evolution.at(-1).change.value, newPreference)
})

test('replace fails closed when previousValue is absent from current state', () => {
  const oldPreference = { claim: 'The user prefers concise answers.' }
  const soul = createSoulState({ soulId: 'soul-revision', name: 'Revision Soul' })
  const before = structuredClone(soul)

  assert.throws(
    () => applyStateTransitionProposal(soul, approvedReplace(oldPreference, { claim: 'The user prefers detailed answers.' })),
    /does not match current state/,
  )
  assert.deepEqual(soul, before)
})

test('replace fails closed when previousValue is ambiguous', () => {
  const oldPreference = { claim: 'The user prefers concise answers.' }
  const soul = createSoulState({ soulId: 'soul-revision', name: 'Revision Soul' })
  soul.userModel.push(structuredClone(oldPreference), structuredClone(oldPreference))
  const before = structuredClone(soul)

  assert.throws(
    () => applyStateTransitionProposal(soul, approvedReplace(oldPreference, { claim: 'The user prefers detailed answers.' })),
    /matches multiple current values/,
  )
  assert.deepEqual(soul, before)
})

test('review integrity binds previousValue for a replace proposal', () => {
  const approved = approvedReplace(
    { claim: 'The user prefers concise answers.' },
    { claim: 'The user prefers detailed answers.' },
  )
  approved.previousValue.claim = 'A different prior claim inserted after review.'

  const soul = createSoulState({ soulId: 'soul-revision', name: 'Revision Soul' })
  soul.userModel.push({ claim: 'The user prefers concise answers.' })

  assert.throws(
    () => applyStateTransitionProposal(soul, approved),
    /review does not match current proposal contents/,
  )
})

test('replace requires previousValue while append rejects it', () => {
  const common = {
    target: 'userModel',
    value: { claim: 'new' },
    reason: 'reason',
    evidence: [{ id: 'evidence-1' }],
    provenance: { source: 'test' },
    confidence: 0.9,
    proposer: 'test',
  }

  assert.throws(
    () => createStateTransitionProposal({ ...common, operation: 'replace' }),
    /previousValue is required for replace/,
  )
  assert.throws(
    () => createStateTransitionProposal({ ...common, operation: 'append', previousValue: { claim: 'old' } }),
    /previousValue is only valid for replace/,
  )
})
