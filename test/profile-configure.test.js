import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSoulState, FileSoulStore } from '../src/core/index.js'
import {
  configureDshProfileDir,
  configurePackage,
  configurePatch,
  planDshProfileConfiguration,
} from '../src/profile-configure.js'
import { SURFACE_BUNDLES } from '../src/profile-preflight.js'

async function createStore() {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-configure-store-'))
  const store = new FileSoulStore({ rootDir })
  await store.save(createSoulState({ soulId: 'aster', name: 'Aster' }))
  return rootDir
}

function basePackage(surface) {
  return {
    name: `fixture-${surface}`,
    dependencies: { existing: '1.2.3' },
    custom: { keep: true },
    dsh: {
      profile: {
        bundles: ['@deepseek-ai/dsh-base', 'existing-bundle', SURFACE_BUNDLES[surface]],
      },
    },
  }
}

const existingPatch = `# preserved header\n- id: existing-plugin\n  config:\n    keep: yes\n`

for (const surface of ['tui', 'web', 'headless']) {
  test(`planner composes Aster with ${surface} without disturbing unrelated profile state`, async () => {
    const storeDir = await createStore()
    const original = basePackage(surface)
    const plan = await planDshProfileConfiguration({
      profilePackage: original,
      patchText: existingPatch,
      soulId: 'aster',
      storeDir,
      surface,
      dependencySpec: 'file:/repo/dsh-ai-soul',
    })

    assert.equal(plan.preflight.ready, true)
    assert.deepEqual(plan.files.packageJson.custom, { keep: true })
    assert.equal(plan.files.packageJson.dependencies.existing, '1.2.3')
    assert.equal(plan.files.packageJson.dependencies['dsh-ai-soul'], 'file:/repo/dsh-ai-soul')
    assert.deepEqual(plan.files.packageJson.dsh.profile.bundles, [
      '@deepseek-ai/dsh-base',
      'existing-bundle',
      'dsh-ai-soul',
      SURFACE_BUNDLES[surface],
    ])
    assert.match(plan.files.cordisPatch, /# preserved header/)
    assert.match(plan.files.cordisPatch, /- id: existing-plugin/)
    assert.match(plan.files.cordisPatch, /soulId: "aster"/)
  })
}

test('new profile dependency requires an explicit source and preserves it exactly', () => {
  assert.throws(
    () => configurePackage({ profilePackage: basePackage('tui') }),
    /dependencySpec is required when the profile does not already declare dsh-ai-soul/,
  )

  const configured = configurePackage({
    profilePackage: basePackage('tui'),
    dependencySpec: 'file:/absolute/path/to/dsh-ai-soul',
  })
  assert.equal(configured.dependencies['dsh-ai-soul'], 'file:/absolute/path/to/dsh-ai-soul')
})

test('existing dsh-ai-soul dependency is preserved when dependency spec is omitted', () => {
  const profilePackage = basePackage('web')
  profilePackage.dependencies['dsh-ai-soul'] = 'file:/already/installed/dsh-ai-soul'

  const configured = configurePackage({ profilePackage })
  assert.equal(configured.dependencies['dsh-ai-soul'], 'file:/already/installed/dsh-ai-soul')
})

test('canonical DSH empty patch is replaced with one valid profile entry sequence', () => {
  const initialPatch = `# DSH initialized profile patch\n[]\n`
  const configured = configurePatch({
    patchText: initialPatch,
    soulId: 'aster',
    storeDir: '/tmp/aster',
  })

  assert.match(configured, /^# DSH initialized profile patch\n- id: ai-soul\n/)
  assert.doesNotMatch(configured, /^\[\]$/m)
  assert.equal(configurePatch({ patchText: configured, soulId: 'aster', storeDir: '/tmp/aster' }), configured)
})

test('configure fails closed when an empty root sequence already coexists with profile entries', () => {
  assert.throws(
    () => configurePatch({
      patchText: `[]\n- id: existing-plugin\n`,
      soulId: 'aster',
      storeDir: '/tmp/aster',
    }),
    /cannot combine the root empty sequence \[\] with profile entries/,
  )
})

test('package and patch transforms are idempotent and update only the ai-soul block', async () => {
  const storeDir = await createStore()
  const oncePackage = configurePackage({ profilePackage: basePackage('tui'), dependencySpec: 'file:/repo/dsh-ai-soul' })
  const twicePackage = configurePackage({ profilePackage: oncePackage })
  assert.deepEqual(twicePackage, oncePackage)

  const firstPatch = configurePatch({
    patchText: `${existingPatch}- id: ai-soul\n  config:\n    soulId: old\n    storeDir: /old\n- id: trailing\n  config:\n    untouched: true\n`,
    soulId: 'aster',
    storeDir,
  })
  const secondPatch = configurePatch({ patchText: firstPatch, soulId: 'aster', storeDir })
  assert.equal(secondPatch, firstPatch)
  assert.match(firstPatch, /- id: trailing\n  config:\n    untouched: true/)
  assert.doesNotMatch(firstPatch, /soulId: old/)
})

test('dry-run returns exact mutations without writing files; write mode persists them', async () => {
  const storeDir = await createStore()
  const profileDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-configure-profile-'))
  const packagePath = join(profileDir, 'package.json')
  const patchPath = join(profileDir, 'cordis.patch.yml')
  const originalPackageText = `${JSON.stringify(basePackage('web'), null, 2)}\n`
  await writeFile(packagePath, originalPackageText)
  await writeFile(patchPath, existingPatch)

  const dryRun = await configureDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'web',
    dependencySpec: 'file:/repo/dsh-ai-soul',
  })
  assert.equal(dryRun.dryRun, true)
  assert.equal(dryRun.changed, true)
  assert.equal(await readFile(packagePath, 'utf8'), originalPackageText)
  assert.equal(await readFile(patchPath, 'utf8'), existingPatch)

  const written = await configureDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'web',
    dependencySpec: 'file:/repo/dsh-ai-soul',
    dryRun: false,
  })
  assert.equal(written.preflight.ready, true)
  assert.match(await readFile(patchPath, 'utf8'), /soulId: "aster"/)

  const rerun = await configureDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'web',
  })
  assert.equal(rerun.changed, false)
})

