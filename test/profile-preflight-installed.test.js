import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { preflightDshProfileDir, SURFACE_BUNDLES } from '../src/profile-preflight.js'

async function installFixturePackage(profileDir, packageName) {
  const packageDir = join(profileDir, 'node_modules', ...packageName.split('/'))
  await mkdir(packageDir, { recursive: true })
  await writeFile(
    join(packageDir, 'package.json'),
    `${JSON.stringify({ name: packageName, version: '0.0.0-test', type: 'module', main: './index.js' }, null, 2)}\n`,
    'utf8',
  )
  await writeFile(join(packageDir, 'index.js'), 'export default {}\n', 'utf8')
}

async function createFixture({ installPlugin, installSurface }) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-installed-preflight-'))
  const profileDir = join(rootDir, 'profile')
  const storeDir = join(rootDir, 'store')
  await mkdir(profileDir, { recursive: true })

  const store = new FileSoulStore({ rootDir: storeDir })
  await store.save(createSoulState({ soulId: 'aster', name: 'Aster' }))

  const profilePackage = {
    dependencies: {
      'dsh-ai-soul': 'file:/package/source/dsh-ai-soul',
    },
    dsh: {
      profile: {
        bundles: [
          '@deepseek-ai/dsh-base',
          'dsh-ai-soul',
          SURFACE_BUNDLES.tui,
        ],
      },
    },
  }

  await writeFile(join(profileDir, 'package.json'), `${JSON.stringify(profilePackage, null, 2)}\n`, 'utf8')
  await writeFile(
    join(profileDir, 'cordis.patch.yml'),
    `- id: ai-soul\n  config:\n    soulId: aster\n    storeDir: ${storeDir}\n    contextOrder: -10\n`,
    'utf8',
  )

  if (installPlugin) await installFixturePackage(profileDir, 'dsh-ai-soul')
  if (installSurface) await installFixturePackage(profileDir, SURFACE_BUNDLES.tui)

  return { profileDir, storeDir }
}

test('directory preflight rejects a declared but uninstalled dsh-ai-soul package', async () => {
  const { profileDir, storeDir } = await createFixture({ installPlugin: false, installSurface: true })

  const result = await preflightDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
  })

  assert.equal(result.checks.pluginDependencyPresent, true)
  assert.equal(result.checks.pluginPackageInstalled, false)
  assert.equal(result.checks.applicationSurfacePackageInstalled, true)
  assert.equal(result.runtimeReady, false)
  assert.equal(result.applicationReady, true)
  assert.equal(result.ready, false)
  assert.equal(result.pluginPackagePath, null)
  assert.equal(result.diagnostics.some(({ code }) => code === 'plugin-package-not-installed'), true)
  assert.match(
    result.diagnostics.find(({ code }) => code === 'plugin-package-not-installed').hint,
    /Install the declared dsh-ai-soul package source/,
  )
})

test('directory preflight rejects a declared but uninstalled application surface package', async () => {
  const { profileDir, storeDir } = await createFixture({ installPlugin: true, installSurface: false })

  const result = await preflightDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
  })

  assert.equal(result.checks.pluginPackageInstalled, true)
  assert.equal(result.checks.applicationSurfacePresent, true)
  assert.equal(result.checks.applicationSurfacePackageInstalled, false)
  assert.equal(result.runtimeReady, true)
  assert.equal(result.applicationReady, false)
  assert.equal(result.ready, false)
  assert.equal(result.applicationSurfacePackagePath, null)
  const diagnostic = result.diagnostics.find(({ code }) => code === 'application-surface-package-not-installed')
  assert.equal(diagnostic.check, 'applicationSurfacePackageInstalled')
  assert.equal(diagnostic.surfaceBundle, SURFACE_BUNDLES.tui)
  assert.match(diagnostic.hint, /@deepseek-harness-tui\/dsh-tui/)
})

test('directory preflight accepts installed and resolvable Soul and application surface packages', async () => {
  const { profileDir, storeDir } = await createFixture({ installPlugin: true, installSurface: true })

  const result = await preflightDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
  })

  assert.equal(result.checks.pluginDependencyPresent, true)
  assert.equal(result.checks.pluginPackageInstalled, true)
  assert.equal(result.checks.applicationSurfacePackageInstalled, true)
  assert.equal(result.runtimeReady, true)
  assert.equal(result.applicationReady, true)
  assert.equal(result.ready, true)
  assert.match(result.pluginPackagePath, /node_modules[\\/]dsh-ai-soul[\\/]index\.js$/)
  assert.match(result.applicationSurfacePackagePath, /node_modules[\\/]@deepseek-harness-tui[\\/]dsh-tui[\\/]index\.js$/)
  assert.deepEqual(result.diagnostics, [])
})
