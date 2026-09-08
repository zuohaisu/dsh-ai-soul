import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DSH_SOUL_PRESENCE_RUNTIME_ID,
  projectDshSoulPresence,
} from '../src/adapters/soul-presence.js'
import { validateSoulPresence } from '../src/core/soul-presence.js'

const loadedSoul = Object.freeze({ soulId: 'soul-1' })
const observedAt = '2026-09-08T12:00:00.000Z'

test('one loaded Soul projects independently onto DSH TUI and Web', () => {
  const tui = projectDshSoulPresence(loadedSoul, { surfaceId: 'tui', observedAt })
  const web = projectDshSoulPresence(loadedSoul, { surfaceId: 'web', observedAt })

  assert.equal(tui.soulId, loadedSoul.soulId)
  assert.equal(web.soulId, loadedSoul.soulId)
  assert.equal(tui.runtimeId, DSH_SOUL_PRESENCE_RUNTIME_ID)
  assert.equal(web.runtimeId, DSH_SOUL_PRESENCE_RUNTIME_ID)
  assert.notEqual(tui.surfaceId, web.surfaceId)
  assert.equal(tui.authority, 'none')
  assert.equal(web.authority, 'none')
  assert.equal(validateSoulPresence(tui).valid, true)
  assert.equal(validateSoulPresence(web).valid, true)
})

test('projection fails closed without an already-loaded Soul identity', () => {
  for (const state of [undefined, null, [], {}, { soulId: '' }, { soulId: 42 }]) {
    assert.throws(() => projectDshSoulPresence(state, { surfaceId: 'tui', observedAt }), /already-loaded Soul|state\.soulId/)
  }
})

test('projection fails closed on unknown or missing DSH surfaces', () => {
  for (const surfaceId of [undefined, '', 'cli', 'mobile']) {
    assert.throws(() => projectDshSoulPresence(loadedSoul, { surfaceId, observedAt }), /surfaceId must be one of/)
  }
})

test('projection cannot be used to smuggle cognition or action authority', () => {
  const record = projectDshSoulPresence(loadedSoul, { surfaceId: 'web', observedAt })
  assert.deepEqual(Object.keys(record).sort(), [
    'authority', 'observedAt', 'runtimeId', 'schemaVersion', 'soulId', 'state', 'surfaceId',
  ])

  for (const forbidden of ['transcript', 'attention', 'experience', 'memory', 'proposal', 'mutation', 'schedule', 'toolCall', 'actuator']) {
    assert.equal(validateSoulPresence({ ...record, [forbidden]: true }).valid, false)
  }
})
