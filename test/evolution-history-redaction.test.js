import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applyStateTransitionProposal,
  createSoulState,
  createStateTransitionProposal,
  redactEvolutionHistoryDerivedContent,
  reviewStateTransitionProposal,
  validateSoulState,
} from '../src/core/index.js'

function buildAppliedState() {
  const base = createSoulState({ soulId: 'soul-privacy-test' })
  const proposal = createStateTransitionProposal({
    id: 'proposal-1',
    at: '2026-09-04T12:00:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: { statement: 'Sensitive preference: call only after 22:00' },
    reason: 'The user explicitly stated a durable preference.',
    evidence: [{ id: 'experience-1', quote: 'Please only call me after 22:00.' }],
    provenance: { source: 'real-dsh-interaction', experienceId: 'experience-1' },
    confidence: 0.95,
    proposer: 'reflection',
  })
  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'human:test',
    reason: 'Explicit preference confirmed.',
    provenance: { source: 'human-review', note: 'contains sensitive review note' },
    conflicts: [],
    at: '2026-09-04T12:01:00.000Z',
  })
  return applyStateTransitionProposal(base, reviewed)
}

test('redacts canonical governed evolution content while preserving minimal lineage and audit event', () => {
  const state = buildAppliedState()
  const original = structuredClone(state)
  const governed = state.evolution[0]

  const next = redactEvolutionHistoryDerivedContent(state, {
    evolutionEntryId: governed.id,
    reason: 'privacy request',
    provenance: { actor: 'privacy-officer', requestId: 'erase-1' },
    at: '2026-09-04T12:02:00.000Z',
  })

  assert.deepEqual(state, original)
  assert.equal(validateSoulState(next).valid, true)
  assert.equal(next.evolution.length, 2)

  const redacted = next.evolution[0]
  assert.equal(redacted.id, governed.id)
  assert.equal(redacted.kind, 'governed-state-transition')
  assert.equal(redacted.reason, '[redacted]')
  assert.equal(redacted.change.target, 'userModel')
  assert.equal(redacted.change.operation, 'append')
  assert.equal(redacted.provenance.proposalId, 'proposal-1')
  assert.deepEqual(redacted.provenance.evidenceIds, ['experience-1'])
  assert.equal(redacted.provenance.review.decision, 'approved')
  assert.equal(redacted.provenance.review.reviewer, 'human:test')
  assert.equal(redacted.redaction.reason, 'privacy request')
  assert.equal(redacted.redaction.provenance.requestId, 'erase-1')
  assert.match(redacted.redaction.removed['change.value'].sha256, /^[a-f0-9]{64}$/)
  assert.match(redacted.redaction.removed['review.proposalFingerprint'].sha256, /^[a-f0-9]{64}$/)
  assert.match(redacted.redaction.removed['review.reviewFingerprint'].sha256, /^[a-f0-9]{64}$/)

  const serialized = JSON.stringify(redacted)
  assert.doesNotMatch(serialized, /Sensitive preference/)
  assert.doesNotMatch(serialized, /Please only call me/)
  assert.doesNotMatch(serialized, /Explicit preference confirmed/)
  assert.doesNotMatch(serialized, /sensitive review note/)
  assert.equal(Object.hasOwn(redacted.provenance.review, 'proposalFingerprint'), false)
  assert.equal(Object.hasOwn(redacted.provenance.review, 'reviewFingerprint'), false)

  const audit = next.evolution[1]
  assert.equal(audit.kind, 'privacy-redaction')
  assert.equal(audit.change.target, 'evolution')
  assert.equal(audit.change.evolutionEntryId, governed.id)
})

test('fails closed for zero match, repeated redaction, and missing governance metadata', () => {
  const state = buildAppliedState()
  const governed = state.evolution[0]
  const options = {
    reason: 'privacy request',
    provenance: { actor: 'privacy-officer' },
    at: '2026-09-04T12:02:00.000Z',
  }

  assert.throws(
    () => redactEvolutionHistoryDerivedContent(state, { ...options, evolutionEntryId: 'missing' }),
    /not found/,
  )
  assert.throws(
    () => redactEvolutionHistoryDerivedContent(state, { evolutionEntryId: governed.id, provenance: {} }),
    /reason is required/,
  )

  const once = redactEvolutionHistoryDerivedContent(state, {
    ...options,
    evolutionEntryId: governed.id,
  })
  assert.throws(
    () => redactEvolutionHistoryDerivedContent(once, { ...options, evolutionEntryId: governed.id }),
    /already been redacted/,
  )
})

test('fails closed for ambiguous ids and non-governed evolution entries', () => {
  const state = buildAppliedState()
  const governed = structuredClone(state.evolution[0])
  const duplicate = structuredClone(state)
  duplicate.evolution.push(governed)

  assert.throws(
    () => redactEvolutionHistoryDerivedContent(duplicate, {
      evolutionEntryId: governed.id,
      reason: 'privacy request',
      provenance: { actor: 'privacy-officer' },
    }),
    /ambiguous/,
  )

  const nonGoverned = structuredClone(state)
  nonGoverned.evolution[0] = {
    id: governed.id,
    at: governed.at,
    kind: 'naming',
    reason: 'name chosen',
    provenance: { source: 'human' },
    change: null,
  }
  assert.throws(
    () => redactEvolutionHistoryDerivedContent(nonGoverned, {
      evolutionEntryId: governed.id,
      reason: 'privacy request',
      provenance: { actor: 'privacy-officer' },
    }),
    /only governed-state-transition/,
  )
})
