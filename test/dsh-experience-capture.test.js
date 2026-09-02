import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSoulState,
  MAX_DSH_EXPERIENCE_TEXT_CHARS,
  mapDshHumanMessageToExperience,
  validateExperienceRecord,
} from '../src/index.js'

const participant = { id: 'human-168', kind: 'human' }
const session = { id: 'session-168' }

function humanMessage(overrides = {}) {
  return {
    type: 'user/message',
    seq: 7,
    time: Date.parse('2026-09-02T21:05:00.000Z'),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text: 'I prefer concise release reports.' }],
    },
    ...overrides,
  }
}

test('maps a real-shape DSH human message to a deterministic Experience Record', () => {
  const event = humanMessage()
  const first = mapDshHumanMessageToExperience(session, event, { participant })
  const second = mapDshHumanMessageToExperience(structuredClone(session), structuredClone(event), { participant })

  assert.deepEqual(first, second)
  assert.deepEqual(validateExperienceRecord(first), { valid: true, errors: [] })
  assert.equal(first.id, 'runtime-event:deepseek-harness:session-168:user-message%3A7')
  assert.equal(first.kind, 'human-message')
  assert.equal(first.at, '2026-09-02T21:05:00.000Z')
  assert.deepEqual(first.source, {
    runtime: 'deepseek-harness',
    sessionId: 'session-168',
    eventId: 'user-message:7',
    eventRef: { eventType: 'user/message', eventSeq: 7 },
  })
  assert.equal(first.provenance.captureBoundary, 'runtime-event-v1')
  assert.equal(first.provenance.adapterBoundary, 'dsh-session-event-v1')
  assert.equal(first.provenance.source, 'deepseek-harness')
  assert.equal(first.provenance.eventSeq, 7)
  assert.deepEqual(first.provenance.participant, participant)
  assert.equal(first.payload.observation.text, 'I prefer concise release reports.')
  assert.equal(first.payload.observation.truncated, false)
})

test('ignores synthetic/plugin messages instead of creating Experience', () => {
  const event = humanMessage({
    data: {
      role: 'user',
      source: { kind: 'plugin', via: 'fixture' },
      content: [{ type: 'text', text: 'synthetic' }],
    },
  })

  assert.equal(mapDshHumanMessageToExperience(session, event, { participant }), null)
})

test('fails closed on missing DSH identity, participant, time, or text content', () => {
  assert.throws(
    () => mapDshHumanMessageToExperience({}, humanMessage(), { participant }),
    /session\.id/,
  )
  assert.throws(
    () => mapDshHumanMessageToExperience(session, humanMessage({ seq: -1 }), { participant }),
    /event\.seq/,
  )
  assert.throws(
    () => mapDshHumanMessageToExperience(session, humanMessage({ time: Number.NaN }), { participant }),
    /event\.time/,
  )
  assert.throws(
    () => mapDshHumanMessageToExperience(session, humanMessage(), {}),
    /participant\.id/,
  )
  assert.throws(
    () => mapDshHumanMessageToExperience(session, humanMessage({
      data: { source: { kind: 'user' }, content: [] },
    }), { participant }),
    /at least one text content part/,
  )
})

test('bounds copied observation text explicitly without mutating Soul state', () => {
  const soul = createSoulState({ soulId: 'ember-168' })
  const before = structuredClone(soul)
  const text = 'x'.repeat(MAX_DSH_EXPERIENCE_TEXT_CHARS + 25)

  const experience = mapDshHumanMessageToExperience(session, humanMessage({
    data: {
      role: 'user',
      source: { kind: 'user', via: 'tui' },
      content: [{ type: 'text', text }],
    },
  }), { participant })

  assert.equal(experience.payload.observation.text.length, MAX_DSH_EXPERIENCE_TEXT_CHARS)
  assert.equal(experience.payload.observation.truncated, true)
  assert.equal(experience.payload.observation.originalChars, MAX_DSH_EXPERIENCE_TEXT_CHARS + 25)
  assert.deepEqual(soul, before)
  assert.equal(soul.autobiography.length, 0)
})
