import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAgencyAuthorizationDecision,
  createAgencyIntent,
  createAgencyPermissionRequest,
  evaluateAgencyAuthorizationUse,
} from '../src/core/index.js'

function approvedDecision(overrides = {}) {
  const intent = createAgencyIntent({ id: 'intent-1', at: '2026-09-06T00:00:00.000Z', soulId: 'soul-1', kind: 'communicate', reason: 'A clarification may help.', proposedAction: 'Ask one clarification.', contextRefs: [{ type: 'world', id: 'project-1' }], provenance: { producer: 'test' } })
  const request = createAgencyPermissionRequest({ id: 'request-1', at: '2026-09-06T00:01:00.000Z', intent, capability: 'communicate-with-user', scope: 'One clarification in the current surface.', justification: 'Permission required.', provenance: { producer: 'test' } })
  return createAgencyAuthorizationDecision({ id: 'decision-1', at: '2026-09-06T00:02:00.000Z', request, decision: 'approved', decisionMaker: { id: 'human-1', role: 'user' }, reason: 'Approved once.', provenance: { producer: 'test' }, ...overrides })
}

function evaluate(decision, overrides = {}) {
  return evaluateAgencyAuthorizationUse({
    decision,
    soulId: 'soul-1',
    capability: 'communicate-with-user',
    scope: 'One clarification in the current surface.',
    evaluatedAt: '2026-09-06T00:03:00.000Z',
    maxAgeMs: 120000,
    ...overrides,
  })
}

test('fresh exact approved authorization is eligible', () => {
  const result = evaluate(approvedDecision())
  assert.equal(result.eligible, true)
  assert.deepEqual(result.reasons, [])
})

test('rejected and malformed decisions fail closed', () => {
  const rejected = approvedDecision({ decision: 'rejected' })
  assert.match(evaluate(rejected).reasons.join(';'), /authorization-not-approved/)
  assert.deepEqual(evaluate({ nope: true }).reasons, ['invalid-authorization-decision'])
})

test('wrong soul capability or scope is ineligible', () => {
  const decision = approvedDecision()
  assert.match(evaluate(decision, { soulId: 'soul-2' }).reasons.join(';'), /soul-mismatch/)
  assert.match(evaluate(decision, { capability: 'send-anything' }).reasons.join(';'), /capability-mismatch/)
  assert.match(evaluate(decision, { scope: 'Any future surface.' }).reasons.join(';'), /scope-mismatch/)
})

test('expired consumed and revoked authorizations are ineligible', () => {
  const decision = approvedDecision()
  assert.match(evaluate(decision, { evaluatedAt: '2026-09-06T00:10:00.000Z' }).reasons.join(';'), /authorization-expired/)
  assert.match(evaluate(decision, { consumedDecisionIds: ['decision-1'] }).reasons.join(';'), /authorization-consumed/)
  assert.match(evaluate(decision, { revokedDecisionIds: new Set(['decision-1']) }).reasons.join(';'), /authorization-revoked/)
})

test('time policy is explicit and fail closed', () => {
  const decision = approvedDecision()
  assert.match(evaluate(decision, { evaluatedAt: 'bad' }).reasons.join(';'), /invalid-evaluation-time/)
  assert.match(evaluate(decision, { maxAgeMs: -1 }).reasons.join(';'), /invalid-max-age/)
  assert.match(evaluate(decision, { evaluatedAt: '2026-09-06T00:01:59.000Z' }).reasons.join(';'), /evaluation-precedes-decision/)
})

test('evaluation is side-effect free', () => {
  const decision = approvedDecision()
  const before = structuredClone(decision)
  const consumed = ['other-decision']
  const revoked = new Set(['another-decision'])
  evaluate(decision, { consumedDecisionIds: consumed, revokedDecisionIds: revoked })
  assert.deepEqual(decision, before)
  assert.deepEqual(consumed, ['other-decision'])
  assert.deepEqual([...revoked], ['another-decision'])
})
