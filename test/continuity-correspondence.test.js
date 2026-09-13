import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyStateTransitionContinuityCorrespondence } from '../src/core/continuity-correspondence.js'
import { projectStateTransitionContinuityPreview } from '../src/core/state-transition-continuity-preview.js'
import { createStateTransitionProposal } from '../src/core/state-transition.js'

function state() {
  return {
    schemaVersion: 1,
    soulId: 'ember-correspondence',
    genesis: { id: 'genesis-1', at: '2026-09-13T00:00:00.000Z', provenance: { source: 'test' } },
    identity: { invariants: [] },
    relationship: { participants: [], state: [], covenants: [] },
    selfModel: [], userModel: [], beliefs: [], worldModel: [], autobiography: [], evolution: [],
  }
}

function proposal(overrides = {}) {
  return createStateTransitionProposal({
    id: 'proposal-correspondence-1',
    at: '2026-09-13T00:01:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { claim: 'The user prefers bounded continuity evidence.' },
    reason: 'explicit preference',
    evidence: [{ kind: 'test' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'reflection:test',
    ...overrides,
  })
}

function evolutionEntry(current, candidate) {
  const preview = projectStateTransitionContinuityPreview({ state: current, proposal: candidate })
  return {
    kind: 'governed-state-transition',
    provenance: { proposalId: candidate.id },
    change: { target: candidate.target, operation: candidate.operation },
    continuityImpact: structuredClone(preview.delta),
  }
}

test('verifies exact visible preview-to-actual continuity correspondence without mutating inputs', () => {
  const current = state()
  const candidate = proposal()
  const entry = evolutionEntry(current, candidate)
  const before = structuredClone({ current, candidate, entry })

  const result = verifyStateTransitionContinuityCorrespondence({ state: current, proposal: candidate, evolutionEntry: entry })

  assert.equal(result.verified, true)
  assert.equal(result.proposalId, candidate.id)
  assert.equal(result.delta.hasVisibleChanges, true)
  assert.deepEqual({ current, candidate, entry }, before)
})

test('accepts opaque canonical relationship change as zero model-visible delta without claiming zero canonical change', () => {
  const current = state()
  const candidate = proposal({ target: 'relationship.state', value: { predicate: 'opaque', value: 'x' } })
  const entry = evolutionEntry(current, candidate)

  const result = verifyStateTransitionContinuityCorrespondence({ state: current, proposal: candidate, evolutionEntry: entry })

  assert.equal(result.verified, true)
  assert.equal(result.delta.hasVisibleChanges, false)
  assert.equal(Object.hasOwn(result, 'canonicalChange'), false)
})

test('fails closed when persisted bounded continuity evidence is tampered', () => {
  const current = state()
  const candidate = proposal()
  const entry = evolutionEntry(current, candidate)
  entry.continuityImpact = { ...entry.continuityImpact, hasVisibleChanges: false }

  assert.throws(
    () => verifyStateTransitionContinuityCorrespondence({ state: current, proposal: candidate, evolutionEntry: entry }),
    /preview continuity delta does not match actual continuity impact/,
  )
})

test('fails closed on proposal, target, or operation correspondence mismatch', () => {
  const current = state()
  const candidate = proposal()
  const base = evolutionEntry(current, candidate)

  assert.throws(() => verifyStateTransitionContinuityCorrespondence({ state: current, proposal: candidate, evolutionEntry: { ...base, provenance: { proposalId: 'other' } } }), /proposalId/)
  assert.throws(() => verifyStateTransitionContinuityCorrespondence({ state: current, proposal: candidate, evolutionEntry: { ...base, change: { ...base.change, target: 'selfModel' } } }), /target/)
  assert.throws(() => verifyStateTransitionContinuityCorrespondence({ state: current, proposal: candidate, evolutionEntry: { ...base, change: { ...base.change, operation: 'retire' } } }), /operation/)
})
