import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { SURFACE_BUNDLES, preflightDshProfile } from './profile-preflight.js'

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

function assertString(name, value) {
  if (!value || typeof value !== 'string') throw new TypeError(`${name} is required`)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function quoteYaml(value) {
  return JSON.stringify(String(value))
}

function locateAiSoulBlock(lines) {
  let start = -1
  let end = lines.length
  let indent = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!/^-\s+id:\s*ai-soul\s*$/.test(line.trim())) continue
    start = index
    indent = line.length - line.trimStart().length
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor]
      const candidateIndent = candidate.length - candidate.trimStart().length
      if (candidate.trim() && candidateIndent <= indent && /^-\s+id:/.test(candidate.trim())) {
        end = cursor
        break
      }
    }
    break
  }

  return { start, end, indent }
}

function renderAiSoulBlock({ soulId, storeDir, contextOrder = -10, indent = 0 }) {
  const pad = ' '.repeat(indent)
  return [
    `${pad}- id: ai-soul`,
    `${pad}  config:`,
    `${pad}    soulId: ${quoteYaml(soulId)}`,
    `${pad}    storeDir: ${quoteYaml(resolve(storeDir))}`,
    `${pad}    contextOrder: ${contextOrder}`,
  ]
}

export function configurePackage({ profilePackage, dependencySpec = 'latest' }) {
  if (!profilePackage || typeof profilePackage !== 'object') throw new TypeError('profilePackage is required')
  const next = clone(profilePackage)

  const existingField = DEPENDENCY_FIELDS.find((field) => next?.[field]?.['dsh-ai-soul'])
  const dependencyField = existingField || 'dependencies'
  next[dependencyField] ||= {}
  next[dependencyField]['dsh-ai-soul'] ||= dependencySpec

  next.dsh ||= {}
  next.dsh.profile ||= {}
  if (!Array.isArray(next.dsh.profile.bundles)) throw new TypeError('profile package must define dsh.profile.bundles')

  if (!next.dsh.profile.bundles.includes('dsh-ai-soul')) {
    const surfaceIndex = next.dsh.profile.bundles.findIndex((bundle) => Object.values(SURFACE_BUNDLES).includes(bundle))
    const insertAt = surfaceIndex >= 0 ? surfaceIndex : next.dsh.profile.bundles.length
    next.dsh.profile.bundles.splice(insertAt, 0, 'dsh-ai-soul')
  }

  return next
}

export function configurePatch({ patchText = '', soulId, storeDir, contextOrder = -10 }) {
  assertString('soulId', soulId)
  assertString('storeDir', storeDir)
  if (!Number.isFinite(contextOrder)) throw new TypeError('contextOrder must be a finite number')

  const normalized = String(patchText)
  const trailingNewline = normalized.endsWith('\n') || normalized.length === 0
  const lines = normalized.split(/\r?\n/)
  if (trailingNewline && lines.at(-1) === '') lines.pop()

  const block = locateAiSoulBlock(lines)
  const rendered = renderAiSoulBlock({ soulId, storeDir, contextOrder, indent: block.start >= 0 ? block.indent : 0 })
  const nextLines = block.start >= 0
    ? [...lines.slice(0, block.start), ...rendered, ...lines.slice(block.end)]
    : [...lines, ...(lines.length && lines.at(-1).trim() ? [''] : []), ...rendered]

  return `${nextLines.join('\n')}\n`
}

export async function planDshProfileConfiguration({
  profilePackage,
  patchText,
  soulId,
  storeDir,
  surface,
  dependencySpec = 'latest',
  contextOrder = -10,
}) {
  if (!SURFACE_BUNDLES[surface]) throw new TypeError(`surface must be one of: ${Object.keys(SURFACE_BUNDLES).join(', ')}`)
  const nextPackage = configurePackage({ profilePackage, dependencySpec })
  const nextPatch = configurePatch({ patchText, soulId, storeDir, contextOrder })
  const preflight = await preflightDshProfile({ profilePackage: nextPackage, patchText: nextPatch, soulId, storeDir, surface })

  return {
    changed: JSON.stringify(profilePackage) !== JSON.stringify(nextPackage) || String(patchText) !== nextPatch,
    files: {
      packageJson: nextPackage,
      cordisPatch: nextPatch,
    },
    preflight,
  }
}

export async function configureDshProfileDir({
  profileDir,
  soulId,
  storeDir,
  surface,
  dependencySpec = 'latest',
  contextOrder = -10,
  dryRun = true,
}) {
  assertString('profileDir', profileDir)
  const resolvedProfileDir = resolve(profileDir)
  const packagePath = join(resolvedProfileDir, 'package.json')
  const patchPath = join(resolvedProfileDir, 'cordis.patch.yml')

  const [packageText, patchText] = await Promise.all([
    readFile(packagePath, 'utf8'),
    readFile(patchPath, 'utf8'),
  ])
  const profilePackage = JSON.parse(packageText)
  const plan = await planDshProfileConfiguration({ profilePackage, patchText, soulId, storeDir, surface, dependencySpec, contextOrder })

  if (!dryRun && !plan.preflight.ready) {
    const failedChecks = Object.entries(plan.preflight.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
      .join(', ')
    throw new Error(`refusing to write DSH profile because preflight is not ready: ${failedChecks || 'unknown failure'}`)
  }

  if (!dryRun && plan.changed) {
    const nextPackageText = `${JSON.stringify(plan.files.packageJson, null, 2)}\n`
    try {
      await writeFile(packagePath, nextPackageText, 'utf8')
      await writeFile(patchPath, plan.files.cordisPatch, 'utf8')
    } catch (error) {
      await Promise.allSettled([
        writeFile(packagePath, packageText, 'utf8'),
        writeFile(patchPath, patchText, 'utf8'),
      ])
      throw error
    }
  }

  return {
    ...plan,
    dryRun,
    profileDir: resolvedProfileDir,
  }
}

export function describeConfigurationPlan(plan) {
  return {
    changed: plan.changed,
    ready: plan.preflight.ready,
    runtimeReady: plan.preflight.runtimeReady,
    applicationReady: plan.preflight.applicationReady,
    checks: plan.preflight.checks,
    diagnostics: plan.preflight.diagnostics,
    errors: plan.preflight.errors,
    packageJson: plan.files.packageJson,
    cordisPatch: plan.files.cordisPatch,
  }
}
