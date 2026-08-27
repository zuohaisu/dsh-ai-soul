import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  createGenesisRecord,
  persistGenesisSoul,
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

test('Genesis persistence requires a store port with save and load', async () => {
  const record = createGenesisRecord({
    soulId: 'no-store',
    name: 'No Store',
    provenance: { method: 'test' },
  })

  await assert.rejects(() => persistGenesisSoul({}, record), /Soul Store with save\(\) and load\(\) is required/)
})
