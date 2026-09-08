import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_SOUL_PRESENCE_SURFACES,
  createSoulPresence,
  createSoulPresenceSnapshot,
  transitionSoulPresence,
} from '../src/core/index.js'

function presence(surfaceId, state = 'present', soulId = 'soul:one') {
  return createSoulPresence({
    soulId,
    runtimeId: 'deepseek-harness',
    surfaceId,
    state,
    observedAt: '2026-09-09T00:00:00.000Z',
  })
}

test('one Soul snapshot preserves independent TUI and Web Presence', () => {
  const tui = presence('tui')
  const web = presence('web')
  const snapshot = createSoulPresenceSnapshot({ soulId: 'soul:one', presences: [tui, web] })

  assert.equal(snapshot.soulId, 'soul:one')
  assert.equal(snapshot.authority, 'none')
  assert.deepEqual(snapshot.presences.map(({ surfaceId, state }) => [surfaceId, state]), [
    ['tui', 'present'],
    ['web', 'present'],
  ])

  const tuiAbsent = transitionSoulPresence(tui, { state: 'absent', observedAt: '2026-09-09T00:01:00.000Z' })
  const changed = createSoulPresenceSnapshot({ soulId: 'soul:one', presences: [tuiAbsent, web] })
  assert.deepEqual(changed.presences.map(({ surfaceId, state }) => [surfaceId, state]), [
    ['tui', 'absent'],
    ['web', 'present'],
  ])
})

test('snapshot fails closed for mixed Souls and duplicate runtime/surface bindings', () => {
  assert.throws(
    () => createSoulPresenceSnapshot({ soulId: 'soul:one', presences: [presence('tui'), presence('web', 'present', 'soul:two')] }),
    /different soulId/,
  )
  assert.throws(
    () => createSoulPresenceSnapshot({ soulId: 'soul:one', presences: [presence('tui'), presence('tui', 'absent')] }),
    /duplicate Presence binding/,
  )
})

test('snapshot is bounded and rejects invalid authority-bearing Presence', () => {
  const bounded = Array.from({ length: MAX_SOUL_PRESENCE_SURFACES }, (_, index) => presence(`surface-${index}`))
  assert.equal(createSoulPresenceSnapshot({ soulId: 'soul:one', presences: bounded }).presences.length, MAX_SOUL_PRESENCE_SURFACES)
  assert.throws(
    () => createSoulPresenceSnapshot({ soulId: 'soul:one', presences: [...bounded, presence('overflow')] }),
    /at most/,
  )

  assert.throws(
    () => createSoulPresenceSnapshot({ soulId: 'soul:one', presences: [{ ...presence('tui'), authority: 'execute' }] }),
    /invalid Soul Presence/,
  )
})
