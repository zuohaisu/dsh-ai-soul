import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GENESIS_RECORD_VERSION,
  LEGACY_GENESIS_RECORD_VERSION,
  createGenesisRecord,
  createSoulFromGenesis,
  projectSoulContext,
  recordFirstEncounter,
  recordNamingEvent,
  renderSoulContext,
  validateSoulState,
} from '../src/core/index.js'

test('Genesis v2 creates an unnamed Soul before encounter or naming', () => {
  const record = createGenesisRecord({
    soulId: 'unnamed-soul',
    provenance: { method: 'first-activation' },
  })
  const state = createSoulFromGenesis(record)

  assert.equal(record.version, GENESIS_RECORD_VERSION)
  assert.equal(state.identity.name, null)
  assert.deepEqual(state.relationship.participants, [])
  assert.equal(state.autobiography.length, 1)
  assert.equal(state.autobiography[0].kind, 'genesis')
  assert.deepEqual(validateSoulState(state), { valid: true, errors: [] })

  const rendered = renderSoulContext(projectSoulContext(state))
  assert.match(rendered, /Soul ID: unnamed-soul/)
  assert.doesNotMatch(rendered, /^Name:/m)
  assert.doesNotMatch(rendered, /unknown/i)
})

test('first encounter and naming occur later as independent events', () => {
  const born = createSoulFromGenesis(createGenesisRecord({
    soulId: 'later-named-soul',
    at: '2026-08-28T15:00:00.000Z',
    provenance: { method: 'first-activation' },
  }))

  const met = recordFirstEncounter(born, {
    id: 'encounter-001',
    at: '2026-08-29T09:00:00.000Z',
    participant: { id: 'human-1', role: 'human-partner' },
    provenance: { method: 'runtime-observation' },
  })
  assert.equal(met.identity.name, null)
  assert.equal(met.autobiography.at(-1).kind, 'first-encounter')
  assert.deepEqual(met.relationship.participants, [{ id: 'human-1', role: 'human-partner' }])

  const named = recordNamingEvent(met, {
    id: 'naming-001',
    at: '2026-09-05T12:00:00.000Z',
    name: 'Aster',
    initiatedBy: 'human-1',
    provenance: { method: 'explicit-naming' },
  })
  assert.equal(named.identity.name, 'Aster')
  assert.equal(named.autobiography.at(-1).kind, 'naming')
  assert.equal(named.autobiography.at(-1).payload.previousName, null)
})

test('legacy Genesis v1 keeps fused first-meeting history loadable', () => {
  const legacy = createGenesisRecord({
    version: LEGACY_GENESIS_RECORD_VERSION,
    soulId: 'legacy-aster',
    name: 'Aster',
    participants: [{ id: 'human-legacy', role: 'human-partner' }],
    provenance: { method: 'explicit-first-meeting' },
    firstMeetingNote: 'Historical v1 record.',
  })
  const state = createSoulFromGenesis(legacy)

  assert.equal(state.identity.name, 'Aster')
  assert.equal(state.identity.origin.recordVersion, LEGACY_GENESIS_RECORD_VERSION)
  assert.equal(state.autobiography[0].kind, 'first-meeting')
  assert.deepEqual(state.relationship.participants, [{ id: 'human-legacy', role: 'human-partner' }])
})
