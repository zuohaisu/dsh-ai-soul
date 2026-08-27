import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appendTransition,
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  projectEvolutionHistory,
  renderSoulEvolutionHistory,
  reviewStateTransitionProposal,
} from '../src/core/index.js'

function governedState({ withConflict = false } = {}) {
  const soul = createSoulState({ soulId: 'soul-history', name: 'History Soul' })
  const proposal = createStateTransitionProposal({
    id: 'proposal-history-1',
    at: '2026-08-27T08:10:00.000Z',
    target: 'selfModel',
    value: { claim: 'I preserve explicit governance boundaries.' },
    reason: 'Repeated evidence supports this working self-model claim.',
    evidence: [
      { type: 'experience', id: 'exp-history-1' },
      { type: 'reflection', id: 'reflection-history-1' },
    ],
    provenance: { reflectionId: 'reflection-history-1' },
    confidence: 0.84,
    proposer: 'reflection:test',
  })

  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: withConflict ? 'Approved as coexistence, not replacement.' : 'Evidence and confidence satisfy policy.',
    provenance: { reviewId: 'review-history-1' },
    conflicts: withConflict
      ? [{ id: 'belief-old-1', reason: 'Older evidence points in a different direction.', provenance: { source: 'archaeology' } }]
      : [],
    conflictResolution: withConflict
      ? { disposition: 'coexist', reason: 'Both claims remain evidence-supported.', provenance: { reviewId: 'review-history-1' } }
      : null,
    at: '2026-08-27T08:11:00.000Z',
  })

  return applyStateTransitionProposal(soul, reviewed)
}

test('projects and renders governed transition with reason and governance decision', () => {
  const state = governedState()
  const before = structuredClone(state)
  const history = projectEvolutionHistory(state)
  const text = renderSoulEvolutionHistory(state)

  assert.equal(history.length, 1)
  assert.equal(history[0].governed, true)
  assert.equal(history[0].target, 'selfModel')
  assert.equal(history[0].review.decision, 'approved')
  assert.equal(history[0].review.reviewer, 'governance:test')
  assert.deepEqual(history[0].evidenceIds, ['exp-history-1', 'reflection-history-1'])
  assert.match(text, /governed-state-transition/)
  assert.match(text, /Change: append → selfModel/)
  assert.match(text, /Repeated evidence supports this working self-model claim/)
  assert.match(text, /Review: approved by governance:test/)
  assert.match(text, /Evidence: exp-history-1, reflection-history-1/)
  assert.deepEqual(state, before)
})

test('renders declared conflict and coexist resolution', () => {
  const text = renderSoulEvolutionHistory(governedState({ withConflict: true }))

  assert.match(text, /Conflicts: belief-old-1/)
  assert.match(text, /Conflict resolution: coexist/)
  assert.match(text, /Resolution reason: Both claims remain evidence-supported/)
})

test('renders empty evolution history explicitly', () => {
  const soul = createSoulState({ soulId: 'empty-history', name: 'Empty History' })
  assert.equal(renderSoulEvolutionHistory(soul), 'No recorded Soul evolution.')
})

test('unknown evolution kinds are rendered conservatively without fabricated semantics', () => {
  const soul = createSoulState({ soulId: 'unknown-history', name: 'Unknown History' })
  const next = appendTransition(soul, {
    id: 'transition-unknown-1',
    at: '2026-08-27T08:12:00.000Z',
    kind: 'future-transition-kind',
    reason: 'A future subsystem recorded this event.',
    provenance: { subsystem: 'future-test' },
  })

  const history = projectEvolutionHistory(next)
  const text = renderSoulEvolutionHistory(next)

  assert.equal(history[0].governed, false)
  assert.match(history[0].summary, /no specialized interpretation is defined/)
  assert.match(text, /future-transition-kind/)
  assert.match(text, /A future subsystem recorded this event/)
  assert.doesNotMatch(text, /approved|rejected|selfModel|userModel/)
})
