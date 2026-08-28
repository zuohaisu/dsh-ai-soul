import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { preflightDshProfileDir, SURFACE_BUNDLES } from '../src/profile-preflight.js'

async function createFixture({ installPlugin }) {
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

  if (installPlugin) {
    const packageDir = join(profileDir, 'node_modules', 'dsh-ai-soul')
    await mkdir(packageDir, { recursive: true })
    await writeFile(
      join(packageDir, 'package.json'),
      `${JSON.stringify({ name: 'dsh-ai-soul', version: '0.0.0-test', type: 'module', main: './index.js' }, null, 2)}\n`,
      'utf8',
    )
    await writeFile(join(packageDir, 'index.js'), 'export default {}\n', 'utf8')
  }

  return { profileDir, storeDir }
}

test('directory preflight rejects a declared but uninstalled dsh-ai-soul package', async () => {
  const { profileDir, storeDir } = await createFixture({ installPlugin: false })

  const result = await preflightDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
  })

  assert.equal(result.checks.pluginDependencyPresent, true)
  assert.equal(result.checks.pluginPackageInstalled, false)
  assert.equal(result.runtimeReady, false)
  assert.equal(result.ready, false)
  assert.equal(result.pluginPackagePath, null)
  assert.equal(result.diagnostics.some(({ code }) => code === 'plugin-package-not-installed'), true)
  assert.match(
    result.diagnostics.find(({ code }) => code === 'plugin-package-not-installed').hint,
    /Install the declared dsh-ai-soul package source/,
  )
})

test('directory preflight accepts an installed and resolvable dsh-ai-soul package', async () => {
  const { profileDir, storeDir } = await createFixture({ installPlugin: true })

  const result = await preflightDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
  })

  assert.equal(result.checks.pluginDependencyPresent, true)
  assert.equal(result.checks.pluginPackageInstalled, true)
  assert.equal(result.runtimeReady, true)
  assert.equal(result.applicationReady, true)
  assert.equal(result.ready, true)
  assert.match(result.pluginPackagePath, /node_modules[\\/]dsh-ai-soul[\\/]index\.js$/)
  assert.deepEqual(result.diagnostics, [])
})
