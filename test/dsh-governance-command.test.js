import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  apply,
  createGenesisRecord,
  FileSoulStore,
  persistGenesisSoul,
} from '../src/index.js'
import { createDshGovernanceCommand } from '../src/adapters/governance-command.js'

const participant = { id: 'human-partner-190', kind: 'human' }

function createRuntime({ withCommands = true } = {}) {
  const handlers = new Map()
  const contexts = []
  const commands = []
  const emitted = []

  const commandService = {
    register(definition) {
      commands.push(definition)
      return () => {}
    },
  }

  const ctx = {
    systemPrompt: {
      context(definition) {
        contexts.push(definition)
        return () => {}
      },
    },
    get(name) {
      if (name === 'commands' && withCommands) return commandService
      return undefined
    },
    on(name, handler) {
      const list = handlers.get(name) ?? []
      list.push(handler)
      handlers.set(name, list)
      return () => handlers.set(name, (handlers.get(name) ?? []).filter((item) => item !== handler))
    },
    async emit(name, ...args) {
      emitted.push({ name, args: structuredClone(args) })
      const results = []
      for (const handler of handlers.get(name) ?? []) {
        results.push(await handler(...args))
      }
      return results
    },
  }

  return { ctx, commands, contexts, emitted }
}

async function genesis(rootDir, soulId) {
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T07:30:00.000Z',
    soulId,
    provenance: { source: 'governance-command-test' },
  }))
  return store
}

function explicitPreferenceEvent(seq = 1) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse('2026-09-03T07:31:00.000Z'),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text: 'Please remember that I prefer concise implementation notes.' }],
    },
  }
}

function invocation(rawInput, commandId = 'command-190') {
  return {
    commandId,
    rawInput,
    agent: { id: 'agent-human-surface' },
    attachments: [],
    signal: new AbortController().signal,
  }
}

