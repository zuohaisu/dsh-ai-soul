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

function groundedDecision(overrides = {}) {
  return approvedDecision({
    version: 2,
    groundingMode: 'grounded',
    initiationGrounding: {
      evidenceId: 'evidence-1',
      evidenceType: 'user-request-evidence',
      source: { runtime: 'dsh', sessionId: 'session-1', eventId: 'event-1' },
      provenance: { experienceId: 'experience-1', source: 'dsh-human-message' },
    },
    ...overrides,
  })
}

test('creates traceable legacy-ungrounded consumption evidence for an approved legacy decision', () => {
  const record = createAgencyAuthorizationConsumption({
    id: 'consumption-1',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decision: approvedDecision(),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve this one-shot authorization before a future execution attempt.',
    provenance: { source: 'authorization-ledger' },
  })

  assert.equal(record.version, 2)
  assert.equal(record.decisionId, 'decision-1')
  assert.equal(record.intentId, 'intent-1')
  assert.equal(record.requestId, 'request-1')
  assert.equal(record.groundingMode, 'legacy-ungrounded')
  assert.equal(Object.hasOwn(record, 'initiationGrounding'), false)
  assert.equal(validateAgencyAuthorizationConsumption(record).valid, true)
})

test('preserves grounded decision lineage through authorization consumption', () => {
  const decision = groundedDecision()
  const record = createAgencyAuthorizationConsumption({
    id: 'consumption-grounded',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decision,
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve grounded authorization.',
    provenance: { source: 'authorization-ledger', ledgerEntry: 'entry-1' },
  })

  assert.equal(record.groundingMode, 'grounded')
  assert.equal(record.intentId, decision.intentId)
  assert.equal(record.requestId, decision.requestId)
  assert.deepEqual(record.initiationGrounding, decision.initiationGrounding)
  assert.notEqual(record.initiationGrounding, decision.initiationGrounding)
  assert.equal(record.initiationGrounding.evidenceId, 'evidence-1')
  assert.equal(validateAgencyAuthorizationConsumption(record).valid, true)
})

test('rejects consumption provenance that attempts to replace initiation grounding', () => {
  assert.throws(() => createAgencyAuthorizationConsumption({
    decision: groundedDecision(),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Invalid grounding override.',
    provenance: { source: 'ledger', initiationGrounding: { evidenceId: 'forged' } },
  }), /must not replace initiation grounding/)
})

test('fails closed when grounded decision lineage is malformed', () => {
  assert.throws(() => createAgencyAuthorizationConsumption({
    decision: groundedDecision({ initiationGrounding: { evidenceId: 'evidence-1' } }),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Malformed grounding.',
    provenance: { source: 'ledger' },
  }), /invalid agency authorization decision/)
})

test('rejects rejected authorization decisions', () => {
  assert.throws(() => createAgencyAuthorizationConsumption({
    decision: approvedDecision({ decision: 'rejected', authority: 'none' }),
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Invalid consume attempt.',
    provenance: { source: 'test' },
  }), /only an approved authorization decision may be consumed/)
})

test('keeps stored version 1 consumption evidence valid', () => {
  const record = {
    version: 1,
    id: 'consumption-legacy',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decisionId: 'decision-legacy',
    soulId: 'soul-1',
    capability: 'send-message',
    scope: 'conversation:abc',
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Historical consumption.',
    provenance: { source: 'legacy-ledger' },
  }
  assert.equal(validateAgencyAuthorizationConsumption(record).valid, true)
})

test('fails closed on malformed or execution-like evidence', () => {
  const record = {
    version: 2,
    id: 'consumption-1',
    consumedAt: '2026-09-06T00:01:00.000Z',
    decisionId: 'decision-1',
    intentId: 'intent-1',
    requestId: 'request-1',
    soulId: 'soul-1',
    capability: 'send-message',
    scope: 'conversation:abc',
    consumer: { id: 'runtime-1', role: 'agency-runtime' },
    reason: 'Reserve authorization.',
    provenance: { source: 'test' },
    groundingMode: 'legacy-ungrounded',
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
