import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const configureCli = new URL('../src/cli/configure-dsh-profile.js', import.meta.url)
const preflightCli = new URL('../src/cli/preflight-dsh-profile.js', import.meta.url)

function run(cli, args = []) {
  return spawnSync(process.execPath, [cli.pathname, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
  })
}

test('configure CLI help is Samuel-free and describes composition inputs', () => {
  const result = run(configureCli, ['--help'])

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /--profile-dir <path>/)
  assert.match(result.stdout, /--soul-id <id>/)
  assert.match(result.stdout, /--surface <tui\|web\|headless>/)
  assert.match(result.stdout, /dsh plugin --profile <profile> add \/absolute\/path\/to\/dsh-ai-soul/)
  assert.match(result.stdout, /--dependency-spec <spec>/)
  assert.match(result.stdout, /manual\/source-controlled profile editing/)
  assert.match(result.stdout, /Required only when the profile does not already declare dsh-ai-soul/)
  assert.match(result.stdout, /dry-run/i)
  assert.doesNotMatch(result.stdout, /samuel/i)
})

test('preflight CLI help documents env fallbacks without coupling identity to surface', () => {
  const result = run(preflightCli, ['--help'])

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /DSH_PROFILE_DIR/)
  assert.match(result.stdout, /SOUL_ID/)
  assert.match(result.stdout, /DSH_SURFACE/)
  assert.match(result.stdout, /independent/i)
  assert.doesNotMatch(result.stdout, /samuel/i)
})

test('configure CLI reports missing inputs as structured JSON without a stack trace', () => {
  const result = run(configureCli)

  assert.notEqual(result.status, 0)
  const output = JSON.parse(result.stderr)
  assert.equal(output.ready, false)
  assert.match(output.error, /missing required --profile-dir/)
  assert.match(output.hint, /--help/)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
})

test('configure CLI rejects unknown options instead of silently ignoring typos', () => {
  const result = run(configureCli, ['--surfaec', 'web'])

  assert.notEqual(result.status, 0)
  const output = JSON.parse(result.stderr)
  assert.equal(output.ready, false)
  assert.match(output.error, /unknown option: --surfaec/)
  assert.match(output.hint, /--help/)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
})

test('preflight CLI rejects unknown options instead of silently ignoring typos', () => {
  const result = run(preflightCli, ['--surfaec', 'web'])

  assert.notEqual(result.status, 0)
  const output = JSON.parse(result.stderr)
  assert.equal(output.ready, false)
  assert.match(output.error, /unknown option: --surfaec/)
  assert.match(output.hint, /--help/)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
})

test('configure CLI rejects non-numeric context order as a concise usage failure', () => {
  const result = run(configureCli, [
    '--profile-dir', '/tmp/profile',
    '--soul-id', 'aster',
    '--store-dir', '/tmp/store',
    '--participant-id', 'human-partner-147',
    '--surface', 'tui',
    '--context-order', 'not-a-number',
  ])

  assert.notEqual(result.status, 0)
  const output = JSON.parse(result.stderr)
  assert.match(output.error, /context-order must be a finite number/)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
})

test('configure CLI reports the DSH install path when a new profile lacks the dependency', async () => {
  const profileDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-cli-dependency-'))
  await writeFile(join(profileDir, 'package.json'), JSON.stringify({
    name: 'fixture-tui',
    dependencies: {},
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-harness-tui/dsh-tui'] } },
  }))
  await writeFile(join(profileDir, 'cordis.patch.yml'), '')

  const result = run(configureCli, [
    '--profile-dir', profileDir,
    '--soul-id', 'aster',
    '--store-dir', '/tmp/store',
    '--participant-id', 'human-partner-147',
    '--surface', 'tui',
  ])

  assert.notEqual(result.status, 0)
  const output = JSON.parse(result.stderr)
  assert.match(output.error, /dependencySpec is required/)
  assert.match(output.hint, /dsh plugin --profile <profile> add <source>/)
  assert.match(output.hint, /--dependency-spec/)
  assert.match(output.hint, /manual\/source-controlled profile editing/)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
})
