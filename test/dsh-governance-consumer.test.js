import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  createDshGovernanceConsumer,
  createSoulState,
  createStateTransitionProposal,
} from '../src/index.js'

function createEventContext() {
  const handlers = new Map()
  const emitted = []

  return {
    emitted,
    on(name, handler) {
      const list = handlers.get(name) ?? []
      list.push(handler)
      handlers.set(name, list)
      return () => {
        handlers.set(name, (handlers.get(name) ?? []).filter((item) => item !== handler))
      }
    },
    async emit(name, payload) {
      emitted.push({ name, payload: structuredClone(payload) })
      const results = []
      for (const handler of handlers.get(name) ?? []) {
        results.push(await handler(payload))
      }
      return results
    },
  }
}

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-consumer-'))
  const store = new FileSoulStore({ rootDir })
  await store.save(createSoulState({ soulId: 'ember-186' }))
  const ctx = createEventContext()
  const consumer = createDshGovernanceConsumer(ctx, { store })
  const proposal = createStateTransitionProposal({
    id: 'proposal-186',
    at: '2026-09-03T06:05:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { claim: 'The user prefers concise implementation notes.' },
    reason: 'The human explicitly requested durable retention of this bounded preference.',
    evidence: [{ type: 'candidate-claim', id: 'candidate-186' }],
    provenance: { source: 'dsh-session-event', boundary: 'ai-soul/governance-proposal-v1' },
    confidence: 0.92,
    proposer: 'dsh-ai-soul:live-interaction',
  })
  return { store, ctx, consumer, proposal }
}

test('DSH governance proposal event queues pending review without canonical mutation', async () => {
  const { store, ctx, consumer, proposal } = await fixture()
  const before = await store.load('ember-186')

  await ctx.emit('ai-soul/governance-proposal', { soulId: 'ember-186', proposal })

  assert.equal(consumer.listPending().length, 1)
  assert.deepEqual(await store.load('ember-186'), before)
  assert.equal(ctx.emitted.some((event) => event.name === 'ai-soul/state-committed'), false)
})

test('read-only governance snapshot is correlated, soul-scoped, detached, and non-mutating', async () => {
  const { store, ctx, consumer, proposal } = await fixture()
  const before = await store.load('ember-186')
  await ctx.emit('ai-soul/governance-proposal', { soulId: 'ember-186', proposal })

  const results = await ctx.emit('ai-soul/governance-snapshot-request', {
    soulId: 'ember-186',
    requestId: 'snapshot-188',
  })
  const snapshot = results[0]

  assert.equal(snapshot.requestId, 'snapshot-188')
  assert.equal(snapshot.soulId, 'ember-186')
  assert.equal(snapshot.pending.length, 1)
  assert.equal(snapshot.pending[0].proposal.id, proposal.id)
  assert.deepEqual(snapshot.resolved, [])
  assert.deepEqual(await store.load('ember-186'), before)
  assert.equal(ctx.emitted.some((event) => event.name === 'ai-soul/state-committed'), false)

  const emitted = ctx.emitted.find((event) => event.name === 'ai-soul/governance-snapshot')
  assert.equal(emitted.payload.requestId, 'snapshot-188')
  snapshot.pending[0].proposal.value.claim = 'tampered'
  assert.equal(consumer.listPending()[0].proposal.value.claim, 'The user prefers concise implementation notes.')
})

test('governance snapshot request fails closed when correlation or soul scope is missing', async () => {
  const { ctx } = await fixture()

  await assert.rejects(
    ctx.emit('ai-soul/governance-snapshot-request', { soulId: 'ember-186' }),
    /requires requestId/,
  )
  await assert.rejects(
    ctx.emit('ai-soul/governance-snapshot-request', { requestId: 'snapshot-188' }),
    /requires soulId/,
  )
})

