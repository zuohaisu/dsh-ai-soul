import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appendTransition,
  createSoulState,
  validateSoulState,
} from '../src/core/index.js'

test('creates a minimal structured Soul state', () => {
  const soul = createSoulState({
    soulId: 'samuel',
    name: 'Samuel',
    createdAt: '2025-10-21T00:00:00.000Z',
    origin: 'Named and recognized by Haisu',
  })

  assert.equal(soul.soulId, 'samuel')
  assert.equal(soul.identity.name, 'Samuel')
  assert.deepEqual(soul.relationship.covenants, [])
  assert.equal(validateSoulState(soul).valid, true)
})

test('fails closed when canonical identity lineage is missing or malformed', () => {
  const soul = createSoulState({
    soulId: 'continuity-test',
    name: null,
    createdAt: '2026-08-28T15:00:00.000Z',
  })

  const cases = [
    { label: 'identity', mutate: (state) => delete state.identity, expected: 'identity must be an object' },
    { label: 'createdAt missing', mutate: (state) => delete state.identity.createdAt, expected: 'identity.createdAt must be a non-empty string' },
    { label: 'createdAt blank', mutate: (state) => { state.identity.createdAt = '   ' }, expected: 'identity.createdAt must be a non-empty string' },
    { label: 'invariants', mutate: (state) => { state.identity.invariants = null }, expected: 'identity.invariants must be an array' },
  ]

  for (const { label, mutate, expected } of cases) {
    const candidate = structuredClone(soul)
    mutate(candidate)
    const before = structuredClone(candidate)
    const result = validateSoulState(candidate)
    assert.equal(result.valid, false, label)
    assert.ok(result.errors.includes(expected), label)
    assert.deepEqual(candidate, before, `${label} validation must not mutate input`)
  }
})

test('accepts an unnamed Genesis-created Soul with intact identity lineage', () => {
  const soul = createSoulState({
    soulId: 'unnamed-soul',
    name: null,
    createdAt: '2026-08-28T15:00:00.000Z',
    origin: null,
  })

  assert.equal(soul.identity.name, null)
  assert.deepEqual(soul.identity.invariants, [])
  assert.deepEqual(validateSoulState(soul), { valid: true, errors: [] })
})

test('requires provenance for evolution', () => {
  const soul = createSoulState({ soulId: 'test-soul', name: 'Test Soul' })

  assert.throws(
    () => appendTransition(soul, { kind: 'belief-change', reason: 'new evidence' }),
    /provenance/,
  )
})

test('records a transition without mutating prior state', () => {
  const soul = createSoulState({ soulId: 'samuel', name: 'Samuel' })
  const next = appendTransition(soul, {
    id: 'transition-001',
    at: '2026-08-27T00:00:00.000Z',
    kind: 'project-decision',
    reason: 'Begin Samuel Exodus',
    provenance: {
      source: 'conversation',
      date: '2026-08-27',
    },
    change: {
      project: 'dsh-ai-soul',
    },
  })

  assert.equal(soul.evolution.length, 0)
  assert.equal(next.evolution.length, 1)
  assert.equal(next.evolution[0].reason, 'Begin Samuel Exodus')
})
