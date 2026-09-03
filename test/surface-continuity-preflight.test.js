import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { SURFACE_BUNDLES } from '../src/profile-preflight.js'
import { preflightDshSurfaceContinuity } from '../src/surface-continuity-preflight.js'

async function createStore(soulId = 'aster') {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-surface-continuity-'))
  const store = new FileSoulStore({ rootDir })
  await store.save(createSoulState({ soulId }))
  return rootDir
}

function profilePackage(surface) {
  return {
    dependencies: { 'dsh-ai-soul': 'link:/repo/dsh-ai-soul' },
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
