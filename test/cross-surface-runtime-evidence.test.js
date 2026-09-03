import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateCrossSurfaceRuntimeEvidence } from '../src/cross-surface-runtime-evidence.js'

function completeRecord() {
  return {
    recordedAt: '2026-09-03T12:00:00Z',
    evidenceKind: 'real-dsh-runtime',
    source: {
      surface: 'tui',
      profile: 'ai-soul-tui',
      runtime: 'node-22',
      dshVersion: '0.1.0',
      soulId: 'soul-001',
      storeAnchor: '/var/lib/ai-soul',
    },
    target: {
      surface: 'web',
      profile: 'ai-soul-web',
      runtime: 'node-22',
      dshVersion: '0.1.0',
      soulId: 'soul-001',
      storeAnchor: '/var/lib/ai-soul',
    },
    observations: {
      realSourceRuntime: true,
      sourceGovernedMutationPersisted: true,
      realTargetRuntime: true,
      targetLoadedAfterSourceCommit: true,
      targetContextContainedClaim: true,
      targetModelDemonstratedRecall: true,
    },
    linkage: {
      stateCommitId: 'commit-1',
      claimId: 'claim-1',
      claim: 'The user prefers concise implementation explanations.',
      sourceCommitAt: '2026-09-03T12:01:00Z',
      targetLoadId: 'load-1',
      targetLoadAt: '2026-09-03T12:02:00Z',
      targetContextAssemblyId: 'context-1',
    },
    evidence: {
      sourceRuntime: 'artifact://source-runtime.json',
      sourceCommittedState: 'artifact://source-state.json',
      targetRuntime: 'artifact://target-runtime.json',
      targetLoadedState: 'artifact://target-state.json',
      targetContext: 'artifact://target-context.txt',
      targetResponse: 'artifact://target-response.txt',
    },
  }
}

test('verifies a complete real TUI to Web continuity record', () => {
  const result = evaluateCrossSurfaceRuntimeEvidence(completeRecord())
  assert.equal(result.complete, true)
  assert.equal(result.verified, true)
  assert.deepEqual(result.missing, [])
  assert.deepEqual(result.failures, [])
})

test('is incomplete when required linkage or evidence is absent', () => {
  const record = completeRecord()
  delete record.linkage.targetContextAssemblyId
  delete record.evidence.targetResponse
  const result = evaluateCrossSurfaceRuntimeEvidence(record)
  assert.equal(result.complete, false)
  assert.equal(result.verified, false)
  assert.ok(result.missing.includes('linkage.targetContextAssemblyId'))
  assert.ok(result.missing.includes('evidence.targetResponse'))
})

test('fails closed when source and target do not share soul or store', () => {
  const record = completeRecord()
  record.target.soulId = 'soul-002'
  record.target.storeAnchor = '/tmp/other-store'
  const result = evaluateCrossSurfaceRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.ok(result.failures.includes('continuity.sameSoulId'))
  assert.ok(result.failures.includes('continuity.sameStoreAnchor'))
})

test('fails closed when source and target are the same surface', () => {
  const record = completeRecord()
  record.target.surface = 'tui'
  const result = evaluateCrossSurfaceRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.ok(result.failures.includes('surfaceBoundary.sourceAndTargetMustDiffer'))
})

test('rejects simulated evidence and explicit target recall failure', () => {
  const record = completeRecord()
  record.evidenceKind = 'simulation'
  record.observations.targetModelDemonstratedRecall = false
  const result = evaluateCrossSurfaceRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.ok(result.failures.includes('evidenceKind=real-dsh-runtime'))
  assert.ok(result.failures.includes('observations.targetModelDemonstratedRecall'))
})

test('fails when target load precedes the governed source commit', () => {
  const record = completeRecord()
  record.linkage.targetLoadAt = '2026-09-03T12:00:00Z'
  const result = evaluateCrossSurfaceRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.ok(result.failures.includes('linkage.targetLoadedAfterSourceCommit'))
})