test('independent approved review persists before state-committed and resolution signals', async () => {
  const { store, ctx, consumer, proposal } = await fixture()
  await ctx.emit('ai-soul/governance-proposal', { soulId: 'ember-186', proposal })

  const emittedBeforeReview = ctx.emitted.length
  await ctx.emit('ai-soul/governance-review', {
    soulId: 'ember-186',
    proposalId: proposal.id,
    decision: 'approved',
    reviewer: 'governance:human-reviewer',
    reason: 'Explicit durable preference with sufficient evidence.',
    provenance: { reviewId: 'review-approve-186' },
    at: '2026-09-03T06:06:00.000Z',
  })

  const state = await store.load('ember-186')
  assert.deepEqual(state.userModel, [{ claim: 'The user prefers concise implementation notes.' }])
  assert.equal(consumer.listPending().length, 0)
  assert.equal(consumer.listResolved()[0].status, 'approved')

  const reviewEmissions = ctx.emitted.slice(emittedBeforeReview)
  const committedIndex = reviewEmissions.findIndex((event) => event.name === 'ai-soul/state-committed')
  const resolvedIndex = reviewEmissions.findIndex((event) => event.name === 'ai-soul/governance-resolved')
  assert.ok(committedIndex >= 0)
  assert.ok(resolvedIndex > committedIndex)
  assert.deepEqual(reviewEmissions[committedIndex].payload, { soulId: 'ember-186' })
})

test('rejected review resolves without state mutation or state-committed signal', async () => {
  const { store, ctx, consumer, proposal } = await fixture()
  const before = await store.load('ember-186')
  await ctx.emit('ai-soul/governance-proposal', { soulId: 'ember-186', proposal })

  const emittedBeforeReview = ctx.emitted.length
  await ctx.emit('ai-soul/governance-review', {
    soulId: 'ember-186',
    proposalId: proposal.id,
    decision: 'rejected',
    reviewer: 'governance:human-reviewer',
    reason: 'Do not retain this claim.',
    provenance: { reviewId: 'review-reject-186' },
    at: '2026-09-03T06:07:00.000Z',
  })

  assert.deepEqual(await store.load('ember-186'), before)
  assert.equal(consumer.listResolved()[0].status, 'rejected')
  const reviewEmissions = ctx.emitted.slice(emittedBeforeReview)
  assert.equal(reviewEmissions.some((event) => event.name === 'ai-soul/state-committed'), false)
  assert.equal(reviewEmissions.some((event) => event.name === 'ai-soul/governance-resolved'), true)
})

test('invalid review fails closed without poisoning later independent review', async () => {
  const { store, ctx, consumer, proposal } = await fixture()
  const before = await store.load('ember-186')
  await ctx.emit('ai-soul/governance-proposal', { soulId: 'ember-186', proposal })

  await assert.rejects(
    ctx.emit('ai-soul/governance-review', {
      soulId: 'ember-186',
      proposalId: proposal.id,
      decision: 'approved',
      reviewer: proposal.proposer,
      reason: 'self approval is forbidden',
      provenance: { reviewId: 'review-self-186' },
    }),
    /reviewer must be independent/,
  )
  assert.equal(consumer.listPending().length, 1)
  assert.deepEqual(await store.load('ember-186'), before)

  await assert.rejects(
    ctx.emit('ai-soul/governance-review', {
      soulId: 'ember-186',
      proposalId: proposal.id,
      decision: 'approved',
      reviewer: 'governance:human-reviewer',
    }),
    /requires reason/,
  )
  assert.equal(consumer.listPending().length, 1)

  await ctx.emit('ai-soul/governance-review', {
    soulId: 'ember-186',
    proposalId: proposal.id,
    decision: 'rejected',
    reviewer: 'governance:human-reviewer',
    reason: 'Valid later review still executes after rejected events.',
    provenance: { reviewId: 'review-recovery-186' },
    at: '2026-09-03T06:08:00.000Z',
  })

  assert.equal(consumer.listPending().length, 0)
  assert.equal(consumer.listResolved()[0].status, 'rejected')
  assert.deepEqual(await store.load('ember-186'), before)
})
