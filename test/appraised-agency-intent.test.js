import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAppraisalInput,
  createAppraisalResult,
  createAppraisedAgencyIntent,
  createSoulState,
  validateAgencyIntent,
} from '../src/core/index.js'

function fixture(relationshipStatement, level = 'high') {
  const state = createSoulState({ soulId: 'soul-appraised-agency', createdAt: '2026-09-10T00:00:00.000Z' })
  state.relationship.state.push({ id: 'rel-1', statement: relationshipStatement })
  const input = createAppraisalInput({
    state,
    eventId: 'event-1',
    eventType: 'human-message',
    observedAt: '2026-09-10T00:01:00.000Z',
    provenance: { source: 'dsh-session-event', sessionId: 'session-1' },
    context: { text: 'What should we do next?' },
  })
  const appraisal = createAppraisalResult({
    input,
    assessment: {
      relationalSignificance: {
        level,
        evidence: [{ path: 'cognition.relational.0.statement' }],
      },
    },
  })
  return { state, input, appraisal }
}

function intentInput(appraisal, overrides = {}) {
  return {
    id: 'intent-appraised-1',
    at: '2026-09-10T00:02:00.000Z',
    soulId: appraisal.soulId,
    kind: 'reflect',
    reason: 'The bounded appraisal makes reflection relevant.',
    proposedAction: 'Reflect on the relationship context before responding.',
    appraisal,
    provenance: { producer: 'appraised-agency:test' },
    ...overrides,
  }
}

test('binds different relational appraisals to traceably different non-authoritative intents', () => {
  const established = fixture('Long-term collaborators.', 'high')
  const firstMeeting = fixture('First interaction.', 'low')

  const highIntent = createAppraisedAgencyIntent(intentInput(established.appraisal))
  const lowIntent = createAppraisedAgencyIntent(intentInput(firstMeeting.appraisal))

  assert.equal(highIntent.authority, 'none')
  assert.equal(lowIntent.authority, 'none')
  assert.equal(highIntent.contextRefs[0].type, 'appraisal-result')
  assert.equal(highIntent.contextRefs[0].dimensions.relationalSignificance.level, 'high')
  assert.equal(lowIntent.contextRefs[0].dimensions.relationalSignificance.level, 'low')
  assert.deepEqual(validateAgencyIntent(highIntent), { valid: true, errors: [] })
})

test('formation is detached and does not mutate Soul, AppraisalInput, or AppraisalResult', () => {
  const { state, input, appraisal } = fixture('Long-term collaborators.')
  const stateBefore = structuredClone(state)
  const inputBefore = structuredClone(input)
  const appraisalBefore = structuredClone(appraisal)

  const intent = createAppraisedAgencyIntent(intentInput(appraisal))
  intent.contextRefs[0].dimensions.relationalSignificance.level = 'low'
  intent.provenance.appraisal.eventProvenance.sessionId = 'changed'

  assert.deepEqual(state, stateBefore)
  assert.deepEqual(input, inputBefore)
  assert.deepEqual(appraisal, appraisalBefore)
})

test('fails closed for mismatched soul or malformed appraisal', () => {
  const { appraisal } = fixture('Long-term collaborators.')
  assert.throws(
    () => createAppraisedAgencyIntent(intentInput(appraisal, { soulId: 'another-soul' })),
    /soulId must match appraisal\.soulId/,
  )

  const malformed = structuredClone(appraisal)
  malformed.dimensions.relationalSignificance.level = 'extreme'
  assert.throws(() => createAppraisedAgencyIntent(intentInput(malformed)), /invalid appraisal level/)
})

test('appraisal binding cannot smuggle approval, scheduling, tools, or execution authority', () => {
  const { appraisal } = fixture('Long-term collaborators.')
  for (const forbidden of [
    { approved: true },
    { scheduled: true },
    { toolCall: { name: 'send' } },
    { execution: { channel: 'runtime' } },
    { authority: 'execute' },
  ]) {
    assert.throws(() => createAppraisedAgencyIntent(intentInput(appraisal, forbidden)), /not allowed|authority must be none/)
  }
})
