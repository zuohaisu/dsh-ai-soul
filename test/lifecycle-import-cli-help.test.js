import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const prepareCli = new URL('../src/cli/prepare-lifecycle-import.js', import.meta.url)
const reconcileCli = new URL('../src/cli/reconcile-lifecycle-import.js', import.meta.url)
const promoteCli = new URL('../src/cli/promote-lifecycle-import.js', import.meta.url)

function runCli(cli, args = []) {
  return spawnSync(process.execPath, [cli.pathname, ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
  })
}

function assertUsageFailure(result, pattern) {
  assert.notEqual(result.status, 0)
  assert.doesNotMatch(result.stderr, /\n\s+at /)
  const output = JSON.parse(result.stderr)
  assert.equal(output.ready, false)
  assert.equal(output.kind, 'usage')
  assert.match(output.error, pattern)
  assert.match(output.hint, /--help/)
  assert.doesNotMatch(result.stderr, /samuel/i)
}

test('lifecycle import CLIs expose Samuel-free self-describing help', () => {
  const prepare = runCli(prepareCli, ['--help'])
  assert.equal(prepare.status, 0, prepare.stderr)
  assert.match(prepare.stdout, /--target-soul-id <id>/)
  assert.match(prepare.stdout, /does\s+not mutate canonical Soul State/i)

  const reconcile = runCli(reconcileCli, ['--help'])
  assert.equal(reconcile.status, 0, reconcile.stderr)
  assert.match(reconcile.stdout, /--target-path <json>/)
  assert.match(reconcile.stdout, /different value is not\s+implicitly a conflict/i)

  const promote = runCli(promoteCli, ['--help'])
  assert.equal(promote.status, 0, promote.stderr)
  assert.match(promote.stdout, /--value <json>/)
  assert.match(promote.stdout, /does\s+not mutate canonical Soul State/i)

  assert.doesNotMatch(`${prepare.stdout}${reconcile.stdout}${promote.stdout}`, /samuel/i)
})

test('lifecycle import CLIs reject unknown options before doing work', () => {
  assertUsageFailure(runCli(prepareCli, ['--soul', 'aster']), /unknown argument: --soul/)
  assertUsageFailure(runCli(reconcileCli, ['--profile', 'web']), /unknown argument: --profile/)
  assertUsageFailure(runCli(promoteCli, ['--surface', 'tui']), /unknown argument: --surface/)
})

test('lifecycle import CLIs report missing required inputs without stack traces', () => {
  assertUsageFailure(runCli(prepareCli), /--source-file is required/)
  assertUsageFailure(runCli(reconcileCli), /--import-dir is required/)
  assertUsageFailure(runCli(promoteCli), /--import-dir is required/)
})

test('lifecycle import JSON arguments fail as usage errors', () => {
  const reconcile = runCli(reconcileCli, [
    '--import-dir', 'import',
    '--review-dir', 'review',
    '--claim-id', 'aster-claim-001',
    '--reconciliation-id', 'aster-reconcile-001',
    '--target-path', '{bad-json}',
    '--proposed-value', '"Nova"',
    '--rationale', 'Compare evidence.',
    '--recorded-by', 'rowan',
    '--recorded-at', '2026-08-28T01:00:00.000Z',
  ])
  assertUsageFailure(reconcile, /--target-path must be valid JSON/)

  const promote = runCli(promoteCli, [
    '--import-dir', 'import',
    '--review-dir', 'review',
    '--claim-id', 'aster-claim-001',
    '--target', 'userModel',
    '--path', 'userModel',
    '--value', '{bad-json}',
    '--proposer', 'rowan',
    '--proposal-id', 'aster-proposal-001',
    '--at', '2026-08-28T01:20:00.000Z',
  ])
  assertUsageFailure(promote, /--value must be valid JSON/)
})
