import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAgencyAuthorizationDecision,
  createAgencyIntent,
  createAgencyPermissionRequest,
  validateAgencyAuthorizationDecision,
} from '../src/core/index.js'

function validRequest() {
  const intent = createAgencyIntent({ id: 'intent-1', at: '2026-09-06T00:00:00.000Z', soulId: 'soul-1', kind: 'communicate', reason: 'A clarification may help.', proposedAction: 'Ask one clarification.', contextRefs: [{ type: 'relationship', id: 'rel-1' }], provenance: { producer: 'test' } })
  return createAgencyPermissionRequest({ id: 'request-1', at: '2026-09-06T00:01:00.000Z', intent, capability: 'communicate-with-user', scope: 'One clarification in the current surface.', justification: 'Separate authorization is required.', provenance: { producer: 'test' } })
}

function validInput(overrides = {}) {
  return { id: 'decision-1', at: '2026-09-06T00:02:00.000Z', request: validRequest(), decision: 'approved', decisionMaker: { id: 'human-1', role: 'user' }, reason: 'Explicitly permitted for this bounded scope.', provenance: { producer: 'authorization:test' }, ...overrides }
}

test('creates explicit approved and rejected decisions bound to the request', () => {
  const approved = createAgencyAuthorizationDecision(validInput())
  assert.deepEqual(validateAgencyAuthorizationDecision(approved), { valid: true, errors: [] })
  assert.equal(approved.soulId, 'soul-1')
  assert.equal(approved.intentId, 'intent-1')
  assert.equal(approved.requestId, 'request-1')
  assert.equal(approved.authority, 'authorized')
  const rejected = createAgencyAuthorizationDecision(validInput({ decision: 'rejected' }))
  assert.equal(rejected.authority, 'none')
})

test('requires a valid pending permission request', () => {
  const request = validRequest()
  request.status = 'approved'
  assert.throws(() => createAgencyAuthorizationDecision(validInput({ request })), /invalid agency permission request/)
})

test('approval cannot broaden capability or scope', () => {
  assert.throws(() => createAgencyAuthorizationDecision(validInput({ capability: 'send-any-message' })), /capability must exactly match/)
  assert.throws(() => createAgencyAuthorizationDecision(validInput({ scope: 'Any future surface.' })), /scope must exactly match/)
})

test('decision cannot smuggle execution evidence or actuator authority', () => {
  const decision = createAgencyAuthorizationDecision(validInput())
  decision.toolCall = { name: 'send_message' }
  decision.executed = true
  const result = validateAgencyAuthorizationDecision(decision)
  assert.equal(result.valid, false)
  assert.match(result.errors.join('; '), /toolCall is not allowed/)
  assert.match(result.errors.join('; '), /executed is not allowed/)
})

test('rejection grants no authority', () => {
  const decision = createAgencyAuthorizationDecision(validInput({ decision: 'rejected' }))
  decision.authority = 'authorized'
  assert.match(validateAgencyAuthorizationDecision(decision).errors.join('; '), /rejected decision authority must be none/)
})

test('creation clones decision maker and provenance without mutating request', () => {
  const request = validRequest()
  const before = structuredClone(request)
  const decisionMaker = { id: 'human-1', role: 'user' }
  const provenance = { producer: 'authorization:test', nested: { review: 'r1' } }
  const decision = createAgencyAuthorizationDecision(validInput({ request, decisionMaker, provenance }))
  decision.decisionMaker.role = 'changed'
  decision.provenance.nested.review = 'changed'
  assert.deepEqual(request, before)
  assert.equal(decisionMaker.role, 'user')
  assert.equal(provenance.nested.review, 'r1')
})
