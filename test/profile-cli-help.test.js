import assert from 'node:assert/strict'
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

test('configure CLI rejects non-numeric context order as a concise usage failure', () => {
  const result = run(configureCli, [
    '--profile-dir', '/tmp/profile',
    '--soul-id', 'aster',
    '--store-dir', '/tmp/store',
    '--surface', 'tui',
    '--context-order', 'not-a-number',
  ])

  assert.notEqual(result.status, 0)
  const output = JSON.parse(result.stderr)
  assert.match(output.error, /context-order must be a finite number/)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
})
