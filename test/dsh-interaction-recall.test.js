import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  apply,
  createCognitiveMemoryRecord,
  createExperienceRecord,
  createGenesisRecord,
  createSignificanceAssessment,
  deriveRecallKeysFromExperience,
  FileCognitiveMemoryStore,
  FileSoulStore,
  persistGenesisSoul,
} from '../src/index.js'

const soulId = 'ember-404-recall'
const participant = { id: 'human-x', kind: 'human' }

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

function sourceExperience(id, participantId) {
  return createExperienceRecord({
    id,
    at: '2026-09-19T05:00:00.000Z',
    kind: 'human-message',
    source: { runtime: 'deepseek-harness', sessionId: 'session-404' },
    provenance: { source: 'test', boundary: 'runtime-event-v1' },
    payload: { participant: { id: participantId, kind: 'human' }, observation: { text: 'A bounded observation.' } },
  })
}

function assessment(id, experienceId) {
  return createSignificanceAssessment({
    id,
    experienceId,
    assessedAt: '2026-09-19T05:00:01.000Z',
    level: 'high',
    rationale: 'Explicitly significant under a governed deterministic policy.',
    confidence: 0.95,
    provenance: { assessor: 'test', policy: 'explicit-significance-v1' },
    recommendPromotion: true,
  })
}

async function makeStores(memorySeeds) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-interaction-recall-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-19T04:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis', issue: 404 },
  }))
  const memoryStore = new FileCognitiveMemoryStore({ rootDir: `${rootDir}.memory` })
  for (const seed of memorySeeds) {
    const experience = sourceExperience(`experience-${seed.id}`, seed.participantId)
    await memoryStore.save(createCognitiveMemoryRecord({
      id: seed.id,
      soulId,
      experience,
      significanceAssessment: assessment(`significance-${seed.id}`, experience.id),
      content: seed.content,
      confidence: 0.9,
      formedAt: '2026-09-19T05:00:02.000Z',
      provenance: { source: 'selective-memory-formation', policy: 'significant-experience-only-v1' },
      recallKeys: deriveRecallKeysFromExperience(experience),
    }))
  }
  return { rootDir, memoryStore }
}

function humanMessage(seq, text, at = `2026-09-19T05:0${seq}:00.000Z`) {
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

test('current interaction recall surfaces only the matching memory', async () => {
  const { rootDir } = await makeStores([
    { id: 'memory-x', participantId: 'human-x', content: 'Kayak trip memory unique phrase' },
    { id: 'memory-y', participantId: 'human-y', content: 'Astronomy night memory unique phrase' },
  ])
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
    cognitiveMemoryStoreDir: `${rootDir}.memory`,
  })

  const provider = runtime.registrations[0].text
  assert.doesNotMatch(provider({}), /Selective Cognitive Memory/)

  await runtime.listeners.get('session/event')({ id: 'session-404-a' }, humanMessage(1, 'hello'))

  const rendered = provider({})
  assert.match(rendered, /## Selective Cognitive Memory/)
  assert.match(rendered, /Kayak trip memory unique phrase/)
  assert.doesNotMatch(rendered, /Astronomy night memory unique phrase/)
})

test('explicit materialized request records override the interaction-conditioned selection', async () => {
  const { rootDir, memoryStore } = await makeStores([
    { id: 'memory-x', participantId: 'human-x', content: 'Kayak trip memory unique phrase' },
    { id: 'memory-y', participantId: 'human-y', content: 'Astronomy night memory unique phrase' },
  ])
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
    cognitiveMemoryStoreDir: `${rootDir}.memory`,
  })
  const provider = runtime.registrations[0].text
  await runtime.listeners.get('session/event')({ id: 'session-404-b' }, humanMessage(1, 'hello'))
  assert.match(provider({}), /Kayak trip memory unique phrase/)

  const explicitMemory = await memoryStore.load(soulId, 'memory-y')
  const explicitRendered = provider({ aiSoulCognitiveMemorySelection: [explicitMemory] })
  assert.match(explicitRendered, /Astronomy night memory unique phrase/)
  assert.doesNotMatch(explicitRendered, /Kayak trip memory unique phrase/)

  await assert.throws(
    () => provider({ aiSoulCognitiveMemorySelection: [explicitMemory], aiSoulCognitiveMemorySelector: { experienceId: 'experience-x' } }),
    /mutually exclusive/,
  )
  await assert.throws(
    () => provider({ aiSoulCognitiveMemorySelector: { experienceId: 'experience-x' } }),
    /not resolvable by the live synchronous context renderer/,
  )
})

test('unrelated interaction recall selects nothing and suppresses startup fallback', async () => {
  const { rootDir, memoryStore } = await makeStores([
    { id: 'memory-y', participantId: 'human-y', content: 'Astronomy night memory unique phrase' },
  ])
  const startupSelection = [await memoryStore.load(soulId, 'memory-y')]
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
    cognitiveMemoryStoreDir: `${rootDir}.memory`,
    cognitiveMemorySelection: startupSelection,
  })
  const provider = runtime.registrations[0].text
  assert.match(provider({}), /Astronomy night memory unique phrase/)

  await runtime.listeners.get('session/event')({ id: 'session-404-c' }, humanMessage(1, 'hello'))

  assert.doesNotMatch(provider({}), /Selective Cognitive Memory/)
  assert.doesNotMatch(provider({}), /Astronomy night memory unique phrase/)
})

test('cue recall is request-ephemeral and mutates neither Soul state nor memory storage', async () => {
  const { rootDir, memoryStore } = await makeStores([
    { id: 'memory-x', participantId: 'human-x', content: 'Kayak trip memory unique phrase' },
  ])
  const store = new FileSoulStore({ rootDir })
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
    cognitiveMemoryStoreDir: `${rootDir}.memory`,
  })
  const provider = runtime.registrations[0].text
  await runtime.listeners.get('session/event')({ id: 'session-404-d' }, humanMessage(1, 'hello'))
  assert.match(provider({}), /Kayak trip memory unique phrase/)

  const stateAfterFirstInteraction = await store.load(soulId)
  await runtime.listeners.get('session/event')({ id: 'session-404-d' }, humanMessage(2, 'good morning'))
  assert.deepEqual(await store.load(soulId), stateAfterFirstInteraction)
  assert.deepEqual((await memoryStore.list(soulId)).map((record) => record.id), ['memory-x'])
  assert.match(provider({}), /Kayak trip memory unique phrase/)
})

test('without cognitiveMemoryStoreDir the ordinary composition path stays default-off', async () => {
  const { rootDir } = await makeStores([
    { id: 'memory-x', participantId: 'human-x', content: 'Kayak trip memory unique phrase' },
  ])
  const runtime = runtimeContext()
  await apply(runtime.ctx, {
    soulId,
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })
  const provider = runtime.registrations[0].text
  await runtime.listeners.get('session/event')({ id: 'session-404-e' }, humanMessage(1, 'hello'))
  assert.doesNotMatch(provider({}), /Selective Cognitive Memory/)
  assert.doesNotMatch(provider({}), /Kayak trip memory unique phrase/)
})
