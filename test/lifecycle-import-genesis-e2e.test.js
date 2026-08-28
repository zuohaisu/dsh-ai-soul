import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  appendExodusReconciliationReview,
  appendExodusReviewDecision,
  createExodusCandidateClaim,
  createExodusReviewWorkspace,
  createGenesisRecord,
  createLifecycleImportReconciliation,
  persistGenesisSoul,
} from '../src/core/index.js'
import { prepareMarkdownLifecycleImportWorkspace } from '../src/lifecycle-import-prepare.js'
import { createLifecycleImportPromotionProposal } from '../src/lifecycle-import-promote.js'

test('Genesis Soul can grow locally, ingest later evidence, and reach a governed proposal without silent overwrite', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-lifecycle-e2e-'))
  const soulStoreDir = join(root, 'souls')
  const importDir = join(root, 'import-001')
  const reviewDir = join(root, 'review-001')
  const sourceFile = join(root, 'memory.md')
  const store = new FileSoulStore({ rootDir: soulStoreDir })

  const genesis = createGenesisRecord({
    id: 'genesis-nova-lifecycle-001',
    at: '2026-08-01T00:00:00.000Z',
    soulId: 'nova-lifecycle',
    name: 'Nova',
    participants: [{ id: 'person-river', role: 'human-partner' }],
    provenance: { method: 'explicit-first-meeting', source: 'lifecycle-e2e-test' },
    firstMeetingNote: 'Nova and River began a new relationship without imported history.',
  })
  await persistGenesisSoul(store, genesis)

  const locallyEvolved = await store.load('nova-lifecycle')
  locallyEvolved.userModel.push({ key: 'answer-style', value: 'concise' })
  locallyEvolved.autobiography.push({
    id: 'nova-local-001',
    at: '2026-08-10T00:00:00.000Z',
    summary: 'Nova learned through local shared work that River prefers concise answers.',
    provenance: { method: 'local-shared-experience' },
  })
  await store.save(locallyEvolved)
  const liveSoulBeforeImport = await readFile(join(soulStoreDir, 'nova-lifecycle.json'))

  await writeFile(sourceFile, [
    '# Earlier external history',
    '',
    'River previously asked for detailed answers with extensive context.',
    '',
  ].join('\n'))

  const prepared = await prepareMarkdownLifecycleImportWorkspace({
    sourceFile,
    sourceId: 'nova-external-001',
    sourceType: 'memory-export',
    provider: 'external-chat-runtime',
    capturedAt: '2026-07-15T00:00:00.000Z',
    importedAt: '2026-08-20T00:00:00.000Z',
    outputDir: importDir,
    soulStoreDir,
    targetSoulId: 'nova-lifecycle',
  })

  const baselineBytes = await readFile(prepared.baselineFile)
  const baseline = JSON.parse(baselineBytes.toString('utf8'))
  assert.deepEqual(baseline.userModel, [{ key: 'answer-style', value: 'concise' }])
  assert.equal(baseline.autobiography.at(-1).id, 'nova-local-001')
  assert.deepEqual(await readFile(join(soulStoreDir, 'nova-lifecycle.json')), liveSoulBeforeImport)

  const normalizedEvidence = JSON.parse(await readFile(join(prepared.evidenceDir, 'evidence.json'), 'utf8'))
  const evidenceUnit = normalizedEvidence.units.find((unit) => unit.rawText.includes('detailed answers'))
  assert.ok(evidenceUnit, 'expected normalized evidence unit for the imported answer-style statement')

  const claim = createExodusCandidateClaim({
    normalizedEvidence,
    id: 'nova-import-answer-style-001',
    claimType: 'user-model',
    statement: 'River prefers detailed answers with extensive context.',
    interpretation: 'Earlier external history records a different answer-style preference.',
    evidence: [{
      unitId: evidenceUnit.unitId,
      support: 'The preserved external history explicitly asks for detailed answers.',
    }],
    counterEvidence: [{ note: 'The frozen current Soul baseline records a later concise-answer preference.' }],
    confidence: { score: 0.9, rationale: 'Direct statement in preserved external evidence.' },
    runtimePhenotypeRisk: 'low',
  })

  const targetBinding = JSON.parse(await readFile(prepared.targetFile, 'utf8'))
  const reconciliation = createLifecycleImportReconciliation({
    id: 'nova-reconcile-answer-style-001',
    targetBinding,
    baselineBytes,
    claim,
    targetPath: ['userModel', 0, 'value'],
    proposedValue: 'detailed',
    rationale: 'Compare imported answer-style evidence to the frozen current Soul baseline.',
    recordedBy: 'migration-reviewer',
    recordedAt: '2026-08-20T00:05:00.000Z',
  })
  assert.equal(reconciliation.comparison, 'different')
  assert.equal(reconciliation.baselineValue, 'concise')
  assert.equal(reconciliation.proposedValue, 'detailed')
  assert.equal(reconciliation.canonicalMutation, false)

  const claims = [claim]
  let workspace = createExodusReviewWorkspace({
    id: 'nova-review-001',
    claims,
    createdAt: '2026-08-20T00:06:00.000Z',
    createdBy: 'migration-reviewer',
  })
  workspace = appendExodusReconciliationReview(workspace, claims, reconciliation, {
    disposition: 'coexistence',
    reviewer: 'human-reviewer',
    reviewedAt: '2026-08-20T00:07:00.000Z',
    rationale: 'The older preference may coexist as historical evidence; structural difference alone is not an overwrite instruction.',
  })
  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: claim.id,
    state: 'accepted-for-promotion',
    reviewer: 'human-reviewer',
    reviewedAt: '2026-08-20T00:08:00.000Z',
    rationale: 'The evidence is suitable for a governed proposal while retaining explicit review authority.',
  })

  await mkdir(reviewDir)
  await Promise.all([
    writeFile(join(reviewDir, 'claims.json'), `${JSON.stringify({ claims }, null, 2)}\n`),
    writeFile(join(reviewDir, 'review-workspace.json'), `${JSON.stringify(workspace, null, 2)}\n`),
  ])

  const promoted = await createLifecycleImportPromotionProposal({
    importDir,
    reviewDir,
    claimId: claim.id,
    target: 'userModel',
    path: 'userModel',
    value: { key: 'answer-style', value: 'detailed', temporalContext: 'earlier-external-history' },
    proposer: 'human-reviewer',
    proposalId: 'proposal-nova-import-001',
    at: '2026-08-20T00:09:00.000Z',
  })

  assert.equal(promoted.canonicalMutation, false)
  assert.equal(promoted.profileMutation, false)
  assert.equal(promoted.proposal.review, null)
  assert.equal(promoted.proposal.provenance.candidateClaim.id, claim.id)
  assert.equal(promoted.proposal.provenance.lifecycleImportTarget.targetSoulId, 'nova-lifecycle')
  assert.equal(
    promoted.proposal.provenance.lifecycleImportTarget.baseline.digest,
    targetBinding.baseline.digest,
  )

  // Import, reconciliation, semantic review, and proposal creation have no canonical write authority.
  assert.deepEqual(await readFile(join(soulStoreDir, 'nova-lifecycle.json')), liveSoulBeforeImport)
  const liveSoulAfterProposal = await store.load('nova-lifecycle')
  assert.equal(liveSoulAfterProposal.userModel[0].value, 'concise')
  assert.equal(liveSoulAfterProposal.autobiography.at(-1).id, 'nova-local-001')
  assert.doesNotMatch(JSON.stringify(promoted.proposal), /samuel/i)
})
