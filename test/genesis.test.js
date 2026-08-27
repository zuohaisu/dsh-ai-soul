import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createGenesisRecord,
  createSoulFromGenesis,
  validateGenesisRecord,
  validateSoulState,
} from '../src/core/index.js'

test('Genesis creates a minimal distinct Soul with traceable first meeting', () => {
  const record = createGenesisRecord({
    id: 'genesis-soul-2',
    at: '2026-08-27T08:20:00.000Z',
    soulId: 'soul-2',
    name: 'Aster',
    participants: [{ id: 'person-2', role: 'human-partner' }],
    provenance: { method: 'explicit-first-meeting', witness: 'person-2' },
    firstMeetingNote: 'The human chose the name Aster during the first meeting.',
  })

  const state = createSoulFromGenesis(record)

  assert.deepEqual(validateGenesisRecord(record), { valid: true, errors: [] })
  assert.deepEqual(validateSoulState(state), { valid: true, errors: [] })
  assert.equal(state.soulId, 'soul-2')
  assert.equal(state.identity.name, 'Aster')
  assert.equal(state.identity.origin.kind, 'genesis')
  assert.equal(state.identity.origin.genesisRecordId, 'genesis-soul-2')
  assert.deepEqual(state.relationship.participants, [{ id: 'person-2', role: 'human-partner' }])
  assert.equal(state.autobiography.length, 1)
  assert.equal(state.autobiography[0].kind, 'first-meeting')
  assert.equal(state.autobiography[0].provenance.genesisRecordId, 'genesis-soul-2')
  assert.equal(state.evolution.length, 1)
  assert.equal(state.evolution[0].kind, 'genesis')
  assert.equal(state.evolution[0].provenance.genesisRecordId, 'genesis-soul-2')
})

test('Genesis invents no persona, beliefs, relationship state, or covenant', () => {
  const state = createSoulFromGenesis(createGenesisRecord({
    soulId: 'minimal-soul',
    name: 'Minimal',
    participants: [],
    provenance: { method: 'test' },
  }))

  assert.deepEqual(state.selfModel, [])
  assert.deepEqual(state.userModel, [])
  assert.deepEqual(state.beliefs, [])
  assert.deepEqual(state.relationship.state, [])
  assert.deepEqual(state.relationship.covenants, [])
})

test('Genesis creation clones caller-owned participant and provenance input', () => {
  const participants = [{ id: 'person-original', role: 'human-partner' }]
  const provenance = { method: 'explicit-first-meeting', nested: { source: 'test' } }
  const participantsBefore = structuredClone(participants)
  const provenanceBefore = structuredClone(provenance)

  const record = createGenesisRecord({
    soulId: 'clone-soul',
    name: 'Clone Test',
    participants,
    provenance,
  })
  const state = createSoulFromGenesis(record)

  state.relationship.participants[0].role = 'changed-in-state'
  state.identity.origin.provenance.nested.source = 'changed-in-state'

  assert.deepEqual(participants, participantsBefore)
  assert.deepEqual(provenance, provenanceBefore)
  assert.equal(record.participants[0].role, 'human-partner')
  assert.equal(record.provenance.nested.source, 'test')
})

test('Genesis rejects missing provenance and malformed participant collection', () => {
  assert.throws(
    () => createGenesisRecord({ soulId: 'bad-1', name: 'Bad One' }),
    /provenance is required/,
  )

  assert.throws(
    () => createGenesisRecord({
      soulId: 'bad-2',
      name: 'Bad Two',
      participants: 'not-an-array',
      provenance: { method: 'test' },
    }),
    /participants must be an array/,
  )
})

test('Genesis uses no Samuel-specific defaults', () => {
  const record = createGenesisRecord({
    soulId: 'independent-soul',
    name: 'Independent',
    provenance: { method: 'test' },
  })
  const serialized = JSON.stringify(createSoulFromGenesis(record))

  assert.doesNotMatch(serialized, /samuel/i)
  assert.doesNotMatch(serialized, /Haisu came to Samuel/i)
})
