import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDshSoulContextCommand,
  registerDshSoulContextCommand,
  renderDshSoulContext,
} from '../src/adapters/soul-context-command.js'

function context(overrides = {}) {
  return {
    soulId: 'soul-1',
    identity: { name: null, nickname: null, birthday: null, origin: null, invariants: [] },
    relationship: { participants: [], state: [], covenants: [] },
    selfModel: [],
    userModel: [],
    worldModel: [],
    beliefs: [],
    ...overrides,
  }
}

test('renders bounded current cognition without evidence-history semantics', () => {
  const rendered = renderDshSoulContext(context({
    selfModel: [{ claim: 'I reason carefully.' }],
    userModel: [{ claim: 'The user prefers explicit structure.' }],
    relationship: { participants: [], covenants: [], state: [{ claim: 'We review consequential changes.' }] },
    worldModel: [{ claim: 'Project Atlas is active.' }],
    beliefs: [{ claim: 'Evidence should remain attributable.' }],
  }))

  assert.match(rendered, /Soul ID: soul-1/)
  assert.match(rendered, /I reason carefully\./)
  assert.match(rendered, /The user prefers explicit structure\./)
  assert.match(rendered, /We review consequential changes\./)
  assert.match(rendered, /Project Atlas is active\./)
  assert.match(rendered, /Evidence should remain attributable\./)
  assert.match(rendered, /not interaction history, Experience evidence, governance history/)
  assert.doesNotMatch(rendered, /proposal queue|raw transcript|session\/event/i)
})

test('command resolves live current context on every invocation', async () => {
  let current = context()
  const command = createDshSoulContextCommand({ soulId: 'soul-1', getContext: () => current })

  const before = await command.handler()
  assert.doesNotMatch(before.text, /learned later/)

  current = context({ userModel: [{ claim: 'learned later' }] })
  const after = await command.handler()
  assert.match(after.text, /learned later/)
  assert.match(after.text, /Soul ID: soul-1/)
})

test('command is read-only and registration remains optional', () => {
  const command = createDshSoulContextCommand({ soulId: 'soul-1', getContext: () => context() })
  assert.equal(command.name, 'soul-context')
  assert.equal(command.recordInput, false)
  assert.deepEqual(registerDshSoulContextCommand({}, { soulId: 'soul-1', getContext: () => context() }), { status: 'unavailable' })
})

test('registration adds the read-only command when commands service exists', () => {
  const registered = []
  const ctx = { commands: { register(command) { registered.push(command) } } }
  assert.deepEqual(registerDshSoulContextCommand(ctx, { soulId: 'soul-1', getContext: () => context() }), { status: 'registered' })
  assert.equal(registered.length, 1)
  assert.equal(registered[0].name, 'soul-context')
  assert.equal(registered[0].recordInput, false)
})

test('fails closed if live context crosses Soul identity', async () => {
  const command = createDshSoulContextCommand({ soulId: 'soul-1', getContext: () => context({ soulId: 'soul-2' }) })
  await assert.rejects(command.handler(), /context mismatch/)
})
