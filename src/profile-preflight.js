import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { preflightSoul } from './preflight.js'

const SURFACE_BUNDLES = Object.freeze({
  tui: '@deepseek-harness-tui/dsh-tui',
  web: '@deepseek-ai/dsh-web-app',
  headless: '@deepseek-ai/dsh-headless',
})

function parseScalar(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export function parseAiSoulPatch(patchText = '') {
  const lines = String(patchText).split(/\r?\n/)
  let inAiSoul = false
  let inConfig = false
  let aiSoulIndent = -1
  let configIndent = -1
  const config = {}

  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const indent = line.length - line.trimStart().length
    const trimmed = line.trim()

    if (/^-\s+id:\s*ai-soul\s*$/.test(trimmed)) {
      inAiSoul = true
      inConfig = false
      aiSoulIndent = indent
      continue
    }

    if (!inAiSoul) continue

    if (indent <= aiSoulIndent && /^-\s+id:/.test(trimmed)) break

    if (/^config:\s*$/.test(trimmed)) {
      inConfig = true
      configIndent = indent
      continue
    }

    if (!inConfig || indent <= configIndent) continue

    const match = trimmed.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!match) continue
    config[match[1]] = parseScalar(match[2])
  }

  return {
    loaderPresent: inAiSoul,
    config,
  }
}

function dependencyPresent(profilePackage) {
  return ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
    .some((field) => Boolean(profilePackage?.[field]?.['dsh-ai-soul']))
}

function profileBundles(profilePackage) {
  const bundles = profilePackage?.dsh?.profile?.bundles
  return Array.isArray(bundles) ? bundles : []
}

function buildDiagnostics({ checks, soulError, soulId, storeDir, surface, surfaceBundle }) {
  const diagnostics = []

  if (!checks.pluginDependencyPresent) {
    diagnostics.push({
      check: 'pluginDependencyPresent',
      code: 'plugin-dependency-missing',
      message: 'The DSH profile does not declare dsh-ai-soul as a dependency.',
      hint: 'Install dsh-ai-soul into the target profile with `dsh plugin --profile <profile> add <package-path-or-spec>`.',
    })
  }

  if (!checks.soulBundleComposed) {
    diagnostics.push({
      check: 'soulBundleComposed',
      code: 'soul-bundle-not-composed',
      message: 'The DSH profile does not compose the dsh-ai-soul bundle.',
      hint: 'Ensure `dsh.profile.bundles` contains `dsh-ai-soul` in the target profile package.json.',
    })
  }

  if (!checks.aiSoulLoaderPresent) {
    diagnostics.push({
      check: 'aiSoulLoaderPresent',
      code: 'ai-soul-loader-missing',
      message: 'cordis.patch.yml does not contain an `ai-soul` loader entry.',
      hint: 'Configure an `- id: ai-soul` entry with explicit `soulId` and `storeDir` values.',
    })
  }

  if (!checks.soulIdConfigured) {
    diagnostics.push({
      check: 'soulIdConfigured',
      code: 'soul-id-mismatch',
      message: `The ai-soul loader is not configured for requested Soul ID ${JSON.stringify(soulId)}.`,
      hint: `Set ai-soul.config.soulId to ${JSON.stringify(soulId)}; do not infer Soul identity from the DSH profile name.`,
    })
  }

  if (!checks.storeDirConfigured) {
    diagnostics.push({
      check: 'storeDirConfigured',
      code: 'store-dir-mismatch',
      message: `The ai-soul loader is not configured for requested Soul Store ${JSON.stringify(storeDir)}.`,
      hint: `Set ai-soul.config.storeDir to ${JSON.stringify(storeDir)} or rerun preflight with the store actually used by this profile.`,
    })
  }

  if (!checks.soulLoadable) {
    diagnostics.push({
      check: 'soulLoadable',
      code: 'soul-not-loadable',
      message: `Soul ${JSON.stringify(soulId)} could not be loaded from ${JSON.stringify(storeDir)}.`,
      hint: 'Verify that the Soul exists in this store and that its persisted Soul State is valid.',
      ...(soulError ? { detail: soulError } : {}),
    })
  }

  if (!checks.applicationSurfacePresent) {
    diagnostics.push({
      check: 'applicationSurfacePresent',
      code: 'application-surface-missing',
      message: `The DSH profile does not compose the requested ${surface} application surface.`,
      hint: `Ensure dsh.profile.bundles contains ${JSON.stringify(surfaceBundle)}; Soul identity and application surface are separate configuration axes.`,
    })
  }

  return diagnostics
}

function installedPackageDiagnostic(profileDir, detail) {
  return {
    check: 'pluginPackageInstalled',
    code: 'plugin-package-not-installed',
    message: 'The DSH profile declares dsh-ai-soul, but the package is not installed/resolvable from that profile.',
    hint: 'Install the declared dsh-ai-soul package source in the target profile (for example with the DSH plugin/package installation flow), then rerun preflight.',
    profileDir,
    ...(detail ? { detail } : {}),
  }
}

function installedSurfacePackageDiagnostic({ profileDir, surface, surfaceBundle, detail }) {
  return {
    check: 'applicationSurfacePackageInstalled',
    code: 'application-surface-package-not-installed',
    message: `The DSH profile composes the requested ${surface} surface, but ${JSON.stringify(surfaceBundle)} is not installed/resolvable from that profile.`,
    hint: `Install ${JSON.stringify(surfaceBundle)} in the target profile, then rerun preflight. Soul identity and application surface remain separate configuration axes.`,
    profileDir,
    surface,
    surfaceBundle,
    ...(detail ? { detail } : {}),
  }
}

