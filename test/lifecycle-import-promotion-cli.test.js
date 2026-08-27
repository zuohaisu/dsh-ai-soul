import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createLifecycleImportPromotionProposal } from '../src/lifecycle-import-promote.js'
import {
  appendExodusReviewDecision,
  createExodusReviewWorkspace,
} from '../src/core/exodus-review-workspace.js'

function asterClaim() {
  return {
    claimVersion: 1,
    id: 'aster-import-pref-001',
    claimType: 'user-model',
    statement: 'Aster learned that the user prefers concise collaboration updates.',
    interpretation: 'A durable collaboration preference from imported history.',
    evidence: [{
      sourceId: 'aster-external-memory',
      algorithm: 'sha256',
      digest: 'digest-aster-external-001',
      unitId: 'unit-aster-pref-001',
      lineStart: 3,
      lineEnd: 4,
      headingPath: ['Working style'],
      support: 'The preference is stated directly in preserved source evidence.',
    }],
    counterEvidence: [],
    confidence: { score: 0.81, rationale: 'Direct imported evidence with explicit provenance.' },
    canonicalStatus: 'candidate',
    runtimePhenotypeRisk: 'low',
    notes: null,
    canonicalMutation: false,
  }
}

async function fixture(reviewState = 'accepted-for-promotion') {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-promote-'))
  const importDir = join(root, 'import')
  const reviewDir = join(root, 'review')
  await Promise.all([mkdir(importDir), mkdir(reviewDir)])

  const claim = asterClaim()
  const claims = [claim]
  let workspace = createExodusReviewWorkspace({
    id: 'aster-import-review-001',
    claims,
    createdAt: '2026-08-28T00:00:00Z',
    createdBy: 'aster-migration-agent',
  })
  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: claim.id,
    state: reviewState,
    reviewer: 'human-reviewer',
    reviewedAt: '2026-08-28T00:05:00Z',
    rationale: 'Preserved evidence is sufficient for a governed proposal.',
  })

  await Promise.all([
    writeFile(join(importDir, 'target.json'), `${JSON.stringify({
      bindingVersion: 1,
      targetSoulId: 'aster',
      baseline: {
        algorithm: 'sha256',
        digest: 'baseline-digest-aster-001',
        capturedAt: '2026-08-28T00:00:00Z',
        file: 'target-baseline.json',
      },
      canonicalMutation: false,
      profileMutation: false,
    }, null, 2)}\n`),
    writeFile(join(reviewDir, 'claims.json'), `${JSON.stringify({ claims }, null, 2)}\n`),
    writeFile(join(reviewDir, 'review-workspace.json'), `${JSON.stringify(workspace, null, 2)}\n`),
  ])

  return { importDir, reviewDir, claim }
}

test('accepted lifecycle-import claim creates an unreviewed proposal with target-baseline provenance', async () => {
  const { importDir, reviewDir, claim } = await fixture()
  const result = await createLifecycleImportPromotionProposal({
    importDir,
    reviewDir,
    claimId: claim.id,
    target: 'userModel',
    path: 'userModel',
    value: { preference: 'concise collaboration updates', source: 'external-import' },
    proposer: 'human-reviewer',
    proposalId: 'proposal-aster-import-001',
    at: '2026-08-28T00:10:00Z',
  })

  assert.equal(result.canonicalMutation, false)
  assert.equal(result.profileMutation, false)
  assert.equal(result.proposal.review, null)
  assert.equal(result.proposal.target, 'userModel')
  assert.equal(result.proposal.provenance.kind, 'generic-exodus-promotion')
  assert.equal(result.proposal.provenance.candidateClaim.id, claim.id)
  assert.equal(result.proposal.provenance.lifecycleImportTarget.targetSoulId, 'aster')
  assert.equal(result.proposal.provenance.lifecycleImportTarget.baseline.digest, 'baseline-digest-aster-001')
  assert.equal(result.proposal.provenance.canonicalMutation, false)
  assert.equal(result.proposal.provenance.profileMutation, false)

  const persisted = JSON.parse(await readFile(result.proposalFile, 'utf8'))
  assert.deepEqual(persisted, result.proposal)
})

test('non-accepted lifecycle-import claim fails closed', async () => {
  const { importDir, reviewDir, claim } = await fixture('needs-more-evidence')

  await assert.rejects(() => createLifecycleImportPromotionProposal({
    importDir,
    reviewDir,
    claimId: claim.id,
    target: 'userModel',
    path: 'userModel',
    value: { preference: 'concise' },
    proposer: 'human-reviewer',
    proposalId: 'proposal-aster-import-pending',
    at: '2026-08-28T00:10:00Z',
  }), /not accepted-for-promotion/)
})

test('lifecycle import promotion never infers a target path', async () => {
  const { importDir, reviewDir, claim } = await fixture()

  await assert.rejects(() => createLifecycleImportPromotionProposal({
    importDir,
    reviewDir,
    claimId: claim.id,
    target: 'userModel',
    path: 'selfModel',
    value: { preference: 'concise' },
    proposer: 'human-reviewer',
    proposalId: 'proposal-aster-import-wrong-target',
    at: '2026-08-28T00:10:00Z',
  }), /must explicitly match/)
})
