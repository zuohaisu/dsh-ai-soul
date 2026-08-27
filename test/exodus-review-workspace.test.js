import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addExodusClaimRelationship,
  appendExodusReviewDecision,
  createExodusReviewWorkspace,
  getExodusClaimReviewState,
  validateExodusReviewWorkspace,
} from '../src/core/exodus-review-workspace.js'

function claim(id, statement, score = 0.6) {
  return {
    claimVersion: 1,
    id,
    claimType: 'identity',
    statement,
    interpretation: null,
    evidence: [{
      sourceId: 'aster-memory',
      algorithm: 'sha256',
      digest: 'abc123',
      unitId: `unit-${id}`,
      lineStart: 1,
      lineEnd: 1,
      headingPath: ['Identity'],
      support: 'Directly stated in imported notes',
    }],
    counterEvidence: [],
    confidence: { score, rationale: 'Single-source evidence remains uncertain' },
    canonicalStatus: 'candidate',
    runtimePhenotypeRisk: 'unknown',
    notes: null,
    canonicalMutation: false,
  }
}

const claims = [
  claim('aster-quiet', 'Aster is consistently quiet and reserved.'),
  claim('aster-expressive', 'Aster is expressive and socially energetic.'),
]

test('ambiguous non-Samuel claims coexist unreviewed until explicitly reviewed', () => {
  const workspace = createExodusReviewWorkspace({
    id: 'aster-migration-001',
    claims,
    createdAt: '2026-08-27T12:00:00Z',
    createdBy: 'migration-agent',
  })

  assert.equal(workspace.canonicalMutation, false)
  assert.equal(getExodusClaimReviewState(workspace, 'aster-quiet'), 'unreviewed')
  assert.equal(getExodusClaimReviewState(workspace, 'aster-expressive'), 'unreviewed')
  assert.deepEqual(workspace.decisions, [])
  assert.ok(Object.isFrozen(workspace))
})

test('conflicting claims are represented explicitly without changing either claim', () => {
  const originalClaims = structuredClone(claims)
  const workspace = createExodusReviewWorkspace({
    id: 'aster-migration-001',
    claims,
    createdAt: '2026-08-27T12:00:00Z',
    createdBy: 'migration-agent',
  })

  const updated = addExodusClaimRelationship(workspace, claims, {
    leftClaimId: 'aster-quiet',
    rightClaimId: 'aster-expressive',
    relationship: 'conflict',
    recordedBy: 'reviewer-1',
    recordedAt: '2026-08-27T12:05:00Z',
    rationale: 'Both statements cannot be canonicalized as unconditional stable traits.',
  })

  assert.equal(workspace.relationships.length, 0)
  assert.equal(updated.relationships.length, 1)
  assert.equal(updated.relationships[0].relationship, 'conflict')
  assert.equal(updated.canonicalMutation, false)
  assert.deepEqual(claims, originalClaims)
})

test('review decisions are append-only audit records and latest state is projected', () => {
  const workspace = createExodusReviewWorkspace({
    id: 'aster-migration-001',
    claims,
    createdAt: '2026-08-27T12:00:00Z',
    createdBy: 'migration-agent',
  })

  const needsEvidence = appendExodusReviewDecision(workspace, claims, {
    claimId: 'aster-quiet',
    state: 'needs-more-evidence',
    reviewer: 'reviewer-1',
    reviewedAt: '2026-08-27T12:10:00Z',
    rationale: 'One memory note is insufficient to establish a durable identity trait.',
  })
  const rejected = appendExodusReviewDecision(needsEvidence, claims, {
    claimId: 'aster-quiet',
    state: 'rejected',
    reviewer: 'reviewer-2',
    reviewedAt: '2026-08-27T12:20:00Z',
    rationale: 'Additional evidence shows the behavior was context-specific.',
  })

  assert.equal(workspace.decisions.length, 0)
  assert.equal(needsEvidence.decisions.length, 1)
  assert.equal(rejected.decisions.length, 2)
  assert.equal(getExodusClaimReviewState(rejected, 'aster-quiet'), 'rejected')
  assert.equal(rejected.canonicalMutation, false)
})

test('unknown claim references and invalid serialized workspaces are rejected', () => {
  const workspace = createExodusReviewWorkspace({
    id: 'aster-migration-001',
    claims,
    createdAt: '2026-08-27T12:00:00Z',
    createdBy: 'migration-agent',
  })

  assert.throws(() => appendExodusReviewDecision(workspace, claims, {
    claimId: 'missing',
    state: 'rejected',
    reviewer: 'reviewer-1',
    reviewedAt: '2026-08-27T12:10:00Z',
    rationale: 'Unknown claim should fail.',
  }), /unknown claim/)

  const invalid = structuredClone(workspace)
  invalid.claimIds.push('missing')
  assert.equal(validateExodusReviewWorkspace(invalid).valid, true)
  assert.throws(() => appendExodusReviewDecision(invalid, claims, {
    claimId: 'aster-quiet',
    state: 'rejected',
    reviewer: 'reviewer-1',
    reviewedAt: '2026-08-27T12:10:00Z',
    rationale: 'Workspace must resolve all claim references.',
  }), /workspace references unknown claim/)
})
