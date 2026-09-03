import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  apply,
  applyStateTransitionProposal,
  createCandidatePromotionProposal,
  createGenesisRecord,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
  reviewStateTransitionProposal,
} from '../src/index.js'

const participant = { id: 'human-184', kind: 'human' }

function runtimeContext() {
  const registrations = []
  const listeners = new Map()
  return {
    registrations,
    listeners,
    ctx: {
      systemPrompt: {
        context(definition) {
          registrations.push(definition)
          return () => {}
        },
      },
      on(name, listener) {
        listeners.set(name, listener)
        return () => listeners.delete(name)
      },
      emit() {},
    },
  }
}

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-dynamic-context-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T05:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis', issue: 184 },
  }))
  return { rootDir, store }
}

function humanMessage(seq, text, at = `2026-09-03T05:0${seq}:00.000Z`) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(at),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

test('per-assembly provider reflects first encounter persisted in the same process', async () => {
  const soulId = 'ember-184-first-encounter'
  const { rootDir } = await makeStore(soulId)
  const runtime = runtimeContext()

  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const provider = runtime.registrations[0].text
  assert.equal(typeof provider, 'function')
  assert.doesNotMatch(provider({}), /human-184/)

  await runtime.listeners.get('session/event')(
    { id: 'session-184-first' },
    humanMessage(1, 'hello'),
  )

  const refreshed = provider({})
  assert.match(refreshed, /human-184/)
  assert.match(refreshed, /## Relationship/)
})

test('governed save becomes model-visible after matching state-committed event without plugin restart', async () => {
  const soulId = 'ember-184-governed'
  const { rootDir, store } = await makeStore(soulId)
  const runtime = runtimeContext()

  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const provider = runtime.registrations[0].text
  assert.doesNotMatch(provider({}), /concise implementation notes/)

  const inferred = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-184-governed' },
    event: humanMessage(2, 'Please remember that I prefer concise implementation notes.'),
    participant,
  })
  const proposal = createCandidatePromotionProposal(inferred.candidateClaim, {
    id: 'proposal-184-dynamic-context',
    at: '2026-09-03T05:03:00.000Z',
    reason: 'Explicit durable preference for same-process context refresh proof.',
    proposer: 'independent-test-proposer',
    provenance: { source: 'automated-integration-test', issue: 184 },
  })
  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'independent-test-reviewer',
    reason: 'Bounded explicit preference satisfies the test governance policy.',
    provenance: {
      source: 'automated-integration-test',
      issue: 184,
      independentFromProposer: true,
    },
    policy: { minimumConfidence: 0.9 },
    conflicts: [],
    at: '2026-09-03T05:04:00.000Z',
  })
  const evolved = applyStateTransitionProposal(await store.load(soulId), reviewed)
  await store.save(evolved)

  // Persisting alone cannot smuggle state into the live provider. The independent
  // governance boundary must explicitly announce a completed save.
  assert.doesNotMatch(provider({}), /concise implementation notes/)

  const refreshResult = await runtime.listeners.get('ai-soul/state-committed')({ soulId })
  assert.deepEqual(refreshResult, { status: 'refreshed', soulId })
  assert.match(provider({}), /## User Model/)
  assert.match(provider({}), /The user prefers concise implementation notes\./)
  assert.doesNotMatch(provider({}), /Please remember that I prefer/)
})

test('state-committed refresh ignores other Souls and fails closed on malformed payloads', async () => {
  const soulId = 'ember-184-isolation'
  const { rootDir } = await makeStore(soulId)
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const refresh = runtime.listeners.get('ai-soul/state-committed')
  assert.deepEqual(
    await refresh({ soulId: 'another-soul' }),
    { status: 'ignored', soulId: 'another-soul' },
  )
  await assert.rejects(() => refresh(null), /requires payload\.soulId/)
  await assert.rejects(() => refresh({}), /requires payload\.soulId/)
})
