import assert from 'node:assert/strict'
import test from 'node:test'

import { createDshGovernanceCommand } from '../src/adapters/governance-command.js'
import { createStateTransitionProposal } from '../src/core/state-transition.js'

function state() {
  return {
    schemaVersion: 1,
    soulId: 'ember-review-preview',
    genesis: { id: 'genesis-1', at: '2026-09-12T00:00:00.000Z', provenance: { source: 'test' } },
    identity: { invariants: [] },
    relationship: { participants: [], state: [], covenants: [] },
    selfModel: [], userModel: [], beliefs: [], worldModel: [], autobiography: [], evolution: [],
  }
}

function proposal(overrides = {}) {
  return createStateTransitionProposal({
    id: 'proposal-preview-1',
    at: '2026-09-12T00:01:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { claim: 'The user prefers falsifiable engineering notes.' },
    reason: 'explicit preference',
    evidence: [{ kind: 'test' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'reflection:test',
    ...overrides,
  })
}

function command(currentState, pendingProposal) {
  return createDshGovernanceCommand({
    ctx: { async emit() { return [] } }, soulId: currentState.soulId, reviewerId: 'human:reviewer',
    getState: () => currentState,
    consumer: { listPending: () => [{ soulId: currentState.soulId, proposal: pendingProposal }] },
  })
}

test('review list shows source-attributed model-visible continuity impact without mutation', async () => {
  const current = state()
  const before = structuredClone(current)
  const result = await command(current, proposal()).handler({ rawInput: 'list' })
  assert.equal(result.kind, 'success')
  assert.match(result.text, /continuity impact:/)
  assert.match(result.text, /\+ userModel\[0\]: The user prefers falsifiable engineering notes\./)
  assert.deepEqual(current, before)
})

test('opaque relationship mutation explicitly reports no model-visible continuity delta', async () => {
  const current = state()
  const result = await command(current, proposal({ target: 'relationship.state', value: { predicate: 'opaque', value: 'x' } })).handler({ rawInput: 'list' })
  assert.match(result.text, /no model-visible continuity delta \(canonical state may still change\)/)
  assert.doesNotMatch(result.text, /\+ relationship\.state/)
})

test('preview failure is isolated to presentation and does not hide the pending proposal', async () => {
  const current = state()
  const stale = proposal({ operation: 'replace', previousValue: { claim: 'missing' } })
  const result = await command(current, stale).handler({ rawInput: 'list' })
  assert.equal(result.kind, 'success')
  assert.match(result.text, /proposal-preview-1/)
  assert.match(result.text, /continuity impact: unavailable/)
})
