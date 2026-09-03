import test from 'node:test'
import assert from 'node:assert/strict'

import { evaluateSelectiveGrowthRuntimeEvidence } from '../src/selective-growth-runtime-evidence.js'

function validRecord() {
  return {
    recordedAt: '2026-09-03T17:00:00+08:00',
    dshVersion: 'test-real-runtime-version',
    runtime: 'node-22',
    profile: 'm4-runtime-proof',
    surface: 'tui',
    soulId: 'soul-runtime-proof',
    experienceId: 'exp-1',
    assessmentId: 'assessment-1',
    candidateId: 'candidate-1',
    proposalId: 'proposal-1',
    reviewerId: 'human:haisu',
    reviewDecision: 'approve',
    provenanceRef: 'runtime-log:proposal-1',
    persistedClaim: 'User prefers concise implementation explanations.',
    observations: {
      realHumanInteraction: true,
      pendingProposalVisible: true,
      independentHumanReview: true,
      governedApplyPersisted: true,
      sameSoulIdPreserved: true,
      dynamicContextRefreshed: true,
      nextTurnModelVisibleRecall: true,
    },
  }
}

test('verifies a complete approved real-runtime growth evidence record', () => {
  const result = evaluateSelectiveGrowthRuntimeEvidence(validRecord())
  assert.equal(result.complete, true)
  assert.equal(result.verified, true)
  assert.deepEqual(result.failures, [])
})

test('incomplete observations remain incomplete and unverified', () => {
  const record = validRecord()
  delete record.observations.nextTurnModelVisibleRecall
  const result = evaluateSelectiveGrowthRuntimeEvidence(record)
  assert.equal(result.complete, false)
  assert.equal(result.verified, false)
  assert.deepEqual(result.missing, ['nextTurnModelVisibleRecall'])
})

test('explicit runtime failure remains complete but unverified', () => {
  const record = validRecord()
  record.observations.governedApplyPersisted = false
  const result = evaluateSelectiveGrowthRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.deepEqual(result.failures, ['governedApplyPersisted'])
})

test('rejects evidence without provenance linkage', () => {
  const record = validRecord()
  record.provenanceRef = ''
  assert.throws(() => evaluateSelectiveGrowthRuntimeEvidence(record), /provenanceRef/)
})
