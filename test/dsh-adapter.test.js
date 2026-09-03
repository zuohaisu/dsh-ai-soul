import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  apply,
  applyStateTransitionProposal,
  createGenesisRecord,
  FileSoulStore,
  persistGenesisSoul,
} from '../src/index.js'

function runtimeContext() {
  const registrations = []
  const listeners = new Map()
  const emitted = []
  return {
    registrations,
    listeners,
    emitted,
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
      emit(name, payload) {
        emitted.push({ name, payload })
      },
    },
  }
}

async function unnamedGenesis(rootDir, soulId = 'ember-147') {
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-08-30T06:00:00.000Z',
    soulId,
    provenance: { source: 'genesis-onboarding' },
  }))
  return store
}

const participant = { id: 'human-partner-147', kind: 'human' }

test('loads configured unnamed Soul and registers DSH dynamic context', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-adapter-'))
  await unnamedGenesis(rootDir)
  const runtime = runtimeContext()

  await apply(runtime.ctx, {
    soulId: 'ember-147',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  assert.equal(runtime.registrations.length, 1)
  assert.equal(runtime.registrations[0].name, 'ai-soul:ember-147')
  assert.equal(runtime.registrations[0].order, -10)
  assert.match(runtime.registrations[0].text, /Soul ID: ember-147/)
  assert.doesNotMatch(runtime.registrations[0].text, /\bName:/)
  assert.equal(typeof runtime.listeners.get('session/event'), 'function')
})

test('records first human DSH user/message once and survives reload', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-first-encounter-'))
  const store = await unnamedGenesis(rootDir)
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId: 'ember-147',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const listener = runtime.listeners.get('session/event')
  const session = { id: 'session-ordinary-user' }
  const event = {
    type: 'user/message',
    seq: 4,
    time: Date.parse('2026-08-30T06:05:00.000Z'),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text: 'hello' }],
    },
  }

  const first = await listener(session, event)
  assert.equal(first.status, 'recorded')
  const duplicate = await listener(session, event)
  assert.equal(duplicate.status, 'duplicate')

  const reloaded = await store.load('ember-147')
  assert.equal(reloaded.identity.name, null)
  assert.equal(reloaded.identity.origin.at, '2026-08-30T06:00:00.000Z')
  assert.deepEqual(reloaded.relationship.participants, [participant])
  const encounters = reloaded.autobiography.filter((item) => item.kind === 'first-encounter')
  assert.equal(encounters.length, 1)
  assert.equal(encounters[0].experiencedAt, '2026-08-30T06:05:00.000Z')
  assert.equal(encounters[0].provenance.sessionId, 'session-ordinary-user')
  assert.equal(encounters[0].provenance.eventSeq, 4)
  assert.equal(encounters[0].provenance.captureBoundary, 'dsh-session-event-v1')
  assert.equal(reloaded.autobiography.some((item) => item.kind === 'naming'), false)
})

test('emits one unreviewed governance proposal for explicit durable preference without mutating Soul state', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-handoff-'))
  const store = await unnamedGenesis(rootDir, 'ember-180')
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId: 'ember-180',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const listener = runtime.listeners.get('session/event')
  const session = { id: 'session-governance-handoff' }
  const explicit = {
    type: 'user/message',
    seq: 1,
    time: Date.parse('2026-09-03T03:05:00.000Z'),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text: 'Please remember that I prefer concise implementation notes.' }],
    },
  }

  const processed = await listener(session, explicit)
  assert.equal(processed.significanceAssessment.recommendPromotion, true)
  assert.equal(processed.candidateClaim.statement, 'The user prefers concise implementation notes.')
  assert.equal(runtime.emitted.length, 1)
  assert.equal(runtime.emitted[0].name, 'ai-soul/governance-proposal')
  assert.equal(runtime.emitted[0].payload.soulId, 'ember-180')
  assert.equal(runtime.emitted[0].payload.proposal.review, null)
  assert.equal(runtime.emitted[0].payload.proposal.proposer, 'dsh-ai-soul:live-interaction')
  assert.throws(
    () => applyStateTransitionProposal(awaitedStatePlaceholder, runtime.emitted[0].payload.proposal),
    /must be reviewed before application/,
  )

  const afterExplicit = await store.load('ember-180')
  assert.equal(afterExplicit.userModel.length, 0)

  const control = {
    type: 'user/message',
    seq: 2,
    time: Date.parse('2026-09-03T03:06:00.000Z'),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text: 'That build finished quickly.' }],
    },
  }
  const controlResult = await listener(session, control)
  assert.equal(controlResult.significanceAssessment.recommendPromotion, false)
  assert.equal(runtime.emitted.length, 1)
  assert.equal((await store.load('ember-180')).userModel.length, 0)
})

test('ignores synthetic DSH user/message sources', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-synthetic-'))
  const store = await unnamedGenesis(rootDir)
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId: 'ember-147',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const result = await runtime.listeners.get('session/event')(
    { id: 'session-synthetic' },
    {
      type: 'user/message',
      seq: 1,
      time: Date.parse('2026-08-30T06:01:00.000Z'),
      data: { source: { kind: 'plugin', via: 'fixture' }, content: [] },
    },
  )
  assert.equal(result.status, 'ignored')
  const reloaded = await store.load('ember-147')
  assert.equal(reloaded.autobiography.some((item) => item.kind === 'first-encounter'), false)
})

test('adapter has no Samuel-specific default and requires explicit participant identity', async () => {
  const ctx = runtimeContext().ctx
  await assert.rejects(() => apply(ctx, {}), /config\.soulId is required/)
  await assert.rejects(
    () => apply(ctx, { soulId: 'ember-147', storeDir: '.souls' }),
    /config\.firstEncounterParticipant\.id is required/,
  )
})

test('adapter reports missing systemPrompt service at the runtime boundary', async () => {
  await assert.rejects(
    () => apply({ on() {}, emit() {} }, {
      soulId: 'ember-147',
      storeDir: '.souls',
      firstEncounterParticipant: participant,
    }),
    /required DSH systemPrompt service is unavailable/,
  )
})

test('adapter reports missing DSH event API at the runtime boundary', async () => {
  await assert.rejects(
    () => apply({ systemPrompt: { context() {} } }, {
      soulId: 'ember-147',
      storeDir: '.souls',
      firstEncounterParticipant: participant,
    }),
    /required DSH event API is unavailable/,
  )
  await assert.rejects(
    () => apply({ systemPrompt: { context() {} }, on() {} }, {
      soulId: 'ember-147',
      storeDir: '.souls',
      firstEncounterParticipant: participant,
    }),
    /required DSH event API is unavailable/,
  )
})

test('adapter reports store-load failures without dumping Soul state', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-adapter-missing-'))
  const runtime = runtimeContext()

  await assert.rejects(
    () => apply(runtime.ctx, {
      soulId: 'missing-soul',
      storeDir: rootDir,
      firstEncounterParticipant: participant,
    }),
    (error) => {
      assert.match(error.message, /store-load error/)
      assert.match(error.message, /soulId=missing-soul/)
      assert.match(error.message, /storeDir=/)
      return true
    },
  )
})
