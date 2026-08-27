import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'

import {
  createLifecycleImportReconciliation,
  validateLifecycleImportReconciliation,
} from '../src/core/lifecycle-import-reconciliation.js'
import { createSoulState } from '../src/core/soul-state.js'

function makeBaseline() {
  const state = createSoulState({
    soulId: 'aster',
    name: 'Aster',
    createdAt: '2026-08-01T00:00:00.000Z',
  })
  state.userModel.push({ key: 'answer-style', value: 'concise' })
  return state
}

function makeBinding(baselineBytes) {
  return {
    bindingVersion: 1,
    targetSoulId: 'aster',
    baseline: {
      algorithm: 'sha256',
      digest: createHash('sha256').update(baselineBytes).digest('hex'),
      capturedAt: '2026-08-28T00:00:00.000Z',
      file: 'target-baseline.json',
    },
    canonicalMutation: false,
    profileMutation: false,
  }
}

function makeClaim() {
  return {
    claimVersion: 1,
    id: 'claim-001',
    claimType: 'user-model',
    statement: 'The user prefers concise answers.',
    interpretation: null,
    evidence: [{
      sourceId: 'external-001',
      algorithm: 'sha256',
      digest: 'abc123',
      unitId: 'unit-001',
      lineStart: 1,
      lineEnd: 1,
      headingPath: [],
      support: 'Explicit preference in source memory.',
    }],
    counterEvidence: [],
    confidence: { score: 0.9, rationale: 'Explicit statement.' },
    canonicalStatus: 'candidate',
    runtimePhenotypeRisk: 'low',
    notes: null,
    canonicalMutation: false,
  }
}

function setup() {
  const baseline = makeBaseline()
  const baselineBytes = Buffer.from(`${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
  return { baseline, baselineBytes, targetBinding: makeBinding(baselineBytes), claim: makeClaim() }
}

function reconcile(overrides = {}) {
  const base = setup()
  return createLifecycleImportReconciliation({
    id: 'reconcile-001',
    targetBinding: base.targetBinding,
    baselineBytes: base.baselineBytes,
    claim: base.claim,
    targetPath: ['identity', 'name'],
    proposedValue: 'Aster',
    rationale: 'Compare imported claim target to the frozen import baseline.',
    recordedBy: 'migration-reviewer',
    recordedAt: '2026-08-28T01:00:00.000Z',
    ...overrides,
  })
}

test('reports equal without mutating canonical state', () => {
  const record = reconcile()
  assert.equal(record.comparison, 'equal')
  assert.equal(record.baselineValue, 'Aster')
  assert.equal(record.baselineValuePresent, true)
  assert.equal(record.canonicalMutation, false)
  assert.deepEqual(validateLifecycleImportReconciliation(record), { valid: true, errors: [] })
  assert.equal(Object.isFrozen(record), true)
})

test('reports different without declaring semantic conflict', () => {
  const record = reconcile({ proposedValue: 'Nova' })
  assert.equal(record.comparison, 'different')
  assert.equal(record.baselineValue, 'Aster')
  assert.equal(record.proposedValue, 'Nova')
  assert.equal(record.canonicalMutation, false)
})

test('reports absent for an explicit target path missing from the baseline', () => {
  const record = reconcile({
    targetPath: ['relationship', 'state', 0],
    proposedValue: { status: 'trusted-partner' },
  })
  assert.equal(record.comparison, 'absent')
  assert.equal(record.baselineValuePresent, false)
  assert.equal(record.baselineValue, null)
})

test('rejects a tampered frozen baseline before reconciliation', () => {
  const base = setup()
  const tampered = Buffer.from(base.baselineBytes)
  tampered[10] = tampered[10] === 32 ? 33 : 32
  assert.throws(() => createLifecycleImportReconciliation({
    id: 'reconcile-tampered',
    targetBinding: base.targetBinding,
    baselineBytes: tampered,
    claim: base.claim,
    targetPath: ['identity', 'name'],
    proposedValue: 'Aster',
    rationale: 'This must fail before comparison.',
    recordedBy: 'migration-reviewer',
  }), /digest does not match/)
})

test('does not infer target path from claim type', () => {
  const base = setup()
  assert.throws(() => createLifecycleImportReconciliation({
    id: 'reconcile-no-path',
    targetBinding: base.targetBinding,
    baselineBytes: base.baselineBytes,
    claim: base.claim,
    proposedValue: 'concise',
    rationale: 'Missing explicit target path.',
    recordedBy: 'migration-reviewer',
  }), /targetPath must be a non-empty array/)
})
