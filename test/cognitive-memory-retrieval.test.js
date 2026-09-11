import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_COGNITIVE_MEMORY_RETRIEVAL_RESULTS,
  retrieveCognitiveMemories,
} from '../src/core/cognitive-memory-retrieval.js'

function memory(id, overrides = {}) {
  return {
    version: 1,
    id,
    soulId: 'soul-a',
    experienceId: 'experience-1',
    significanceAssessmentId: 'significance-1',
    formedAt: '2026-09-11T10:00:00.000Z',
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

test('explicit selector returns deterministic bounded matching subset', async () => {
  const records = [
    memory('memory-c', { formedAt: '2026-09-11T12:00:00.000Z' }),
    memory('memory-b', { formedAt: '2026-09-11T11:00:00.000Z' }),
    memory('memory-a', { formedAt: '2026-09-11T11:00:00.000Z' }),
    memory('other', { experienceId: 'experience-2' }),
  ]
  const selector = { experienceId: 'experience-1' }
  const before = structuredClone(selector)
  const result = await retrieveCognitiveMemories({ store: store(records), soulId: 'soul-a', selector, limit: 2 })
  assert.deepEqual(result.map((record) => record.id), ['memory-a', 'memory-b'])
  assert.deepEqual(selector, before)
  result[0].content = 'caller mutation'
  assert.equal(records[1].content, 'Memory memory-b')
})

test('no match returns empty and never falls back to all memories', async () => {
  const result = await retrieveCognitiveMemories({
    store: store([memory('memory-1')]), soulId: 'soul-a', selector: { experienceId: 'missing' },
  })
  assert.deepEqual(result, [])
})

test('retrieval rejects cross-Soul and tampered records', async () => {
  await assert.rejects(
    retrieveCognitiveMemories({ store: store([memory('foreign', { soulId: 'soul-b' })]), soulId: 'soul-a', selector: { experienceId: 'experience-1' } }),
    /another Soul/,
  )
  await assert.rejects(
    retrieveCognitiveMemories({ store: store([memory('tampered', { authority: 'execute' })]), soulId: 'soul-a', selector: { experienceId: 'experience-1' } }),
    /invalid retrieved cognitive memory/,
  )
})

test('selector and hard result limit fail closed', async () => {
  const source = [memory('memory-1')]
  await assert.rejects(retrieveCognitiveMemories({ store: store(source), soulId: 'soul-a', selector: {} }), /at least one criterion/)
  await assert.rejects(retrieveCognitiveMemories({ store: store(source), soulId: 'soul-a', selector: { content: 'Memory' } }), /unsupported cognitive memory selector field/)
  await assert.rejects(retrieveCognitiveMemories({ store: store(source), soulId: 'soul-a', selector: { experienceId: 'experience-1' }, limit: 0 }), /limit must be/)
  await assert.rejects(retrieveCognitiveMemories({ store: store(source), soulId: 'soul-a', selector: { experienceId: 'experience-1' }, limit: MAX_COGNITIVE_MEMORY_RETRIEVAL_RESULTS + 1 }), /limit must be/)
})
