import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createExodusReviewWorkspace } from '../src/core/exodus-review-workspace.js'
import { updateExodusReviewWorkspace } from '../src/exodus-review-update.js'

function claim(id) {
  return {
    claimVersion: 1,
    id,
    claimType: 'identity',
    statement: `${id} statement`,
    interpretation: null,
    evidence: [{
      sourceId: 'mira-memory', algorithm: 'sha256', digest: 'abc123', unitId: `unit-${id}`,
      lineStart: 1, lineEnd: 1, headingPath: ['Identity'], support: 'Direct statement',
    }],
    counterEvidence: [],
    confidence: { score: 0.6, rationale: 'Single source' },
    canonicalStatus: 'candidate', runtimePhenotypeRisk: 'unknown', notes: null, canonicalMutation: false,
  }
}

test('updates relationships and decisions while leaving claims bytes unchanged', async () => {
  const reviewDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-review-'))
  const claims = [claim('mira-quiet'), claim('mira-expressive')]
  const workspace = createExodusReviewWorkspace({
    id: 'mira-review-001', claims, createdAt: '2026-08-28T00:00:00Z', createdBy: 'migration-agent',
  })
  const claimsPath = join(reviewDir, 'claims.json')
  const workspacePath = join(reviewDir, 'review-workspace.json')
  await writeFile(claimsPath, `${JSON.stringify({ claims }, null, 2)}\n`)
  await writeFile(workspacePath, `${JSON.stringify(workspace, null, 2)}\n`)
  const beforeClaims = await readFile(claimsPath)

  await updateExodusReviewWorkspace({ reviewDir, operation: { type: 'relationship', value: {
    leftClaimId: 'mira-quiet', rightClaimId: 'mira-expressive', relationship: 'conflict',
    recordedBy: 'reviewer-1', recordedAt: '2026-08-28T00:05:00Z', rationale: 'Conflicting stable-trait interpretations.',
  } } })
  await updateExodusReviewWorkspace({ reviewDir, operation: { type: 'decision', value: {
    claimId: 'mira-quiet', state: 'accepted-for-promotion', reviewer: 'reviewer-1',
    reviewedAt: '2026-08-28T00:10:00Z', rationale: 'Supported after explicit review.',
  } } })

  assert.deepEqual(await readFile(claimsPath), beforeClaims)
  const updated = JSON.parse(await readFile(workspacePath, 'utf8'))
  assert.equal(updated.relationships.length, 1)
  assert.equal(updated.decisions.length, 1)
  assert.equal(updated.decisions[0].state, 'accepted-for-promotion')
  assert.equal(updated.canonicalMutation, false)
})

test('fails closed on unknown claim references without rewriting workspace', async () => {
  const reviewDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-review-'))
  const claims = [claim('mira-known')]
  const workspace = createExodusReviewWorkspace({
    id: 'mira-review-002', claims, createdAt: '2026-08-28T00:00:00Z', createdBy: 'migration-agent',
  })
  await writeFile(join(reviewDir, 'claims.json'), `${JSON.stringify({ claims }, null, 2)}\n`)
  const workspacePath = join(reviewDir, 'review-workspace.json')
  await writeFile(workspacePath, `${JSON.stringify(workspace, null, 2)}\n`)
  const before = await readFile(workspacePath)

  await assert.rejects(() => updateExodusReviewWorkspace({ reviewDir, operation: { type: 'decision', value: {
    claimId: 'missing', state: 'rejected', reviewer: 'reviewer-1', reviewedAt: '2026-08-28T00:10:00Z', rationale: 'Unknown claim.',
  } } }), /unknown claim/)
  assert.deepEqual(await readFile(workspacePath), before)
})
