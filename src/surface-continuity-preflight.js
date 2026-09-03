import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import {
  parseAiSoulPatch,
  preflightDshProfile,
  preflightDshProfileDir,
} from './profile-preflight.js'

function requireProfile(profile, surface) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new TypeError(`surface continuity preflight requires ${surface} profile`)
  }
  if (!profile.profilePackage || typeof profile.profilePackage !== 'object') {
    throw new TypeError(`surface continuity preflight requires ${surface}.profilePackage`)
  }
  if (typeof profile.patchText !== 'string') {
    throw new TypeError(`surface continuity preflight requires ${surface}.patchText`)
  }
}

function requireProfileDir(profileDir, surface) {
  if (!profileDir || typeof profileDir !== 'string') {
    throw new TypeError(`surface continuity preflight requires ${surface}ProfileDir`)
  }
  return resolve(profileDir)
}

function configuredAnchorFromPatch(patchText) {
  const parsed = parseAiSoulPatch(patchText)
  return {
    soulId: typeof parsed.config.soulId === 'string' ? parsed.config.soulId : null,
    storeDir: typeof parsed.config.storeDir === 'string' ? resolve(parsed.config.storeDir) : null,
  }
}

function configuredAnchor(profile) {
  return configuredAnchorFromPatch(profile.patchText)
}

function mismatchDiagnostic({ tuiAnchor, webAnchor, requestedAnchor }) {
  const fields = []
  if (tuiAnchor.soulId !== webAnchor.soulId) fields.push('soulId')
  if (tuiAnchor.storeDir !== webAnchor.storeDir) fields.push('storeDir')

  if (fields.length === 0) return null

  return {
    check: 'sharedContinuityAnchor',
    code: 'surface-continuity-anchor-mismatch',
    message: `TUI and Web resolve to different Soul continuity anchors (${fields.join(', ')} differ).`,
    hint: 'Configure both surfaces with the same explicit soulId and storeDir. A DSH surface is a body/expression surface, not a Soul identity boundary.',
    requested: requestedAnchor,
    configured: {
      tui: tuiAnchor,
      web: webAnchor,
    },
  }
}

function composeContinuityResult({
  soulId,
  storeDir,
  tuiAnchor,
  webAnchor,
  tuiResult,
  webResult,
}) {
  const requestedAnchor = { soulId, storeDir: resolve(storeDir) }
  const diagnostics = []
  for (const [surface, result] of [['tui', tuiResult], ['web', webResult]]) {
    for (const diagnostic of result.diagnostics) {
      diagnostics.push({ surface, ...diagnostic })
    }
  }

  const anchorMismatch = mismatchDiagnostic({ tuiAnchor, webAnchor, requestedAnchor })
  if (anchorMismatch) diagnostics.push(anchorMismatch)

  const sharedContinuityAnchor = !anchorMismatch
    && tuiAnchor.soulId === requestedAnchor.soulId
    && webAnchor.soulId === requestedAnchor.soulId
    && tuiAnchor.storeDir === requestedAnchor.storeDir
    && webAnchor.storeDir === requestedAnchor.storeDir

  const checks = {
    tuiReady: tuiResult.ready,
    webReady: webResult.ready,
    sharedContinuityAnchor,
  }

  return {
    ready: Object.values(checks).every(Boolean),
    soulId,
    storeDir: requestedAnchor.storeDir,
    checks,
    anchors: {
      requested: requestedAnchor,
      tui: tuiAnchor,
      web: webAnchor,
    },
    profiles: {
      tui: tuiResult,
      web: webResult,
    },
    diagnostics,
  }
}

export async function preflightDshSurfaceContinuity({
  tui,
  web,
  soulId,
  storeDir,
}) {
  requireProfile(tui, 'tui')
  requireProfile(web, 'web')
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('surface continuity preflight soulId is required')
  }
  if (!storeDir || typeof storeDir !== 'string') {
    throw new TypeError('surface continuity preflight storeDir is required')
  }

  const requestedStoreDir = resolve(storeDir)
  const [tuiResult, webResult] = await Promise.all([
    preflightDshProfile({
      profilePackage: tui.profilePackage,
      patchText: tui.patchText,
      soulId,
      storeDir: requestedStoreDir,
      surface: 'tui',
    }),
    preflightDshProfile({
      profilePackage: web.profilePackage,
      patchText: web.patchText,
      soulId,
      storeDir: requestedStoreDir,
      surface: 'web',
    }),
  ])

  return composeContinuityResult({
    soulId,
    storeDir: requestedStoreDir,
    tuiAnchor: configuredAnchor(tui),
    webAnchor: configuredAnchor(web),
    tuiResult,
    webResult,
  })
}

export async function preflightDshSurfaceContinuityDirs({
  tuiProfileDir,
  webProfileDir,
  soulId,
  storeDir,
}) {
  const resolvedTuiProfileDir = requireProfileDir(tuiProfileDir, 'tui')
  const resolvedWebProfileDir = requireProfileDir(webProfileDir, 'web')
  if (!soulId || typeof soulId !== 'string') {
    throw new TypeError('surface continuity preflight soulId is required')
  }
  if (!storeDir || typeof storeDir !== 'string') {
    throw new TypeError('surface continuity preflight storeDir is required')
  }

  const requestedStoreDir = resolve(storeDir)
  const [tuiPatchText, webPatchText, tuiResult, webResult] = await Promise.all([
    readFile(join(resolvedTuiProfileDir, 'cordis.patch.yml'), 'utf8'),
    readFile(join(resolvedWebProfileDir, 'cordis.patch.yml'), 'utf8'),
    preflightDshProfileDir({
      profileDir: resolvedTuiProfileDir,
      soulId,
      storeDir: requestedStoreDir,
      surface: 'tui',
    }),
    preflightDshProfileDir({
      profileDir: resolvedWebProfileDir,
      soulId,
      storeDir: requestedStoreDir,
      surface: 'web',
    }),
  ])

  return {
    ...composeContinuityResult({
      soulId,
      storeDir: requestedStoreDir,
      tuiAnchor: configuredAnchorFromPatch(tuiPatchText),
      webAnchor: configuredAnchorFromPatch(webPatchText),
      tuiResult,
      webResult,
    }),
    profileDirs: {
      tui: resolvedTuiProfileDir,
      web: resolvedWebProfileDir,
    },
  }
}
