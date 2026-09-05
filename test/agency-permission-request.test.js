import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AGENCY_PERMISSION_REQUEST_MAX_CAPABILITY_LENGTH,
  AGENCY_PERMISSION_REQUEST_MAX_JUSTIFICATION_LENGTH,
  AGENCY_PERMISSION_REQUEST_MAX_SCOPE_LENGTH,
  createAgencyIntent,
  createAgencyPermissionRequest,
  validateAgencyPermissionRequest,
} from '../src/core/index.js'

function validIntent(overrides = {}) {
  return createAgencyIntent({
    id: 'intent-1',
    at: '2026-09-05T17:00:00.000Z',
    soulId: 'soul-test-1',
    kind: 'communicate',
    reason: 'A governed relationship context makes a clarification potentially useful.',
    proposedAction: 'Ask whether the user wants a concise summary.',
    contextRefs: [{ type: 'relationship', id: 'claim-rel-1' }],
    provenance: { producer: 'agency:test', contextVersion: 'ctx-1' },
    ...overrides,
  })
}

function validInput(overrides = {}) {
  return {
    id: 'permission-1',
    at: '2026-09-05T17:05:00.000Z',
    intent: validIntent(),
    capability: 'communicate-with-user',
    scope: 'Send one user-visible clarification in the current DSH surface.',
    justification: 'The intent is grounded in current relationship context but requires separate permission before any user interruption.',
    provenance: { producer: 'agency-permission:test', policyVersion: 'policy-1' },
    ...overrides,
  }
}

test('creates a pending permission request from a valid agency intent without authority', () => {
  const request = createAgencyPermissionRequest(validInput())
  assert.deepEqual(validateAgencyPermissionRequest(request), { valid: true, errors: [] })
  assert.equal(request.soulId, 'soul-test-1')
  assert.equal(request.intentId, 'intent-1')
  assert.equal(request.status, 'pending')
  assert.equal(request.authority, 'none')
})

test('requires a valid prior agency intent', () => {
  const intent = validIntent()
  intent.authority = 'execute'
  assert.throws(() => createAgencyPermissionRequest(validInput({ intent })), /invalid agency intent/)
})

test('fails closed when approval or execution authority is smuggled into a request', () => {
  const request = createAgencyPermissionRequest(validInput())
  request.approved = true
  request.toolCall = { name: 'send_message' }

  const result = validateAgencyPermissionRequest(request)
  assert.equal(result.valid, false)
  assert.match(result.errors.join('; '), /approved is not allowed/)
  assert.match(result.errors.join('; '), /toolCall is not allowed/)

  request.authority = 'execute'
  assert.match(validateAgencyPermissionRequest(request).errors.join('; '), /authority must be none/)
})

test('only pending status is valid', () => {
  const request = createAgencyPermissionRequest(validInput())
  request.status = 'approved'
  assert.match(validateAgencyPermissionRequest(request).errors.join('; '), /status must be pending/)
})

test('bounds capability, scope, and justification', () => {
  assert.throws(
    () => createAgencyPermissionRequest(validInput({ capability: 'x'.repeat(AGENCY_PERMISSION_REQUEST_MAX_CAPABILITY_LENGTH + 1) })),
    /capability must be <=/,
  )
  assert.throws(
    () => createAgencyPermissionRequest(validInput({ scope: 'x'.repeat(AGENCY_PERMISSION_REQUEST_MAX_SCOPE_LENGTH + 1) })),
    /scope must be <=/,
  )
  assert.throws(
    () => createAgencyPermissionRequest(validInput({ justification: 'x'.repeat(AGENCY_PERMISSION_REQUEST_MAX_JUSTIFICATION_LENGTH + 1) })),
    /justification must be <=/,
  )
})

test('creation clones provenance and does not mutate the source intent', () => {
  const intent = validIntent()
  const intentBefore = structuredClone(intent)
  const provenance = { producer: 'agency-permission:test', nested: { reviewId: 'review-1' } }
  const provenanceBefore = structuredClone(provenance)

  const request = createAgencyPermissionRequest(validInput({ intent, provenance }))
  request.provenance.nested.reviewId = 'changed'

  assert.deepEqual(intent, intentBefore)
  assert.deepEqual(provenance, provenanceBefore)
})
