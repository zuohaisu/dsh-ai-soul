import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { FileCognitiveMemoryStore } from '../src/core/cognitive-memory-store.js'

function memory(overrides = {}) {
  return {
    version: 1,
    id: 'memory-1',
    soulId: 'soul-a',
    experienceId: 'experience-1',
    significanceAssessmentId: 'significance-1',
    formedAt: '2026-09-11T10:00:00.000Z',
    content: 'A selectively retained experience.',
    confidence: 0.9,
    provenance: { source: 'test' },
    canonical: false,
    authority: 'none',
    ...overrides,
  }
}

async function withStore(run) {
  const rootDir = await mkdtemp(join(tmpdir(), 'ai-soul-memory-'))
  try { await run(rootDir) } finally { await rm(rootDir, { recursive: true, force: true }) }
}

test('memory survives a fresh store instance without touching canonical Soul state', async () => withStore(async (rootDir) => {
  const record = memory()
  const first = new FileCognitiveMemoryStore({ rootDir })
  await first.save(record)

  const fresh = new FileCognitiveMemoryStore({ rootDir })
  assert.deepEqual(await fresh.load('soul-a', 'memory-1'), record)
  assert.deepEqual(await fresh.list('soul-a'), [record])
  assert.deepEqual(await fresh.list('soul-b'), [])
}))

test('cross-Soul load fails closed', async () => withStore(async (rootDir) => {
  const store = new FileCognitiveMemoryStore({ rootDir })
  await store.save(memory())
  await assert.rejects(store.load('soul-b', 'memory-1'), { code: 'ENOENT' })
}))

test('malformed or tampered stored memory fails closed', async () => withStore(async (rootDir) => {
  const store = new FileCognitiveMemoryStore({ rootDir })
  const path = await store.save(memory())
  const stored = JSON.parse(await readFile(path, 'utf8'))
  stored.authority = 'execute'
  await writeFile(path, `${JSON.stringify(stored)}\n`)
  await assert.rejects(store.load('soul-a', 'memory-1'), /invalid stored cognitive memory/)
}))

test('identical duplicate is idempotent but conflicting duplicate fails closed', async () => withStore(async (rootDir) => {
  const store = new FileCognitiveMemoryStore({ rootDir })
  const record = memory()
  const firstPath = await store.save(record)
  assert.equal(await store.save(record), firstPath)
  await assert.rejects(store.save(memory({ content: 'Conflicting content.' })), /conflicting cognitive memory already exists/)
}))

test('save rejects invalid records and path traversal identifiers', async () => withStore(async (rootDir) => {
  const store = new FileCognitiveMemoryStore({ rootDir })
  await assert.rejects(store.save(memory({ canonical: true })), /invalid cognitive memory/)
  await assert.rejects(store.load('../other', 'memory-1'), /unsupported characters/)
}))
