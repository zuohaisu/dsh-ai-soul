import assert from 'node:assert/strict'
import test from 'node:test'

import {
  STATE_TRANSITION_CONTINUITY_PREVIEW_VERSION,
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  projectContinuityDigestDelta,
  projectStateTransitionContinuityPreview,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function baseState() {
  const state = createSoulState({ soulId: 'soul-preview', name: 'Mira' })
  state.userModel = [{ claim: 'Prefers concise explanations.' }]
  state.relationship.state = [{ opaque: 'legacy relationship content' }]
  return state
}

function appendProposal() {
  return createStateTransitionProposal({
    id: 'proposal-preview-1',
    at: '2026-09-12T13:00:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { claim: 'Prefers explicit uncertainty.' },
    reason: 'durable preference evidence',
    evidence: [{ experienceId: 'exp-1' }],
    provenance: { source: 'test' },
    confidence: 0.9,
    proposer: 'reflection:test',
  })
}

test('preview is deterministic, attributable, and zero-mutation', () => {
  const state = baseState()
  const proposal = appendProposal()
  const stateBefore = structuredClone(state)
  const proposalBefore = structuredClone(proposal)

  const first = projectStateTransitionContinuityPreview({ state, proposal })
  const second = projectStateTransitionContinuityPreview({ state, proposal })

  assert.deepEqual(first, second)
  assert.equal(first.version, STATE_TRANSITION_CONTINUITY_PREVIEW_VERSION)
  assert.equal(first.proposalId, proposal.id)
  assert.equal(first.target, 'userModel')
  assert.equal(first.operation, 'append')
  assert.equal(first.delta.hasVisibleChanges, true)
  assert.deepEqual(first.delta.added, [
    { sourcePath: 'userModel[1]', text: 'Prefers explicit uncertainty.' },
  ])
  assert.deepEqual(state, stateBefore)
  assert.deepEqual(proposal, proposalBefore)
})

test('preview delta matches canonical applied-state delta after independent approval', () => {
  const state = baseState()
  const proposal = appendProposal()
  const preview = projectStateTransitionContinuityPreview({ state, proposal })
  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'human:test-reviewer',
    reason: 'evidence supports the change',
    provenance: { source: 'test-review' },
    at: '2026-09-12T13:01:00.000Z',
  })
  const applied = applyStateTransitionProposal(state, reviewed)
  const actualDelta = projectContinuityDigestDelta({ before: state, after: applied })

  assert.deepEqual(preview.delta, actualDelta)
})

test('opaque relationship mutation yields no continuity claim', () => {
  const state = baseState()
  const proposal = createStateTransitionProposal({
    id: 'proposal-preview-relational',
    at: '2026-09-12T13:00:00.000Z',
    target: 'relationship.state',
    operation: 'append',
    value: { opaque: 'new relationship content' },
    reason: 'relationship evidence',
    evidence: [{ experienceId: 'exp-2' }],
    provenance: { source: 'test' },
    confidence: 0.9,
    proposer: 'reflection:test',
  })

  const preview = projectStateTransitionContinuityPreview({ state, proposal })
  assert.equal(preview.delta.hasVisibleChanges, false)
  assert.deepEqual(preview.delta.added, [])
  assert.deepEqual(preview.delta.removed, [])
  assert.deepEqual(preview.delta.changed, [])
})

test('replace preview fails closed when previousValue does not match current state', () => {
  const state = baseState()
  const proposal = createStateTransitionProposal({
    id: 'proposal-preview-missing',
    at: '2026-09-12T13:00:00.000Z',
    target: 'userModel',
    operation: 'replace',
    previousValue: { claim: 'Not present.' },
    value: { claim: 'Replacement.' },
    reason: 'revision',
    evidence: [{ experienceId: 'exp-3' }],
    provenance: { source: 'test' },
    confidence: 0.9,
    proposer: 'reflection:test',
  })

  assert.throws(
    () => projectStateTransitionContinuityPreview({ state, proposal }),
    /replace previousValue does not match current state/,
  )
})
