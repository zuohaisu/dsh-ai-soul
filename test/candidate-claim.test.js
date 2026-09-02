import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH,
  createCandidateClaim,
  createExperienceRecord,
  createSignificanceAssessment,
  validateCandidateClaim,
} from '../src/core/index.js'

function fixture() {
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

  const significanceAssessment = createSignificanceAssessment({
    id: 'sig:exp:dsh:session-1:42',
    experienceId: experience.id,
    assessedAt: '2026-09-03T01:00:01.000Z',
    level: 'medium',
    rationale: 'A durable collaboration preference may improve future interactions.',
    confidence: 0.82,
    provenance: { method: 'test-positive-assessor-v1' },
    recommendPromotion: true,
  })

  return { experience, significanceAssessment }
}

test('creates an immutable userModel candidate bound to exact Experience and assessment provenance', () => {
  const { experience, significanceAssessment } = fixture()
  const originalExperience = structuredClone(experience)
  const originalAssessment = structuredClone(significanceAssessment)

  const claim = createCandidateClaim({
    experience,
    significanceAssessment,
    id: 'claim:preference:concise-notes',
    createdAt: '2026-09-03T01:00:02.000Z',
    statement: 'The user prefers concise implementation notes.',
    confidence: 0.78,
    provenance: { method: 'candidate-extractor-test-v1' },
  })

  assert.deepEqual(validateCandidateClaim(claim), { valid: true, errors: [] })
  assert.equal(claim.target, 'userModel')
  assert.equal(claim.status, 'candidate')
  assert.equal(claim.canonicalMutation, false)
  assert.equal(claim.source.experienceId, experience.id)
  assert.equal(claim.source.significanceAssessmentId, significanceAssessment.id)
  assert.deepEqual(claim.source.experienceProvenance, experience.provenance)
  assert.deepEqual(claim.source.significanceProvenance, significanceAssessment.provenance)
  assert.equal(Object.isFrozen(claim), true)
  assert.equal(Object.isFrozen(claim.source), true)
  assert.deepEqual(experience, originalExperience)
  assert.deepEqual(significanceAssessment, originalAssessment)
})

test('fails closed when significance does not recommend promotion', () => {
  const { experience, significanceAssessment } = fixture()
  const negative = { ...significanceAssessment, recommendPromotion: false }

  assert.throws(() => createCandidateClaim({
    experience,
    significanceAssessment: negative,
    statement: 'The user prefers concise implementation notes.',
    confidence: 0.7,
    provenance: { method: 'test' },
  }), /recommendPromotion=true/)
})

test('fails closed when assessment belongs to a different Experience', () => {
  const { experience, significanceAssessment } = fixture()
  const mismatched = { ...significanceAssessment, experienceId: 'exp:other' }

  assert.throws(() => createCandidateClaim({
    experience,
    significanceAssessment: mismatched,
    statement: 'The user prefers concise implementation notes.',
    confidence: 0.7,
    provenance: { method: 'test' },
  }), /experienceId must match/)
})

test('candidate scope is bounded to userModel and bounded statement size', () => {
  const { experience, significanceAssessment } = fixture()
  const base = {
    experience,
    significanceAssessment,
    statement: 'The user prefers concise implementation notes.',
    confidence: 0.7,
    provenance: { method: 'test' },
  }

  assert.throws(() => createCandidateClaim({ ...base, target: 'selfModel' }), /target must be one of/)
  assert.throws(() => createCandidateClaim({
    ...base,
    statement: 'x'.repeat(CANDIDATE_CLAIM_MAX_STATEMENT_LENGTH + 1),
  }), /must be at most/)
})

test('candidate requires explicit confidence and provenance', () => {
  const { experience, significanceAssessment } = fixture()
  const base = {
    experience,
    significanceAssessment,
    statement: 'The user prefers concise implementation notes.',
  }

  assert.throws(() => createCandidateClaim({ ...base, confidence: 1.1, provenance: { method: 'test' } }), /confidence must be between/)
  assert.throws(() => createCandidateClaim({ ...base, confidence: 0.7 }), /provenance is required/)
})
