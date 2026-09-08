import assert from 'node:assert/strict'
import test from 'node:test'

import { composeDshSoulPresenceSnapshot } from '../src/index.js'

const loadedSoul = Object.freeze({ soulId: 'soul:one' })

test('composes explicit TUI/Web observations for one loaded Soul', () => {
  const snapshot = composeDshSoulPresenceSnapshot(loadedSoul, [
    { surfaceId: 'tui', state: 'absent', observedAt: '2026-09-09T00:00:00.000Z' },
    { surfaceId: 'web', state: 'present', observedAt: '2026-09-09T00:00:01.000Z' },
  ])

  assert.equal(snapshot.soulId, loadedSoul.soulId)
  assert.equal(snapshot.authority, 'none')
  assert.deepEqual(snapshot.presences.map(({ surfaceId, state }) => [surfaceId, state]), [
    ['tui', 'absent'],
    ['web', 'present'],
  ])
  assert.ok(snapshot.presences.every((presence) => presence.runtimeId === 'deepseek-harness'))
  assert.deepEqual(loadedSoul, { soulId: 'soul:one' })
})

test('surface observations remain independent', () => {
  const snapshot = composeDshSoulPresenceSnapshot(loadedSoul, [
    { surfaceId: 'tui', state: 'detached' },
    { surfaceId: 'web', state: 'present' },
  ])
  assert.equal(snapshot.presences.find(({ surfaceId }) => surfaceId === 'tui').state, 'detached')
  assert.equal(snapshot.presences.find(({ surfaceId }) => surfaceId === 'web').state, 'present')
})

test('fails closed for invalid loaded Soul, observations, surfaces, states, and duplicates', () => {
  assert.throws(() => composeDshSoulPresenceSnapshot(null, []), /already-loaded Soul state/)
  assert.throws(() => composeDshSoulPresenceSnapshot({}, []), /state\.soulId/)
  assert.throws(() => composeDshSoulPresenceSnapshot(loadedSoul, null), /must be an array/)
  assert.throws(() => composeDshSoulPresenceSnapshot(loadedSoul, [null]), /must be an object/)
  assert.throws(() => composeDshSoulPresenceSnapshot(loadedSoul, [{ surfaceId: 'mobile', state: 'present' }]), /surfaceId must be one of/)
  assert.throws(() => composeDshSoulPresenceSnapshot(loadedSoul, [{ surfaceId: 'tui', state: 'online' }]), /Presence/)
  assert.throws(() => composeDshSoulPresenceSnapshot(loadedSoul, [
    { surfaceId: 'tui', state: 'present' },
    { surfaceId: 'tui', state: 'absent' },
  ]), /duplicate Presence binding/)
})

test('composition accepts no conversation-derived inputs or authority payload', () => {
  const snapshot = composeDshSoulPresenceSnapshot(loadedSoul, [{
    surfaceId: 'web',
    state: 'present',
    transcript: 'must not be copied',
    memory: { claim: 'must not be copied' },
    authority: 'act',
  }])
  assert.deepEqual(Object.keys(snapshot.presences[0]).sort(), [
    'authority', 'observedAt', 'runtimeId', 'soulId', 'state', 'surfaceId', 'version',
  ])
  assert.equal(snapshot.presences[0].authority, 'none')
})
