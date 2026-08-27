import assert from 'node:assert/strict'
import test from 'node:test'

import { createExodusPromotionProposal } from '../src/core/exodus-promotion.js'
import {
  addExodusClaimRelationship,
  appendExodusReviewDecision,
  createExodusReviewWorkspace,
} from '../src/core/exodus-review-workspace.js'

function claim(id, statement, score = 0.78) {
  return {
    claimVersion: 1,
    id,
    claimType: 'user-model',
    statement,
    interpretation: 'Durable collaboration preference inferred from imported partner history.',
    evidence: [{
      sourceId: 'mira-memory',
      algorithm: 'sha256',
      digest: 'digest-mira-001',
      unitId: `unit-${id}`,
      lineStart: 4,
      lineEnd: 6,
      headingPath: ['Working together'],
      support: 'The preference is stated directly and repeated.',
    }],
    counterEvidence: [{ kind: 'note', note: 'No contradictory evidence in the imported source.' }],
    confidence: { score, rationale: 'Repeated direct statements with preserved provenance.' },
    canonicalStatus: 'candidate',
    runtimePhenotypeRisk: 'low',
    notes: null,
    canonicalMutation: false,
  }
}

const claims = [
  claim('mira-concise', 'Mira prefers concise collaboration updates.'),
  claim('mira-detailed', 'Mira prefers exhaustive collaboration updates.', 0.62),
]

function reviewedWorkspace(state = 'accepted-for-promotion') {
  const workspace = createExodusReviewWorkspace({
    id: 'mira-migration-001',
    claims,
    createdAt: '2026-08-27T13:00:00Z',
    createdBy: 'migration-agent',
  })
  return appendExodusReviewDecision(workspace, claims, {
    claimId: 'mira-concise',
    state,
    reviewer: 'human-reviewer',
    reviewedAt: '2026-08-27T13:20:00Z',
    rationale: 'Evidence is sufficient to propose this as user-model state.',
  })
}

function promotion(workspace) {
  return createExodusPromotionProposal({
    workspace,
    claims,
    claimId: 'mira-concise',
    targetMapping: {
      target: 'userModel',
      path: 'userModel',
      value: { preference: 'concise collaboration updates', source: 'exodus' },
    },
    proposer: 'exodus-reviewer',
    proposalId: 'proposal-mira-001',
    at: '2026-08-27T13:30:00Z',
  })
}

test('accepted reviewed claim becomes an unreviewed normal state-transition proposal', () => {
  const workspace = reviewedWorkspace()
  const original = structuredClone(workspace)
  const proposal = promotion(workspace)

  assert.equal(proposal.target, 'userModel')
  assert.equal(proposal.review, null)
  assert.equal(proposal.confidence, 0.78)
  assert.equal(proposal.provenance.kind, 'generic-exodus-promotion')
  assert.equal(proposal.provenance.workspace.id, 'mira-migration-001')
  assert.equal(proposal.provenance.reviewDecision.index, 0)
  assert.equal(typeof proposal.provenance.reviewDecision.fingerprint, 'string')
  assert.equal(proposal.provenance.reviewDecision.state, 'accepted-for-promotion')
  assert.equal(proposal.provenance.candidateClaim.id, 'mira-concise')
  assert.equal(proposal.provenance.targetMapping.path, 'userModel')
  assert.equal(proposal.evidence[0].sourceId, 'mira-memory')
  assert.equal(proposal.evidence[0].digest, 'digest-mira-001')
  assert.deepEqual(workspace, original)
  assert.equal(workspace.canonicalMutation, false)
})

test('unreviewed, rejected, and needs-more-evidence claims cannot generate proposals', () => {
  const unreviewed = createExodusReviewWorkspace({
    id: 'mira-migration-001',
    claims,
    createdAt: '2026-08-27T13:00:00Z',
    createdBy: 'migration-agent',
  })

  for (const [workspace, state] of [
    [unreviewed, 'unreviewed'],
    [reviewedWorkspace('rejected'), 'rejected'],
    [reviewedWorkspace('needs-more-evidence'), 'needs-more-evidence'],
  ]) {
    assert.throws(() => promotion(workspace), new RegExp(`latest state: ${state}`))
  }
})

test('target domain, path, and value must be explicit and cannot be inferred from claim type', () => {
  const workspace = reviewedWorkspace()

  assert.throws(() => createExodusPromotionProposal({
    workspace,
    claims,
    claimId: 'mira-concise',
    targetMapping: { target: 'userModel', value: { preference: 'concise' } },
    proposer: 'exodus-reviewer',
  }), /targetMapping.path/)

  assert.throws(() => createExodusPromotionProposal({
    workspace,
    claims,
    claimId: 'mira-concise',
    targetMapping: { target: 'userModel', path: 'selfModel', value: { preference: 'concise' } },
    proposer: 'exodus-reviewer',
  }), /must explicitly match/)

  assert.throws(() => createExodusPromotionProposal({
    workspace,
    claims,
    claimId: 'mira-concise',
    targetMapping: { target: 'userModel', path: 'userModel' },
    proposer: 'exodus-reviewer',
  }), /targetMapping.value/)
})

test('accepted claim in a declared unresolved conflict cannot silently generate a promotion proposal', () => {
  let workspace = reviewedWorkspace()
  workspace = addExodusClaimRelationship(workspace, claims, {
    leftClaimId: 'mira-concise',
    rightClaimId: 'mira-detailed',
    relationship: 'conflict',
    recordedBy: 'human-reviewer',
    recordedAt: '2026-08-27T13:25:00Z',
    rationale: 'Both cannot be promoted as unconditional preferences without resolving scope.',
  })

  assert.throws(() => promotion(workspace), /unresolved declared conflict/)
})

test('a declared conflict no longer blocks promotion after the counterpart is explicitly rejected', () => {
  let workspace = reviewedWorkspace()
  workspace = addExodusClaimRelationship(workspace, claims, {
    leftClaimId: 'mira-concise',
    rightClaimId: 'mira-detailed',
    relationship: 'conflict',
    recordedBy: 'human-reviewer',
    recordedAt: '2026-08-27T13:25:00Z',
    rationale: 'Both cannot be promoted as unconditional preferences without resolving scope.',
  })
  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: 'mira-detailed',
    state: 'rejected',
    reviewer: 'human-reviewer',
    reviewedAt: '2026-08-27T13:27:00Z',
    rationale: 'The detailed-answer preference was context-specific and should not be promoted.',
  })

  const proposal = promotion(workspace)
  assert.equal(proposal.provenance.candidateClaim.id, 'mira-concise')
  assert.equal(proposal.review, null)
})
