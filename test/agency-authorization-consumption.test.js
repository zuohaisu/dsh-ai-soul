import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createAgencyAuthorizationConsumption,
  deriveConsumedAuthorizationDecisionIds,
  validateAgencyAuthorizationConsumption,
} from '../src/core/agency-authorization-consumption.js'

function approvedDecision(overrides = {}) {
  return {
    version: 1,
    id: 'decision-1',
    at: '2026-09-06T00:00:00.000Z',
    soulId: 'soul-1',
    intentId: 'intent-1',
    requestId: 'request-1',
    decision: 'approved',
    decisionMaker: { id: 'human-1', role: 'owner' },
    reason: 'Explicit human approval.',
    capability: 'send-message',
    scope: 'conversation:abc',
    provenance: { source: 'human-review' },
    authority: 'authorized',
    ...overrides,
  }
}

test('creates traceable consumption evidence for an approved decision', () => {
  const record = createAgencyAuthorizationConsumption({
    id: 'consumption-1',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decision: approvedDecision(),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve this one-shot authorization before a future execution attempt.',
    provenance: { source: 'authorization-ledger' },
  })

  assert.equal(record.decisionId, 'decision-1')
  assert.equal(record.soulId, 'soul-1')
  assert.equal(record.capability, 'send-message')
  assert.equal(record.scope, 'conversation:abc')
  assert.equal(validateAgencyAuthorizationConsumption(record).valid, true)
})

test('rejects rejected authorization decisions', () => {
  assert.throws(() => createAgencyAuthorizationConsumption({
    decision: approvedDecision({ decision: 'rejected', authority: 'none' }),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Invalid consume attempt.',
    provenance: { source: 'test' },
  }), /only an approved authorization decision may be consumed/)
})

test('fails closed on malformed or execution-like evidence', () => {
  const record = {
    version: 1,
    id: 'consumption-1',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decisionId: 'decision-1',
    soulId: 'soul-1',
    capability: 'send-message',
    scope: 'conversation:abc',
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve authorization.',
    provenance: { source: 'test' },
    executed: true,
  }
  const validation = validateAgencyAuthorizationConsumption(record)
  assert.equal(validation.valid, false)
  assert.match(validation.errors.join('; '), /executed is not allowed/)
})

test('derives deterministic unique consumed decision ids and rejects malformed records', () => {
  const first = createAgencyAuthorizationConsumption({
    id: 'consumption-2',
    consumedAt: '2026-09-06T00:02:00.000Z',
    decision: approvedDecision({ id: 'decision-b' }),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve B.',
    provenance: { source: 'ledger' },
  })
  const second = createAgencyAuthorizationConsumption({
    id: 'consumption-1',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decision: approvedDecision({ id: 'decision-a' }),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve A.',
    provenance: { source: 'ledger' },
  })

  assert.deepEqual(deriveConsumedAuthorizationDecisionIds([first, second, first]), ['decision-a', 'decision-b'])
  assert.throws(() => deriveConsumedAuthorizationDecisionIds([{ decisionId: 'bad' }]), /invalid agency authorization consumption/)
})
