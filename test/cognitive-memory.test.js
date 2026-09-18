import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCognitiveMemoryRecord,
  deriveRecallKeysFromExperience,
} from '../src/core/cognitive-memory.js'
import { createExperienceRecord } from '../src/core/experience.js'
import { createSignificanceAssessment } from '../src/core/significance.js'

function experience() {
  return createExperienceRecord({
    id: 'experience-1',
    at: '2026-09-11T08:00:00.000Z',
    kind: 'human-message',
    source: { runtime: 'deepseek-harness', sessionId: 'session-1' },
    provenance: { source: 'test', boundary: 'runtime-event-v1' },
    payload: { observation: { text: 'A bounded significant event.' } },
  })
}

function assessment(overrides = {}) {
  return createSignificanceAssessment({
    id: 'significance-1',
    experienceId: 'experience-1',
    assessedAt: '2026-09-11T08:00:01.000Z',
    level: 'high',
    rationale: 'Explicitly significant under a governed deterministic policy.',
    confidence: 0.95,
    provenance: { assessor: 'test', policy: 'explicit-significance-v1' },
    recommendPromotion: true,
    ...overrides,
  })
}

function input(overrides = {}) {
  return {
    id: 'memory-1',
    soulId: 'soul-1',
    experience: experience(),
    significanceAssessment: assessment(),
    content: 'Remember that this bounded event materially changed an ongoing commitment.',
    confidence: 0.9,
    formedAt: '2026-09-11T08:00:02.000Z',
    provenance: { source: 'selective-memory-formation', policy: 'significant-experience-only-v1' },
    ...overrides,
  }
}

test('forms detached authority-free Cognitive Memory from significant Experience lineage', () => {
  const source = input()
  const beforeExperience = structuredClone(source.experience)
  const beforeAssessment = structuredClone(source.significanceAssessment)
  const memory = createCognitiveMemoryRecord(source)

  assert.equal(memory.soulId, 'soul-1')
  assert.equal(memory.experienceId, 'experience-1')
  assert.equal(memory.significanceAssessmentId, 'significance-1')
  assert.equal(memory.canonical, false)
  assert.equal(memory.authority, 'none')
  assert.deepEqual(source.experience, beforeExperience)
  assert.deepEqual(source.significanceAssessment, beforeAssessment)
  assert.equal(Object.isFrozen(memory), true)
})

test('ordinary or non-promotable Experience cannot become Cognitive Memory', () => {
  assert.throws(() => createCognitiveMemoryRecord(input({ significanceAssessment: assessment({ level: 'low', recommendPromotion: false }) })), /requires an explicitly high-significance promotable assessment/)
})

test('mismatched significance lineage fails closed', () => {
  assert.throws(() => createCognitiveMemoryRecord(input({ significanceAssessment: assessment({ experienceId: 'experience-other' }) })), /must reference the source experience/)
})

test('unbounded content and authority smuggling fail closed', () => {
  assert.throws(() => createCognitiveMemoryRecord(input({ content: 'x'.repeat(1201) })), /content must be a non-empty string/)
  for (const field of ['approved', 'authorization', 'authorized', 'canonicalMutation', 'execution', 'memoryWrite', 'permission', 'scheduled', 'toolCall']) {
    assert.throws(() => createCognitiveMemoryRecord(input({ [field]: true })), /rejects authority-bearing field/)
  }
})

test('explicit structured recall keys round-trip frozen and reject malformed input', () => {
  const memory = createCognitiveMemoryRecord(input({ recallKeys: ['participant:human-1'] }))
  assert.deepEqual(memory.recallKeys, ['participant:human-1'])
  assert.equal(Object.isFrozen(memory.recallKeys), true)

  assert.throws(() => createCognitiveMemoryRecord(input({ recallKeys: [] })), /at least 1 key/)
  assert.throws(() => createCognitiveMemoryRecord(input({ recallKeys: ['participant:human-1', 'participant:human-1'] })), /duplicates/)
  assert.throws(() => createCognitiveMemoryRecord(input({ recallKeys: ['bad key with spaces'] })), /recall key must match/)
  assert.throws(() => createCognitiveMemoryRecord(input({ recallKeys: ['x'.repeat(129)] })), /recall key must be a non-empty string/)
  assert.throws(() => createCognitiveMemoryRecord(input({ recallKeys: Array.from({ length: 9 }, (_, index) => `participant:p-${index}`) })), /<= 8 keys/)
  assert.throws(() => createCognitiveMemoryRecord(input({ recallKeys: 'participant:human-1' })), /recallKeys must be an array/)
})

test('records without recall keys stay valid for backward compatibility', () => {
  const memory = createCognitiveMemoryRecord(input())
  assert.equal(memory.recallKeys, undefined)
})

test('recall keys derive deterministically from explicit participant evidence only', () => {
  const withParticipant = createExperienceRecord({
    id: 'experience-participant',
    at: '2026-09-11T08:00:00.000Z',
    kind: 'human-message',
    source: { runtime: 'deepseek-harness', sessionId: 'session-1' },
    provenance: { source: 'test', boundary: 'runtime-event-v1' },
    payload: { participant: { id: 'human-7', kind: 'human' }, observation: { text: 'A bounded observation.' } },
  })
  assert.deepEqual(deriveRecallKeysFromExperience(withParticipant), ['participant:human-7'])

  assert.deepEqual(deriveRecallKeysFromExperience(experience()), [])
  const unsafeParticipant = createExperienceRecord({
    id: 'experience-unsafe',
    at: '2026-09-11T08:00:00.000Z',
    kind: 'human-message',
    source: { runtime: 'deepseek-harness', sessionId: 'session-1' },
    provenance: { source: 'test', boundary: 'runtime-event-v1' },
    payload: { participant: { id: 'not a safe id' }, observation: { text: 'A bounded observation.' } },
  })
  assert.deepEqual(deriveRecallKeysFromExperience(unsafeParticipant), [])
  assert.throws(() => deriveRecallKeysFromExperience({ version: 2 }), /invalid experience record/)
})
