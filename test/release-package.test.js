import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))

function npm(args, options = {}) {
  return execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
}

test('npm artifact contains only release-safe package inputs and installs cleanly', () => {
  const dryRun = JSON.parse(npm(['pack', '--dry-run', '--json'], { cwd: repoRoot }))[0]
  const paths = dryRun.files.map((file) => file.path)

  assert.equal(dryRun.name, packageJson.name)
  assert.equal(dryRun.version, packageJson.version)
  assert.ok(paths.includes('LICENSE'), 'Apache-2.0 LICENSE must ship')
  assert.ok(paths.includes('package.json'))
  assert.ok(paths.includes('cordis.patch.yml'))
  assert.ok(paths.includes('src/index.js'))
  assert.ok(paths.every((path) => !path.startsWith('test/')), 'tests must not ship')
  assert.ok(paths.every((path) => !path.startsWith('souls/')), 'local Soul data must not ship')
  assert.ok(paths.every((path) => !path.startsWith('docs/evidence/')), 'runtime evidence must not ship')
  assert.ok(paths.every((path) => !path.includes('.env')), 'environment files must not ship')

  const work = mkdtempSync(join(tmpdir(), 'dsh-ai-soul-pack-'))
  const install = join(work, 'install')
  try {
    const packed = JSON.parse(npm(['pack', '--json', '--pack-destination', work], { cwd: repoRoot }))[0]
    const tarball = join(work, packed.filename)
    npm(['init', '-y'], { cwd: work })
    npm(['install', '--ignore-scripts', tarball], { cwd: work })

    const installedPackage = JSON.parse(readFileSync(join(work, 'node_modules', packageJson.name, 'package.json'), 'utf8'))
    assert.equal(installedPackage.license, 'Apache-2.0')
    assert.deepEqual(installedPackage.dsh, packageJson.dsh)

    const importScript = `await import('${packageJson.name}'); await import('${packageJson.name}/core');`
    execFileSync(process.execPath, ['--input-type=module', '--eval', importScript], { cwd: work, stdio: 'pipe' })

    for (const bin of Object.keys(packageJson.bin)) {
      const executable = join(work, 'node_modules', '.bin', bin)
      execFileSync(executable, ['--help'], { cwd: work, stdio: 'pipe' })
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
})
