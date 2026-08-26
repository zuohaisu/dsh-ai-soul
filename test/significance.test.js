import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExperienceRecord,
  createSignificanceAssessment,
  createSoulState,
  promoteExperienceToAutobiography,
  validateSignificanceAssessment,
} from '../src/core/index.js'

function makeExperience() {
  return createExperienceRecord({
    id: 'exp-significance-1',
    at: '2026-08-27T03:30:00.000Z',
    kind: 'decision',
    source: { runtime: 'test-runtime', sessionId: 'session-significance' },
    provenance: { eventId: 'event-significance-1' },
    payload: { summary: 'A durable project decision was made.' },
  })
}

test('creates a valid significance assessment tied to one experience', () => {
  const assessment = createSignificanceAssessment({
    id: 'assessment-1',
    experienceId: 'exp-significance-1',
    assessedAt: '2026-08-27T03:31:00.000Z',
    level: 'high',
    rationale: 'The event changes durable project history.',
    confidence: 0.9,
    provenance: { assessor: 'test', method: 'explicit-review' },
    recommendPromotion: true,
  })

  assert.deepEqual(validateSignificanceAssessment(assessment), { valid: true, errors: [] })
  assert.equal(assessment.experienceId, 'exp-significance-1')
  assert.equal(assessment.recommendPromotion, true)
})

test('validates level and bounded confidence', () => {
  assert.throws(
    () => createSignificanceAssessment({
      experienceId: 'exp-1',
      level: 'urgent',
      rationale: 'Invalid level.',
      confidence: 0.5,
      provenance: { assessor: 'test' },
      recommendPromotion: false,
    }),
    /level must be one of: low, medium, high/,
  )

  assert.throws(
    () => createSignificanceAssessment({
      experienceId: 'exp-1',
      level: 'medium',
      rationale: 'Invalid confidence.',
      confidence: 1.1,
      provenance: { assessor: 'test' },
      recommendPromotion: false,
    }),
    /confidence must be between 0 and 1/,
  )
})

test('positive promotion recommendation has no side effect on Soul State', () => {
  const soul = createSoulState({ soulId: 'soul-significance', name: 'Soul Significance' })
  const before = structuredClone(soul)
  const experience = makeExperience()

  createSignificanceAssessment({
    id: 'assessment-high',
    experienceId: experience.id,
    level: 'high',
    rationale: 'Strong candidate for durable autobiography.',
    confidence: 0.99,
    provenance: { assessor: 'test', method: 'proposal-only' },
    recommendPromotion: true,
  })

  assert.deepEqual(soul, before)
  assert.equal(soul.autobiography.length, 0)
})

test('explicit promotion preserves validated significance assessment as evidence', () => {
  const soul = createSoulState({ soulId: 'soul-significance', name: 'Soul Significance' })
  const experience = makeExperience()
  const assessment = createSignificanceAssessment({
    id: 'assessment-promoted',
    experienceId: experience.id,
    assessedAt: '2026-08-27T03:31:00.000Z',
    level: 'high',
    rationale: 'This decision materially changes durable shared history.',
    confidence: 0.95,
    provenance: { assessor: 'test', method: 'explicit-review' },
    recommendPromotion: true,
  })

  const next = promoteExperienceToAutobiography(soul, experience, {
    reason: 'Explicit reviewer decision after significance assessment.',
    provenance: { reviewer: 'test', method: 'governed-promotion' },
    significanceAssessment: assessment,
    promotedAt: '2026-08-27T03:32:00.000Z',
  })

  assert.equal(soul.autobiography.length, 0)
  assert.equal(next.autobiography.length, 1)
  assert.deepEqual(next.autobiography[0].significanceAssessment, assessment)
})

test('promotion rejects assessment for a different experience', () => {
  const soul = createSoulState({ soulId: 'soul-significance', name: 'Soul Significance' })
  const experience = makeExperience()
  const assessment = createSignificanceAssessment({
    experienceId: 'different-experience',
    level: 'high',
    rationale: 'This belongs to another event.',
    confidence: 0.8,
    provenance: { assessor: 'test' },
    recommendPromotion: true,
  })

  assert.throws(
    () => promoteExperienceToAutobiography(soul, experience, {
      reason: 'Should fail.',
      provenance: { reviewer: 'test' },
      significanceAssessment: assessment,
    }),
    /significance assessment experienceId must match experience\.id/,
  )
})
