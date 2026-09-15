import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  apply,
  createGenesisRecord,
  persistGenesisSoul,
} from '../src/index.js'
import { FileEvolutionLedgerStore } from '../src/core/evolution-ledger-store.js'

const participant = { id: 'human-415', kind: 'human' }

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-15T02:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

function runtimeContext() {
  const handlers = new Map()
  const registrations = []
  const emitted = []
  return {
    registrations,
    emitted,
    ctx: {
      systemPrompt: {
        context(definition) {
          registrations.push(definition)
          return () => {}
        },
      },
      on(name, handler) {
        const list = handlers.get(name) ?? []
        list.push(handler)
        handlers.set(name, list)
        return () => handlers.set(name, (handlers.get(name) ?? []).filter((item) => item !== handler))
      },
      async emit(name, payload, event) {
        emitted.push({ name, payload: structuredClone(payload) })
        const results = []
        for (const handler of handlers.get(name) ?? []) results.push(await handler(payload, event))
        return results
      },
    },
  }
}

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-closed-loop-'))
  const soulId = 'ember-415-growth-loop'
  const bootstrapStore = new FileSoulStore({ rootDir })
  await persistGenesisSoul(bootstrapStore, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-15T02:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis', issue: 415 },
  }))
  const runtime = runtimeContext()
  await apply(runtime.ctx, { soulId, storeDir: rootDir, firstEncounterParticipant: participant })
  return { rootDir, soulId, runtime }
}

test('real-shape DSH interaction grows next-turn cognition only after independent governance and detached persistence', async () => {
  const { rootDir, soulId, runtime } = await fixture()
  const provider = runtime.registrations[0].text
  const baseline = provider({})
  assert.doesNotMatch(baseline, /concise implementation notes/)

  await runtime.ctx.emit('session/event', { id: 'session-415' }, humanMessage(1, 'That build finished quickly.'))
  assert.equal(runtime.emitted.some((event) => event.name === 'ai-soul/governance-proposal'), false)
  assert.equal(provider({}), baseline)

  await runtime.ctx.emit('session/event', { id: 'session-415' }, humanMessage(2, 'Please remember that I prefer concise implementation notes.'))
  const proposalEvent = runtime.emitted.find((event) => event.name === 'ai-soul/governance-proposal')
  assert.ok(proposalEvent)
  assert.equal(proposalEvent.payload.soulId, soulId)
  assert.equal(proposalEvent.payload.proposal.review, null)
  assert.doesNotMatch(provider({}), /concise implementation notes/)

  await runtime.ctx.emit('ai-soul/governance-review', {
    soulId,
    proposalId: proposalEvent.payload.proposal.id,
    decision: 'approved',
    reviewer: 'human:human-415',
    reason: 'Explicit durable preference is eligible for bounded governed retention.',
    provenance: { source: 'automated-closed-loop-test', issue: 415, reviewId: 'review-415' },
    at: '2026-09-15T02:03:00.000Z',
  })

  const nextTurn = provider({})
  assert.match(nextTurn, /## User Model/)
  assert.match(nextTurn, /The user prefers concise implementation notes\./)
  assert.doesNotMatch(nextTurn, /Please remember that I prefer/)

  const persisted = JSON.parse(await readFile(join(rootDir, `${soulId}.json`), 'utf8'))
  assert.deepEqual(persisted.evolution, [])

  const ledger = new FileEvolutionLedgerStore({ rootDir: join(rootDir, '.evolution') })
  const evolution = await ledger.list(soulId)
  assert.ok(evolution.length > 0)
  assert.equal(evolution.at(-1).provenance.source, 'dsh-session-event')

  const reloaded = await new FileSoulStore({ rootDir, evolutionLedger: ledger }).load(soulId)
  assert.equal(reloaded.soulId, soulId)
  assert.deepEqual(reloaded.identity, persisted.identity)
  assert.deepEqual(reloaded.relationship.covenants, persisted.relationship.covenants)
  assert.deepEqual(reloaded.userModel, [{ claim: 'The user prefers concise implementation notes.' }])
})
