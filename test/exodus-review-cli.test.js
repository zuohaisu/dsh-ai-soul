import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

import { prepareMarkdownExodusWorkspace } from '../src/exodus-prepare.js'

const execFileAsync = promisify(execFile)
const fixture = resolve('test/fixtures/exodus/mira-memory.md')
const cli = resolve('src/cli/prepare-exodus-review.js')

async function prepare(root) {
  const preparedWorkspace = join(root, 'prepared')
  await prepareMarkdownExodusWorkspace({
    sourceFile: fixture,
    sourceId: 'mira-memory-review-001',
    sourceType: 'memory-export',
    provider: 'example-chat-runtime',
    capturedAt: '2026-08-27T09:00:00.000Z',
    importedAt: '2026-08-27T09:05:00.000Z',
    outputDir: preparedWorkspace,
  })
  const evidence = JSON.parse(await readFile(join(preparedWorkspace, 'evidence.json'), 'utf8'))
  return { preparedWorkspace, evidence }
}

function cliArgs({ preparedWorkspace, claimsFile, outputDir, extra = [] }) {
  return [
    cli,
    '--prepared-workspace', preparedWorkspace,
    '--claims-file', claimsFile,
    '--workspace-id', 'mira-review-001',
    '--created-by', 'migration-agent',
    '--created-at', '2026-08-27T12:00:00.000Z',
    '--output-dir', outputDir,
    ...extra,
  ]
}

function claimDocument(unitId) {
  return {
    claims: [{
      id: 'mira-claim-001',
      claimType: 'relationship',
      statement: 'Mira and Rowan have an established collaborative relationship.',
      interpretation: 'The export describes an existing shared history.',
      evidence: [{ unitId, support: 'The preserved memory describes their shared work.' }],
      counterEvidence: [{ note: 'One export does not establish every aspect of the relationship.' }],
      confidence: { score: 0.75, rationale: 'Directly supported by preserved text but not independently repeated.' },
      runtimePhenotypeRisk: 'low',
    }],
  }
}

test('CLI creates evidence-bound candidate claims and a non-canonical review workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-review-'))
  const { preparedWorkspace, evidence } = await prepare(root)
  const claimsFile = join(root, 'candidate-claims.json')
  const outputDir = join(root, 'review')
  await writeFile(claimsFile, JSON.stringify(claimDocument(evidence.units[0].unitId)))

  const { stdout } = await execFileAsync(process.execPath, cliArgs({ preparedWorkspace, claimsFile, outputDir }))
  const summary = JSON.parse(stdout)
  const source = JSON.parse(await readFile(join(preparedWorkspace, 'source.json'), 'utf8'))
  const claimsOutput = JSON.parse(await readFile(join(outputDir, 'claims.json'), 'utf8'))
  const workspace = JSON.parse(await readFile(join(outputDir, 'review-workspace.json'), 'utf8'))
  const claim = claimsOutput.claims[0]

  assert.equal(claim.canonicalStatus, 'candidate')
  assert.equal(claim.canonicalMutation, false)
  assert.equal(claim.evidence[0].sourceId, source.sourceId)
  assert.equal(claim.evidence[0].digest, source.content.digest)
  assert.equal(workspace.id, 'mira-review-001')
  assert.deepEqual(workspace.claimIds, ['mira-claim-001'])
  assert.deepEqual(workspace.decisions, [])
  assert.deepEqual(workspace.relationships, [])
  assert.equal(workspace.canonicalMutation, false)
  assert.equal(summary.digest, source.content.digest)
  assert.equal(summary.canonicalMutation, false)
  assert.equal(summary.profileMutation, false)
  assert.deepEqual((await readdir(outputDir)).sort(), ['claims.json', 'review-workspace.json'])
})

test('CLI fails closed on an unknown evidence-unit reference', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-review-unknown-'))
  const { preparedWorkspace } = await prepare(root)
  const claimsFile = join(root, 'candidate-claims.json')
  const outputDir = join(root, 'review')
  await writeFile(claimsFile, JSON.stringify(claimDocument('missing-unit')))

  await assert.rejects(
    () => execFileAsync(process.execPath, cliArgs({ preparedWorkspace, claimsFile, outputDir })),
    /unknown evidence unit/,
  )
})

test('CLI refuses candidate input that requests canonical mutation authority', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-review-mutation-'))
  const { preparedWorkspace, evidence } = await prepare(root)
  const claimsFile = join(root, 'candidate-claims.json')
  const outputDir = join(root, 'review')
  const document = claimDocument(evidence.units[0].unitId)
  document.claims[0].canonicalMutation = true
  await writeFile(claimsFile, JSON.stringify(document))

  await assert.rejects(
    () => execFileAsync(process.execPath, cliArgs({ preparedWorkspace, claimsFile, outputDir })),
    /canonicalMutation must remain false/,
  )
})

test('--replace protects unmanaged files in an existing review workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-review-replace-'))
  const { preparedWorkspace, evidence } = await prepare(root)
  const claimsFile = join(root, 'candidate-claims.json')
  const outputDir = join(root, 'review')
  await writeFile(claimsFile, JSON.stringify(claimDocument(evidence.units[0].unitId)))

  await execFileAsync(process.execPath, cliArgs({ preparedWorkspace, claimsFile, outputDir }))
  await execFileAsync(process.execPath, cliArgs({ preparedWorkspace, claimsFile, outputDir, extra: ['--replace'] }))

  await writeFile(join(outputDir, 'human-notes.md'), 'keep this')
  await assert.rejects(
    () => execFileAsync(process.execPath, cliArgs({ preparedWorkspace, claimsFile, outputDir, extra: ['--replace'] })),
    /unmanaged entries: human-notes.md/,
  )
  assert.equal(await readFile(join(outputDir, 'human-notes.md'), 'utf8'), 'keep this')
})
