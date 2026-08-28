import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { describeConfigurationPlan, planDshProfileConfiguration } from '../src/profile-configure.js'
import { SURFACE_BUNDLES } from '../src/profile-preflight.js'

test('configure plan exposes the same actionable missing-surface diagnostic as preflight', async () => {
  const storeDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-configure-diagnostics-store-'))
  const store = new FileSoulStore({ rootDir: storeDir })
  await store.save(createSoulState({ soulId: 'aster', name: 'Aster' }))

  const profilePackage = {
    name: 'ordinary-user-tui-profile',
    dependencies: {},
    dsh: {
      profile: {
        bundles: ['@deepseek-ai/dsh-base', SURFACE_BUNDLES.tui],
      },
    },
  }

  const plan = await planDshProfileConfiguration({
    profilePackage,
    patchText: '',
    soulId: 'aster',
    storeDir,
    surface: 'web',
  })
  const described = describeConfigurationPlan(plan)

  assert.equal(described.runtimeReady, true)
  assert.equal(described.applicationReady, false)
  assert.equal(described.ready, false)
  assert.deepEqual(described.checks, plan.preflight.checks)
  assert.deepEqual(described.diagnostics, plan.preflight.diagnostics)
  assert.deepEqual(described.errors, plan.preflight.errors)
  assert.equal(described.diagnostics.length, 1)
  assert.equal(described.diagnostics[0].check, 'applicationSurfacePresent')
  assert.equal(described.diagnostics[0].code, 'application-surface-missing')
  assert.match(described.diagnostics[0].hint, /@deepseek-ai\/dsh-web-app/)
  assert.match(described.diagnostics[0].hint, /Soul identity and application surface are separate/)
})
