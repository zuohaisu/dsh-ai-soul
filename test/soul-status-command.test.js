import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDshSoulStatusCommand,
  registerDshSoulStatusCommand,
  renderDshSoulStatus,
} from '../src/adapters/soul-status-command.js'
import { composeDshSoulPresenceSnapshot } from '../src/adapters/soul-presence.js'

function context(overrides = {}) {
  return {
    soulId: 'soul-1',
    identity: { name: null },
    relationship: { participants: [], state: [] },
    selfModel: [],
    userModel: [],
    worldModel: [],
    beliefs: [],
    ...overrides,
  }
}

function snapshot(observations = []) {
  return composeDshSoulPresenceSnapshot(context(), observations)
}

test('renderDshSoulStatus keeps existence separate from naming and unknown surface presence', () => {
  const rendered = renderDshSoulStatus(context())

  assert.match(rendered, /Soul ID: soul-1/)
  assert.match(rendered, /Name: \(unnamed\)/)
  assert.match(rendered, /Naming state: unnamed/)
  assert.match(rendered, /DSH TUI presence: unknown/)
  assert.match(rendered, /DSH Web presence: unknown/)
  assert.doesNotMatch(rendered, /DeepSeek Harness \(active\)/)
  assert.match(rendered, /Existence is not surface presence/)
})

test('status reports only explicitly observed DSH surfaces', () => {
  const tuiOnly = renderDshSoulStatus(context(), 'soul-1', snapshot([
    { surfaceId: 'tui', state: 'present', observedAt: '2026-09-15T14:00:00.000Z' },
  ]))
  assert.match(tuiOnly, /DSH TUI presence: present/)
  assert.match(tuiOnly, /DSH Web presence: unknown/)

  const webOnly = renderDshSoulStatus(context(), 'soul-1', snapshot([
    { surfaceId: 'web', state: 'present', observedAt: '2026-09-15T14:00:01.000Z' },
  ]))
  assert.match(webOnly, /DSH TUI presence: unknown/)
  assert.match(webOnly, /DSH Web presence: present/)

  const both = renderDshSoulStatus(context(), 'soul-1', snapshot([
    { surfaceId: 'tui', state: 'present', observedAt: '2026-09-15T14:00:02.000Z' },
    { surfaceId: 'web', state: 'present', observedAt: '2026-09-15T14:00:03.000Z' },
  ]))
  assert.match(both, /DSH TUI presence: present/)
  assert.match(both, /DSH Web presence: present/)
})

test('presence never upgrades into attention, memory capture, mutation authority, or action authority', () => {
  const rendered = renderDshSoulStatus(context(), 'soul-1', snapshot([
    { surfaceId: 'tui', state: 'present', observedAt: '2026-09-15T14:00:00.000Z' },
  ]))

  assert.match(rendered, /Attention: not asserted/)
  assert.match(rendered, /Memory capture: not implied by presence/)
  assert.match(rendered, /presence is not attention, memory capture, mutation authority, or permission to act\./)
  assert.doesNotMatch(rendered, /Attention: active|Memory capture: active|continuous capture/i)
})

test('status exposes bounded current cognition counts without content dumping', () => {
  const rendered = renderDshSoulStatus(context({
    identity: { name: 'Nova' },
    relationship: { participants: [{ id: 'human-1' }], state: [{ claim: 'trusted collaborator' }] },
    selfModel: [{ claim: 'careful' }, { claim: 'persistent' }],
    userModel: [{ claim: 'prefers structure' }],
    worldModel: [{ claim: 'project alpha exists' }],
    beliefs: [{ claim: 'evidence matters' }],
  }))

  assert.match(rendered, /Name: Nova/)
  assert.match(rendered, /Relationship participants: 1/)
  assert.match(rendered, /Current SELF entries: 2/)
  assert.match(rendered, /Current OTHER entries: 1/)
  assert.match(rendered, /Current RELATIONAL entries: 1/)
  assert.match(rendered, /Current WORLD entries: 1/)
  assert.match(rendered, /Current belief entries: 1/)
  assert.doesNotMatch(rendered, /prefers structure|trusted collaborator|project alpha exists|evidence matters/)
})

test('command resolves current context and current presence on every invocation', async () => {
  let current = context()
  let currentPresence = snapshot()
  const command = createDshSoulStatusCommand({
    soulId: 'soul-1',
    getContext: () => current,
    getPresenceSnapshot: () => currentPresence,
  })

  const before = await command.handler()
  assert.match(before.text, /Current OTHER entries: 0/)
  assert.match(before.text, /DSH TUI presence: unknown/)

  current = context({ userModel: [{ claim: 'learned later' }] })
  currentPresence = snapshot([{ surfaceId: 'tui', state: 'present', observedAt: '2026-09-15T14:00:00.000Z' }])
  const after = await command.handler()
  assert.match(after.text, /Current OTHER entries: 1/)
  assert.match(after.text, /DSH TUI presence: present/)
})

test('registration is optional when DSH commands service is absent', () => {
  assert.deepEqual(registerDshSoulStatusCommand({}, { soulId: 'soul-1', getContext: () => context() }), { status: 'unavailable' })
})

test('registration adds one read-only command when service is present', () => {
  const registered = []
  const ctx = { commands: { register(command) { registered.push(command) } } }

  assert.deepEqual(registerDshSoulStatusCommand(ctx, { soulId: 'soul-1', getContext: () => context() }), { status: 'registered' })
  assert.equal(registered.length, 1)
  assert.equal(registered[0].name, 'soul-status')
  assert.equal(registered[0].recordInput, false)
})

test('status fails closed if live context crosses Soul identity', async () => {
  const command = createDshSoulStatusCommand({ soulId: 'soul-1', getContext: () => context({ soulId: 'soul-2' }) })
  await assert.rejects(command.handler(), /context mismatch/)
})

test('status fails closed on presence Soul mismatch, unsupported runtime, unsupported surface, and conflicting evidence', () => {
  const base = snapshot([{ surfaceId: 'tui', state: 'present', observedAt: '2026-09-15T14:00:00.000Z' }])
  assert.throws(() => renderDshSoulStatus(context(), 'soul-1', { ...base, soulId: 'soul-2' }), /presence mismatch/)
  assert.throws(() => renderDshSoulStatus(context(), 'soul-1', {
    ...base,
    presences: [{ ...base.presences[0], runtimeId: 'other-runtime' }],
  }), /runtimeId=other-runtime/)
  assert.throws(() => renderDshSoulStatus(context(), 'soul-1', {
    ...base,
    presences: [{ ...base.presences[0], surfaceId: 'mobile' }],
  }), /surfaceId=mobile/)
  assert.throws(() => renderDshSoulStatus(context(), 'soul-1', {
    ...base,
    presences: [base.presences[0], { ...base.presences[0], state: 'absent' }],
  }), /duplicate Presence binding/)
})
