import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateSelectiveGrowthRuntimeEvidence } from '../src/selective-growth-runtime-evidence.js'

function completeRecord() {
  return {
    recordedAt: '2026-09-03T09:00:00Z',
    dshVersion: '0.1.0',
    runtime: 'node-22',
    profile: 'ai-soul-m4-evidence',
    soulId: 'soul-evidence-001',
    surface: 'tui',
    observations: {
      realHumanInteraction: true,
      pendingProposalVisible: true,
      independentHumanReview: true,
      persistedUserModelMutation: true,
      sameSoulIdAfterCommit: true,
      dynamicContextRefreshed: true,
      nextTurnContextContainedClaim: true,
      nextTurnModelDemonstratedRecall: true,
    },
    linkage: {
      experienceId: 'exp-1',
      candidateId: 'candidate-1',
      proposalId: 'proposal-1',
      proposerId: 'ai-soul:reflection',
      reviewId: 'review-1',
      reviewerId: 'human:haisu',
      stateCommitId: 'commit-1',
      contextAssemblyId: 'context-2',
      provenanceSource: 'dsh-session-event',
    },
    mutation: {
      target: 'userModel',
      claim: 'The user prefers concise implementation explanations.',
      persistedClaimCountDelta: 1,
      rawInteractionStoredInCanonicalState: false,
    },
    evidence: {
      interaction: 'artifact://interaction.json',
      proposalSnapshot: 'artifact://proposal.json',
      review: 'artifact://review.json',
      persistedState: 'artifact://state.json',
      nextTurnContext: 'artifact://context.txt',
      nextTurnResponse: 'artifact://response.txt',
    },
    deviations: [],
  }
}

test('verifies a complete linked real-runtime evidence record', () => {
  const result = evaluateSelectiveGrowthRuntimeEvidence(completeRecord())
  assert.equal(result.complete, true)
  assert.equal(result.verified, true)
  assert.deepEqual(result.missing, [])
  assert.deepEqual(result.failures, [])
})

test('is incomplete when linkage or evidence is missing', () => {
  const record = completeRecord()
  delete record.linkage.reviewId
  delete record.evidence.nextTurnResponse
  const result = evaluateSelectiveGrowthRuntimeEvidence(record)
  assert.equal(result.complete, false)
  assert.equal(result.verified, false)
  assert.ok(result.missing.includes('linkage.reviewId'))
  assert.ok(result.missing.includes('evidence.nextTurnResponse'))
})

test('preserves explicit runtime failures separately from completeness', () => {
  const record = completeRecord()
  record.observations.nextTurnModelDemonstratedRecall = false
  const result = evaluateSelectiveGrowthRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.ok(result.failures.includes('observations.nextTurnModelDemonstratedRecall'))
})

test('fails verification if reviewer equals proposer or canonical state stores raw interaction', () => {
  const record = completeRecord()
  record.linkage.reviewerId = record.linkage.proposerId
  record.mutation.rawInteractionStoredInCanonicalState = true
  const result = evaluateSelectiveGrowthRuntimeEvidence(record)
  assert.equal(result.complete, true)
  assert.equal(result.verified, false)
  assert.ok(result.failures.includes('linkage.independentReviewer'))
  assert.ok(result.failures.includes('mutation.rawInteractionStoredInCanonicalState=false'))
})
