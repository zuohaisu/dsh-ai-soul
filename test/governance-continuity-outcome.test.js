import assert from 'node:assert/strict'
import test from 'node:test'

import { projectGovernanceContinuityOutcome } from '../src/adapters/governance-continuity-outcome.js'
import { projectStateTransitionContinuityPreview } from '../src/core/state-transition-continuity-preview.js'
import { createStateTransitionProposal } from '../src/core/state-transition.js'

function state() {
  return {
    schemaVersion: 1,
    soulId: 'ember-governance-outcome',
    genesis: { id: 'genesis-1', at: '2026-09-13T00:00:00.000Z', provenance: { source: 'test' } },
    identity: { createdAt: '2026-09-13T00:00:00.000Z', invariants: [] },
    relationship: { participants: [], state: [], covenants: [] },
    selfModel: [], userModel: [], beliefs: [], worldModel: [], autobiography: [], evolution: [],
  }
}

function proposal(overrides = {}) {
  return createStateTransitionProposal({
    id: 'proposal-outcome-1',
    at: '2026-09-13T00:01:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { claim: 'The user prefers verified post-apply continuity evidence.' },
    reason: 'explicit preference',
    evidence: [{ kind: 'test' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'reflection:test',
    ...overrides,
  })
}

function afterState(beforeState, candidate) {
  const preview = projectStateTransitionContinuityPreview({ state: beforeState, proposal: candidate })
  const after = structuredClone(beforeState)
  const target = candidate.target === 'relationship.state' ? after.relationship.state : after[candidate.target]
  target.push(structuredClone(candidate.value))
  after.evolution.push({
    id: 'evolution-1',
    at: '2026-09-13T00:02:00.000Z',
    kind: 'governed-state-transition',
    reason: candidate.reason,
    provenance: { proposalId: candidate.id },
    change: { target: candidate.target, operation: candidate.operation },
    continuityImpact: structuredClone(preview.delta),
  })
  return after
}

test('projects verified visible post-apply continuity outcome without mutating evidence', () => {
  const before = state()
  const candidate = proposal()
  const after = afterState(before, candidate)
  const snapshot = structuredClone({ before, candidate, after })
  const result = projectGovernanceContinuityOutcome({ beforeState: before, afterState: after, proposal: candidate })
  assert.equal(result.verified, true)
  assert.equal(result.proposalId, candidate.id)
  assert.equal(result.delta.hasVisibleChanges, true)
  assert.match(result.text, /Verified actual continuity impact:/)
  assert.deepEqual({ before, candidate, after }, snapshot)
})

test('reports opaque canonical mutation as zero model-visible delta without claiming no canonical change', () => {
  const before = state()
  const candidate = proposal({ target: 'relationship.state', value: { predicate: 'opaque', value: 'x' } })
  const after = afterState(before, candidate)
  const result = projectGovernanceContinuityOutcome({ beforeState: before, afterState: after, proposal: candidate })
  assert.equal(result.verified, true)
  assert.equal(result.delta.hasVisibleChanges, false)
  assert.match(result.text, /canonical state changed/)
})

test('fails closed when proposal-bound evidence is missing or ambiguous', () => {
  const before = state()
  const candidate = proposal()
  const after = afterState(before, candidate)
  assert.throws(() => projectGovernanceContinuityOutcome({ beforeState: before, afterState: { ...after, evolution: [] }, proposal: candidate }), /exactly one governed transition evidence entry/)
  assert.throws(() => projectGovernanceContinuityOutcome({ beforeState: before, afterState: { ...after, evolution: [...after.evolution, structuredClone(after.evolution[0])] }, proposal: candidate }), /exactly one governed transition evidence entry/)
})

test('fails closed when persisted continuity evidence is tampered', () => {
  const before = state()
  const candidate = proposal()
  const after = afterState(before, candidate)
  after.evolution[0].continuityImpact = { ...after.evolution[0].continuityImpact, hasVisibleChanges: false }
  assert.throws(() => projectGovernanceContinuityOutcome({ beforeState: before, afterState: after, proposal: candidate }), /preview continuity delta does not match actual continuity impact/)
})
