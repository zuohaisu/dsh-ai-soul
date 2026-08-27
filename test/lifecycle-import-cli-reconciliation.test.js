import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createExodusReviewWorkspace, createSoulState } from '../src/core/index.js'
import { reconcileLifecycleImportClaim } from '../src/lifecycle-import-reconcile.js'
import { updateExodusReviewWorkspace } from '../src/exodus-review-update.js'

function makeClaim() {
  return {
    claimVersion: 1,
    id: 'aster-claim-001',
    claimType: 'identity',
    statement: 'The imported source names this partner Nova.',
    interpretation: null,
    evidence: [{
      sourceId: 'external-aster-001',
      algorithm: 'sha256',
      digest: 'abc123',
      unitId: 'unit-001',
      lineStart: 1,
      lineEnd: 1,
      headingPath: [],
      support: 'Explicit name in imported history.',
    }],
    counterEvidence: [],
    confidence: { score: 0.8, rationale: 'Explicit source statement.' },
    canonicalStatus: 'candidate',
    runtimePhenotypeRisk: 'low',
    notes: null,
    canonicalMutation: false,
  }
}

test('reconciles and semantically reviews a non-Samuel import without mutating source artifacts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-lifecycle-cli-'))
  const importDir = join(root, 'import-001')
  const reviewDir = join(root, 'review')
  await mkdir(importDir, { recursive: true })
  await mkdir(reviewDir, { recursive: true })

  const baseline = createSoulState({ soulId: 'aster', name: 'Aster', createdAt: '2026-08-28T00:00:00.000Z' })
  const baselineBytes = Buffer.from(`${JSON.stringify(baseline, null, 2)}\n`)
  const target = {
    bindingVersion: 1,
    targetSoulId: 'aster',
    baseline: {
      algorithm: 'sha256',
      digest: createHash('sha256').update(baselineBytes).digest('hex'),
      capturedAt: '2026-08-28T00:30:00.000Z',
      file: 'target-baseline.json',
    },
    canonicalMutation: false,
    profileMutation: false,
  }
  const claim = makeClaim()
  const workspace = createExodusReviewWorkspace({
    id: 'aster-review-001',
    claims: [claim],
    createdAt: '2026-08-28T00:40:00.000Z',
    createdBy: 'rowan',
  })

  await writeFile(join(importDir, 'target-baseline.json'), baselineBytes)
  await writeFile(join(importDir, 'target.json'), `${JSON.stringify(target, null, 2)}\n`)
  await writeFile(join(reviewDir, 'claims.json'), `${JSON.stringify({ claims: [claim] }, null, 2)}\n`)
  await writeFile(join(reviewDir, 'review-workspace.json'), `${JSON.stringify(workspace, null, 2)}\n`)

  const targetBefore = await readFile(join(importDir, 'target.json'))
  const baselineBefore = await readFile(join(importDir, 'target-baseline.json'))
  const claimsBefore = await readFile(join(reviewDir, 'claims.json'))

  const reconciled = await reconcileLifecycleImportClaim({
    importDir,
    reviewDir,
    claimId: claim.id,
    reconciliationId: 'aster-reconcile-001',
    targetPath: ['identity', 'name'],
    proposedValue: 'Nova',
    rationale: 'Compare imported name evidence with frozen Aster baseline.',
    recordedBy: 'rowan',
    recordedAt: '2026-08-28T01:00:00.000Z',
  })

  assert.equal(reconciled.reconciliation.comparison, 'different')
  assert.equal(reconciled.reconciliation.canonicalMutation, false)

  const reviewed = await updateExodusReviewWorkspace({
    reviewDir,
    operation: {
      type: 'reconciliation-review',
      reconciliationFile: reconciled.reconciliationFile,
      value: {
        disposition: 'uncertain',
        reviewer: 'rowan',
        reviewedAt: '2026-08-28T01:10:00.000Z',
        rationale: 'A different imported name does not establish identity replacement.',
      },
    },
  })

  assert.equal(reviewed.workspace.reconciliationReviews.at(-1).disposition, 'uncertain')
  assert.equal(reviewed.workspace.reconciliationReviews.at(-1).targetSoulId, 'aster')
  assert.equal(reviewed.canonicalMutation, false)
  assert.deepEqual(await readFile(join(importDir, 'target.json')), targetBefore)
  assert.deepEqual(await readFile(join(importDir, 'target-baseline.json')), baselineBefore)
  assert.deepEqual(await readFile(join(reviewDir, 'claims.json')), claimsBefore)
})
