import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSignificanceAssessment,
  redactSignificanceAssessmentDerivedContent,
} from '../src/core/index.js'

function buildAssessment(id = 'sig-private', experienceId = 'exp-private') {
  return createSignificanceAssessment({
    id,
    experienceId,
    assessedAt: '2026-09-04T14:03:00.000Z',
    level: 'high',
    rationale: 'user disclosed a sensitive durable preference',
    confidence: 0.91,
    provenance: { assessor: 'runtime', evidence: 'sensitive explanation' },
    recommendPromotion: true,
  })
}

test('redacts significance derived plaintext while preserving decision lineage', () => {
  const assessments = [buildAssessment()]
  const before = structuredClone(assessments)
  const next = redactSignificanceAssessmentDerivedContent(assessments, {
    experienceId: 'exp-private',
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T14:04:00.000Z',
  })

  assert.deepEqual(assessments, before)
  const assessment = next[0]
  assert.equal(assessment.id, before[0].id)
  assert.equal(assessment.experienceId, before[0].experienceId)
  assert.equal(assessment.assessedAt, before[0].assessedAt)
  assert.equal(assessment.level, before[0].level)
  assert.equal(assessment.confidence, before[0].confidence)
  assert.equal(assessment.recommendPromotion, before[0].recommendPromotion)
  assert.equal(assessment.rationale, null)
  assert.equal(assessment.provenance, null)
  assert.match(assessment.derivedContentRedaction.digests.rationale, /^[a-f0-9]{64}$/)
  assert.match(assessment.derivedContentRedaction.digests.provenance, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(next).includes('sensitive durable preference'), false)
  assert.equal(JSON.stringify(next).includes('sensitive explanation'), false)
})

test('redaction digests are deterministic', () => {
  const options = {
    experienceId: 'exp-private',
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T14:04:00.000Z',
  }
  const a = redactSignificanceAssessmentDerivedContent([buildAssessment()], options)[0]
  const b = redactSignificanceAssessmentDerivedContent([buildAssessment()], options)[0]
  assert.equal(a.derivedContentRedaction.digests.rationale, b.derivedContentRedaction.digests.rationale)
  assert.equal(a.derivedContentRedaction.digests.provenance, b.derivedContentRedaction.digests.provenance)
})

test('fails closed for zero, ambiguous, repeat, malformed, and missing governance metadata', () => {
  const assessment = buildAssessment()
  assert.throws(() => redactSignificanceAssessmentDerivedContent([assessment], {
    experienceId: 'missing', reason: 'privacy request', provenance: { actor: 'human' },
  }), /no significance assessment found/)

  assert.throws(() => redactSignificanceAssessmentDerivedContent([assessment, buildAssessment('sig-2')], {
    experienceId: 'exp-private', reason: 'privacy request', provenance: { actor: 'human' },
  }), /ambiguous significance assessments/)

  const redacted = redactSignificanceAssessmentDerivedContent([assessment], {
    experienceId: 'exp-private', reason: 'privacy request', provenance: { actor: 'human' },
  })
  assert.throws(() => redactSignificanceAssessmentDerivedContent(redacted, {
    experienceId: 'exp-private', reason: 'repeat', provenance: { actor: 'human' },
  }), /already redacted/)

  assert.throws(() => redactSignificanceAssessmentDerivedContent([{ ...assessment, confidence: 2 }], {
    experienceId: 'exp-private', reason: 'privacy request', provenance: { actor: 'human' },
  }), /invalid significance assessment/)

  assert.throws(() => redactSignificanceAssessmentDerivedContent([assessment], {
    experienceId: 'exp-private', provenance: { actor: 'human' },
  }), /redaction reason is required/)
  assert.throws(() => redactSignificanceAssessmentDerivedContent([assessment], {
    experienceId: 'exp-private', reason: 'privacy request',
  }), /redaction provenance is required/)
})
