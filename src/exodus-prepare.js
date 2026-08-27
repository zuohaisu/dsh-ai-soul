import { basename, join } from 'node:path'
import {
  cp,
  mkdir,
  readdir,
  readFile,
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

  if (replace && inspection.entries.length > 0) {
    for (const entry of inspection.entries) {
      await rm(join(outputDir, entry), { recursive: true, force: true })
    }
  }

  const originalDir = join(outputDir, 'original')
  await mkdir(originalDir, { recursive: true })
  await cp(sourceFile, join(originalDir, filename), { force: false, errorOnExist: true })
  await writeFile(join(outputDir, 'source.json'), `${JSON.stringify(source, null, 2)}\n`, { flag: 'wx' })
  await writeFile(join(outputDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' })

  return {
    outputDir,
    originalFile: join(originalDir, filename),
    sourceFile: join(outputDir, 'source.json'),
    evidenceFile: join(outputDir, 'evidence.json'),
    source,
    evidence,
    canonicalMutation: false,
    profileMutation: false,
  }
}
