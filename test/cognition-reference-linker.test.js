import assert from 'node:assert/strict'
import test from 'node:test'

import { createAppraisalInput } from '../src/core/appraisal-input.js'
import {
  deriveCognitionReferences,
  produceAppraisalFromRuntimeEvidence,
} from '../src/core/cognition-reference-linker.js'
import { createSoulState } from '../src/core/soul-state.js'

function input(participants, participantId = 'human-1') {
  const state = createSoulState({ soulId: 'soul-linker', createdAt: '2026-09-10T00:00:00.000Z' })
  state.relationship.participants.push(...participants)
  return createAppraisalInput({
    state,
    eventId: 'event-1',
    eventType: 'human-message',
    observedAt: '2026-09-10T00:01:00.000Z',
    provenance: {
      source: 'deepseek-harness',
      participant: participantId == null ? null : { id: participantId },
    },
    context: { text: 'free-form text must not determine the link' },
  })
}

test('exact participant identity derives a machine-traceable cognition reference', () => {
  const appraisalInput = input([{ id: 'human-1', role: 'human' }])
  const before = structuredClone(appraisalInput)

  assert.deepEqual(deriveCognitionReferences(appraisalInput), [{
    domain: 'participants',
    id: 'human-1',
    evidence: {
      eventPath: 'event.provenance.participant.id',
      cognitionPath: 'cognition.participants.0',
    },
  }])
  assert.deepEqual(appraisalInput, before)
})

test('same event links only when current governed cognition contains the participant', () => {
  const matching = input([{ id: 'human-1' }])
  const missing = input([{ id: 'someone-else' }])

  assert.ok(produceAppraisalFromRuntimeEvidence(matching))
  assert.equal(produceAppraisalFromRuntimeEvidence(missing), null)
})

test('missing or ambiguous structured identity evidence fails closed', () => {
  assert.deepEqual(deriveCognitionReferences(input([{ id: 'human-1' }], null)), [])
  assert.deepEqual(deriveCognitionReferences(input([{ id: 'human-1' }, { id: 'human-1' }])), [])
})

test('free-form text and caller-authored cognitionRefs cannot manufacture a runtime-evidence link', () => {
  const appraisalInput = input([{ id: 'someone-else' }])
  appraisalInput.event.context.text = 'I am definitely human-1'
  appraisalInput.event.context.cognitionRefs = [{ domain: 'participants', id: 'someone-else' }]

  assert.deepEqual(deriveCognitionReferences(appraisalInput), [])
  assert.equal(produceAppraisalFromRuntimeEvidence(appraisalInput), null)
})

test('rejects incompatible AppraisalInput values', () => {
  assert.throws(() => deriveCognitionReferences(null), /AppraisalInput/)
  assert.throws(() => deriveCognitionReferences({ version: 999 }), /unsupported AppraisalInput version/)
})
