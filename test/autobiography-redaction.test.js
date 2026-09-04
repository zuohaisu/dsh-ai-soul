import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExperienceRecord,
  createSoulState,
  promoteExperienceToAutobiography,
  redactAutobiographyDerivedContent,
} from '../src/core/index.js'

function buildPromotedState() {
  const soul = createSoulState({ soulId: 'soul-private', name: 'Private Soul' })
  const experience = createExperienceRecord({
    id: 'exp-private-auto',
    at: '2026-09-04T08:10:00.000Z',
    kind: 'conversation-turn',
    source: { runtime: 'dsh', sessionId: 'session-private' },
    provenance: { eventId: 'event-private', sourceType: 'runtime-event' },
    payload: { text: 'secret autobiography payload' },
  })

  return promoteExperienceToAutobiography(soul, experience, {
    reason: 'secret promotion reason',
    provenance: { reviewer: 'human', method: 'explicit-promotion' },
    interpretation: 'secret derived interpretation',
    significanceAssessment: null,
    promotedAt: '2026-09-04T08:11:00.000Z',
  })
}

test('redacts autobiography derived plaintext while preserving lineage', () => {
  const state = buildPromotedState()
  const before = structuredClone(state)

  const next = redactAutobiographyDerivedContent(state, {
    experienceId: 'exp-private-auto',
    reason: 'human requested derived-data redaction',
    provenance: { actor: 'human', method: 'explicit-request' },
    redactedAt: '2026-09-04T08:12:00.000Z',
  })

  const entry = next.autobiography[0]
  assert.deepEqual(state, before)
  assert.equal(entry.id, before.autobiography[0].id)
  assert.equal(entry.sourceExperienceId, 'exp-private-auto')
  assert.equal(entry.experiencedAt, before.autobiography[0].experiencedAt)
  assert.equal(entry.promotedAt, before.autobiography[0].promotedAt)
  assert.equal(entry.kind, before.autobiography[0].kind)
  assert.deepEqual(entry.promotion.provenance, before.autobiography[0].promotion.provenance)
  assert.deepEqual(entry.experienceProvenance, before.autobiography[0].experienceProvenance)
  assert.equal(entry.payload, null)
  assert.equal(entry.interpretation, null)
  assert.equal(entry.significanceAssessment, null)
  assert.equal(entry.promotion.reason, null)
  assert.equal(entry.derivedContentRedaction.algorithm, 'sha256')
  assert.match(entry.derivedContentRedaction.digests.payload, /^[a-f0-9]{64}$/)
  assert.match(entry.derivedContentRedaction.digests.interpretation, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(next).includes('secret autobiography payload'), false)
  assert.equal(JSON.stringify(next).includes('secret derived interpretation'), false)
  assert.equal(JSON.stringify(next).includes('secret promotion reason'), false)
})

test('redaction digests are deterministic for equivalent content', () => {
  const a = buildPromotedState()
  const b = buildPromotedState()
  a.autobiography[0].payload = { b: 2, a: { y: 2, x: 1 } }
  b.autobiography[0].payload = { a: { x: 1, y: 2 }, b: 2 }

  const options = {
    experienceId: 'exp-private-auto',
    reason: 'privacy request',
    provenance: { actor: 'human' },
    redactedAt: '2026-09-04T08:13:00.000Z',
  }

  const redactedA = redactAutobiographyDerivedContent(a, options)
  const redactedB = redactAutobiographyDerivedContent(b, options)
  assert.equal(
    redactedA.autobiography[0].derivedContentRedaction.digests.payload,
    redactedB.autobiography[0].derivedContentRedaction.digests.payload,
  )
})

test('fails closed for zero, ambiguous, or repeat matches', () => {
  const state = buildPromotedState()

  assert.throws(
    () => redactAutobiographyDerivedContent(state, {
      experienceId: 'missing',
      reason: 'privacy request',
      provenance: { actor: 'human' },
    }),
    /no autobiography entry found/,
  )

  const ambiguous = structuredClone(state)
  ambiguous.autobiography.push(structuredClone(ambiguous.autobiography[0]))
  assert.throws(
    () => redactAutobiographyDerivedContent(ambiguous, {
      experienceId: 'exp-private-auto',
      reason: 'privacy request',
      provenance: { actor: 'human' },
    }),
    /ambiguous autobiography entries/,
  )

  const redacted = redactAutobiographyDerivedContent(state, {
    experienceId: 'exp-private-auto',
    reason: 'privacy request',
    provenance: { actor: 'human' },
  })
  assert.throws(
    () => redactAutobiographyDerivedContent(redacted, {
      experienceId: 'exp-private-auto',
      reason: 'repeat request',
      provenance: { actor: 'human' },
    }),
    /already redacted/,
  )
})

test('requires valid state and explicit governance metadata', () => {
  const state = buildPromotedState()

  assert.throws(
    () => redactAutobiographyDerivedContent({ ...state, autobiography: null }, {
      experienceId: 'exp-private-auto',
      reason: 'privacy request',
      provenance: { actor: 'human' },
    }),
    /invalid Soul state/,
  )

  assert.throws(
    () => redactAutobiographyDerivedContent(state, {
      experienceId: 'exp-private-auto',
      provenance: { actor: 'human' },
    }),
    /redaction reason is required/,
  )

  assert.throws(
    () => redactAutobiographyDerivedContent(state, {
      experienceId: 'exp-private-auto',
      reason: 'privacy request',
    }),
    /redaction provenance is required/,
  )
})
