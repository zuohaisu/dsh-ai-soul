import assert from 'node:assert/strict'
import test from 'node:test'

import { assertSoulHomeostasis } from '../src/core/homeostasis.js'
import { createSoulState } from '../src/core/soul-state.js'

function baselineSoul() {
  return createSoulState({
    soulId: 'soul-homeostasis-test',
    createdAt: '2026-09-07T00:00:00.000Z',
    origin: { kind: 'genesis', source: 'test' },
  })
}

test('assertSoulHomeostasis returns machine-verifiable success for unchanged protected identity', () => {
  const baseline = baselineSoul()
  const current = structuredClone(baseline)
  const result = assertSoulHomeostasis({ baseline, current })
  assert.equal(result.passed, true)
  assert.equal(result.soulId, baseline.soulId)
})

test('assertSoulHomeostasis fails closed with structured evidence when soulId drifts', () => {
  const baseline = baselineSoul()
  const current = structuredClone(baseline)
  current.soulId = 'different-soul'

  assert.throws(
    () => assertSoulHomeostasis({ baseline, current }),
    (error) => {
      assert.equal(error.code, 'SOUL_HOMEOSTASIS_VIOLATION')
      assert.equal(error.homeostasis.passed, false)
      assert.deepEqual(error.homeostasis.violations.map(({ code }) => code), ['soul-id-changed'])
      return true
    },
  )
})

test('assertSoulHomeostasis rejects protected identity and covenant drift', () => {
  const baseline = baselineSoul()
  const current = structuredClone(baseline)
  current.identity.invariants.push('silently-added-invariant')
  current.relationship.covenants.push('silently-added-covenant')

  assert.throws(
    () => assertSoulHomeostasis({ baseline, current }),
    (error) => {
      const codes = error.homeostasis.violations.map(({ code }) => code)
      assert.ok(codes.includes('identity-invariants-changed'))
      assert.ok(codes.includes('relationship-covenants-changed'))
      return true
    },
  )
})
