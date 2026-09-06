import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAgencyExecutionOutcome,
  validateAgencyExecutionOutcome,
  validateAgencyExecutionOutcomeLineage,
} from '../src/core/agency-execution-outcome.js'

const attempt = {
  version: 1,
  id: 'attempt-1',
  attemptedAt: '2026-09-06T01:00:00.000Z',
  consumptionId: 'consumption-1',
  decisionId: 'decision-1',
  soulId: 'soul-1',
  capability: 'send-message',
  scope: 'conversation:123',
  executor: { id: 'dsh-runtime', role: 'runtime' },
  channel: 'dsh',
  reason: 'Execute approved one-shot action',
  provenance: { source: 'runtime-boundary' },
}

function create(status = 'succeeded') {
  return createAgencyExecutionOutcome({
    id: `outcome-${status}`,
    recordedAt: '2026-09-06T01:00:01.000Z',
    attempt,
    status,
    reporter: { id: 'dsh-runtime', role: 'runtime' },
    channel: 'dsh',
    summary: status === 'succeeded' ? 'Runtime reports completion.' : 'Runtime reports failure.',
    provenance: { source: 'runtime-boundary', eventId: 'event-1' },
  })
}

test('creates explicit succeeded and failed outcomes without granting authority', () => {
  for (const status of ['succeeded', 'failed']) {
    const outcome = create(status)
    assert.equal(outcome.status, status)
    assert.equal(outcome.attemptId, attempt.id)
    assert.equal(Object.hasOwn(outcome, 'authority'), false)
    assert.deepEqual(validateAgencyExecutionOutcomeLineage(outcome, attempt), { valid: true, errors: [] })
  }
})

test('rejects malformed status and provenance', () => {
  assert.throws(() => createAgencyExecutionOutcome({ attempt, status: 'completed', reporter: { id: 'x', role: 'runtime' }, channel: 'dsh', summary: 'x', provenance: {} }), /status must be one of/)
  const outcome = create()
  outcome.provenance = null
  assert.equal(validateAgencyExecutionOutcome(outcome).valid, false)
})

test('fails closed on lineage mismatch', () => {
  const outcome = create()
  outcome.scope = 'conversation:other'
  const result = validateAgencyExecutionOutcomeLineage(outcome, attempt)
  assert.equal(result.valid, false)
  assert.match(result.errors.join('; '), /scope does not match/)
})

test('forbids authority, scheduling, and execution payload fields', () => {
  for (const field of ['authority', 'approved', 'schedule', 'toolCall', 'actuatorPayload', 'retry']) {
    const outcome = create()
    outcome[field] = true
    const result = validateAgencyExecutionOutcome(outcome)
    assert.equal(result.valid, false)
    assert.match(result.errors.join('; '), new RegExp(`${field} is not allowed`))
  }
})
