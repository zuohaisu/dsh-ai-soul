import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { FileEvolutionLedgerStore } from '../src/core/evolution-ledger-store.js'
import { FileSoulStore } from '../src/core/soul-store.js'
import { appendTransition, createSoulState } from '../src/core/soul-state.js'

function transition(index) {
  return {
    id: `transition-${index}`,
    at: `2026-09-15T00:00:${String(index).padStart(2, '0')}Z`,
    kind: 'reflection',
    reason: `reason-${index}`,
    provenance: { source: 'test', id: `evidence-${index}` },
    change: { index },
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-ledger-'))
  const stateRoot = join(root, 'souls')
  const ledgerRoot = join(root, 'evolution')
  const ledger = new FileEvolutionLedgerStore({ rootDir: ledgerRoot })
  const store = new FileSoulStore({ rootDir: stateRoot, evolutionLedger: ledger })
  return { root, stateRoot, ledgerRoot, ledger, store }
}

test('compact Soul persistence stays free of detached evolution history while load restores the full ordered ledger', async () => {
  const { stateRoot, ledger, store } = await fixture()
  let state = createSoulState({ soulId: 'soul-bounded', createdAt: '2026-09-15T00:00:00Z' })

  for (let index = 0; index < 20; index += 1) state = appendTransition(state, transition(index))
  await store.save(state)

  const persisted = JSON.parse(await readFile(join(stateRoot, 'soul-bounded.json'), 'utf8'))
  assert.deepEqual(persisted.evolution, [])

  const detached = await ledger.list('soul-bounded')
  assert.equal(detached.length, 20)
  assert.deepEqual(detached.map((entry) => entry.id), state.evolution.map((entry) => entry.id))
  assert.deepEqual(detached.map((entry) => entry.provenance), state.evolution.map((entry) => entry.provenance))

  const loaded = await store.load('soul-bounded')
  assert.deepEqual(loaded.evolution, state.evolution)
  assert.equal(loaded.soulId, state.soulId)
})

test('legacy embedded evolution is ingested once and repeated loads remain idempotent', async () => {
  const { stateRoot, ledger, store } = await fixture()
  let legacy = createSoulState({ soulId: 'soul-legacy', createdAt: '2026-09-15T00:00:00Z' })
  for (let index = 0; index < 3; index += 1) legacy = appendTransition(legacy, transition(index))

  await mkdir(stateRoot, { recursive: true })
  await writeFile(join(stateRoot, 'soul-legacy.json'), `${JSON.stringify(legacy, null, 2)}\n`, 'utf8')

  const first = await store.load('soul-legacy')
  const second = await store.load('soul-legacy')
  const detached = await ledger.list('soul-legacy')

  assert.deepEqual(first.evolution, legacy.evolution)
  assert.deepEqual(second.evolution, legacy.evolution)
  assert.deepEqual(detached, legacy.evolution)
  assert.equal(detached.length, 3)
  assert.equal(first.soulId, legacy.soulId)
})
