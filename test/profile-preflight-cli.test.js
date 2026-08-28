import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import { SURFACE_BUNDLES } from '../src/profile-preflight.js'

const cli = new URL('../src/cli/preflight-dsh-profile.js', import.meta.url)

async function fixture({ soulId = 'aster', surface = 'tui' } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-preflight-cli-'))
  const profileDir = join(root, 'profile')
  const storeDir = join(root, 'store')
  const { mkdir } = await import('node:fs/promises')
  await mkdir(profileDir, { recursive: true })

  const store = new FileSoulStore({ rootDir: storeDir })
  await store.save(createSoulState({ soulId, name: 'Aster' }))

  await writeFile(join(profileDir, 'package.json'), JSON.stringify({
    dependencies: { 'dsh-ai-soul': '0.0.1' },
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-ai-soul', SURFACE_BUNDLES[surface]] } },
  }))
  await writeFile(join(profileDir, 'cordis.patch.yml'), `- id: ai-soul\n  config:\n    soulId: ${soulId}\n    storeDir: ${storeDir}\n`)

  return { profileDir, storeDir, soulId, surface }
}

function run(args = [], env = {}) {
  return spawnSync(process.execPath, [cli.pathname, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  })
}

test('preflight CLI accepts explicit ordinary-user arguments', async () => {
  const f = await fixture()
  const result = run([
    '--profile-dir', f.profileDir,
    '--soul-id', f.soulId,
    '--store-dir', f.storeDir,
    '--surface', f.surface,
  ])

  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).ready, true)
})

test('preflight CLI preserves environment-variable fallback', async () => {
  const f = await fixture({ surface: 'web' })
  const result = run([], {
    DSH_PROFILE_DIR: f.profileDir,
    SOUL_ID: f.soulId,
    SOUL_STORE_DIR: f.storeDir,
    DSH_SURFACE: f.surface,
  })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).surface, 'web')
})

test('preflight CLI arguments override environment values', async () => {
  const f = await fixture({ surface: 'headless' })
  const result = run([
    '--profile-dir', f.profileDir,
    '--soul-id', f.soulId,
    '--store-dir', f.storeDir,
    '--surface', f.surface,
  ], {
    DSH_PROFILE_DIR: '/wrong/profile',
    SOUL_ID: 'wrong-soul',
    SOUL_STORE_DIR: '/wrong/store',
    DSH_SURFACE: 'tui',
  })

  assert.equal(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout)
  assert.equal(output.soulId, f.soulId)
  assert.equal(output.surface, 'headless')
})

test('preflight CLI fails clearly when required inputs are missing', () => {
  const result = run([])

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /missing required --profile-dir/)
})
