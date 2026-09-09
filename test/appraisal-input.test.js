import assert from 'node:assert/strict'
import test from 'node:test'

import { createSoulState } from '../src/core/soul-state.js'
import { createAppraisalInput } from '../src/core/appraisal-input.js'

function state() {
  const value = createSoulState({ soulId: 'soul-appraisal', createdAt: '2026-09-10T00:00:00.000Z' })
  value.selfModel.push({ id: 'self-1', statement: 'Values explicit uncertainty.' })
  value.userModel.push({ id: 'other-1', statement: 'Prefers concise tradeoffs.' })
  value.relationship.state.push({ id: 'rel-1', statement: 'Long-term collaborators.' })
  value.worldModel.push({ id: 'world-1', statement: 'Project Atlas is active.' })
  value.beliefs.push({ id: 'belief-1', statement: 'Evidence should remain auditable.' })
  return value
}

const event = {
  eventId: 'event-1',
  eventType: 'human-message',
  observedAt: '2026-09-10T00:01:00.000Z',
  provenance: { source: 'dsh-session-event', sessionId: 'session-1' },
  context: { text: 'What should we do next?' },
}

test('projects detached current Soul cognition without mutation authority', () => {
  const current = state()
  const before = structuredClone(current)
  const input = createAppraisalInput({ state: current, ...event })

  assert.equal(input.soulId, current.soulId)
  assert.deepEqual(input.cognition.self, current.selfModel)
  assert.deepEqual(input.cognition.other, current.userModel)
  assert.deepEqual(input.cognition.relational, current.relationship.state)
  assert.deepEqual(input.cognition.world, current.worldModel)
  assert.deepEqual(input.cognition.beliefs, current.beliefs)
  assert.deepEqual(current, before)

  input.cognition.self[0].statement = 'mutated projection'
  input.event.context.text = 'mutated context'
  assert.deepEqual(current, before)
  assert.equal(event.context.text, 'What should we do next?')
})

test('same event changes appraisal input when governed Soul cognition changes', () => {
  const first = state()
  const second = structuredClone(first)
  second.relationship.state = [{ id: 'rel-2', statement: 'New collaborators.' }]

  const firstInput = createAppraisalInput({ state: first, ...event })
  const secondInput = createAppraisalInput({ state: second, ...event })

  assert.deepEqual(firstInput.event, secondInput.event)
  assert.equal(firstInput.soulId, secondInput.soulId)
  assert.notDeepEqual(firstInput.cognition.relational, secondInput.cognition.relational)
  assert.deepEqual(firstInput.cognition.self, secondInput.cognition.self)
})

test('fails closed without valid Soul and explicit event provenance binding', () => {
  const current = state()
  assert.throws(() => createAppraisalInput({ state: null, ...event }), /invalid Soul state/)
  assert.throws(() => createAppraisalInput({ state: current, ...event, eventId: '' }), /eventId/)
  assert.throws(() => createAppraisalInput({ state: current, ...event, provenance: null }), /provenance/)
  assert.throws(() => createAppraisalInput({ state: current, ...event, context: 'raw transcript' }), /context/)
})
