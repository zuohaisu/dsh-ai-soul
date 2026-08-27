import { createHash, randomUUID } from 'node:crypto'
import { basename, dirname, join } from 'node:path'
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'

import { FileSoulStore } from './core/index.js'
import { prepareMarkdownExodusWorkspace } from './exodus-prepare.js'

const MANAGED_ENTRIES = new Set(['evidence', 'target.json', 'target-baseline.json'])

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function digestSoulState(state) {
  return createHash('sha256').update(JSON.stringify(state)).digest('hex')
}

async function inspectOutputDir(outputDir) {
  if (!(await pathExists(outputDir))) return { exists: false, entries: [] }
  return { exists: true, entries: await readdir(outputDir) }
}

function ensureReplaceIsSafe(entries) {
  const unknown = entries.filter((entry) => !MANAGED_ENTRIES.has(entry))
  if (unknown.length > 0) {
    throw new Error(`refusing --replace because import workspace contains unmanaged entries: ${unknown.join(', ')}`)
  }
}

async function installStagingWorkspace({ stagingDir, outputDir, outputExists }) {
  if (!outputExists) {
    await rename(stagingDir, outputDir)
    return
  }
  const backupDir = `${outputDir}.backup-${randomUUID()}`
  await rename(outputDir, backupDir)
  try {
    await rename(stagingDir, outputDir)
  } catch (error) {
    await rename(backupDir, outputDir)
    throw error
  }
  await rm(backupDir, { recursive: true, force: true })
}

export async function prepareMarkdownLifecycleImportWorkspace({
  sourceFile,
  sourceId,
  sourceType,
  provider,
  capturedAt,
  outputDir,
  soulStoreDir,
  targetSoulId,
  replace = false,
  importedAt,
}) {
  if (!outputDir) throw new TypeError('outputDir is required')
  if (!soulStoreDir) throw new TypeError('soulStoreDir is required')
  if (!targetSoulId) throw new TypeError('targetSoulId is required')

  const store = new FileSoulStore({ rootDir: soulStoreDir })
  const targetSoul = await store.load(targetSoulId)
  if (targetSoul.soulId !== targetSoulId) throw new TypeError('loaded Soul does not match targetSoulId')

  const inspection = await inspectOutputDir(outputDir)
  if (inspection.entries.length > 0 && !replace) {
    throw new Error(`output workspace is not empty: ${outputDir}; pass --replace to replace a managed import workspace`)
  }
  if (replace && inspection.entries.length > 0) ensureReplaceIsSafe(inspection.entries)

  const parentDir = dirname(outputDir)
  await mkdir(parentDir, { recursive: true })
  const stagingDir = join(parentDir, `.${basename(outputDir)}.staging-${randomUUID()}`)
  const baselineDigest = digestSoulState(targetSoul)
  const baselineCapturedAt = importedAt ?? new Date().toISOString()

  const target = {
    bindingVersion: 1,
    targetSoulId,
    baseline: {
      algorithm: 'sha256',
      digest: baselineDigest,
      capturedAt: baselineCapturedAt,
      file: 'target-baseline.json',
    },
    canonicalMutation: false,
    profileMutation: false,
  }

  try {
    await mkdir(stagingDir)
    await prepareMarkdownExodusWorkspace({
      sourceFile,
      sourceId,
      sourceType,
      provider,
      capturedAt,
      outputDir: join(stagingDir, 'evidence'),
      importedAt,
    })
    await writeFile(join(stagingDir, 'target-baseline.json'), `${JSON.stringify(targetSoul, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
    await writeFile(join(stagingDir, 'target.json'), `${JSON.stringify(target, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
    await installStagingWorkspace({ stagingDir, outputDir, outputExists: inspection.exists })
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true })
    throw error
  }

  return {
    outputDir,
    evidenceDir: join(outputDir, 'evidence'),
    targetFile: join(outputDir, 'target.json'),
    baselineFile: join(outputDir, 'target-baseline.json'),
    target,
    canonicalMutation: false,
    profileMutation: false,
  }
}
