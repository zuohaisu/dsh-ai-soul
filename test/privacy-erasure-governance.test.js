import assert from 'node:assert/strict'
import test from 'node:test'

import { createPrivacyErasureRequest, decidePrivacyErasure, executePrivacyErasure } from '../src/core/privacy-erasure-governance.js'

function request(overrides = {}) {
  return createPrivacyErasureRequest({
    id: 'erase-request-1',
    target: { type: 'cognitive-memory', soulId: 'soul-a', memoryId: 'memory-1' },
    requester: 'user:a',
    reason: 'privacy request',
    provenance: { source: 'test' },
    ...overrides,
  })
}

function approved(req = request(), overrides = {}) {
  return decidePrivacyErasure({ request: req, decision: 'approved', decidedBy: 'user:a', reason: 'confirmed', ...overrides })
}

test('request is non-authoritative and rejected decision cannot erase', async () => {
  const req = request()
  const decision = decidePrivacyErasure({ request: req, decision: 'rejected', decidedBy: 'user:a', reason: 'cancelled' })
  let eraseCalls = 0
  const result = await executePrivacyErasure({ request: req, decision, store: { erase: async () => { eraseCalls += 1 } } })

  assert.equal(req.authority, 'none')
  assert.equal(decision.authority, 'none')
  assert.equal(result.executed, false)
  assert.equal(result.reason, 'not-authorized')
  assert.equal(eraseCalls, 0)
})

test('approved exact-target decision is the only path to physical erase', async () => {
  const req = request()
  const decision = approved(req)
  const calls = []
  const result = await executePrivacyErasure({
    request: req,
    decision,
    store: { erase: async (...args) => { calls.push(args); return { erased: true, soulId: args[0], memoryId: args[1] } } },
  })

  assert.deepEqual(calls, [['soul-a', 'memory-1']])
  assert.equal(result.executed, true)
  assert.equal(result.cascade, false)
  assert.equal(result.canonicalSoulMutation, false)
  assert.equal(Object.hasOwn(result, 'content'), false)
})

test('approval cannot broaden to another memory or Soul', async () => {
  const req = request()
  const decision = approved(req)
  const broadenedMemory = { ...decision, target: { ...decision.target, memoryId: 'memory-2' } }
  const broadenedSoul = { ...decision, target: { ...decision.target, soulId: 'soul-b' } }
  const store = { erase: async () => assert.fail('erase must not be called') }

  await assert.rejects(executePrivacyErasure({ request: req, decision: broadenedMemory, store }), /target does not match/)
  await assert.rejects(executePrivacyErasure({ request: req, decision: broadenedSoul, store }), /target does not match/)
})

test('decision cannot authorize another request and missing authorization fails closed', async () => {
  const req = request()
  const other = request({ id: 'erase-request-2' })
  const decision = approved(req)
  const store = { erase: async () => assert.fail('erase must not be called') }

  await assert.rejects(executePrivacyErasure({ request: other, decision, store }), /does not authorize this request/)
  await assert.rejects(executePrivacyErasure({ request: req, store }), /explicit privacy erasure decision is required/)
})

test('malformed scope and unsupported target type fail closed', () => {
  assert.throws(() => request({ target: { type: 'soul-state', soulId: 'soul-a', memoryId: 'memory-1' } }), /unsupported privacy erasure target type/)
  assert.throws(() => request({ target: { type: 'cognitive-memory', soulId: '', memoryId: 'memory-1' } }), /target.soulId is required/)
})
