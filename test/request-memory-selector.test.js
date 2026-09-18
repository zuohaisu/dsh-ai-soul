import assert from 'node:assert/strict'
import test from 'node:test'

import { deriveDshInteractionRecallKey, resolveRequestScopedCognitiveMemorySelection } from '../src/adapters/request-memory-selector.js'

const session = { id: 'session-1' }

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse('2026-09-19T05:00:00.000Z'),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

function memory(id, overrides = {}) {
  return {
    version: 1,
    id,
    soulId: 'soul-a',
    experienceId: 'experience-1',
    significanceAssessmentId: 'significance-1',
    formedAt: '2026-09-12T00:00:00.000Z',
    content: `Memory ${id}`,
    confidence: 0.9,
    provenance: { source: 'test' },
    canonical: false,
    authority: 'none',
    ...overrides,
  }
}

function store(records) {
  return { async list() { return structuredClone(records) } }
}

test('explicit lineage selector delegates to bounded deterministic retrieval', async () => {
  const records = [memory('b'), memory('a'), memory('other', { experienceId: 'experience-2' })]
  const requestContext = { aiSoulCognitiveMemorySelector: { experienceId: 'experience-1' } }
  const before = structuredClone(requestContext)
  const result = await resolveRequestScopedCognitiveMemorySelection({ requestContext, store: store(records), soulId: 'soul-a' })
  assert.deepEqual(result.map((record) => record.id), ['a', 'b'])
  assert.deepEqual(requestContext, before)
})

test('zero match is empty and missing selector grants no selection', async () => {
  assert.deepEqual(await resolveRequestScopedCognitiveMemorySelection({
    requestContext: { aiSoulCognitiveMemorySelector: { experienceId: 'missing' } },
    store: store([memory('a')]),
    soulId: 'soul-a',
  }), [])
  assert.equal(await resolveRequestScopedCognitiveMemorySelection({ requestContext: {}, store: store([memory('a')]), soulId: 'soul-a' }), undefined)
})

test('dual authority sources and unsupported selectors fail closed', async () => {
  await assert.rejects(resolveRequestScopedCognitiveMemorySelection({
    requestContext: {
      aiSoulCognitiveMemorySelection: [memory('a')],
      aiSoulCognitiveMemorySelector: { experienceId: 'experience-1' },
    },
    store: store([memory('a')]), soulId: 'soul-a',
  }), /mutually exclusive/)
  await assert.rejects(resolveRequestScopedCognitiveMemorySelection({
    requestContext: { aiSoulCognitiveMemorySelector: { content: 'Memory' } },
    store: store([memory('a')]), soulId: 'soul-a',
  }), /unsupported cognitive memory selector field/)
})

test('retrieval rejects cross-Soul and tampered durable records', async () => {
  await assert.rejects(resolveRequestScopedCognitiveMemorySelection({
    requestContext: { aiSoulCognitiveMemorySelector: { experienceId: 'experience-1' } },
    store: store([memory('foreign', { soulId: 'soul-b' })]), soulId: 'soul-a',
  }), /another Soul/)
  await assert.rejects(resolveRequestScopedCognitiveMemorySelection({
    requestContext: { aiSoulCognitiveMemorySelector: { experienceId: 'experience-1' } },
    store: store([memory('tampered', { authority: 'execute' })]), soulId: 'soul-a',
  }), /invalid retrieved cognitive memory/)
})

test('interaction recall cue derives the exact participant key for accepted human interactions', () => {
  assert.equal(
    deriveDshInteractionRecallKey({ session, event: humanMessage(1, 'hello'), participant: { id: 'human-x' } }),
    'participant:human-x',
  )
})

test('non-human, boundary-failing, and unsafe-identity interactions yield no cue', () => {
  assert.equal(deriveDshInteractionRecallKey({}), null)
  assert.equal(deriveDshInteractionRecallKey({
    session,
    event: { type: 'user/message', seq: 1, time: Date.parse('2026-09-19T05:00:00.000Z'), data: { source: { kind: 'plugin' }, content: [{ type: 'text', text: 'hello' }] } },
    participant: { id: 'human-x' },
  }), null)
  assert.equal(deriveDshInteractionRecallKey({ session, event: humanMessage(1, 'hello'), participant: { id: 'unsafe id' } }), null)
  assert.throws(
    () => deriveDshInteractionRecallKey({ session, event: { type: 'user/message', seq: -1, time: Date.parse('2026-09-19T05:00:00.000Z'), data: { source: { kind: 'user' } } }, participant: { id: 'human-x' } }),
    /non-negative event\.seq/,
  )
})