test('human /soul-review lists and approves a live proposal, persists it, and refreshes model context', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-command-'))
  const store = await genesis(rootDir, 'ember-190-approve')
  const runtime = createRuntime()

  await apply(runtime.ctx, {
    soulId: 'ember-190-approve',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  assert.deepEqual(runtime.commands.map((item) => item.name).sort(), ['soul-review', 'soul-status'])
  const command = runtime.commands.find((item) => item.name === 'soul-review')
  assert.ok(command)
  assert.equal(command.recordInput, false)

  const [processed] = await runtime.ctx.emit(
    'session/event',
    { id: 'session-190-approve' },
    explicitPreferenceEvent(),
  )
  assert.equal(processed.significanceAssessment.recommendPromotion, true)

  const list = await command.handler(invocation(' list'))
  assert.equal(list.kind, 'success')
  assert.match(list.text, /Pending AI Soul governance proposals: 1/)
  assert.match(list.text, /operation: append/)
  assert.match(list.text, /The user prefers concise implementation notes\./)
  assert.match(list.text, /confidence:/)
  assert.match(list.text, /provenance: dsh-session-event/)

  const proposalId = list.text.match(/proposal:dsh-live:[^\n]+/u)?.[0]
  assert.ok(proposalId)
  assert.equal((await store.load('ember-190-approve')).userModel.length, 0)

  const approved = await command.handler(invocation(` approve ${proposalId} Human explicitly requested durable retention.`))
  assert.equal(approved.kind, 'success')
  assert.match(approved.text, /Approved and persisted/)

  const persisted = await store.load('ember-190-approve')
  assert.equal(persisted.userModel.length, 1)
  assert.equal(persisted.userModel[0].claim, 'The user prefers concise implementation notes.')
  assert.equal(persisted.evolution.at(-1).provenance.review.reviewer, 'human:human-partner-190')

  const promptText = runtime.contexts[0].text({})
  assert.match(promptText, /The user prefers concise implementation notes\./)
  assert.equal(runtime.emitted.some((event) => event.name === 'ai-soul/state-committed'), true)

  const after = await command.handler(invocation(' list', 'command-190-after'))
  assert.equal(after.kind, 'success')
  assert.equal(after.text, 'No pending AI Soul governance proposals.')
})

test('human /soul-review renders consolidation sources and result before review', async () => {
  const first = { claim: 'The user prefers concise status updates.' }
  const second = { claim: 'The user prefers explicit acceptance criteria.' }
  const consolidated = { claim: 'The user prefers concise, falsifiable engineering communication.' }
  const command = createDshGovernanceCommand({
    ctx: { async emit() { return [] } },
    soulId: 'ember-222-consolidation',
    reviewerId: 'human:human-partner-222',
    consumer: {
      listPending() {
        return [{
          soulId: 'ember-222-consolidation',
          proposal: {
            id: 'proposal-consolidation-222',
            target: 'userModel',
            operation: 'consolidate',
            previousValues: [first, second],
            value: consolidated,
            confidence: 0.95,
            proposer: 'reflection:test',
            provenance: { source: 'dsh-session-event' },
          },
        }]
      },
    },
  })

  const list = await command.handler(invocation('list', 'command-222-list'))
  assert.equal(list.kind, 'success')
  assert.match(list.text, /operation: consolidate/)
  assert.match(list.text, /source claims:/)
  assert.match(list.text, /1\. The user prefers concise status updates\./)
  assert.match(list.text, /2\. The user prefers explicit acceptance criteria\./)
  assert.match(list.text, /claim: The user prefers concise, falsifiable engineering communication\./)
})

test('human /soul-review renders exact previous claim for replace and retire proposals', async () => {
  const consumer = {
    listPending() {
      return [
        {
          soulId: 'ember-222-previous',
          proposal: {
            id: 'proposal-replace-222',
            target: 'userModel',
            operation: 'replace',
            previousValue: { claim: 'The user prefers concise answers.' },
            value: { claim: 'The user prefers detailed answers.' },
            confidence: 0.95,
            proposer: 'reflection:test',
            provenance: { source: 'dsh-session-event' },
          },
        },
        {
          soulId: 'ember-222-previous',
          proposal: {
            id: 'proposal-retire-222',
            target: 'userModel',
            operation: 'retire',
            previousValue: { claim: 'The user prefers weekly summaries.' },
            value: undefined,
            confidence: 0.95,
            proposer: 'reflection:test',
            provenance: { source: 'dsh-session-event' },
          },
        },
      ]
    },
  }
  const command = createDshGovernanceCommand({
    ctx: { async emit() { return [] } },
    consumer,
    soulId: 'ember-222-previous',
    reviewerId: 'human:human-partner-222',
  })

  const list = await command.handler(invocation('list', 'command-222-previous'))
  assert.match(list.text, /operation: replace/)
  assert.match(list.text, /previous claim: The user prefers concise answers\./)
  assert.match(list.text, /operation: retire/)
  assert.match(list.text, /previous claim: The user prefers weekly summaries\./)
})

test('human /soul-review reject resolves without canonical mutation', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-reject-'))
  const store = await genesis(rootDir, 'ember-190-reject')
  const runtime = createRuntime()

  await apply(runtime.ctx, {
    soulId: 'ember-190-reject',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })
  await runtime.ctx.emit('session/event', { id: 'session-190-reject' }, explicitPreferenceEvent(2))

  const command = runtime.commands.find((item) => item.name === 'soul-review')
  assert.ok(command)
  const list = await command.handler(invocation(''))
  const proposalId = list.text.match(/proposal:dsh-live:[^\n]+/u)?.[0]
  assert.ok(proposalId)

  const missingReason = await command.handler(invocation(` reject ${proposalId}`))
  assert.equal(missingReason.kind, 'error')
  assert.match(missingReason.text, /Reject requires a reason/)

  const rejected = await command.handler(invocation(` reject ${proposalId} This should not become durable state.`))
  assert.equal(rejected.kind, 'success')
  assert.match(rejected.text, /without Soul-state mutation/)
  assert.equal((await store.load('ember-190-reject')).userModel.length, 0)
  assert.equal(runtime.emitted.some((event) => event.name === 'ai-soul/state-committed'), false)
})

test('governance command fails closed for malformed or unknown proposal ids', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-invalid-'))
  await genesis(rootDir, 'ember-190-invalid')
  const runtime = createRuntime()
  await apply(runtime.ctx, {
    soulId: 'ember-190-invalid',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  const command = runtime.commands.find((item) => item.name === 'soul-review')
  assert.ok(command)
  assert.equal((await command.handler(invocation(' delete everything'))).kind, 'error')
  const unknown = await command.handler(invocation(' approve missing-proposal'))
  assert.equal(unknown.kind, 'error')
  assert.match(unknown.text, /not found/)
})

test('UI-less runtime degrades cleanly when optional commands service is absent', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governance-headless-'))
  await genesis(rootDir, 'ember-190-headless')
  const runtime = createRuntime({ withCommands: false })

  await apply(runtime.ctx, {
    soulId: 'ember-190-headless',
    storeDir: rootDir,
    firstEncounterParticipant: participant,
  })

  assert.equal(runtime.commands.length, 0)
  assert.equal(runtime.contexts.length, 1)
  assert.equal(typeof runtime.contexts[0].text, 'function')
})
