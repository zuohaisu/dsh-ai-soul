import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AGENCY_INTENT_MAX_ACTION_LENGTH,
  createAgencyIntent,
  validateAgencyIntent,
} from '../src/core/index.js'

function validInput(overrides = {}) {
  return {
    id: 'intent-1',
    at: '2026-09-05T17:00:00.000Z',
    soulId: 'soul-test-1',
    kind: 'communicate',
    reason: 'A governed user preference and current world commitment make a clarification useful.',
    proposedAction: 'Ask whether the user wants the pending architecture decision summarized.',
    contextRefs: [
      { type: 'userModel', id: 'claim-user-1' },
      { type: 'world', id: 'claim-world-1' },
    ],
    provenance: { producer: 'agency:test', contextVersion: 'ctx-1' },
    ...overrides,
  }
}

test('creates a reason-grounded agency intent with no execution authority', () => {
  const intent = createAgencyIntent(validInput())
  assert.deepEqual(validateAgencyIntent(intent), { valid: true, errors: [] })
  assert.equal(intent.authority, 'none')
})

test('requires traceable context and provenance', () => {
  assert.throws(() => createAgencyIntent(validInput({ contextRefs: [] })), /contextRefs must be a non-empty array/)
  assert.throws(() => createAgencyIntent(validInput({ provenance: undefined })), /provenance is required/)
})

test('fails closed when execution authority is smuggled into an intent', () => {
  const intent = createAgencyIntent(validInput())
  intent.executed = true
  const result = validateAgencyIntent(intent)
  assert.equal(result.valid, false)
  assert.match(result.errors.join('; '), /executed is not allowed/)

  intent.authority = 'execute'
  assert.match(validateAgencyIntent(intent).errors.join('; '), /authority must be none/)
})

test('bounds proposed action text', () => {
  assert.throws(
    () => createAgencyIntent(validInput({ proposedAction: 'x'.repeat(AGENCY_INTENT_MAX_ACTION_LENGTH + 1) })),
    /proposedAction must be <=/,
  )
})

test('creation clones source references and provenance', () => {
  const contextRefs = [{ type: 'selfModel', id: 'claim-self-1' }]
  const provenance = { producer: 'agency:test', nested: { runId: 'run-1' } }
  const beforeRefs = structuredClone(contextRefs)
  const beforeProvenance = structuredClone(provenance)

  const intent = createAgencyIntent(validInput({ contextRefs, provenance }))
  intent.contextRefs[0].id = 'changed'
  intent.provenance.nested.runId = 'changed'

  assert.deepEqual(contextRefs, beforeRefs)
  assert.deepEqual(provenance, beforeProvenance)
})
