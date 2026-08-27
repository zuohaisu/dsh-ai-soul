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

  return {
    ready: runtimeReady && applicationReady,
    runtimeReady,
    applicationReady,
    surface,
    surfaceBundle: SURFACE_BUNDLES[surface],
    soulId,
    storeDir: resolvedStoreDir,
    checks,
    errors: soulError ? { soulLoadable: soulError } : {},
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

  const result = await preflightDshProfile({
    profilePackage: JSON.parse(packageText),
    patchText,
    soulId,
    storeDir,
    surface,
  })

  return {
    ...result,
    profileDir: resolvedProfileDir,
  }
}

export { SURFACE_BUNDLES }
