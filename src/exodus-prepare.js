import { randomUUID } from 'node:crypto'
import { basename, dirname, join } from 'node:path'
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'

import { createExodusSource, normalizeMarkdownEvidence } from './core/index.js'

const MANAGED_ENTRIES = new Set(['original', 'source.json', 'evidence.json'])

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function inspectOutputDir(outputDir) {
  if (!(await pathExists(outputDir))) return { exists: false, entries: [] }
  const entries = await readdir(outputDir)
  return { exists: true, entries }
}

function ensureReplaceIsSafe(entries) {
  const unknown = entries.filter((entry) => !MANAGED_ENTRIES.has(entry))
  if (unknown.length > 0) {
    throw new Error(`refusing --replace because workspace contains unmanaged entries: ${unknown.join(', ')}`)
  }
}

async function writeStagingWorkspace({ stagingDir, filename, sourceBytes, source, evidence }) {
  const originalDir = join(stagingDir, 'original')
  await mkdir(originalDir, { recursive: true })
  await writeFile(join(originalDir, filename), sourceBytes, { flag: 'wx' })
  await writeFile(join(stagingDir, 'source.json'), `${JSON.stringify(source, null, 2)}\n`, { flag: 'wx' })
  await writeFile(join(stagingDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' })
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

export async function prepareMarkdownExodusWorkspace({
  sourceFile,
  sourceId,
  sourceType,
  provider,
  capturedAt,
  outputDir,
  replace = false,
  importedAt,
}) {
  if (!sourceFile) throw new TypeError('sourceFile is required')
  if (!outputDir) throw new TypeError('outputDir is required')

  const sourceBytes = await readFile(sourceFile)
  const filename = basename(sourceFile)
  const inspection = await inspectOutputDir(outputDir)

  if (inspection.entries.length > 0 && !replace) {
    throw new Error(`output workspace is not empty: ${outputDir}; pass --replace to replace a managed workspace`)
  }
  if (replace && inspection.entries.length > 0) {
    ensureReplaceIsSafe(inspection.entries)
  }

  const source = createExodusSource({
    sourceId,
    sourceType,
    provider,
    capturedAt,
    importedAt,
    filename,
    mediaType: 'text/markdown',
    content: sourceBytes,
    provenance: {
      acquisition: 'user-supplied-file',
      originalPath: sourceFile,
    },
  })
  const evidence = normalizeMarkdownEvidence({ source, content: sourceBytes })

  const parentDir = dirname(outputDir)
  await mkdir(parentDir, { recursive: true })
  const stagingDir = join(parentDir, `.${basename(outputDir)}.staging-${randomUUID()}`)

  try {
    await mkdir(stagingDir)
    await writeStagingWorkspace({ stagingDir, filename, sourceBytes, source, evidence })
    await installStagingWorkspace({
      stagingDir,
      outputDir,
      outputExists: inspection.exists,
    })
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true })
    throw error
  }

  return {
    outputDir,
    originalFile: join(outputDir, 'original', filename),
    sourceFile: join(outputDir, 'source.json'),
    evidenceFile: join(outputDir, 'evidence.json'),
    source,
    evidence,
    canonicalMutation: false,
    profileMutation: false,
  }
}
