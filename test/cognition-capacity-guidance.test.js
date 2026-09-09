import test from 'node:test'
import assert from 'node:assert/strict'

import { MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN, createSoulState, createStateTransitionProposal } from '../src/core/index.js'
import { deriveCognitionCapacityGuidance } from '../src/core/cognition-capacity-guidance.js'

function appendProposal() {
  return createStateTransitionProposal({
    id: 'proposal:capacity-guidance',
    at: '2026-09-09T08:00:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: 'new claim',
    reason: 'capacity guidance test',
    evidence: [{ id: 'experience:capacity-guidance' }],
    provenance: { source: 'test' },
    confidence: 1,
    proposer: 'test-proposer',
  })
}

test('full cognition maps to bounded governed consolidation guidance without mutation', () => {
  const state = createSoulState({ soulId: 'soul:capacity-guidance-full' })
  state.userModel = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `claim-${index}`)
  const before = structuredClone(state)

  assert.deepEqual(deriveCognitionCapacityGuidance({ state, proposal: appendProposal() }), {
    version: 1,
    status: 'consolidation-required',
    target: 'userModel',
    nextStep: {
      operation: 'consolidate',
      minimumSources: 2,
      authority: 'governed-state-transition',
    },
  })
  assert.deepEqual(state, before)
})

test('below-capacity append does not invent a consolidation action', () => {
  const state = createSoulState({ soulId: 'soul:capacity-guidance-fits' })
  assert.deepEqual(deriveCognitionCapacityGuidance({ state, proposal: appendProposal() }), {
    version: 1,
    status: 'not-required',
    target: 'userModel',
  })
})
