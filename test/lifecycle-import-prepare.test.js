import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { prepareMarkdownLifecycleImportWorkspace } from '../src/lifecycle-import-prepare.js'

function digestBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

test('binds external evidence to a frozen non-Samuel Soul baseline without mutation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-lifecycle-import-'))
  const soulStoreDir = join(root, 'souls')
  const outputDir = join(root, 'import-001')
  const sourceFile = join(root, 'memory.md')
  const store = new FileSoulStore({ rootDir: soulStoreDir })

  const aster = createSoulState({ soulId: 'aster', name: 'Aster', createdAt: '2026-08-28T00:00:00.000Z' })
  aster.autobiography.push({ id: 'aster-shared-001', at: '2026-08-28T00:10:00.000Z', summary: 'Aster and Rowan completed their first shared task.' })
  await store.save(aster)
  const beforeLiveSoul = await readFile(join(soulStoreDir, 'aster.json'))
  await writeFile(sourceFile, '# Earlier history\n\nAster once described the first shared task differently.\n')

  const result = await prepareMarkdownLifecycleImportWorkspace({
    sourceFile,
    sourceId: 'aster-external-001',
    sourceType: 'memory-export',
    provider: 'chat-runtime-export',
    capturedAt: '2026-08-20T00:00:00.000Z',
    importedAt: '2026-08-28T01:00:00.000Z',
    outputDir,
    soulStoreDir,
    targetSoulId: 'aster',
  })

  assert.equal(result.target.targetSoulId, 'aster')
  assert.equal(result.canonicalMutation, false)
  assert.equal(result.profileMutation, false)
  assert.deepEqual(await readFile(join(soulStoreDir, 'aster.json')), beforeLiveSoul)

  const baselineBytes = await readFile(join(outputDir, 'target-baseline.json'))
  const frozenBaseline = JSON.parse(baselineBytes.toString('utf8'))
  assert.deepEqual(frozenBaseline, aster)
  const binding = JSON.parse(await readFile(join(outputDir, 'target.json'), 'utf8'))
  assert.equal(binding.baseline.digest, digestBytes(baselineBytes))
  assert.equal(result.target.baseline.digest, digestBytes(baselineBytes))
  await stat(join(outputDir, 'evidence', 'source.json'))
  await stat(join(outputDir, 'evidence', 'evidence.json'))

  const evolved = structuredClone(aster)
  evolved.autobiography.push({ id: 'aster-shared-002', at: '2026-08-28T02:00:00.000Z', summary: 'A later local experience.' })
  await store.save(evolved)

  assert.deepEqual(await readFile(join(outputDir, 'target-baseline.json')), baselineBytes)
  assert.equal(JSON.parse(await readFile(join(outputDir, 'target.json'), 'utf8')).baseline.digest, digestBytes(baselineBytes))
})

test('refuses a missing target Soul before creating the import workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-lifecycle-import-'))
  const outputDir = join(root, 'import-missing')
  const sourceFile = join(root, 'memory.md')
  await writeFile(sourceFile, '# Memory\n')

  await assert.rejects(() => prepareMarkdownLifecycleImportWorkspace({
    sourceFile,
    sourceId: 'missing-external-001',
    sourceType: 'memory-export',
    provider: 'chat-runtime-export',
    capturedAt: '2026-08-20T00:00:00.000Z',
    outputDir,
    soulStoreDir: join(root, 'souls'),
    targetSoulId: 'missing',
  }), /ENOENT/)

  await assert.rejects(() => stat(outputDir), /ENOENT/)
})
