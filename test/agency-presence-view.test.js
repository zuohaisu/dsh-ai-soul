import assert from 'node:assert/strict'
import test from 'node:test'

import { createDshAgencyPresenceView, renderDshAgencyPresence } from '../src/adapters/agency-presence-view.js'

function presence(overrides = {}) {
  return {
    version: 1,
    kind: 'agency-intent',
    soulId: 'soul-1',
    intentId: 'intent-1',
    intentKind: 'proposal',
    at: '2026-09-07T00:00:00.000Z',
    reason: 'A relevant commitment may need attention.',
    proposedAction: { kind: 'mention', subject: 'commitment-1' },
    contextRefs: ['world:commitment-1'],
    provenance: { source: 'reflection', projectionBoundary: 'dsh-agency-presence-v1' },
    runtime: { name: 'deepseek-harness', sessionId: 'session-1', surface: 'tui' },
    authority: 'none',
    ...overrides,
  }
}

test('valid authority-free projection becomes a bounded DSH surface view', () => {
  const view = createDshAgencyPresenceView(presence(), { soulId: 'soul-1' })

  assert.equal(view.kind, 'agency-presence')
  assert.equal(view.soulId, 'soul-1')
  assert.equal(view.intentId, 'intent-1')
  assert.equal(view.reason, 'A relevant commitment may need attention.')
  assert.equal(view.authority, 'none')
  assert.equal(view.attention, 'not-asserted')
  assert.equal(view.memoryCapture, 'not-implied')
  assert.deepEqual(view.runtime, { name: 'deepseek-harness', sessionId: 'session-1', surface: 'tui' })
})

test('rendered presence is user-visible without implying action authority', () => {
  const rendered = renderDshAgencyPresence(createDshAgencyPresenceView(presence(), { soulId: 'soul-1' }))

  assert.match(rendered, /AI Soul presence/)
  assert.match(rendered, /Soul ID: soul-1/)
  assert.match(rendered, /Intent ID: intent-1/)
  assert.match(rendered, /Reason: A relevant commitment may need attention\./)
  assert.match(rendered, /Authority: none/)
  assert.match(rendered, /Attention: not asserted/)
  assert.match(rendered, /Memory capture: not implied by presence/)
  assert.doesNotMatch(rendered, /Authority: granted|executed|scheduled/i)
})

test('consumer fails closed on Soul mismatch or elevated authority', () => {
  assert.throws(() => createDshAgencyPresenceView(presence(), { soulId: 'soul-2' }), /soulId mismatch/)
  assert.throws(() => createDshAgencyPresenceView(presence({ authority: 'execute' }), { soulId: 'soul-1' }), /authority=none/)
})

test('consumer requires attributable intent, reason, and provenance', () => {
  assert.throws(() => createDshAgencyPresenceView(presence({ intentId: '' }), { soulId: 'soul-1' }), /presence.intentId/)
  assert.throws(() => createDshAgencyPresenceView(presence({ reason: ' ' }), { soulId: 'soul-1' }), /presence.reason/)
  assert.throws(() => createDshAgencyPresenceView(presence({ provenance: {} }), { soulId: 'soul-1' }), /non-empty provenance/)
})

test('view construction is detached from mutable projection input', () => {
  const source = presence()
  const view = createDshAgencyPresenceView(source, { soulId: 'soul-1' })
  source.provenance.source = 'tampered'
  source.runtime.surface = 'web'

  assert.equal(view.provenance.source, 'reflection')
  assert.equal(view.runtime.surface, 'tui')
})
