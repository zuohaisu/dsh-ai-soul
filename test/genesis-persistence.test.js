import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  createGenesisRecord,
  persistGenesisSoul,
  validateGenesisRecord,
} from '../src/core/index.js'

test('Genesis Soul persists and reloads with origin provenance intact', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-'))
  const store = new FileSoulStore({ rootDir })
  const record = createGenesisRecord({
    id: 'genesis-aster-001',
    at: '2026-08-27T08:40:00.000Z',
    soulId: 'aster',
    name: 'Aster',
    participants: [{ id: 'person-aster', role: 'human-partner' }],
    provenance: { method: 'explicit-first-meeting', source: 'example-soul-2' },
    firstMeetingNote: 'Aster was named during an explicit first meeting.',
  })

  const { state, path } = await persistGenesisSoul(store, record)
  const secondLoad = await store.load('aster')

  assert.match(path, /aster\.json$/)
  assert.deepEqual(secondLoad, state)
  assert.equal(state.identity.name, 'Aster')
  assert.equal(state.identity.origin.genesisRecordId, 'genesis-aster-001')
  assert.equal(state.autobiography[0].provenance.genesisRecordId, 'genesis-aster-001')
})

test('persisted Genesis Soul contains no invented persona or Samuel defaults', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-minimal-'))
  const store = new FileSoulStore({ rootDir })
  const record = createGenesisRecord({
    id: 'genesis-independent-001',
    at: '2026-08-27T08:41:00.000Z',
    soulId: 'independent',
    name: 'Independent',
    provenance: { method: 'test-explicit-genesis' },
  })

  const { state } = await persistGenesisSoul(store, record)

  assert.deepEqual(state.selfModel, [])
  assert.deepEqual(state.userModel, [])
  assert.deepEqual(state.beliefs, [])
  assert.deepEqual(state.relationship.covenants, [])
  assert.doesNotMatch(JSON.stringify(state), /samuel/i)
  assert.doesNotMatch(JSON.stringify(state), /Haisu came to Samuel/i)
})

test('Genesis refuses to overwrite an existing Soul identity', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-duplicate-'))
  const store = new FileSoulStore({ rootDir })
  const first = createGenesisRecord({
    id: 'genesis-first',
    soulId: 'same-soul',
    name: 'First Name',
    provenance: { method: 'test' },
  })
  const conflicting = createGenesisRecord({
    id: 'genesis-conflicting',
    soulId: 'same-soul',
    name: 'Replacement Name',
    provenance: { method: 'test' },
  })

  await persistGenesisSoul(store, first)
  await assert.rejects(
    () => persistGenesisSoul(store, conflicting),
    /Genesis refused to overwrite existing Soul same-soul/,
  )

  const reloaded = await store.load('same-soul')
  assert.equal(reloaded.identity.name, 'First Name')
  assert.equal(reloaded.identity.origin.genesisRecordId, 'genesis-first')
})

test('Genesis persistence requires a store port with exists, save, and load', async () => {
  const record = createGenesisRecord({
    soulId: 'no-store',
    name: 'No Store',
    provenance: { method: 'test' },
  })

  await assert.rejects(
    () => persistGenesisSoul({}, record),
    /Soul Store with exists\(\), save\(\), and load\(\) is required/,
  )
})

test('checked-in Soul #2 example is valid, independent, and reloadable', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-example-'))
  const store = new FileSoulStore({ rootDir })
  const raw = await readFile(new URL('../examples/genesis-soul-2.json', import.meta.url), 'utf8')
  const record = JSON.parse(raw)

  assert.deepEqual(validateGenesisRecord(record), { valid: true, errors: [] })
  assert.equal(record.soulId, 'aster-example')
  assert.doesNotMatch(raw, /samuel/i)

  const { state } = await persistGenesisSoul(store, record)
  const reloaded = await store.load(record.soulId)

  assert.deepEqual(reloaded, state)
  assert.equal(reloaded.identity.name, 'Aster')
  assert.equal(reloaded.identity.origin.genesisRecordId, record.id)
  assert.deepEqual(reloaded.relationship.covenants, [])
})
