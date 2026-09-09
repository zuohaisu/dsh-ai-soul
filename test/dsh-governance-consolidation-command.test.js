import assert from 'node:assert/strict'
import test from 'node:test'

import { createDshGovernanceCommand } from '../src/adapters/governance-command.js'

function stateWithClaims() {
  return {
    relationship: { state: [] },
    selfModel: [],
    userModel: [
      { claim: 'The user prefers concise status updates.' },
      { claim: 'The user prefers explicit acceptance criteria.' },
      { claim: 'The user prefers evidence-linked decisions.' },
    ],
    beliefs: [],
    worldModel: [],
  }
}

function invocation(payload, commandId = 'command-consolidate-330') {
  return { rawInput: `consolidate ${JSON.stringify(payload)}`, commandId }
}

function commandFor({ state, emit } = {}) {
  const pending = []
  const ctx = {
    async emit(name, payload) {
      if (emit) return emit(name, payload, pending)
      if (name === 'ai-soul/governance-proposal') {
        const entry = { soulId: payload.soulId, proposal: structuredClone(payload.proposal), status: 'pending' }
        pending.push(entry)
        return [structuredClone(entry)]
      }
      return []
    },
  }
  return {
    pending,
    command: createDshGovernanceCommand({
      ctx,
      consumer: { listPending: () => structuredClone(pending) },
      soulId: 'ember-330',
      reviewerId: 'human:operator-330',
      getState: () => state,
    }),
  }
}

const payload = {
  target: 'userModel',
  sources: [
    { claim: 'The user prefers concise status updates.' },
    { claim: 'The user prefers explicit acceptance criteria.' },
  ],
  claim: { claim: 'The user prefers concise, falsifiable engineering communication.' },
  reason: 'Compress overlapping durable communication preferences without losing their shared meaning.',
}

test('human consolidation command creates only an unreviewed canonical proposal and leaves Soul state unchanged', async () => {
  const state = stateWithClaims()
  const before = structuredClone(state)
  const { command, pending } = commandFor({ state })

  const result = await command.handler(invocation(payload))

  assert.equal(result.kind, 'success')
  assert.match(result.text, /independent review without Soul-state mutation/)
  assert.deepEqual(state, before)
  assert.equal(pending.length, 1)
  const proposal = pending[0].proposal
  assert.equal(proposal.operation, 'consolidate')
  assert.equal(proposal.target, 'userModel')
  assert.deepEqual(proposal.previousValues, payload.sources)
  assert.deepEqual(proposal.value, payload.claim)
  assert.equal(proposal.review, null)
  assert.equal(proposal.proposer, 'human:operator-330')
  assert.equal(proposal.provenance.boundary, 'soul-review-consolidate-v1')
})

test('consolidation command fails closed for fewer than two or non-current source claims', async () => {
  const state = stateWithClaims()
  const { command, pending } = commandFor({ state })

  const tooFew = await command.handler(invocation({ ...payload, sources: payload.sources.slice(0, 1) }))
  assert.equal(tooFew.kind, 'error')
  assert.match(tooFew.text, /at least two source claims/)

  const stale = await command.handler(invocation({ ...payload, sources: [payload.sources[0], { claim: 'A stale claim.' }] }))
  assert.equal(stale.kind, 'error')
  assert.match(stale.text, /exactly match one current claim/)
  assert.equal(pending.length, 0)
})

test('consolidation command fails closed when governance transport does not accept the proposal', async () => {
  const state = stateWithClaims()
  const before = structuredClone(state)
  const { command } = commandFor({ state, emit: async () => [] })

  const result = await command.handler(invocation(payload))
  assert.equal(result.kind, 'error')
  assert.match(result.text, /transport did not accept/)
  assert.deepEqual(state, before)
})

test('the same configured human cannot review the consolidation proposal they created', async () => {
  const state = stateWithClaims()
  const { command, pending } = commandFor({ state })
  const proposed = await command.handler(invocation(payload))
  assert.equal(proposed.kind, 'success')
  assert.equal(pending.length, 1)
  const proposalId = pending[0].proposal.id

  const reviewed = await command.handler({ rawInput: `approve ${proposalId}`, commandId: 'command-review-330' })
  assert.equal(reviewed.kind, 'error')
  assert.match(reviewed.text, /Independent review required/)
})
