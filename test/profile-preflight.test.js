import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createSoulState,
  FileSoulStore,
} from '../src/core/index.js'
import {
  parseAiSoulPatch,
  preflightDshProfile,
  SURFACE_BUNDLES,
} from '../src/profile-preflight.js'

async function createStore() {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-preflight-'))
  const store = new FileSoulStore({ rootDir })
  await store.save(createSoulState({ soulId: 'aster', name: 'Aster' }))
  return rootDir
}

function profilePackage(surface) {
  return {
    dependencies: {
      'dsh-ai-soul': 'link:/repo/dsh-ai-soul',
    },
    dsh: {
      profile: {
        bundles: [
          '@deepseek-ai/dsh-base',
          'dsh-ai-soul',
          SURFACE_BUNDLES[surface],
        ],
      },
    },
  }
}

function patch(storeDir) {
  return `- id: ai-soul\n  config:\n    soulId: aster\n    storeDir: ${storeDir}\n    contextOrder: -10\n`
}

test('parseAiSoulPatch extracts only ai-soul configuration', () => {
  const result = parseAiSoulPatch(`- id: another-plugin\n  config:\n    soulId: wrong\n- id: ai-soul\n  config:\n    soulId: aster\n    storeDir: /tmp/aster\n- id: trailing-plugin\n`)

  assert.equal(result.loaderPresent, true)
  assert.equal(result.documentValid, true)
  assert.equal(result.config.soulId, 'aster')
  assert.equal(result.config.storeDir, '/tmp/aster')
})

test('profile preflight rejects an empty root sequence followed by profile entries', async () => {
  const storeDir = await createStore()
  const result = await preflightDshProfile({
    profilePackage: profilePackage('web'),
    patchText: `[]\n${patch(storeDir)}`,
    soulId: 'aster',
    storeDir,
    surface: 'web',
  })

  assert.equal(result.checks.patchDocumentValid, false)
  assert.equal(result.runtimeReady, false)
  assert.equal(result.ready, false)
  assert.equal(result.diagnostics[0].code, 'profile-patch-invalid')
})

for (const surface of ['tui', 'web', 'headless']) {
  test(`profile preflight accepts a non-Samuel Soul composed with ${surface}`, async () => {
    const storeDir = await createStore()
    const result = await preflightDshProfile({
      profilePackage: profilePackage(surface),
      patchText: patch(storeDir),
      soulId: 'aster',
      storeDir,
      surface,
    })

    assert.equal(result.ready, true)
    assert.equal(result.runtimeReady, true)
    assert.equal(result.applicationReady, true)
    assert.deepEqual(result.errors, {})
    assert.deepEqual(result.diagnostics, [])
    assert.ok(Object.values(result.checks).every(Boolean))
  })
}

test('profile preflight separates runtime readiness from missing application surface', async () => {
  const storeDir = await createStore()
  const manifest = profilePackage('tui')
  manifest.dsh.profile.bundles.pop()

  const result = await preflightDshProfile({
    profilePackage: manifest,
    patchText: patch(storeDir),
    soulId: 'aster',
    storeDir,
    surface: 'tui',
  })

  assert.equal(result.runtimeReady, true)
  assert.equal(result.applicationReady, false)
  assert.equal(result.ready, false)
  assert.equal(result.checks.applicationSurfacePresent, false)
  assert.deepEqual(result.diagnostics.map(({ check, code }) => ({ check, code })), [
    {
      check: 'applicationSurfacePresent',
      code: 'application-surface-missing',
    },
  ])
  assert.match(result.diagnostics[0].hint, /@deepseek-harness-tui\/dsh-tui/)
})

test('profile preflight reports configuration mismatch independently of Soul loadability', async () => {
  const storeDir = await createStore()

  const result = await preflightDshProfile({
    profilePackage: profilePackage('web'),
    patchText: patch(storeDir).replace('soulId: aster', 'soulId: another-soul'),
    soulId: 'aster',
    storeDir,
    surface: 'web',
  })

  assert.equal(result.checks.soulLoadable, true)
  assert.equal(result.checks.soulIdConfigured, false)
  assert.equal(result.runtimeReady, false)
  assert.equal(result.applicationReady, true)
  assert.equal(result.ready, false)
  assert.equal(result.diagnostics.length, 1)
  assert.equal(result.diagnostics[0].code, 'soul-id-mismatch')
  assert.match(result.diagnostics[0].hint, /do not infer Soul identity from the DSH profile name/)
})

test('profile preflight returns deterministic diagnostics for multiple composition failures', async () => {
  const storeDir = await createStore()
  const manifest = {
    dsh: {
      profile: {
        bundles: ['@deepseek-ai/dsh-base'],
      },
    },
  }

  const result = await preflightDshProfile({
    profilePackage: manifest,
    patchText: '',
    soulId: 'aster',
    storeDir,
    surface: 'headless',
  })

  assert.equal(result.checks.soulLoadable, true)
  assert.deepEqual(result.diagnostics.map((entry) => entry.code), [
    'plugin-dependency-missing',
    'soul-bundle-not-composed',
    'ai-soul-loader-missing',
    'soul-id-mismatch',
    'store-dir-mismatch',
    'application-surface-missing',
  ])
  for (const diagnostic of result.diagnostics) {
    assert.equal(typeof diagnostic.check, 'string')
    assert.equal(typeof diagnostic.code, 'string')
    assert.ok(diagnostic.message.length > 0)
    assert.ok(diagnostic.hint.length > 0)
  }
})

test('profile preflight preserves the underlying Soul load error in diagnostics', async () => {
  const storeDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-preflight-missing-'))

  const result = await preflightDshProfile({
    profilePackage: profilePackage('web'),
    patchText: patch(storeDir),
    soulId: 'aster',
    storeDir,
    surface: 'web',
  })

  assert.equal(result.checks.soulLoadable, false)
  assert.equal(result.errors.soulLoadable, result.diagnostics[0].detail)
  assert.equal(result.diagnostics[0].check, 'soulLoadable')
  assert.equal(result.diagnostics[0].code, 'soul-not-loadable')
  assert.match(result.diagnostics[0].message, /aster/)
  assert.ok(result.diagnostics[0].detail.length > 0)
})