test('write mode refuses a missing surface or unloadable Soul without mutation', async () => {
  const storeDir = await createStore()
  const profileDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-configure-not-ready-'))
  const packagePath = join(profileDir, 'package.json')
  const patchPath = join(profileDir, 'cordis.patch.yml')
  const packageWithoutWeb = basePackage('tui')
  const packageText = `${JSON.stringify(packageWithoutWeb, null, 2)}\n`
  await writeFile(packagePath, packageText)
  await writeFile(patchPath, existingPatch)

  await assert.rejects(
    () => configureDshProfileDir({
      profileDir,
      soulId: 'aster',
      storeDir,
      surface: 'web',
      dependencySpec: 'file:/repo/dsh-ai-soul',
      dryRun: false,
    }),
    /applicationSurfacePresent/,
  )
  assert.equal(await readFile(packagePath, 'utf8'), packageText)
  assert.equal(await readFile(patchPath, 'utf8'), existingPatch)

  await assert.rejects(
    () => configureDshProfileDir({
      profileDir,
      soulId: 'missing-soul',
      storeDir,
      surface: 'tui',
      dependencySpec: 'file:/repo/dsh-ai-soul',
      dryRun: false,
    }),
    /soulLoadable/,
  )
  assert.equal(await readFile(packagePath, 'utf8'), packageText)
  assert.equal(await readFile(patchPath, 'utf8'), existingPatch)
})

test('malformed or incomplete profiles fail before any write', async () => {
  const storeDir = await createStore()
  const profileDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-configure-invalid-'))
  const packagePath = join(profileDir, 'package.json')
  const patchPath = join(profileDir, 'cordis.patch.yml')
  await writeFile(packagePath, '{ invalid json')
  await writeFile(patchPath, existingPatch)

  await assert.rejects(() => configureDshProfileDir({
    profileDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
    dryRun: false,
  }))
  assert.equal(await readFile(packagePath, 'utf8'), '{ invalid json')
  assert.equal(await readFile(patchPath, 'utf8'), existingPatch)

  const missingPatchDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-profile-configure-missing-'))
  await mkdir(join(missingPatchDir, 'nested'))
  await writeFile(join(missingPatchDir, 'package.json'), JSON.stringify(basePackage('tui')))
  await assert.rejects(() => configureDshProfileDir({
    profileDir: missingPatchDir,
    soulId: 'aster',
    storeDir,
    surface: 'tui',
    dryRun: false,
  }))
})
