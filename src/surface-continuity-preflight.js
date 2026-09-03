import { resolve } from 'node:path'

import { parseAiSoulPatch, preflightDshProfile } from './profile-preflight.js'

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

function configuredAnchor(profile) {
  const parsed = parseAiSoulPatch(profile.patchText)
  return {
    soulId: typeof parsed.config.soulId === 'string' ? parsed.config.soulId : null,
    storeDir: typeof parsed.config.storeDir === 'string' ? resolve(parsed.config.storeDir) : null,
  }
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

  const requestedAnchor = {
    soulId,
    storeDir: resolve(storeDir),
  }
  const tuiAnchor = configuredAnchor(tui)
  const webAnchor = configuredAnchor(web)

  const [tuiResult, webResult] = await Promise.all([
    preflightDshProfile({
      profilePackage: tui.profilePackage,
      patchText: tui.patchText,
      soulId,
      storeDir: requestedAnchor.storeDir,
      surface: 'tui',
    }),
    preflightDshProfile({
      profilePackage: web.profilePackage,
      patchText: web.patchText,
      soulId,
      storeDir: requestedAnchor.storeDir,
      surface: 'web',
    }),
  ])

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
