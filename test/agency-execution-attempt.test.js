import test from 'node:test'
import assert from 'node:assert/strict'
import { createAgencyExecutionAttempt, validateAgencyExecutionAttempt, validateAgencyExecutionAttemptLineage } from '../src/core/agency-execution-attempt.js'

const grounding = { evidenceId: 'evidence-1', evidenceType: 'user-request-evidence', source: { runtime: 'dsh', interactionId: 'interaction-1' }, provenance: { experienceId: 'experience-1' } }
function consumption(overrides = {}) {
  return { version: 2, id: 'consumption-1', consumedAt: '2026-09-06T01:00:00.000Z', decisionId: 'decision-1', intentId: 'intent-1', requestId: 'request-1', soulId: 'soul-1', capability: 'send-message', scope: 'conversation:abc', consumer: { id: 'runtime-1', role: 'agency-runtime' }, reason: 'Reserve authorization before an execution attempt.', provenance: { source: 'authorization-ledger' }, groundingMode: 'grounded', initiationGrounding: grounding, ...overrides }
}
function args(c = consumption()) { return { id: 'attempt-1', attemptedAt: '2026-09-06T01:01:00.000Z', consumption: c, executor: { id: 'dsh-runtime-1', role: 'runtime-adapter' }, channel: 'dsh:tool-boundary', reason: 'Begin one governed outbound message attempt.', provenance: { source: 'runtime-execution-boundary' } } }

test('preserves grounded authority lineage into execution-attempt evidence', () => {
  const record = createAgencyExecutionAttempt(args())
  assert.equal(record.version, 2)
  assert.equal(record.intentId, 'intent-1')
  assert.equal(record.requestId, 'request-1')
  assert.equal(record.consumptionId, 'consumption-1')
  assert.deepEqual(record.initiationGrounding, grounding)
  assert.equal(validateAgencyExecutionAttempt(record).valid, true)
  assert.equal(validateAgencyExecutionAttemptLineage(record, consumption()).valid, true)
})

test('execution provenance cannot replace initiation grounding', () => {
  assert.throws(() => createAgencyExecutionAttempt({ ...args(), provenance: { source: 'runtime', initiationGrounding: { evidenceId: 'other' } } }), /must not replace initiation grounding/)
})

test('grounded v2 attempt fails closed when grounding is malformed', () => {
  const record = createAgencyExecutionAttempt(args())
  const validation = validateAgencyExecutionAttempt({ ...record, initiationGrounding: { evidenceId: 'evidence-1' } })
  assert.equal(validation.valid, false)
  assert.match(validation.errors.join('; '), /evidenceType is required/)
})

test('lineage rejects intent, request, grounding, identity, decision, capability, scope, or consumption mismatch', () => {
  const c = consumption()
  const record = createAgencyExecutionAttempt(args(c))
  for (const [field, value] of [['intentId','intent-other'],['requestId','request-other'],['consumptionId','consumption-other'],['decisionId','decision-other'],['soulId','soul-other'],['capability','delete-account'],['scope','conversation:other']]) {
    assert.equal(validateAgencyExecutionAttemptLineage({ ...record, [field]: value }, c).valid, false, `${field} mismatch must fail closed`)
  }
  assert.equal(validateAgencyExecutionAttemptLineage({ ...record, initiationGrounding: { ...grounding, evidenceId: 'other' } }, c).valid, false)
})

test('legacy stored v1 attempts remain valid and legacy consumption does not invent grounding', () => {
  const legacyAttempt = { version: 1, id: 'attempt-old', attemptedAt: '2026-09-06T01:01:00.000Z', consumptionId: 'consumption-old', decisionId: 'decision-old', soulId: 'soul-1', capability: 'send-message', scope: 'conversation:abc', executor: { id: 'runtime-1', role: 'runtime-adapter' }, channel: 'dsh:tool-boundary', reason: 'Attempt action.', provenance: { source: 'test' } }
  assert.equal(validateAgencyExecutionAttempt(legacyAttempt).valid, true)
  const legacyConsumption = { version: 1, id: 'consumption-old', consumedAt: '2026-09-06T01:00:00.000Z', decisionId: 'decision-old', soulId: 'soul-1', capability: 'send-message', scope: 'conversation:abc', consumer: { id: 'runtime-1', role: 'agency-runtime' }, reason: 'Consume.', provenance: { source: 'legacy' } }
  const created = createAgencyExecutionAttempt(args(legacyConsumption))
  assert.equal(created.groundingMode, 'legacy-ungrounded')
  assert.equal(Object.hasOwn(created, 'initiationGrounding'), false)
})

test('outcome-like fields remain forbidden', () => {
  const record = createAgencyExecutionAttempt(args())
  const validation = validateAgencyExecutionAttempt({ ...record, success: true })
  assert.equal(validation.valid, false)
  assert.match(validation.errors.join('; '), /success is not allowed/)
})
