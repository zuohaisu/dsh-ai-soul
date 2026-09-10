import assert from 'node:assert/strict'
import test from 'node:test'

import { createAppraisalInput } from '../src/core/appraisal-input.js'
import { createAppraisalResult } from '../src/core/appraisal-result.js'
import { createRelationshipFact } from '../src/core/relationship-fact.js'
import { createSoulState } from '../src/core/soul-state.js'

function inputWithRelationship(projectId = 'atlas') {
  const state = createSoulState({ soulId: 'soul-appraisal-result', createdAt: '2026-09-10T00:00:00.000Z' })
  state.relationship.state.push(createRelationshipFact({
    id: `rel-${projectId}`,
    subject: { type: 'participant', id: 'human-1' },
    predicate: 'shared-project',
    value: { projectId },
    confidence: 0.9,
    provenance: { type: 'governed-proposal', id: `proposal-${projectId}` },
  }))
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
    evidence: [{ path: 'cognition.relational.0' }],
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

test('can explicitly appraise the same event differently when semantic relational cognition differs', () => {
  const atlas = inputWithRelationship('atlas').input
  const orion = inputWithRelationship('orion').input

  assert.deepEqual(atlas.event, orion.event)
  assert.notDeepEqual(atlas.cognition.relational, orion.cognition.relational)

  const atlasResult = createAppraisalResult({ input: atlas, assessment: relationalAssessment('high') })
  const orionResult = createAppraisalResult({ input: orion, assessment: relationalAssessment('low') })

  assert.equal(atlasResult.dimensions.relationalSignificance.level, 'high')
  assert.equal(orionResult.dimensions.relationalSignificance.level, 'low')
  assert.equal(atlasResult.eventId, orionResult.eventId)
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
