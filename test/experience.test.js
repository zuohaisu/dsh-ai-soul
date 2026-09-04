import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExperienceRecord,
  createSoulState,
  promoteExperienceToAutobiography,
  redactExperiencePayload,
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

test('promotion rejects raw unprovenanced significance', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const experience = createExperienceRecord({
    id: 'exp-raw-significance',
    kind: 'decision',
    source: { runtime: 'test' },
    provenance: { eventId: 'event-raw-significance' },
    payload: { text: 'important' },
  })

  assert.throws(
    () => promoteExperienceToAutobiography(soul, experience, {
      reason: 'Attempted legacy significance.',
      provenance: { reviewer: 'test' },
      significance: { level: 'high' },
    }),
    /raw significance is not supported; use significanceAssessment/,
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

test('experience creation rejects omitted payload', () => {
  assert.throws(
    () => createExperienceRecord({
      kind: 'conversation-turn',
      source: { runtime: 'test' },
      provenance: { eventId: 'event-4' },
    }),
    /payload is required/,
  )
})

test('Experience payload redaction removes plaintext while preserving lineage', () => {
  const experience = createExperienceRecord({
    id: 'exp-private',
    at: '2026-09-04T05:00:00.000Z',
    kind: 'conversation-turn',
    source: { runtime: 'dsh', sessionId: 'session-private' },
    provenance: { eventId: 'event-private', sourceType: 'runtime-event' },
    payload: { observation: { text: 'my private secret value' }, extra: ['sensitive', 42] },
  })

  const redacted = redactExperiencePayload(experience, {
    reason: 'human requested physical payload redaction',
    provenance: { actor: 'human', method: 'explicit-request' },
    redactedAt: '2026-09-04T05:01:00.000Z',
  })

  assert.deepEqual(validateExperienceRecord(redacted), { valid: true, errors: [] })
  assert.equal(redacted.id, experience.id)
  assert.equal(redacted.at, experience.at)
  assert.equal(redacted.kind, experience.kind)
  assert.deepEqual(redacted.source, experience.source)
  assert.deepEqual(redacted.provenance, experience.provenance)
  assert.equal(redacted.payload.redacted, true)
  assert.equal(redacted.payload.redaction.algorithm, 'sha256')
  assert.match(redacted.payload.redaction.digest, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(redacted).includes('my private secret value'), false)
  assert.equal(JSON.stringify(redacted).includes('sensitive'), false)
  assert.deepEqual(experience.payload, { observation: { text: 'my private secret value' }, extra: ['sensitive', 42] })
})

test('Experience payload redaction digest is deterministic across object key order', () => {
  const base = {
    id: 'exp-digest',
    at: '2026-09-04T05:02:00.000Z',
    kind: 'conversation-turn',
    source: { runtime: 'test' },
    provenance: { eventId: 'event-digest' },
  }
  const a = createExperienceRecord({ ...base, payload: { b: 2, a: { y: 2, x: 1 } } })
  const b = createExperienceRecord({ ...base, payload: { a: { x: 1, y: 2 }, b: 2 } })

  const options = {
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T05:03:00.000Z',
  }
  const redactedA = redactExperiencePayload(a, options)
  const redactedB = redactExperiencePayload(b, options)

  assert.equal(redactedA.payload.redaction.digest, redactedB.payload.redaction.digest)
})

test('Experience payload redaction fails closed when already redacted', () => {
  const experience = createExperienceRecord({
    id: 'exp-redact-once',
    kind: 'conversation-turn',
    source: { runtime: 'test' },
    provenance: { eventId: 'event-redact-once' },
    payload: { text: 'erase me' },
  })
  const redacted = redactExperiencePayload(experience, {
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T05:04:00.000Z',
  })

  assert.throws(
    () => redactExperiencePayload(redacted, {
      reason: 'second request',
      provenance: { actor: 'human' },
      redactedAt: '2026-09-04T05:05:00.000Z',
    }),
    /already redacted/,
  )
})

test('Experience payload redaction requires reason and provenance', () => {
  const experience = createExperienceRecord({
    id: 'exp-redaction-governance',
    kind: 'conversation-turn',
    source: { runtime: 'test' },
    provenance: { eventId: 'event-redaction-governance' },
    payload: { text: 'erase me' },
  })

  assert.throws(() => redactExperiencePayload(experience, { provenance: { actor: 'human' } }), /redaction reason is required/)
  assert.throws(() => redactExperiencePayload(experience, { reason: 'privacy request' }), /redaction provenance is required/)
})
