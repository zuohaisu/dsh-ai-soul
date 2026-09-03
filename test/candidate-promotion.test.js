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

function candidateFixture() {
  const experience = createExperienceRecord({
    id: 'exp:dsh:session-1:42',
    at: '2026-09-03T01:00:00.000Z',
    kind: 'human-message',
    source: { runtime: 'dsh', sessionId: 'session-1' },
    provenance: {
      runtime: 'dsh',
      sessionId: 'session-1',
      eventSequence: 42,
      eventType: 'user/message',
      participantId: 'human-1',
    },
    payload: { observation: 'I prefer concise implementation notes.' },
  })

  const assessment = createSignificanceAssessment({
    id: 'sig:exp:dsh:session-1:42',
    experienceId: experience.id,
    assessedAt: '2026-09-03T01:00:01.000Z',
    level: 'medium',
    rationale: 'A durable collaboration preference may improve future interactions.',
    confidence: 0.82,
    provenance: { method: 'test-positive-assessor-v1' },
    recommendPromotion: true,
  })

  return createCandidateClaim({
    experience,
    significanceAssessment: assessment,
    id: 'claim:preference:concise-notes',
    createdAt: '2026-09-03T01:00:02.000Z',
    statement: 'The user prefers concise implementation notes.',
    confidence: 0.78,
    provenance: { method: 'candidate-extractor-test-v1' },
  })
}

test('bridges a valid candidate into an unreviewed traceable state-transition proposal', () => {
  const candidate = candidateFixture()
  const candidateBefore = structuredClone(candidate)

  const proposal = createCandidatePromotionProposal(candidate, {
    id: 'proposal:candidate:concise-notes',
    at: '2026-09-03T01:00:03.000Z',
    reason: 'Promote a reviewed durable collaboration preference into the current user model.',
    proposer: 'candidate-promotion:test',
    provenance: { method: 'candidate-promotion-bridge-v1' },
  })

  assert.deepEqual(validateStateTransitionProposal(proposal), { valid: true, errors: [] })
  assert.equal(proposal.target, 'userModel')
  assert.equal(proposal.operation, 'append')
  assert.deepEqual(proposal.value, { claim: candidate.statement })
  assert.equal(proposal.confidence, candidate.confidence)
  assert.equal(proposal.review, null)
  assert.equal(proposal.evidence.length, 1)
  assert.equal(proposal.evidence[0].type, 'candidate-claim-v1')
  assert.equal(proposal.evidence[0].id, candidate.id)
  assert.equal(proposal.evidence[0].source.experienceId, candidate.source.experienceId)
  assert.equal(
    proposal.evidence[0].source.significanceAssessmentId,
    candidate.source.significanceAssessmentId,
  )
  assert.deepEqual(proposal.evidence[0].source.experienceProvenance, candidate.source.experienceProvenance)
  assert.deepEqual(proposal.evidence[0].source.significanceProvenance, candidate.source.significanceProvenance)
  assert.equal(proposal.provenance.candidateClaimId, candidate.id)
  assert.equal(proposal.provenance.experienceId, candidate.source.experienceId)
  assert.equal(
    proposal.provenance.significanceAssessmentId,
    candidate.source.significanceAssessmentId,
  )
  assert.deepEqual(candidate, candidateBefore)
})

test('candidate promotion proposal has no mutation or review authority', () => {
  const soul = createSoulState({ soulId: 'soul-1', name: null })
  const soulBefore = structuredClone(soul)
  const proposal = createCandidatePromotionProposal(candidateFixture(), {
    reason: 'Submit candidate for independent governance review.',
    proposer: 'candidate-promotion:test',
    provenance: { method: 'candidate-promotion-bridge-v1' },
  })

  assert.throws(() => applyStateTransitionProposal(soul, proposal), /must be reviewed/)
  assert.deepEqual(soul, soulBefore)
})

test('independent review is still required before candidate-derived state can be applied', () => {
  const candidate = candidateFixture()
  const proposal = createCandidatePromotionProposal(candidate, {
    id: 'proposal:candidate:reviewed',
    reason: 'Submit evidence-bound preference candidate for governance review.',
    proposer: 'candidate-promotion:test',
    provenance: { method: 'candidate-promotion-bridge-v1' },
  })

  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Candidate evidence and confidence satisfy the active review policy.',
    provenance: { reviewId: 'review:candidate:1' },
  })
  const next = applyStateTransitionProposal(createSoulState({ soulId: 'soul-1', name: null }), reviewed)

  assert.deepEqual(next.userModel, [{ claim: candidate.statement }])
  assert.equal(next.evolution.length, 1)
  assert.equal(next.evolution[0].provenance.proposalId, proposal.id)
  assert.equal(next.evolution[0].provenance.evidence[0].id, candidate.id)
})

test('fails closed for invalid or authority-escalated candidate claims', () => {
  const invalid = structuredClone(candidateFixture())
  invalid.canonicalMutation = true

  assert.throws(
    () => createCandidatePromotionProposal(invalid, {
      reason: 'Should not promote.',
      proposer: 'candidate-promotion:test',
      provenance: { method: 'test' },
    }),
    /invalid candidate claim|non-authoritative/,
  )
})

test('bridge requires explicit governance-facing reason, proposer, and provenance', () => {
  const candidate = candidateFixture()

  assert.throws(() => createCandidatePromotionProposal(candidate), /reason is required/)
  assert.throws(
    () => createCandidatePromotionProposal(candidate, { reason: 'reason' }),
    /proposer is required/,
  )
  assert.throws(
    () => createCandidatePromotionProposal(candidate, { reason: 'reason', proposer: 'test' }),
    /provenance is required/,
  )
})