function resolveInstalledPackage(profileDir, packageName) {
  const requireFromProfile = createRequire(join(profileDir, 'package.json'))
  return requireFromProfile.resolve(packageName)
}

export async function preflightDshProfile({
  profilePackage,
  patchText,
  soulId,
  storeDir,
  surface,
}) {
  if (!profilePackage || typeof profilePackage !== 'object') {
    throw new TypeError('profile preflight requires profilePackage')
  }
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('profile preflight soulId is required')
  }
  if (!storeDir || typeof storeDir !== 'string') {
    throw new TypeError('profile preflight storeDir is required')
  }
  if (!SURFACE_BUNDLES[surface]) {
    throw new TypeError(`profile preflight surface must be one of: ${Object.keys(SURFACE_BUNDLES).join(', ')}`)
  }

  const bundles = profileBundles(profilePackage)
  const parsedPatch = parseAiSoulPatch(patchText)
  const resolvedStoreDir = resolve(storeDir)
  const configuredStoreDir = parsedPatch.config.storeDir ? resolve(parsedPatch.config.storeDir) : null

  const checks = {
    pluginDependencyPresent: dependencyPresent(profilePackage),
    soulBundleComposed: bundles.includes('dsh-ai-soul'),
    aiSoulLoaderPresent: parsedPatch.loaderPresent,
    soulIdConfigured: parsedPatch.config.soulId === soulId,
    storeDirConfigured: configuredStoreDir === resolvedStoreDir,
    soulLoadable: false,
    applicationSurfacePresent: bundles.includes(SURFACE_BUNDLES[surface]),
  }

  let soulError = null
  try {
    await preflightSoul({ soulId, storeDir: resolvedStoreDir })
    checks.soulLoadable = true
  } catch (error) {
    soulError = error instanceof Error ? error.message : String(error)
  }

  const runtimeReady = [
    checks.pluginDependencyPresent,
    checks.soulBundleComposed,
    checks.aiSoulLoaderPresent,
    checks.soulIdConfigured,
    checks.storeDirConfigured,
    checks.soulLoadable,
  ].every(Boolean)

  const applicationReady = checks.applicationSurfacePresent
  const surfaceBundle = SURFACE_BUNDLES[surface]
  const diagnostics = buildDiagnostics({
    checks,
    soulError,
    soulId,
    storeDir: resolvedStoreDir,
    surface,
    surfaceBundle,
  })

  return {
    ready: runtimeReady && applicationReady,
    runtimeReady,
    applicationReady,
    surface,
    surfaceBundle,
    soulId,
    storeDir: resolvedStoreDir,
    checks,
    errors: soulError ? { soulLoadable: soulError } : {},
    diagnostics,
  }
}

export async function preflightDshProfileDir({ profileDir, soulId, storeDir, surface }) {
  if (!profileDir || typeof profileDir !== 'string') {
    throw new TypeError('profile preflight profileDir is required')
  }

  const resolvedProfileDir = resolve(profileDir)
  const [packageText, patchText] = await Promise.all([
    readFile(join(resolvedProfileDir, 'package.json'), 'utf8'),
    readFile(join(resolvedProfileDir, 'cordis.patch.yml'), 'utf8'),
  ])
  const profilePackage = JSON.parse(packageText)

  const result = await preflightDshProfile({
    profilePackage,
    patchText,
    soulId,
    storeDir,
    surface,
  })

  let pluginPackageInstalled = false
  let pluginPackagePath = null
  let pluginPackageError = null
  if (result.checks.pluginDependencyPresent) {
    try {
      pluginPackagePath = resolveInstalledPackage(resolvedProfileDir, 'dsh-ai-soul')
      pluginPackageInstalled = true
    } catch (error) {
      pluginPackageError = error instanceof Error ? error.message : String(error)
    }
  }

  let applicationSurfacePackageInstalled = false
  let applicationSurfacePackagePath = null
  let applicationSurfacePackageError = null
  if (result.checks.applicationSurfacePresent) {
    try {
      applicationSurfacePackagePath = resolveInstalledPackage(resolvedProfileDir, result.surfaceBundle)
      applicationSurfacePackageInstalled = true
    } catch (error) {
      applicationSurfacePackageError = error instanceof Error ? error.message : String(error)
    }
  }

  const checks = {
    ...result.checks,
    pluginPackageInstalled,
    applicationSurfacePackageInstalled,
  }
  const diagnostics = [...result.diagnostics]
  if (result.checks.pluginDependencyPresent && !pluginPackageInstalled) {
    diagnostics.splice(1, 0, installedPackageDiagnostic(resolvedProfileDir, pluginPackageError))
  }
  if (result.checks.applicationSurfacePresent && !applicationSurfacePackageInstalled) {
    diagnostics.push(installedSurfacePackageDiagnostic({
      profileDir: resolvedProfileDir,
      surface: result.surface,
      surfaceBundle: result.surfaceBundle,
      detail: applicationSurfacePackageError,
    }))
  }
  const runtimeReady = result.runtimeReady && pluginPackageInstalled
  const applicationReady = result.applicationReady && applicationSurfacePackageInstalled

  return {
    ...result,
    ready: runtimeReady && applicationReady,
    runtimeReady,
    applicationReady,
    checks,
    diagnostics,
    pluginPackagePath,
    applicationSurfacePackagePath,
    profileDir: resolvedProfileDir,
  }
}

export { SURFACE_BUNDLES }
