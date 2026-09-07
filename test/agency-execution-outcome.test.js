import test from 'node:test'
import assert from 'node:assert/strict'
import { createAgencyExecutionOutcome, validateAgencyExecutionOutcome, validateAgencyExecutionOutcomeLineage } from '../src/core/agency-execution-outcome.js'

const grounding = { evidenceId: 'evidence-1', evidenceType: 'presence-trigger', source: { runtime: 'dsh' }, provenance: { source: 'presence-evaluator' } }
const groundedAttempt = { version: 2, id: 'attempt-1', attemptedAt: '2026-09-06T01:00:00.000Z', consumptionId: 'consumption-1', decisionId: 'decision-1', intentId: 'intent-1', requestId: 'request-1', soulId: 'soul-1', capability: 'send-message', scope: 'conversation:123', executor: { id: 'dsh-runtime', role: 'runtime' }, channel: 'dsh', reason: 'Execute approved one-shot action', provenance: { source: 'runtime-boundary' }, groundingMode: 'grounded', initiationGrounding: grounding }
const legacyAttempt = { version: 1, id: 'legacy-attempt', attemptedAt: '2026-09-06T01:00:00.000Z', consumptionId: 'legacy-consumption', decisionId: 'legacy-decision', soulId: 'soul-1', capability: 'send-message', scope: 'conversation:123', executor: { id: 'dsh-runtime', role: 'runtime' }, channel: 'dsh', reason: 'Legacy action', provenance: { source: 'runtime-boundary' } }
function create(attempt = groundedAttempt, status = 'succeeded', provenance = { source: 'runtime-boundary', eventId: 'event-1' }) { return createAgencyExecutionOutcome({ id: `outcome-${status}`, recordedAt: '2026-09-06T01:00:01.000Z', attempt, status, reporter: { id: 'dsh-runtime', role: 'runtime' }, channel: 'dsh', summary: 'Runtime reports outcome.', provenance }) }

test('preserves grounded authority lineage into durable outcomes', () => {
  const outcome = create()
  assert.equal(outcome.version, 2); assert.equal(outcome.intentId, groundedAttempt.intentId); assert.equal(outcome.requestId, groundedAttempt.requestId); assert.equal(outcome.groundingMode, 'grounded'); assert.deepEqual(outcome.initiationGrounding, grounding); assert.deepEqual(validateAgencyExecutionOutcomeLineage(outcome, groundedAttempt), { valid: true, errors: [] })
})
test('supports explicit legacy-ungrounded outcomes without invented evidence and validates stored v1', () => {
  const outcome = create(legacyAttempt); assert.equal(outcome.groundingMode, 'legacy-ungrounded'); assert.equal(Object.hasOwn(outcome, 'initiationGrounding'), false)
  const storedV1 = { version: 1, id: 'old', recordedAt: '2026-09-06T01:00:01.000Z', attemptId: legacyAttempt.id, consumptionId: legacyAttempt.consumptionId, decisionId: legacyAttempt.decisionId, soulId: legacyAttempt.soulId, capability: legacyAttempt.capability, scope: legacyAttempt.scope, status: 'succeeded', reporter: { id: 'dsh-runtime', role: 'runtime' }, channel: 'dsh', summary: 'old', provenance: { source: 'runtime' } }; assert.equal(validateAgencyExecutionOutcome(storedV1).valid, true)
})
test('fails closed when outcome provenance tries to replace initiation grounding', () => { assert.throws(() => create(groundedAttempt, 'succeeded', { source: 'runtime', initiationGrounding: { evidenceId: 'other' } }), /must not replace initiation grounding/) })
test('fails closed on malformed or mismatched grounded lineage', () => {
  const malformed = create(); malformed.initiationGrounding.source = null; assert.equal(validateAgencyExecutionOutcome(malformed).valid, false)
  const mismatch = create(); mismatch.requestId = 'other-request'; const result = validateAgencyExecutionOutcomeLineage(mismatch, groundedAttempt); assert.equal(result.valid, false); assert.match(result.errors.join('; '), /requestId does not match/)
})
test('rejects malformed status and provenance and forbids authority/execution payload fields', () => {
  assert.throws(() => createAgencyExecutionOutcome({ attempt: groundedAttempt, status: 'completed', reporter: { id: 'x', role: 'runtime' }, channel: 'dsh', summary: 'x', provenance: {} }), /status must be one of/)
  for (const field of ['authority', 'approved', 'schedule', 'toolCall', 'actuatorPayload', 'retry']) { const outcome = create(); outcome[field] = true; const result = validateAgencyExecutionOutcome(outcome); assert.equal(result.valid, false); assert.match(result.errors.join('; '), new RegExp(`${field} is not allowed`)) }
})
