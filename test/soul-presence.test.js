import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSoulPresence,
  validateSoulPresence,
  validateSoulPresenceBinding,
} from '../src/core/soul-presence.js'

const observedAt = '2026-09-08T09:00:00.000Z'

function presence(overrides = {}) {
  return createSoulPresence({
    soulId: 'soul-1',
    runtimeId: 'deepseek-harness',
    surfaceId: 'tui',
    state: 'present',
    observedAt,
    ...overrides,
  })
}

test('one Soul can be present through independent DSH TUI and Web surfaces', () => {
  const tui = presence({ surfaceId: 'tui' })
  const web = presence({ surfaceId: 'web' })

  assert.equal(tui.soulId, web.soulId)
  assert.equal(tui.runtimeId, web.runtimeId)
  assert.notEqual(tui.surfaceId, web.surfaceId)
  assert.equal(tui.authority, 'none')
  assert.equal(web.authority, 'none')
  assert.equal(validateSoulPresenceBinding(tui, { soulId: 'soul-1', runtimeId: 'deepseek-harness', surfaceId: 'tui' }).valid, true)
  assert.equal(validateSoulPresenceBinding(web, { soulId: 'soul-1', runtimeId: 'deepseek-harness', surfaceId: 'web' }).valid, true)
})

test('presence lifecycle is explicit and bounded', () => {
  for (const state of ['present', 'absent', 'detached']) {
    assert.equal(validateSoulPresence(presence({ state })).valid, true)
  }
  assert.throws(() => presence({ state: 'thinking' }), /state must be one of/)
})

test('binding validation fails closed on Soul, runtime, or surface mismatch', () => {
  const record = presence()
  for (const expected of [
    { soulId: 'soul-2' },
    { runtimeId: 'another-runtime' },
    { surfaceId: 'web' },
  ]) {
    assert.equal(validateSoulPresenceBinding(record, expected).valid, false)
  }
})

test('presence cannot carry attention, memory, governance, or execution authority', () => {
  const base = presence()
  for (const forbidden of [
    'transcript', 'history', 'messages', 'attention', 'significance', 'experience',
    'memory', 'memoryCandidate', 'proposal', 'review', 'approval', 'mutation',
    'execution', 'schedule', 'toolCall', 'actuator',
  ]) {
    const validation = validateSoulPresence({ ...base, [forbidden]: { injected: true } })
    assert.equal(validation.valid, false, `${forbidden} must fail closed`)
  }
  assert.equal(validateSoulPresence({ ...base, authority: 'execute' }).valid, false)
})
