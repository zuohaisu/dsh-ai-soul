import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

const execFileAsync = promisify(execFile)
const fixture = resolve('test/fixtures/exodus/mira-memory.md')
const cli = resolve('src/cli/prepare-exodus-markdown.js')

function args(outputDir, extra = []) {
  return [
    cli,
    '--source-file', fixture,
    '--source-id', 'mira-memory-cli-001',
    '--source-type', 'memory-export',
    '--provider', 'example-chat-runtime',
    '--captured-at', '2026-08-27T09:00:00.000Z',
    '--output-dir', outputDir,
    ...extra,
  ]
}

test('CLI prepares a non-Samuel Markdown Exodus workspace with preserved bytes and provenance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-cli-'))
  const outputDir = join(root, 'workspace')
  const originalBytes = await readFile(fixture)

  const { stdout } = await execFileAsync(process.execPath, args(outputDir))
  const summary = JSON.parse(stdout)
  const source = JSON.parse(await readFile(join(outputDir, 'source.json'), 'utf8'))
  const evidence = JSON.parse(await readFile(join(outputDir, 'evidence.json'), 'utf8'))
  const copiedBytes = await readFile(join(outputDir, 'original', 'mira-memory.md'))

  assert.deepEqual(copiedBytes, originalBytes)
  assert.equal(source.sourceId, 'mira-memory-cli-001')
  assert.equal(source.provider, 'example-chat-runtime')
  assert.equal(source.canonicalMutation, false)
  assert.equal(
    source.content.digest,
    createHash('sha256').update(originalBytes).digest('hex'),
  )
  assert.equal(evidence.sourceRef.digest, source.content.digest)
  assert.equal(evidence.canonicalMutation, false)
  assert.ok(evidence.units.length > 0)
  assert.ok(evidence.units.every((unit) => unit.canonicalMutation === false))
  assert.equal(summary.digest, source.content.digest)
  assert.equal(summary.canonicalMutation, false)
  assert.equal(summary.profileMutation, false)
  assert.deepEqual((await readdir(outputDir)).sort(), ['evidence.json', 'original', 'source.json'])
})

test('CLI refuses accidental overwrite of a non-empty workspace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-cli-refuse-'))
  const outputDir = join(root, 'workspace')
  await mkdir(outputDir)
  await writeFile(join(outputDir, 'notes.txt'), 'keep me')

  await assert.rejects(
    () => execFileAsync(process.execPath, args(outputDir)),
    /output workspace is not empty/,
  )
  assert.equal(await readFile(join(outputDir, 'notes.txt'), 'utf8'), 'keep me')
})

test('--replace replaces only a managed workspace and refuses unmanaged entries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-exodus-cli-replace-'))
  const outputDir = join(root, 'workspace')

  await execFileAsync(process.execPath, args(outputDir))
  await execFileAsync(process.execPath, args(outputDir, ['--replace']))
  assert.deepEqual((await readdir(outputDir)).sort(), ['evidence.json', 'original', 'source.json'])

  await writeFile(join(outputDir, 'human-notes.md'), 'do not delete')
  await assert.rejects(
    () => execFileAsync(process.execPath, args(outputDir, ['--replace'])),
    /unmanaged entries: human-notes.md/,
  )
  assert.equal(await readFile(join(outputDir, 'human-notes.md'), 'utf8'), 'do not delete')
})
