import assert from 'node:assert/strict'
import test from 'node:test'

import {
  mapRuntimeEventToExperience,
  validateRuntimeEventEnvelope,
} from '../src/adapters/runtime-event.js'
import { createSoulState } from '../src/core/index.js'

const event = {
  version: 1,
  runtime: 'test-runtime',
  sessionId: 'session-1',
  eventId: 'event-42',
  at: '2026-08-27T04:00:00.000Z',
  kind: 'conversation-turn',
  eventRef: { stream: 'session-log', offset: 42 },
  provenance: { adapter: 'test-adapter', observedBy: 'unit-test' },
  payload: { summary: 'User and assistant exchanged one turn.' },
}

test('maps one explicit runtime event into a deterministic Experience Record', () => {
  const first = mapRuntimeEventToExperience(event)
  const second = mapRuntimeEventToExperience(structuredClone(event))

  assert.deepEqual(validateRuntimeEventEnvelope(event), { valid: true, errors: [] })
  assert.deepEqual(first, second)
  assert.equal(first.id, 'runtime-event:test-runtime:session-1:event-42')
  assert.equal(first.at, event.at)
  assert.deepEqual(first.source, {
    runtime: 'test-runtime',
    sessionId: 'session-1',
    eventId: 'event-42',
    eventRef: { stream: 'session-log', offset: 42 },
  })
  assert.deepEqual(first.provenance, {
    adapter: 'test-adapter',
    observedBy: 'unit-test',
    captureBoundary: 'runtime-event-v1',
  })
})

test('derived IDs do not collide when identity parts contain delimiters', () => {
  const first = mapRuntimeEventToExperience({
    ...event,
    runtime: 'a:b',
    sessionId: 'c',
    eventId: 'd',
  })
  const second = mapRuntimeEventToExperience({
    ...event,
    runtime: 'a',
    sessionId: 'b:c',
    eventId: 'd',
  })

  assert.notEqual(first.id, second.id)
  assert.equal(first.id, 'runtime-event:a%3Ab:c:d')
  assert.equal(second.id, 'runtime-event:a:b%3Ac:d')
})

test('capture does not mutate Soul State or promote autobiography', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: 'Soul One' })
  const before = structuredClone(soul)

  mapRuntimeEventToExperience(event)

  assert.deepEqual(soul, before)
  assert.equal(soul.autobiography.length, 0)
})

test('mapping preserves a reference instead of requiring a raw transcript', () => {
  const experience = mapRuntimeEventToExperience(event)

  assert.deepEqual(experience.source.eventRef, { stream: 'session-log', offset: 42 })
  assert.equal(Object.hasOwn(experience.source, 'rawTranscript'), false)
  assert.deepEqual(experience.payload, { summary: 'User and assistant exchanged one turn.' })
})

test('rejects events without explicit provenance', () => {
  const invalid = structuredClone(event)
  delete invalid.provenance

  assert.throws(
    () => mapRuntimeEventToExperience(invalid),
    /provenance is required/,
  )
})
