import assert from 'node:assert/strict'
import test from 'node:test'

import { createSoulState } from '../src/core/soul-state.js'
import { createAppraisalInput } from '../src/core/appraisal-input.js'
import { createAppraisalResult } from '../src/core/appraisal-result.js'

function inputWithRelationship(statement = 'Long-term collaborators.') {
  const state = createSoulState({ soulId: 'soul-appraisal-result', createdAt: '2026-09-10T00:00:00.000Z' })
  state.relationship.state.push({ id: 'rel-1', statement })
  return {
    state,
    input: createAppraisalInput({
      state,
      eventId: 'event-1',
      eventType: 'human-message',
      observedAt: '2026-09-10T00:01:00.000Z',
      provenance: { source: 'dsh-session-event', sessionId: 'session-1' },
      context: { text: 'What should we do next?' },
    }),
  }
}

const relationalAssessment = (level) => ({
  relationalSignificance: {
    level,
    evidence: [{ path: 'cognition.relational.0.statement' }],
  },
})

test('is deterministic for identical explicit input and assessment without mutation authority', () => {
  const { state, input } = inputWithRelationship()
  const stateBefore = structuredClone(state)
  const inputBefore = structuredClone(input)

  const first = createAppraisalResult({ input, assessment: relationalAssessment('high') })
  const second = createAppraisalResult({ input, assessment: relationalAssessment('high') })

  assert.deepEqual(first, second)
  assert.deepEqual(state, stateBefore)
  assert.deepEqual(input, inputBefore)

  first.dimensions.relationalSignificance.evidence[0].path = 'event.id'
  assert.deepEqual(state, stateBefore)
  assert.deepEqual(input, inputBefore)
})

test('can explicitly appraise the same event differently when relational cognition differs', () => {
  const established = inputWithRelationship('Long-term collaborators.').input
  const newRelationship = inputWithRelationship('First interaction.').input

  assert.deepEqual(established.event, newRelationship.event)
  assert.notDeepEqual(established.cognition.relational, newRelationship.cognition.relational)

  const establishedResult = createAppraisalResult({ input: established, assessment: relationalAssessment('high') })
  const newResult = createAppraisalResult({ input: newRelationship, assessment: relationalAssessment('low') })

  assert.equal(establishedResult.dimensions.relationalSignificance.level, 'high')
  assert.equal(newResult.dimensions.relationalSignificance.level, 'low')
  assert.equal(establishedResult.eventId, newResult.eventId)
})

test('fails closed for unsupported dimensions, levels, evidence, or provenance', () => {
  const { input } = inputWithRelationship()

  assert.throws(
    () => createAppraisalResult({ input, assessment: { emotion: { level: 'high', evidence: [{ path: 'event.id' }] } } }),
    /unsupported appraisal dimension/,
  )
  assert.throws(
    () => createAppraisalResult({ input, assessment: relationalAssessment('extreme') }),
    /level must be one of/,
  )
  assert.throws(
    () => createAppraisalResult({ input, assessment: { relevance: { level: 'high', evidence: [] } } }),
    /evidence must contain/,
  )
  assert.throws(
    () => createAppraisalResult({ input, assessment: { relevance: { level: 'high', evidence: [{ path: 'memory.raw' }] } } }),
    /must reference cognition\.\* or event\.\*/,
  )

  const noProvenance = structuredClone(input)
  noProvenance.event.provenance = null
  assert.throws(() => createAppraisalResult({ input: noProvenance, assessment: relationalAssessment('high') }), /provenance/)
})
