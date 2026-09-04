import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCandidateClaim,
  createExperienceRecord,
  createSignificanceAssessment,
  redactCandidateClaimDerivedContent,
} from '../src/core/index.js'

function buildCandidate(id = 'claim-private', experienceId = 'exp-private') {
  const experience = createExperienceRecord({
    id: experienceId,
    at: '2026-09-04T09:05:00.000Z',
    kind: 'conversation-turn',
    source: { runtime: 'dsh', sessionId: 'session-private' },
    provenance: { eventId: 'event-private', sourceType: 'runtime-event' },
    payload: { text: 'sensitive preference' },
  })
  const significanceAssessment = createSignificanceAssessment({
    experienceId: experience.id,
    id: `sig-${experienceId}`,
    assessedAt: '2026-09-04T09:05:01.000Z',
    level: 'high',
    rationale: 'explicit durable preference',
    confidence: 0.9,
    provenance: { assessor: 'test' },
    recommendPromotion: true,
  })
  return createCandidateClaim({
    experience,
    significanceAssessment,
    id,
    createdAt: '2026-09-04T09:05:02.000Z',
    statement: 'The user has a sensitive durable preference.',
    confidence: 0.9,
    provenance: { inference: 'contains sensitive derived explanation' },
  })
}

test('redacts candidate derived plaintext while preserving structured lineage', () => {
  const claims = [buildCandidate()]
  const before = structuredClone(claims)
  const next = redactCandidateClaimDerivedContent(claims, {
    experienceId: 'exp-private',
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T09:06:00.000Z',
  })

  assert.deepEqual(claims, before)
  const claim = next[0]
  assert.equal(claim.id, before[0].id)
  assert.equal(claim.createdAt, before[0].createdAt)
  assert.equal(claim.target, before[0].target)
  assert.equal(claim.confidence, before[0].confidence)
  assert.equal(claim.status, 'candidate')
  assert.equal(claim.canonicalMutation, false)
  assert.deepEqual(claim.source, before[0].source)
  assert.equal(claim.statement, null)
  assert.equal(claim.provenance, null)
  assert.match(claim.derivedContentRedaction.digests.statement, /^[a-f0-9]{64}$/)
  assert.match(claim.derivedContentRedaction.digests.provenance, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(next).includes('sensitive durable preference'), false)
  assert.equal(JSON.stringify(next).includes('sensitive derived explanation'), false)
})

test('redaction digests are deterministic', () => {
  const options = {
    experienceId: 'exp-private',
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T09:06:00.000Z',
  }
  const a = redactCandidateClaimDerivedContent([buildCandidate()], options)[0]
  const b = redactCandidateClaimDerivedContent([buildCandidate()], options)[0]
  assert.equal(a.derivedContentRedaction.digests.statement, b.derivedContentRedaction.digests.statement)
  assert.equal(a.derivedContentRedaction.digests.provenance, b.derivedContentRedaction.digests.provenance)
})

test('fails closed for zero, ambiguous, repeat, malformed, and missing governance metadata', () => {
  const claim = buildCandidate()
  assert.throws(() => redactCandidateClaimDerivedContent([claim], {
    experienceId: 'missing', reason: 'privacy request', provenance: { actor: 'human' },
  }), /no candidate claim found/)

  assert.throws(() => redactCandidateClaimDerivedContent([claim, buildCandidate('claim-2')], {
    experienceId: 'exp-private', reason: 'privacy request', provenance: { actor: 'human' },
  }), /ambiguous candidate claims/)

  const redacted = redactCandidateClaimDerivedContent([claim], {
    experienceId: 'exp-private', reason: 'privacy request', provenance: { actor: 'human' },
  })
  assert.throws(() => redactCandidateClaimDerivedContent(redacted, {
    experienceId: 'exp-private', reason: 'repeat', provenance: { actor: 'human' },
  }), /already redacted/)

  assert.throws(() => redactCandidateClaimDerivedContent([{ ...claim, confidence: 2 }], {
    experienceId: 'exp-private', reason: 'privacy request', provenance: { actor: 'human' },
  }), /invalid candidate claim/)

  assert.throws(() => redactCandidateClaimDerivedContent([claim], {
    experienceId: 'exp-private', provenance: { actor: 'human' },
  }), /redaction reason is required/)
  assert.throws(() => redactCandidateClaimDerivedContent([claim], {
    experienceId: 'exp-private', reason: 'privacy request',
  }), /redaction provenance is required/)
})
