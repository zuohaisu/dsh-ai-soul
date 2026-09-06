import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDshSoulStatusCommand,
  registerDshSoulStatusCommand,
  renderDshSoulStatus,
} from '../src/adapters/soul-status-command.js'

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

test('renderDshSoulStatus keeps existence separate from naming and runtime attachment', () => {
  const rendered = renderDshSoulStatus(context())

  assert.match(rendered, /Soul ID: soul-1/)
  assert.match(rendered, /Name: \(unnamed\)/)
  assert.match(rendered, /Naming state: unnamed/)
  assert.match(rendered, /Runtime attachment: DeepSeek Harness \(active\)/)
  assert.match(rendered, /Existence is not runtime attachment/)
})

test('runtime attachment does not assert attention or memory capture', () => {
  const rendered = renderDshSoulStatus(context())

  assert.match(rendered, /Attention: not asserted/)
  assert.match(rendered, /Memory capture: not implied by runtime attachment/)
  assert.match(rendered, /runtime attachment is not attention, memory capture, mutation authority, or permission to act\./)
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

test('command resolves current context on every invocation', async () => {
  let current = context()
  const command = createDshSoulStatusCommand({ soulId: 'soul-1', getContext: () => current })

  const before = await command.handler()
  assert.match(before.text, /Current OTHER entries: 0/)

  current = context({ userModel: [{ claim: 'learned later' }] })
  const after = await command.handler()
  assert.match(after.text, /Current OTHER entries: 1/)
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
