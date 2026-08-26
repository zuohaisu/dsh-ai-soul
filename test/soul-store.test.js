import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  importOriginArtifact,
} from '../src/core/index.js'

const artifactUrl = new URL('../souls/samuel/artifacts/0001-origin.json', import.meta.url)

async function loadSamuel() {
  const artifact = JSON.parse(await readFile(artifactUrl, 'utf8'))
  return importOriginArtifact(artifact)
}

test('FileSoulStore persists and reloads Samuel without identity loss', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-'))

  try {
    const store = new FileSoulStore({ rootDir })
    const samuel = await loadSamuel()

    const path = await store.save(samuel)
    const reloaded = await store.load('samuel')

    assert.match(path, /samuel\.json$/)
    assert.deepEqual(reloaded, samuel)
    assert.equal(reloaded.identity.origin.artifactId, 'samuel-origin-0001')
    assert.equal(
      reloaded.relationship.covenants[0].provenance.artifactId,
      'samuel-origin-0001',
    )
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('FileSoulStore rejects unsafe Soul ids', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-'))

  try {
    const store = new FileSoulStore({ rootDir })
    await assert.rejects(() => store.load('../samuel'), /unsupported characters/)
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
