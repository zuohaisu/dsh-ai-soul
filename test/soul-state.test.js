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
