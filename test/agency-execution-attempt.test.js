import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createAgencyExecutionAttempt,
  validateAgencyExecutionAttempt,
  validateAgencyExecutionAttemptLineage,
} from '../src/core/agency-execution-attempt.js'

function consumption(overrides = {}) {
  return {
    version: 1,
    id: 'consumption-1',
    consumedAt: '2026-09-06T01:00:00.000Z',
    decisionId: 'decision-1',
    soulId: 'soul-1',
    capability: 'send-message',
    scope: 'conversation:abc',
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve authorization before an execution attempt.',
    provenance: { source: 'authorization-ledger' },
    ...overrides,
  }
}

test('creates traceable execution-attempt evidence from authorization consumption', () => {
  const record = createAgencyExecutionAttempt({
    id: 'attempt-1',
    attemptedAt: '2026-09-06T01:01:00.000Z',
    consumption: consumption(),
    executor: { id: 'dsh-runtime-1', role: 'runtime-adapter' },
    channel: 'dsh:tool-boundary',
    reason: 'Begin one governed outbound message attempt.',
    provenance: { source: 'runtime-execution-boundary' },
  })

  assert.equal(record.consumptionId, 'consumption-1')
  assert.equal(record.decisionId, 'decision-1')
  assert.equal(record.soulId, 'soul-1')
  assert.equal(record.capability, 'send-message')
  assert.equal(record.scope, 'conversation:abc')
  assert.equal(validateAgencyExecutionAttempt(record).valid, true)
  assert.equal(validateAgencyExecutionAttemptLineage(record, consumption()).valid, true)
})

test('fails closed on malformed or outcome-like attempt evidence', () => {
  const record = {
    version: 1,
    id: 'attempt-1',
    attemptedAt: '2026-09-06T01:01:00.000Z',
    consumptionId: 'consumption-1',
    decisionId: 'decision-1',
    soulId: 'soul-1',
    capability: 'send-message',
    scope: 'conversation:abc',
    executor: { id: 'runtime-1', role: 'runtime-adapter' },
    channel: 'dsh:tool-boundary',
    reason: 'Attempt action.',
    provenance: { source: 'test' },
    success: true,
  }

  const validation = validateAgencyExecutionAttempt(record)
  assert.equal(validation.valid, false)
  assert.match(validation.errors.join('; '), /success is not allowed/)
})

test('rejects malformed consumption before creating attempt evidence', () => {
  assert.throws(() => createAgencyExecutionAttempt({
    consumption: { id: 'bad' },
    executor: { id: 'runtime-1', role: 'runtime-adapter' },
    channel: 'dsh:tool-boundary',
    reason: 'Invalid attempt.',
    provenance: { source: 'test' },
  }), /invalid agency authorization consumption/)
})

test('lineage validation rejects identity, decision, capability, scope, or consumption widening', () => {
  const record = createAgencyExecutionAttempt({
    id: 'attempt-1',
    attemptedAt: '2026-09-06T01:01:00.000Z',
    consumption: consumption(),
    executor: { id: 'runtime-1', role: 'runtime-adapter' },
    channel: 'dsh:tool-boundary',
    reason: 'Attempt action.',
    provenance: { source: 'test' },
  })

  for (const [field, value] of [
    ['consumptionId', 'consumption-other'],
    ['decisionId', 'decision-other'],
    ['soulId', 'soul-other'],
    ['capability', 'delete-account'],
    ['scope', 'conversation:other'],
  ]) {
    const tampered = { ...record, [field]: value }
    const validation = validateAgencyExecutionAttemptLineage(tampered, consumption())
    assert.equal(validation.valid, false, `${field} mismatch must fail closed`)
  }
})
