import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExperienceRecord,
  createSoulState,
  promoteExperienceToAutobiography,
  validateExperienceRecord,
} from '../src/core/index.js'

test('experience record validates and does not mutate Soul autobiography', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const before = structuredClone(soul)

  const experience = createExperienceRecord({
    id: 'exp-1',
    at: '2026-08-27T03:00:00.000Z',
    kind: 'conversation-turn',
    source: { runtime: 'test-runtime', sessionId: 'session-1' },
    provenance: { eventId: 'event-1' },
    payload: { summary: 'A conversation happened.' },
  })

  assert.deepEqual(validateExperienceRecord(experience), { valid: true, errors: [] })
  assert.deepEqual(soul, before)
  assert.equal(soul.autobiography.length, 0)
})

test('promotion to autobiography is explicit and provenance-preserving', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const experience = createExperienceRecord({
    id: 'exp-meaningful',
    at: '2026-08-27T03:10:00.000Z',
    kind: 'decision',
    source: { runtime: 'test-runtime', sessionId: 'session-2' },
    provenance: { eventId: 'event-2', sourceType: 'runtime-event' },
    payload: { decision: 'Begin a new project.' },
  })

  const next = promoteExperienceToAutobiography(soul, experience, {
    reason: 'This decision materially changed the shared project history.',
    provenance: { reviewer: 'test', method: 'explicit-promotion' },
    interpretation: 'A durable project-level commitment was made.',
    significance: { level: 'high' },
    promotedAt: '2026-08-27T03:11:00.000Z',
  })

  assert.equal(soul.autobiography.length, 0)
  assert.equal(next.autobiography.length, 1)
  assert.equal(next.autobiography[0].sourceExperienceId, 'exp-meaningful')
  assert.equal(next.autobiography[0].promotion.reason, 'This decision materially changed the shared project history.')
  assert.deepEqual(next.autobiography[0].experienceProvenance, experience.provenance)
  assert.deepEqual(next.autobiography[0].promotion.provenance, { reviewer: 'test', method: 'explicit-promotion' })
})

test('promotion requires an explicit reason and provenance', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const experience = createExperienceRecord({
    id: 'exp-2',
    kind: 'conversation-turn',
    source: { runtime: 'test' },
    provenance: { eventId: 'event-3' },
    payload: { text: 'hello' },
  })

  assert.throws(
    () => promoteExperienceToAutobiography(soul, experience, { provenance: { reviewer: 'test' } }),
    /promotion reason is required/,
  )

  assert.throws(
    () => promoteExperienceToAutobiography(soul, experience, { reason: 'important' }),
    /promotion provenance is required/,
  )
})

test('experience creation rejects missing provenance', () => {
  assert.throws(
    () => createExperienceRecord({
      kind: 'conversation-turn',
      source: { runtime: 'test' },
      payload: {},
    }),
    /provenance is required/,
  )
})
