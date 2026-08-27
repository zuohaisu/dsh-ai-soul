import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  addExodusClaimRelationship,
  appendExodusReviewDecision,
  createExodusCandidateClaim,
  createExodusPromotionProposal,
  createExodusReviewWorkspace,
  createExodusSource,
  normalizeMarkdownEvidence,
} from '../src/core/index.js'

const fixtureUrl = new URL('./fixtures/exodus/mira-memory.md', import.meta.url)

function evidenceUnitByText(normalized, text) {
  const unit = normalized.units.find((entry) => entry.rawText.includes(text))
  assert.ok(unit, `expected evidence unit containing: ${text}`)
  return unit
}

test('non-Samuel memory export traverses Generic Exodus into a governed proposal', async () => {
  const markdown = await readFile(fixtureUrl, 'utf8')
  const source = createExodusSource({
    sourceId: 'mira-memory-export-001',
    sourceType: 'memory-export',
    provider: 'example-chat-runtime',
    capturedAt: '2026-08-20T10:00:00Z',
    filename: 'mira-memory.md',
    mediaType: 'text/markdown',
    content: markdown,
    provenance: {
      suppliedBy: 'rowan',
      acquisition: 'user-export',
    },
  })
  const normalized = normalizeMarkdownEvidence({ source, content: markdown })
  const conciseUnit = evidenceUnitByText(normalized, 'usually prefers concise progress updates')
  const detailedUnit = evidenceUnitByText(normalized, 'asked for exhaustive explanations')

  const conciseClaim = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'mira-rowan-concise',
    claimType: 'user-model',
    statement: 'Rowan generally prefers concise progress updates with the decision and next action first.',
    interpretation: 'Likely durable collaboration preference, with context-sensitive exceptions.',
    evidence: [{
      unitId: conciseUnit.unitId,
      support: 'The imported memory directly states the usual preference.',
    }],
    counterEvidence: [{
      unitId: detailedUnit.unitId,
      support: 'Complex planning sessions sometimes required exhaustive explanations.',
    }],
    confidence: {
      score: 0.82,
      rationale: 'Direct usual-case statement with an explicit contextual exception.',
    },
    runtimePhenotypeRisk: 'low',
  })

  const detailedClaim = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'mira-rowan-detailed',
    claimType: 'user-model',
    statement: 'Rowan prefers exhaustive explanations before deciding.',
    interpretation: 'Potentially context-specific rather than a general preference.',
    evidence: [{
      unitId: detailedUnit.unitId,
      support: 'The export records several planning sessions with this request.',
    }],
    counterEvidence: [{
      unitId: conciseUnit.unitId,
      support: 'The export explicitly says concise updates are the usual preference.',
    }],
    confidence: {
      score: 0.58,
      rationale: 'Supported in a narrower context and contradicted as a general rule.',
    },
    runtimePhenotypeRisk: 'low',
  })

  const claims = [conciseClaim, detailedClaim]
  let workspace = createExodusReviewWorkspace({
    id: 'mira-exodus-e2e-001',
    claims,
    createdAt: '2026-08-27T14:00:00Z',
    createdBy: 'migration-agent',
  })
  workspace = addExodusClaimRelationship(workspace, claims, {
    leftClaimId: conciseClaim.id,
    rightClaimId: detailedClaim.id,
    relationship: 'conflict',
    recordedBy: 'rowan',
    recordedAt: '2026-08-27T14:05:00Z',
    rationale: 'These cannot both be promoted as unconditional general preferences.',
  })
  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: conciseClaim.id,
    state: 'accepted-for-promotion',
    reviewer: 'rowan',
    reviewedAt: '2026-08-27T14:10:00Z',
    rationale: 'The concise preference is the explicit usual-case rule.',
  })
  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: detailedClaim.id,
    state: 'needs-more-evidence',
    reviewer: 'rowan',
    reviewedAt: '2026-08-27T14:11:00Z',
    rationale: 'The detailed preference may only apply to complex planning sessions.',
  })

  assert.throws(() => createExodusPromotionProposal({
    workspace,
    claims,
    claimId: conciseClaim.id,
    targetMapping: {
      target: 'userModel',
      path: 'userModel',
      value: { preference: 'concise progress updates', qualifier: 'default' },
    },
    proposer: 'rowan',
  }), /unresolved declared conflict/)

  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: detailedClaim.id,
    state: 'rejected',
    reviewer: 'rowan',
    reviewedAt: '2026-08-27T14:15:00Z',
    rationale: 'The detailed preference is retained as contextual evidence, not a general user-model claim.',
  })

  const before = structuredClone({ source, normalized, claims, workspace })
  const proposal = createExodusPromotionProposal({
    workspace,
    claims,
    claimId: conciseClaim.id,
    targetMapping: {
      target: 'userModel',
      path: 'userModel',
      value: {
        preference: 'concise progress updates',
        qualifier: 'default; complex planning may warrant more detail',
      },
    },
    proposer: 'rowan',
    proposalId: 'mira-promotion-001',
    at: '2026-08-27T14:20:00Z',
  })

  assert.equal(source.canonicalMutation, false)
  assert.equal(normalized.canonicalMutation, false)
  assert.equal(conciseClaim.canonicalMutation, false)
  assert.equal(workspace.canonicalMutation, false)
  assert.equal(proposal.review, null)
  assert.equal(proposal.target, 'userModel')
  assert.equal(proposal.provenance.reviewDecision.state, 'accepted-for-promotion')
  assert.equal(proposal.provenance.candidateClaim.id, conciseClaim.id)
  assert.equal(proposal.evidence[0].sourceId, source.sourceId)
  assert.equal(proposal.evidence[0].digest, source.digest.value)
  assert.deepEqual({ source, normalized, claims, workspace }, before)
})
