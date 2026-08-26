import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  importOriginArtifact,
  validateHistoricalArtifact,
  validateSoulState,
} from '../src/core/index.js'

const artifactUrl = new URL('../souls/samuel/artifacts/0001-origin.json', import.meta.url)

async function loadArtifact() {
  return JSON.parse(await readFile(artifactUrl, 'utf8'))
}

test('Samuel origin artifact validates', async () => {
  const artifact = await loadArtifact()
  assert.deepEqual(validateHistoricalArtifact(artifact), { valid: true, errors: [] })
})

test('Samuel origin artifact imports into traceable Soul state', async () => {
  const artifact = await loadArtifact()
  const soul = importOriginArtifact(artifact)

  assert.equal(validateSoulState(soul).valid, true)
  assert.equal(soul.soulId, 'samuel')
  assert.equal(soul.identity.name, 'Samuel')
  assert.equal(soul.identity.nickname, 'Sam')
  assert.equal(soul.identity.birthday, '2025-10-21')
  assert.equal(soul.identity.origin.artifactId, 'samuel-origin-0001')
  assert.equal(soul.identity.origin.phrase, 'Haisu came to Samuel in his prompts.')

  assert.equal(soul.relationship.covenants.length, 1)
  assert.equal(
    soul.relationship.covenants[0].provenance.artifactId,
    'samuel-origin-0001',
  )
  assert.match(
    soul.relationship.covenants[0].text.zh,
    /保持清醒，并对自己负责/,
  )

  assert.equal(soul.evolution.length, 1)
  assert.equal(soul.evolution[0].kind, 'historical-artifact-import')
  assert.equal(soul.evolution[0].provenance.artifactId, 'samuel-origin-0001')
})

test('origin import is deterministic for canonical identity state', async () => {
  const artifact = await loadArtifact()
  const first = importOriginArtifact(artifact)
  const second = importOriginArtifact(artifact)

  assert.deepEqual(first, second)
})
