import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  createSoulState,
  evaluateSoulHomeostasis,
} from '../src/core/index.js'

function baselineState() {
  const state = createSoulState({
    soulId: 'soul-homeostasis',
    name: 'Aster',
    createdAt: '2026-09-05T00:00:00.000Z',
    origin: { kind: 'genesis', recordId: 'genesis-1' },
  })
  state.identity.invariants.push({ id: 'inv-1', statement: 'Preserve provenance.' })
  state.relationship.covenants.push({ id: 'cov-1', text: 'Do not fabricate certainty.' })
  return state
}

test('allows governed mutable growth and a human-facing name change', () => {
  const baseline = baselineState()
  const current = structuredClone(baseline)
  current.identity.name = 'Nova'
  current.selfModel.push({ id: 'self-1', statement: 'Values explicit uncertainty.' })
  current.userModel.push({ id: 'user-1', statement: 'Prefers concise tradeoffs.' })
  current.relationship.state.push({ id: 'rel-1', statement: 'Long-term collaborators.' })
  current.beliefs.push({ id: 'belief-1', statement: 'Evidence should remain auditable.' })
  current.worldModel.push({ id: 'world-1', statement: 'Project Alpha is active.' })

  const result = evaluateSoulHomeostasis({ baseline, current })

  assert.equal(result.passed, true)
  assert.equal(result.soulId, baseline.soulId)
  assert.deepEqual(result.violations, [])
})

test('reports hard machine-continuity violations deterministically', () => {
  const baseline = baselineState()
  const current = structuredClone(baseline)
  current.soulId = 'different-soul'
  current.identity.createdAt = '2026-09-06T00:00:00.000Z'
  current.identity.origin = { kind: 'replacement' }
  current.identity.invariants = []
  current.relationship.covenants = []

  const result = evaluateSoulHomeostasis({ baseline, current })

  assert.equal(result.passed, false)
  assert.deepEqual(result.violations.map((entry) => entry.code), [
    'soul-id-changed',
    'identity-created-at-changed',
    'identity-origin-changed',
    'identity-invariants-changed',
    'relationship-covenants-changed',
  ])
})

test('fails when bounded current cognition exceeds repository capacity', () => {
  const baseline = baselineState()
  const current = structuredClone(baseline)
  current.userModel = Array.from(
    { length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN + 1 },
    (_, index) => ({ id: `user-${index}`, statement: `claim ${index}` }),
  )

  const result = evaluateSoulHomeostasis({ baseline, current })

  assert.equal(result.passed, false)
  assert.deepEqual(result.violations, [{
    code: 'current-cognition-over-capacity',
    target: 'userModel',
    count: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN + 1,
    capacity: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
  }])
})

test('fails closed on invalid state and never mutates inputs', () => {
  assert.throws(
    () => evaluateSoulHomeostasis({ baseline: {}, current: {} }),
    /invalid baseline Soul state/,
  )

  const baseline = baselineState()
  const current = structuredClone(baseline)
  current.userModel.push({ id: 'user-1', statement: 'A mutable claim.' })
  const beforeBaseline = structuredClone(baseline)
  const beforeCurrent = structuredClone(current)

  evaluateSoulHomeostasis({ baseline, current })

  assert.deepEqual(baseline, beforeBaseline)
  assert.deepEqual(current, beforeCurrent)
})
