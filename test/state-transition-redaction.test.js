import assert from 'node:assert/strict'
import test from 'node:test'

import {
  archiveRedactedStateTransitionProposal,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
  validateStateTransitionProposal,
} from '../src/core/index.js'

function reviewedProposal() {
  const proposal = createStateTransitionProposal({
    id: 'proposal-sensitive-1',
    at: '2026-09-04T10:00:00.000Z',
    target: 'userModel',
    operation: 'append',
    value: 'The user prefers private workspace names.',
    reason: 'explicit durable preference from a sensitive interaction',
    evidence: [{ experienceId: 'exp-sensitive-1', quote: 'Keep this workspace name private.' }],
    provenance: { sourceExperienceId: 'exp-sensitive-1', adapter: 'dsh' },
    confidence: 0.95,
    proposer: 'ai-soul/reflection',
  })

  return reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'human:h',
    reason: 'confirmed as a durable preference',
    provenance: { command: '/soul-review approve proposal-sensitive-1' },
    conflicts: [],
    at: '2026-09-04T10:01:00.000Z',
  })
}

test('archives reviewed Experience-derived proposal without retaining sensitive plaintext', () => {
  const proposal = reviewedProposal()
  const before = structuredClone(proposal)

  const archive = archiveRedactedStateTransitionProposal(proposal, {
    experienceId: 'exp-sensitive-1',
    reason: 'user requested deletion of sensitive derived content',
    provenance: { actor: 'human:h', requestId: 'privacy-1' },
    at: '2026-09-04T10:02:00.000Z',
  })

  assert.equal(archive.archival, true)
  assert.equal(archive.executable, false)
  assert.equal(archive.sourceProposal.id, proposal.id)
  assert.equal(archive.sourceProposal.target, proposal.target)
  assert.equal(archive.review.decision, 'approved')
  assert.match(archive.review.proposalFingerprintDigest, /^[a-f0-9]{64}$/)
  assert.match(archive.review.reviewFingerprintDigest, /^[a-f0-9]{64}$/)
  assert.equal(Object.hasOwn(archive.review, 'proposalFingerprint'), false)
  assert.equal(Object.hasOwn(archive.review, 'reviewFingerprint'), false)
  assert.equal(archive.redaction.experienceId, 'exp-sensitive-1')
  assert.match(archive.redaction.proposalFieldDigests.value, /^[a-f0-9]{64}$/)
  assert.match(archive.redaction.proposalFieldDigests.evidence, /^[a-f0-9]{64}$/)
  assert.match(archive.redaction.reviewFieldDigests.reason, /^[a-f0-9]{64}$/)

  const serialized = JSON.stringify(archive)
  assert.equal(serialized.includes('private workspace names'), false)
  assert.equal(serialized.includes('Keep this workspace name private'), false)
  assert.equal(serialized.includes('confirmed as a durable preference'), false)
  assert.deepEqual(proposal, before)
  assert.equal(validateStateTransitionProposal(archive).valid, false)
})

test('digest output is deterministic for the same reviewed proposal', () => {
  const proposal = reviewedProposal()
  const a = archiveRedactedStateTransitionProposal(proposal, {
    experienceId: 'exp-sensitive-1', reason: 'erase', provenance: { actor: 'human:h' }, at: '2026-09-04T10:02:00.000Z',
  })
  const b = archiveRedactedStateTransitionProposal(proposal, {
    experienceId: 'exp-sensitive-1', reason: 'erase later', provenance: { actor: 'human:h' }, at: '2026-09-04T10:03:00.000Z',
  })
  assert.deepEqual(a.redaction.proposalFieldDigests, b.redaction.proposalFieldDigests)
  assert.deepEqual(a.redaction.reviewFieldDigests, b.redaction.reviewFieldDigests)
  assert.equal(a.review.proposalFingerprintDigest, b.review.proposalFingerprintDigest)
  assert.equal(a.review.reviewFingerprintDigest, b.review.reviewFingerprintDigest)
})

test('fails closed for pending, unrelated, and already-redacted proposals', () => {
  const reviewed = reviewedProposal()
  const pending = createStateTransitionProposal({
    target: 'userModel', operation: 'append', value: 'x', reason: 'r',
    evidence: [{ experienceId: 'exp-sensitive-1' }], provenance: { sourceExperienceId: 'exp-sensitive-1' },
    confidence: 0.9, proposer: 'p',
  })

  assert.throws(() => archiveRedactedStateTransitionProposal(pending, {
    experienceId: 'exp-sensitive-1', reason: 'erase', provenance: { actor: 'h' },
  }), /terminal review/)

  assert.throws(() => archiveRedactedStateTransitionProposal(reviewed, {
    experienceId: 'exp-other', reason: 'erase', provenance: { actor: 'h' },
  }), /does not structurally reference/)

  const archive = archiveRedactedStateTransitionProposal(reviewed, {
    experienceId: 'exp-sensitive-1', reason: 'erase', provenance: { actor: 'h' },
  })
  assert.throws(() => archiveRedactedStateTransitionProposal(archive, {
    experienceId: 'exp-sensitive-1', reason: 'erase', provenance: { actor: 'h' },
  }), /already a redacted archive/)
})

test('requires explicit redaction governance metadata', () => {
  const proposal = reviewedProposal()
  assert.throws(() => archiveRedactedStateTransitionProposal(proposal, {
    experienceId: 'exp-sensitive-1', provenance: { actor: 'h' },
  }), /redaction reason is required/)
  assert.throws(() => archiveRedactedStateTransitionProposal(proposal, {
    experienceId: 'exp-sensitive-1', reason: 'erase',
  }), /redaction provenance is required/)
})
