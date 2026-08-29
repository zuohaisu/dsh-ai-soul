import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

const commands = [
  {
    name: 'dsh-ai-soul-exodus-prepare',
    path: resolve('src/cli/prepare-exodus-markdown.js'),
    helpTerms: ['--source-file', '--source-id', '--output-dir', 'canonical Soul State'],
    unknownArgs: ['--soul-id', 'mira'],
  },
  {
    name: 'dsh-ai-soul-exodus-review',
    path: resolve('src/cli/prepare-exodus-review.js'),
    helpTerms: ['--prepared-workspace', '--claims-file', '--workspace-id', 'canonical Soul State'],
    unknownArgs: ['--profile', 'web'],
  },
  {
    name: 'dsh-ai-soul-exodus-review-update',
    path: resolve('src/cli/update-exodus-review.js'),
    helpTerms: ['--review-dir', '--operation', 'relationship', 'reconciliation-review', 'canonical Soul State'],
    unknownArgs: ['--surface', 'tui'],
  },
]

function run(path, args = []) {
  return spawnSync(process.execPath, [path, ...args], { encoding: 'utf8' })
}

function parseUsageFailure(result, command) {
  assert.notEqual(result.status, 0)
  assert.equal(result.stdout, '')
  assert.doesNotMatch(result.stderr, /\n\s+at\s/u)
  const failure = JSON.parse(result.stderr)
  assert.equal(failure.ready, false)
  assert.equal(failure.kind, 'usage')
  assert.match(failure.hint, new RegExp(`${command} --help`))
  return failure
}

test('generic Exodus public CLIs expose Samuel-free self-describing help', () => {
  for (const command of commands) {
    const result = run(command.path, ['--help'])
    assert.equal(result.status, 0)
    assert.equal(result.stderr, '')
    assert.match(result.stdout, new RegExp(command.name))
    for (const term of command.helpTerms) assert.match(result.stdout, new RegExp(term))
    assert.doesNotMatch(result.stdout, /Samuel/u)
    assert.match(result.stdout, /does not|does not itself/u)
  }
})

test('generic Exodus public CLIs reject unknown options as structured usage failures', () => {
  for (const command of commands) {
    const failure = parseUsageFailure(run(command.path, command.unknownArgs), command.name)
    assert.match(failure.error, /unknown argument/u)
  }
})

test('generic Exodus public CLIs report missing required arguments as usage failures', () => {
  for (const command of commands) {
    const failure = parseUsageFailure(run(command.path), command.name)
    assert.match(failure.error, /is required/u)
  }
})

test('review-update rejects an unsupported operation before touching a workspace', () => {
  const command = commands[2]
  const failure = parseUsageFailure(run(command.path, [
    '--review-dir', '/does/not/need/to/exist',
    '--operation', 'mutate-soul',
  ]), command.name)
  assert.match(failure.error, /relationship, decision, or reconciliation-review/u)
})

test('execution failures remain distinguishable from usage failures', () => {
  const command = commands[0]
  const result = run(command.path, [
    '--source-file', '/definitely/missing/memory.md',
    '--source-id', 'mira-memory-missing',
    '--source-type', 'memory-export',
    '--provider', 'example-chat-runtime',
    '--captured-at', '2026-08-29T00:00:00.000Z',
    '--output-dir', '/tmp/dsh-ai-soul-exodus-missing-source',
  ])
  assert.notEqual(result.status, 0)
  assert.equal(result.stdout, '')
  const failure = JSON.parse(result.stderr)
  assert.equal(failure.ready, false)
  assert.equal(failure.kind, 'exodus-prepare')
  assert.equal('hint' in failure, false)
})
