import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  createGovernanceInbox,
  createSoulState,
  createStateTransitionProposal,
} from '../src/core/index.js'

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-inbox-'))
  const store = new FileSoulStore({ rootDir })
  await store.save(createSoulState({ soulId: 'ember-182' }))
  const inbox = createGovernanceInbox({ store })
  const proposal = createStateTransitionProposal({
    id: 'proposal-182',
    at: '2026-09-03T04:05:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { claim: 'The user prefers concise implementation notes.' },
    reason: 'The human explicitly requested durable retention of this bounded preference.',
    evidence: [{ type: 'candidate-claim', id: 'candidate-182' }],
    provenance: { source: 'dsh-session-event', boundary: 'ai-soul/governance-proposal-v1' },
    confidence: 0.92,
    proposer: 'dsh-ai-soul:live-interaction',
  })
  return { store, inbox, proposal }
}

test('receiving a governance proposal only queues it and does not mutate Soul state', async () => {
  const { store, inbox, proposal } = await fixture()
  const before = await store.load('ember-182')

  inbox.receive({ soulId: 'ember-182', proposal })

  assert.equal(inbox.listPending().length, 1)
  assert.deepEqual(await store.load('ember-182'), before)
})

test('proposal proposer cannot review its own proposal', async () => {
  const { inbox, proposal } = await fixture()
  inbox.receive({ soulId: 'ember-182', proposal })

  await assert.rejects(
    inbox.review({
      soulId: 'ember-182',
      proposalId: proposal.id,
      decision: 'approved',
      reviewer: proposal.proposer,
      reason: 'self approval is forbidden',
      provenance: { reviewId: 'review-self' },
    }),
    /reviewer must be independent/,
  )
  assert.equal(inbox.listPending().length, 1)
})

test('independent approval applies and persists exactly one bounded userModel claim', async () => {
  const { store, inbox, proposal } = await fixture()
  inbox.receive({ soulId: 'ember-182', proposal })

  const resolved = await inbox.review({
    soulId: 'ember-182',
    proposalId: proposal.id,
    decision: 'approved',
    reviewer: 'governance:human-reviewer',
    reason: 'Explicit durable preference with sufficient confidence.',
    provenance: { reviewId: 'review-approve-182' },
    at: '2026-09-03T04:06:00.000Z',
  })

  const state = await store.load('ember-182')
  assert.equal(resolved.status, 'approved')
  assert.equal(resolved.persisted, true)
  assert.equal(inbox.listPending().length, 0)
  assert.equal(inbox.listResolved().length, 1)
  assert.deepEqual(state.userModel, [{ claim: 'The user prefers concise implementation notes.' }])
  assert.equal(state.evolution.at(-1).provenance.review.reviewer, 'governance:human-reviewer')
})

test('independent rejection resolves proposal without mutating canonical Soul state', async () => {
  const { store, inbox, proposal } = await fixture()
  const before = await store.load('ember-182')
  inbox.receive({ soulId: 'ember-182', proposal })

  const resolved = await inbox.review({
    soulId: 'ember-182',
    proposalId: proposal.id,
    decision: 'rejected',
    reviewer: 'governance:human-reviewer',
    reason: 'Evidence should not be promoted.',
    provenance: { reviewId: 'review-reject-182' },
    at: '2026-09-03T04:07:00.000Z',
  })

  assert.equal(resolved.status, 'rejected')
  assert.equal(resolved.persisted, false)
  assert.deepEqual(await store.load('ember-182'), before)
})
