import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_VISIBLE_COGNITIVE_MEMORIES,
  projectCognitiveMemoryVisibility,
  renderCognitiveMemoryVisibility,
} from '../src/core/cognitive-memory-visibility.js'

function memory(overrides = {}) {
  return {
    version: 1,
    id: 'mem-1',
    soulId: 'soul-1',
    experienceId: 'exp-1',
    significanceAssessmentId: 'sig-1',
    formedAt: '2026-09-11T00:00:00.000Z',
    content: 'Haisu prefers explicit architectural boundaries.',
    confidence: 0.9,
    provenance: { source: 'test' },
    canonical: false,
    authority: 'none',
    ...overrides,
  }
}

test('projects explicitly supplied memory as non-canonical model-visible cognition', () => {
  const source = memory()
  const projection = projectCognitiveMemoryVisibility({ soulId: 'soul-1', memories: [source] })
  assert.equal(projection.canonical, false)
  assert.equal(projection.authority, 'none')
  assert.equal(projection.memories.length, 1)
  assert.match(renderCognitiveMemoryVisibility(projection), /non-canonical/)
  assert.match(renderCognitiveMemoryVisibility(projection), /explicit architectural boundaries/)
  assert.deepEqual(source.provenance, { source: 'test' })
})

test('empty explicit selection renders no memory context', () => {
  const projection = projectCognitiveMemoryVisibility({ soulId: 'soul-1', memories: [] })
  assert.equal(renderCognitiveMemoryVisibility(projection), '')
})

test('rejects cross-Soul and tampered memory', () => {
  assert.throws(() => projectCognitiveMemoryVisibility({ soulId: 'soul-1', memories: [memory({ soulId: 'soul-2' })] }), /different Soul/)
  assert.throws(() => projectCognitiveMemoryVisibility({ soulId: 'soul-1', memories: [memory({ authority: 'execute' })] }), /invalid cognitive memory/)
})

test('rejects implicit selection and count overflow', () => {
  assert.throws(() => projectCognitiveMemoryVisibility({ soulId: 'soul-1' }), /explicitly supplied array/)
  const memories = Array.from({ length: MAX_VISIBLE_COGNITIVE_MEMORIES + 1 }, (_, index) => memory({ id: `mem-${index}` }))
  assert.throws(() => projectCognitiveMemoryVisibility({ soulId: 'soul-1', memories }), /records/)
})
