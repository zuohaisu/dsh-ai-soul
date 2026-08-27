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

import {
  createExodusCandidateClaim,
  createExodusReviewWorkspace,
  validateExodusSource,
} from './core/index.js'

const MANAGED_ENTRIES = new Set(['claims.json', 'review-workspace.json'])

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
  return { exists: true, entries: await readdir(outputDir) }
}

function ensureReplaceIsSafe(entries) {
  const unknown = entries.filter((entry) => !MANAGED_ENTRIES.has(entry))
  if (unknown.length > 0) {
    throw new Error(`refusing --replace because review workspace contains unmanaged entries: ${unknown.join(', ')}`)
  }
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new TypeError(`${label} must contain valid JSON: ${error.message}`)
  }
}

function validatePreparedEvidence(source, evidence) {
  const sourceValidation = validateExodusSource(source)
  if (!sourceValidation.valid) {
    throw new TypeError(`invalid prepared Exodus source: ${sourceValidation.errors.join('; ')}`)
  }
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new TypeError('prepared evidence must be an object')
  }
  if (evidence.canonicalMutation !== false) {
    throw new TypeError('prepared evidence must have canonicalMutation=false')
  }
  if (
    evidence.sourceRef?.sourceId !== source.sourceId
    || evidence.sourceRef?.algorithm !== source.content.algorithm
    || evidence.sourceRef?.digest !== source.content.digest
  ) {
    throw new TypeError('prepared evidence sourceRef does not match source.json')
  }
}

function normalizeClaimSpecs(document) {
  const specs = Array.isArray(document) ? document : document?.claims
  if (!Array.isArray(specs) || specs.length === 0) {
    throw new TypeError('candidate claims JSON must contain a non-empty claims array')
  }
  return specs
}

function assertNoMutationRequest(spec, index) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new TypeError(`claims[${index}] must be an object`)
  }
  if (spec.canonicalStatus !== undefined && spec.canonicalStatus !== 'candidate') {
    throw new TypeError(`claims[${index}].canonicalStatus must remain candidate`)
  }
  if (spec.canonicalMutation !== undefined && spec.canonicalMutation !== false) {
    throw new TypeError(`claims[${index}].canonicalMutation must remain false`)
  }
}

function buildClaims(evidence, document) {
  return normalizeClaimSpecs(document).map((spec, index) => {
    assertNoMutationRequest(spec, index)
    return createExodusCandidateClaim({
      normalizedEvidence: evidence,
      id: spec.id,
      claimType: spec.claimType,
      statement: spec.statement,
      interpretation: spec.interpretation ?? null,
      evidence: spec.evidence,
      counterEvidence: spec.counterEvidence ?? [],
      confidence: spec.confidence,
      runtimePhenotypeRisk: spec.runtimePhenotypeRisk ?? 'unknown',
      notes: spec.notes ?? null,
    })
  })
}

async function writeStagingWorkspace({ stagingDir, claims, workspace }) {
  await mkdir(stagingDir)
  await writeFile(join(stagingDir, 'claims.json'), `${JSON.stringify({ claims }, null, 2)}\n`, { flag: 'wx' })
  await writeFile(join(stagingDir, 'review-workspace.json'), `${JSON.stringify(workspace, null, 2)}\n`, { flag: 'wx' })
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

export async function prepareExodusReviewWorkspace({
  preparedWorkspace,
  claimsFile,
  workspaceId,
  createdBy,
  createdAt,
  outputDir,
  replace = false,
}) {
  if (!preparedWorkspace) throw new TypeError('preparedWorkspace is required')
  if (!claimsFile) throw new TypeError('claimsFile is required')
  if (!outputDir) throw new TypeError('outputDir is required')

  const [sourceBytes, evidenceBytes, claimBytes] = await Promise.all([
    readFile(join(preparedWorkspace, 'source.json')),
    readFile(join(preparedWorkspace, 'evidence.json')),
    readFile(claimsFile),
  ])

  const source = parseJson(sourceBytes, 'source.json')
  const evidence = parseJson(evidenceBytes, 'evidence.json')
  const claimDocument = parseJson(claimBytes, basename(claimsFile))
  validatePreparedEvidence(source, evidence)

  const claims = buildClaims(evidence, claimDocument)
  const workspace = createExodusReviewWorkspace({
    id: workspaceId,
    claims,
    createdAt,
    createdBy,
  })

  const inspection = await inspectOutputDir(outputDir)
  if (inspection.entries.length > 0 && !replace) {
    throw new Error(`review workspace is not empty: ${outputDir}; pass --replace to replace a managed workspace`)
  }
  if (replace && inspection.entries.length > 0) ensureReplaceIsSafe(inspection.entries)

  const parentDir = dirname(outputDir)
  await mkdir(parentDir, { recursive: true })
  const stagingDir = join(parentDir, `.${basename(outputDir)}.staging-${randomUUID()}`)

  try {
    await writeStagingWorkspace({ stagingDir, claims, workspace })
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
    claimsFile: join(outputDir, 'claims.json'),
    reviewWorkspaceFile: join(outputDir, 'review-workspace.json'),
    sourceId: source.sourceId,
    digest: source.content.digest,
    claims,
    workspace,
    canonicalMutation: false,
    profileMutation: false,
  }
}
