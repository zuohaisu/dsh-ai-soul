import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createGenesisRecord,
  createSoulFromGenesis,
  recordFirstEncounter,
  recordNamingEvent,
} from '../src/core/index.js'

function newborn(id = 'newborn') {
  return createSoulFromGenesis(createGenesisRecord({
    soulId: id,
    provenance: { method: 'first-activation' },
  }))
}

test('first encounter refuses to fabricate a second first encounter', () => {
  const met = recordFirstEncounter(newborn(), {
    participant: { id: 'human-1' },
    provenance: { method: 'runtime-observation' },
  })

  assert.throws(() => recordFirstEncounter(met, {
    participant: { id: 'human-2' },
    provenance: { method: 'runtime-observation' },
  }), /first encounter already recorded/)
})

test('naming preserves previous name as history', () => {
  const first = recordNamingEvent(newborn('rename-soul'), {
    name: 'Aster',
    provenance: { method: 'explicit-naming' },
  })
  const second = recordNamingEvent(first, {
    name: 'Orion',
    provenance: { method: 'explicit-renaming' },
  })

  assert.equal(second.identity.name, 'Orion')
  assert.equal(second.autobiography.at(-1).payload.previousName, 'Aster')
})
