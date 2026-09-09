import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { apply, createGenesisRecord, FileSoulStore, persistGenesisSoul } from '../src/index.js'

function runtime() {
  const handlers = new Map()
  const commands = []
  const ctx = {
    systemPrompt: { context() { return () => {} } },
    get(name) { return name === 'commands' ? { register(command) { commands.push(command) } } : undefined },
    on(name, handler) { const list = handlers.get(name) ?? []; list.push(handler); handlers.set(name, list); return () => {} },
    async emit(name, ...args) { const results = []; for (const handler of handlers.get(name) ?? []) results.push(await handler(...args)); return results },
  }
  return { ctx, commands }
}

function preferenceEvent(seq, text) {
  return {
    type: 'user/message', seq, time: Date.parse(`2026-09-09T04:${String(seq).padStart(2, '0')}:00.000Z`),
    data: { role: 'user', source: { kind: 'user', via: 'web' }, content: [{ type: 'text', text }] },
  }
}

async function setup(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-capacity-review-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({ id: `${soulId}-genesis`, at: '2026-09-09T04:00:00.000Z', soulId, provenance: { source: 'capacity-review-test' } }))
  const rt = runtime()
  await apply(rt.ctx, { soulId, storeDir: rootDir, firstEncounterParticipant: { id: 'human-capacity', kind: 'human' } })
  return { ...rt, store }
}

test('DSH governance list projects current cognition capacity without mutating Soul state', async () => {
  const { ctx, commands, store } = await setup('ember-capacity-visible')
  await ctx.emit('session/event', { id: 'session-capacity' }, preferenceEvent(1, 'Please remember that I prefer concise implementation notes.'))
  const before = await store.load('ember-capacity-visible')
  const command = commands.find((item) => item.name === 'soul-review')
  const listed = await command.handler({ rawInput: 'list' })
  const after = await store.load('ember-capacity-visible')

  assert.equal(listed.kind, 'success')
  assert.match(listed.text, /capacity: fits \(0\/8\)/)
  assert.deepEqual(after, before)
})

test('capacity projection is observation only; authoritative apply remains independent', async () => {
  const { ctx, commands, store } = await setup('ember-capacity-authority')
  await ctx.emit('session/event', { id: 'session-capacity-authority' }, preferenceEvent(2, 'Please remember that I prefer concise implementation notes.'))
  const command = commands.find((item) => item.name === 'soul-review')
  const listed = await command.handler({ rawInput: 'list' })
  assert.match(listed.text, /capacity: fits/)
  const proposalId = listed.text.match(/proposal:dsh-live:[^\n]+/u)?.[0]
  assert.ok(proposalId)

  const before = await store.load('ember-capacity-authority')
  assert.equal(before.userModel.length, 0)
  const approved = await command.handler({ rawInput: `approve ${proposalId}` })
  assert.equal(approved.kind, 'success')
  assert.equal((await store.load('ember-capacity-authority')).userModel.length, 1)
})
