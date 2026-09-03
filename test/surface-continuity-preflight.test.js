import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { SURFACE_BUNDLES } from '../src/profile-preflight.js'
import {
  preflightDshSurfaceContinuity,
  preflightDshSurfaceContinuityDirs,
} from '../src/surface-continuity-preflight.js'

async function createStore(soulId = 'aster') {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-surface-continuity-'))
  const store = new FileSoulStore({ rootDir })
  await store.save(createSoulState({ soulId }))
  return rootDir
}

function profilePackage(surface) {
  return {
    dependencies: { 'dsh-ai-soul': '0.1.0-test' },
    dsh: {
      profile: {
        bundles: ['@deepseek-ai/dsh-base', 'dsh-ai-soul', SURFACE_BUNDLES[surface]],
      },
    },
  }
}

function profile(surface, { soulId = 'aster', storeDir }) {
  return {
    profilePackage: profilePackage(surface),
    patchText: `- id: ai-soul\n  config:\n    soulId: ${soulId}\n    storeDir: ${storeDir}\n`,
  }
}

async function installResolvablePackage(profileDir, packageName) {
  const packageDir = join(profileDir, 'node_modules', ...packageName.split('/'))
  await mkdir(packageDir, { recursive: true })
  await writeFile(join(packageDir, 'package.json'), JSON.stringify({
    name: packageName,
    version: '0.0.0-test',
    main: 'index.js',
  }))
  await writeFile(join(packageDir, 'index.js'), 'export default {}\n')
}

async function createProfileDir(surface, { soulId = 'aster', storeDir, install = true } = {}) {
  const profileDir = await mkdtemp(join(tmpdir(), `dsh-ai-soul-${surface}-profile-`))
  await writeFile(join(profileDir, 'package.json'), JSON.stringify(profilePackage(surface), null, 2))
  await writeFile(
    join(profileDir, 'cordis.patch.yml'),
    `- id: ai-soul\n  config:\n    soulId: ${soulId}\n    storeDir: ${storeDir}\n`,
  )
  if (install) {
    await installResolvablePackage(profileDir, 'dsh-ai-soul')
    await installResolvablePackage(profileDir, SURFACE_BUNDLES[surface])
  }
  return profileDir
}

test('TUI and Web pass when both bind to the same explicit Soul continuity anchor', async () => {
  const storeDir = await createStore()
  const result = await preflightDshSurfaceContinuity({
    tui: profile('tui', { storeDir }),
    web: profile('web', { storeDir }),
    soulId: 'aster',
    storeDir,
  })

  assert.equal(result.ready, true)
  assert.deepEqual(result.checks, {
    tuiReady: true,
    webReady: true,
    sharedContinuityAnchor: true,
  })
  assert.deepEqual(result.diagnostics, [])
  assert.deepEqual(result.anchors.tui, result.anchors.web)
  assert.deepEqual(result.anchors.tui, result.anchors.requested)
})

test('same soulId in different stores fails closed as divergent continuity anchors', async () => {
  const storeDir = await createStore()
  const otherStoreDir = await createStore()
  const result = await preflightDshSurfaceContinuity({
    tui: profile('tui', { storeDir }),
    web: profile('web', { storeDir: otherStoreDir }),
    soulId: 'aster',
    storeDir,
  })

  assert.equal(result.ready, false)
  assert.equal(result.checks.sharedContinuityAnchor, false)
  assert.equal(result.profiles.tui.ready, true)
  assert.equal(result.profiles.web.checks.storeDirConfigured, false)
  assert.ok(result.diagnostics.some((entry) => entry.code === 'surface-continuity-anchor-mismatch'))
  assert.ok(result.diagnostics.some((entry) => entry.surface === 'web' && entry.code === 'store-dir-mismatch'))
})

test('different Soul IDs in the same store fail closed', async () => {
  const storeDir = await createStore()
  const result = await preflightDshSurfaceContinuity({
    tui: profile('tui', { storeDir }),
    web: profile('web', { soulId: 'another-soul', storeDir }),
    soulId: 'aster',
    storeDir,
  })

  assert.equal(result.ready, false)
  assert.equal(result.checks.sharedContinuityAnchor, false)
  assert.equal(result.profiles.web.checks.soulIdConfigured, false)
  const mismatch = result.diagnostics.find((entry) => entry.code === 'surface-continuity-anchor-mismatch')
  assert.ok(mismatch)
  assert.deepEqual(mismatch.configured.tui, { soulId: 'aster', storeDir })
  assert.deepEqual(mismatch.configured.web, { soulId: 'another-soul', storeDir })
})

test('a miscomposed application surface is attributed without changing the shared anchor', async () => {
  const storeDir = await createStore()
  const web = profile('web', { storeDir })
  web.profilePackage.dsh.profile.bundles.pop()

  const result = await preflightDshSurfaceContinuity({
    tui: profile('tui', { storeDir }),
    web,
    soulId: 'aster',
    storeDir,
  })

  assert.equal(result.ready, false)
  assert.equal(result.checks.sharedContinuityAnchor, true)
  assert.equal(result.checks.tuiReady, true)
  assert.equal(result.checks.webReady, false)
  assert.ok(result.diagnostics.some((entry) => entry.surface === 'web' && entry.code === 'application-surface-missing'))
})

test('profile labels do not participate in Soul identity', async () => {
  const storeDir = await createStore()
  const tui = { name: 'totally-unrelated-name', ...profile('tui', { storeDir }) }
  const web = { name: 'another-profile-name', ...profile('web', { storeDir }) }

  const result = await preflightDshSurfaceContinuity({ tui, web, soulId: 'aster', storeDir })

  assert.equal(result.ready, true)
  assert.equal(result.soulId, 'aster')
})

test('directory preflight verifies real TUI and Web profile directories and installed packages', async () => {
  const storeDir = await createStore()
  const tuiProfileDir = await createProfileDir('tui', { storeDir })
  const webProfileDir = await createProfileDir('web', { storeDir })

  const result = await preflightDshSurfaceContinuityDirs({
    tuiProfileDir,
    webProfileDir,
    soulId: 'aster',
    storeDir,
  })

  assert.equal(result.ready, true)
  assert.equal(result.checks.tuiReady, true)
  assert.equal(result.checks.webReady, true)
  assert.equal(result.checks.sharedContinuityAnchor, true)
  assert.deepEqual(result.anchors.tui, result.anchors.web)
  assert.equal(result.profiles.tui.checks.pluginPackageInstalled, true)
  assert.equal(result.profiles.web.checks.applicationSurfacePackageInstalled, true)
  assert.equal(result.profileDirs.tui, tuiProfileDir)
  assert.equal(result.profileDirs.web, webProfileDir)
})

test('directory preflight fails closed when a real profile declares but does not install its surface package', async () => {
  const storeDir = await createStore()
  const tuiProfileDir = await createProfileDir('tui', { storeDir })
  const webProfileDir = await createProfileDir('web', { storeDir, install: false })
  await installResolvablePackage(webProfileDir, 'dsh-ai-soul')

  const result = await preflightDshSurfaceContinuityDirs({
    tuiProfileDir,
    webProfileDir,
    soulId: 'aster',
    storeDir,
  })

  assert.equal(result.ready, false)
  assert.equal(result.checks.sharedContinuityAnchor, true)
  assert.equal(result.checks.webReady, false)
  assert.ok(result.diagnostics.some((entry) => (
    entry.surface === 'web' && entry.code === 'application-surface-package-not-installed'
  )))
})
