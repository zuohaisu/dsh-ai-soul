import assert from 'node:assert/strict'
import test from 'node:test'

import { createAppraisalInput } from '../src/core/appraisal-input.js'
import { produceAppraisal } from '../src/core/appraisal-producer.js'
import { createRelationshipFact } from '../src/core/relationship-fact.js'
import { createSoulState } from '../src/core/soul-state.js'

function state({ includeRelationship = true } = {}) {
  const value = createSoulState({ soulId: 'soul-producer', createdAt: '2026-09-10T00:00:00.000Z' })
  if (includeRelationship) {
    value.relationship.state.push(createRelationshipFact({
      id: 'rel-collaboration',
      subject: { type: 'participant', id: 'human-1' },
      predicate: 'shared-project',
      value: { projectId: 'atlas' },
      confidence: 0.9,
      provenance: { type: 'governed-proposal', id: 'proposal-rel-collaboration' },
    }))
  }
  return value
}

function input(current) {
  return createAppraisalInput({
    state: current,
    eventId: 'event-1',
    eventType: 'human-message',
    observedAt: '2026-09-10T00:01:00.000Z',
    provenance: { source: 'dsh-session-event', sessionId: 'session-1' },
    context: {
      text: 'What should we do next?',
      cognitionRefs: [{ domain: 'relational', id: 'rel-collaboration' }],
    },
  })
}

test('derives high relevance only from an explicit ref that resolves in semantic current cognition', () => {
  const appraisalInput = input(state())
  const before = structuredClone(appraisalInput)

  const result = produceAppraisal(appraisalInput)

  assert.equal(result.dimensions.relevance.level, 'high')
  assert.deepEqual(result.dimensions.relevance.evidence, [
    { path: 'event.context.cognitionRefs' },
    { path: 'cognition.relational.0' },
  ])
  assert.deepEqual(appraisalInput, before)
})

test('same event does not claim relevance when governed semantic cognition no longer resolves the ref', () => {
  const withRelationship = input(state())
  const withoutRelationship = input(state({ includeRelationship: false }))

  assert.deepEqual(withRelationship.event, withoutRelationship.event)
  assert.ok(produceAppraisal(withRelationship))
  assert.equal(produceAppraisal(withoutRelationship), null)
})

test('missing, stale, or malformed refs produce no guessed appraisal', () => {
  const current = state()
  const noRefs = createAppraisalInput({
    state: current,
    eventId: 'event-2',
    eventType: 'human-message',
    observedAt: '2026-09-10T00:02:00.000Z',
    provenance: { source: 'dsh-session-event' },
    context: { text: 'hello' },
  })
  assert.equal(produceAppraisal(noRefs), null)

  const stale = input(current)
  stale.event.context.cognitionRefs = [{ domain: 'relational', id: 'missing' }]
  assert.equal(produceAppraisal(stale), null)

  const malformed = input(current)
  malformed.event.context.cognitionRefs = [{ domain: 'unknown', id: 'rel-collaboration' }]
  assert.equal(produceAppraisal(malformed), null)
})

test('rejects objects that are not compatible AppraisalInput values', () => {
  assert.throws(() => produceAppraisal(null), /AppraisalInput/)
  assert.throws(() => produceAppraisal({ version: 999, event: {}, cognition: {} }), /unsupported AppraisalInput version/)
})
