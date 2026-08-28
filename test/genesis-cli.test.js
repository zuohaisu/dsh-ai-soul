import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

import { bootstrapGenesisSoul } from '../src/genesis-bootstrap.js'
import { FileSoulStore } from '../src/core/index.js'

const execFileAsync = promisify(execFile)

function independentRecord(overrides = {}) {
  return {
    version: 1,
    id: 'genesis-nova-cli-001',
    at: '2026-08-28T00:30:00.000Z',
    soulId: 'nova-cli',
    name: 'Nova',
    participants: [{ id: 'human-nova', role: 'human-partner' }],
    provenance: { method: 'explicit-first-meeting', source: 'genesis-cli-test' },
    firstMeetingNote: 'Nova was named during an explicit first meeting.',
    ...overrides,
  }
}

async function writeRecord(rootDir, record, filename = 'genesis.json') {
  const path = join(rootDir, filename)
  await writeFile(path, `${JSON.stringify(record, null, 2)}\n`)
  return path
}

test('Genesis package helper creates and reloads an independent Soul', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-helper-'))
  const storeDir = join(rootDir, 'souls')
  const recordFile = await writeRecord(rootDir, independentRecord())

  const result = await bootstrapGenesisSoul({ recordFile, storeDir })
  const reloaded = await new FileSoulStore({ rootDir: storeDir }).load('nova-cli')

  assert.equal(result.soulId, 'nova-cli')
  assert.equal(result.name, 'Nova')
  assert.equal(result.genesisRecordId, 'genesis-nova-cli-001')
  assert.match(result.storePath, /nova-cli\.json$/)
  assert.deepEqual(reloaded, result.state)
  assert.equal(reloaded.identity.origin.genesisRecordId, 'genesis-nova-cli-001')
  assert.doesNotMatch(JSON.stringify(reloaded), /samuel/i)
})

test('published Genesis CLI creates a Soul without repository example code', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-cli-'))
  const storeDir = join(rootDir, 'souls')
  const recordFile = await writeRecord(rootDir, independentRecord({ soulId: 'orion-cli', name: 'Orion', id: 'genesis-orion-cli-001' }))
  const cliFile = new URL('../src/cli/bootstrap-genesis.js', import.meta.url)

  const { stdout, stderr } = await execFileAsync(process.execPath, [
    cliFile.pathname,
    '--record', recordFile,
    '--store-dir', storeDir,
  ])

  assert.equal(stderr, '')
  assert.match(stdout, /Genesis persisted Soul orion-cli/)
  assert.match(stdout, /Name: Orion/)
  assert.match(stdout, /Origin record: genesis-orion-cli-001/)

  const persisted = JSON.parse(await readFile(join(storeDir, 'orion-cli.json'), 'utf8'))
  assert.equal(persisted.soulId, 'orion-cli')
  assert.equal(persisted.identity.origin.genesisRecordId, 'genesis-orion-cli-001')
})

test('Genesis helper fails closed for malformed input and duplicate Soul IDs', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-genesis-fail-'))
  const storeDir = join(rootDir, 'souls')
  const malformedFile = await writeRecord(rootDir, { version: 1, soulId: 'bad' }, 'bad.json')

  await assert.rejects(
    () => bootstrapGenesisSoul({ recordFile: malformedFile, storeDir }),
    /invalid genesis record/,
  )

  const firstFile = await writeRecord(rootDir, independentRecord({ soulId: 'stable-cli' }), 'first.json')
  const replacementFile = await writeRecord(rootDir, independentRecord({
    id: 'genesis-replacement-001',
    soulId: 'stable-cli',
    name: 'Replacement',
  }), 'replacement.json')

  await bootstrapGenesisSoul({ recordFile: firstFile, storeDir })
  await assert.rejects(
    () => bootstrapGenesisSoul({ recordFile: replacementFile, storeDir }),
    /Genesis refused to overwrite existing Soul stable-cli/,
  )

  const reloaded = await new FileSoulStore({ rootDir: storeDir }).load('stable-cli')
  assert.equal(reloaded.identity.name, 'Nova')
})
