import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  appendExodusReviewDecision,
  createExodusCandidateClaim,
  createExodusReviewWorkspace,
  createGenesisRecord,
  persistGenesisSoul,
} from '../src/core/index.js'
import { prepareMarkdownLifecycleImportWorkspace } from '../src/lifecycle-import-prepare.js'
import { createLifecycleImportPromotionProposal } from '../src/lifecycle-import-promote.js'

async function buildAcceptedProposal({ root, soulStoreDir, sourceName, sourceText, sourceId, importIndex }) {
  const sourceFile = join(root, sourceName)
  const importDir = join(root, `import-${importIndex}`)
  const reviewDir = join(root, `review-${importIndex}`)
  await writeFile(sourceFile, `${sourceText}\n`)

  const prepared = await prepareMarkdownLifecycleImportWorkspace({
    sourceFile,
    sourceId,
    sourceType: 'memory-export',
    provider: 'external-chat-runtime',
    capturedAt: `2026-07-${String(10 + importIndex).padStart(2, '0')}T00:00:00.000Z`,
    importedAt: '2026-08-20T00:00:00.000Z',
    outputDir: importDir,
    soulStoreDir,
    targetSoulId: 'lyra-repeatable',
  })

  const normalizedEvidence = JSON.parse(await readFile(join(prepared.evidenceDir, 'evidence.json'), 'utf8'))
  const unit = normalizedEvidence.units.find((candidate) => candidate.rawText.includes(sourceText))
  assert.ok(unit)

  const claim = createExodusCandidateClaim({
    normalizedEvidence,
    id: `lyra-import-claim-${importIndex}`,
    claimType: 'user-model',
    statement: sourceText,
    interpretation: `Imported history ${importIndex} is candidate evidence only.`,
    evidence: [{ unitId: unit.unitId, support: 'Preserved external evidence.' }],
    counterEvidence: [],
    confidence: { score: 0.8, rationale: 'Direct statement in imported evidence.' },
    runtimePhenotypeRisk: 'low',
  })

  const claims = [claim]
  let workspace = createExodusReviewWorkspace({
    id: `lyra-review-${importIndex}`,
    claims,
    createdAt: `2026-08-20T00:0${importIndex}:00.000Z`,
    createdBy: 'migration-reviewer',
  })
  workspace = appendExodusReviewDecision(workspace, claims, {
    claimId: claim.id,
    state: 'accepted-for-promotion',
    reviewer: 'human-reviewer',
    reviewedAt: `2026-08-20T00:1${importIndex}:00.000Z`,
    rationale: 'Eligible for a governed proposal; no canonical mutation occurs here.',
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
    value: { key: `external-note-${importIndex}`, value: sourceText },
    proposer: 'human-reviewer',
    proposalId: `proposal-lyra-import-${importIndex}`,
    at: `2026-08-20T00:2${importIndex}:00.000Z`,
  })

  return { prepared, claim, promoted }
}

test('repeated imports into one unchanged Soul remain distinct through proposal provenance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-repeatable-import-'))
  const soulStoreDir = join(root, 'souls')
  const store = new FileSoulStore({ rootDir: soulStoreDir })

  const genesis = createGenesisRecord({
    id: 'genesis-lyra-repeatable-001',
    at: '2026-08-01T00:00:00.000Z',
    soulId: 'lyra-repeatable',
    name: 'Lyra',
    participants: [{ id: 'person-ember', role: 'human-partner' }],
    provenance: { method: 'explicit-first-meeting', source: 'repeatable-import-test' },
    firstMeetingNote: 'Lyra and Ember began without imported history.',
  })
  await persistGenesisSoul(store, genesis)
  const liveSoulBeforeImports = await readFile(join(soulStoreDir, 'lyra-repeatable.json'))

  const first = await buildAcceptedProposal({
    root,
    soulStoreDir,
    sourceName: 'memory-one.md',
    sourceText: 'Ember once preferred numbered explanations.',
    sourceId: 'lyra-external-one',
    importIndex: 1,
  })
  const second = await buildAcceptedProposal({
    root,
    soulStoreDir,
    sourceName: 'memory-two.md',
    sourceText: 'Ember later preferred examples before theory.',
    sourceId: 'lyra-external-two',
    importIndex: 2,
  })

  assert.ok(first.prepared.target.importId)
  assert.ok(second.prepared.target.importId)
  assert.notEqual(first.prepared.target.importId, second.prepared.target.importId)
  assert.equal(first.prepared.target.targetSoulId, 'lyra-repeatable')
  assert.equal(second.prepared.target.targetSoulId, 'lyra-repeatable')
  assert.equal(first.prepared.target.baseline.digest, second.prepared.target.baseline.digest)

  const firstProvenance = first.promoted.proposal.provenance.lifecycleImportTarget
  const secondProvenance = second.promoted.proposal.provenance.lifecycleImportTarget
  assert.equal(firstProvenance.importId, first.prepared.target.importId)
  assert.equal(secondProvenance.importId, second.prepared.target.importId)
  assert.notEqual(firstProvenance.importId, secondProvenance.importId)
  assert.equal(firstProvenance.targetSoulId, secondProvenance.targetSoulId)
  assert.equal(firstProvenance.baseline.digest, secondProvenance.baseline.digest)
  assert.equal(first.promoted.proposal.provenance.candidateClaim.id, first.claim.id)
  assert.equal(second.promoted.proposal.provenance.candidateClaim.id, second.claim.id)

  assert.equal(first.promoted.canonicalMutation, false)
  assert.equal(second.promoted.canonicalMutation, false)
  assert.deepEqual(await readFile(join(soulStoreDir, 'lyra-repeatable.json')), liveSoulBeforeImports)
  assert.doesNotMatch(JSON.stringify([first.promoted.proposal, second.promoted.proposal]), /samuel/i)
})
