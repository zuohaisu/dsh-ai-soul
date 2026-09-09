import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStateTransitionProposal,
  createCandidateClaim,
  createCandidatePromotionProposal,
  createExperienceRecord,
  createSignificanceAssessment,
  createSoulState,
  reviewStateTransitionProposal,
  validateStateTransitionProposal,
} from '../src/core/index.js'

function candidateFixture(statement = 'The user prefers compact summaries.') {
  const experience = createExperienceRecord({
    id: `exp:${statement}`,
    at: '2026-09-09T13:10:00.000Z',
    kind: 'human-message',
    source: { runtime: 'dsh', sessionId: 'session-331' },
    provenance: { runtime: 'dsh', sessionId: 'session-331', eventSequence: 1, eventType: 'user/message', participantId: 'human-1' },
    payload: { observation: statement },
  })
  const significanceAssessment = createSignificanceAssessment({
    id: `sig:${experience.id}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'medium',
    rationale: 'Explicit human request requires independent governance.',
    confidence: 0.99,
    provenance: { method: 'test-explicit-human-request' },
    recommendPromotion: true,
  })
  return createCandidateClaim({
    experience,
    significanceAssessment,
    id: `candidate:${experience.id}`,
    createdAt: experience.at,
    statement,
    confidence: 0.96,
    provenance: { method: 'test-candidate' },
  })
}

function promotionOptions(operation, operands = {}) {
  return {
    operation,
    reason: `Exercise governed ${operation} proposal formation.`,
    proposer: 'candidate-promotion:test',
    provenance: { source: 'test', boundary: 'candidate-promotion' },
    ...operands,
  }
}

test('forms an unreviewed retire proposal without smuggling candidate value into mutation', () => {
  const previousValue = { claim: 'The user prefers verbose summaries.' }
  const proposal = createCandidatePromotionProposal(candidateFixture(), promotionOptions('retire', { previousValue }))

  assert.deepEqual(validateStateTransitionProposal(proposal), { valid: true, errors: [] })
  assert.equal(proposal.operation, 'retire')
  assert.deepEqual(proposal.previousValue, previousValue)
  assert.equal(Object.hasOwn(proposal, 'value'), false)
  assert.equal(proposal.review, null)
})

test('forms an unreviewed consolidate proposal with explicit source values', () => {
  const previousValues = [
    { claim: 'The user prefers concise implementation notes.' },
    { claim: 'The user prefers short status reports.' },
  ]
  const candidate = candidateFixture('The user prefers compact engineering communication.')
  const proposal = createCandidatePromotionProposal(candidate, promotionOptions('consolidate', { previousValues }))

  assert.deepEqual(validateStateTransitionProposal(proposal), { valid: true, errors: [] })
  assert.equal(proposal.operation, 'consolidate')
  assert.deepEqual(proposal.previousValues, previousValues)
  assert.deepEqual(proposal.value, { claim: candidate.statement })
  assert.equal(proposal.review, null)
})

test('retire and consolidate formation fail closed when explicit operands are missing', () => {
  const candidate = candidateFixture()
  assert.throws(() => createCandidatePromotionProposal(candidate, promotionOptions('retire')), /previousValue is required/)
  assert.throws(() => createCandidatePromotionProposal(candidate, promotionOptions('consolidate', { previousValues: [{ claim: 'only one' }] })), /at least two values/)
})

test('proposal formation has zero Soul-state mutation and stale consolidation sources still fail at authoritative apply', () => {
  const sourceA = { claim: 'The user prefers concise implementation notes.' }
  const sourceB = { claim: 'The user prefers short status reports.' }
  const state = createSoulState({ soulId: 'soul-331', name: null, userModel: [sourceA, sourceB] })
  const before = structuredClone(state)
  const proposal = createCandidatePromotionProposal(
    candidateFixture('The user prefers compact engineering communication.'),
    promotionOptions('consolidate', { previousValues: [sourceA, sourceB] }),
  )

  assert.deepEqual(state, before)
  assert.throws(() => applyStateTransitionProposal(state, proposal), /must be reviewed/)

  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Explicit sources and result are acceptable.',
    provenance: { reviewId: 'review-331' },
  })
  const staleState = structuredClone(state)
  staleState.userModel.splice(1, 1)
  assert.throws(() => applyStateTransitionProposal(staleState, reviewed), /does not match current state/)
  assert.deepEqual(state, before)
})
