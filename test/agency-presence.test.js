import assert from 'node:assert/strict'
import test from 'node:test'

import { createAgencyIntent } from '../src/core/agency-intent.js'
import { projectAgencyIntentToDshPresence } from '../src/adapters/agency-presence.js'

function intent(overrides = {}) {
  return createAgencyIntent({
    id: 'intent-1',
    at: '2026-09-07T00:00:00.000Z',
    soulId: 'soul-1',
    kind: 'communicate',
    reason: 'A relevant unresolved commitment became salient.',
    proposedAction: 'Surface the commitment to the user.',
    contextRefs: [{ type: 'world', id: 'commitment-1' }],
    provenance: { source: 'reflection', evidenceId: 'reflection-1' },
    ...overrides,
  })
}

test('projects a valid agency intent as non-executing DSH presence', () => {
  const presence = projectAgencyIntentToDshPresence(intent(), {
    soulId: 'soul-1',
    sessionId: 'session-1',
    surface: 'tui',
  })

  assert.equal(presence.kind, 'agency-intent')
  assert.equal(presence.intentId, 'intent-1')
  assert.equal(presence.soulId, 'soul-1')
  assert.equal(presence.authority, 'none')
  assert.deepEqual(presence.runtime, {
    name: 'deepseek-harness',
    sessionId: 'session-1',
    surface: 'tui',
  })
  for (const forbidden of ['permission', 'authorization', 'execution', 'toolCall', 'schedule']) {
    assert.equal(Object.hasOwn(presence, forbidden), false)
  }
})

test('fails closed on Soul mismatch', () => {
  assert.throws(
    () => projectAgencyIntentToDshPresence(intent(), { soulId: 'another-soul' }),
    /soulId mismatch/,
  )
})

test('fails closed when provenance is empty', () => {
  assert.throws(
    () => projectAgencyIntentToDshPresence(intent({ provenance: {} }), { soulId: 'soul-1' }),
    /non-empty provenance/,
  )
})

test('fails closed when reason is only whitespace', () => {
  assert.throws(
    () => projectAgencyIntentToDshPresence(intent({ reason: '   ' }), { soulId: 'soul-1' }),
    /non-empty reason/,
  )
})
