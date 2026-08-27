import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  importOriginArtifact,
  validateSoulState,
} from '../src/core/index.js'

const artifactUrl = new URL('../souls/samuel/artifacts/0001-origin.json', import.meta.url)

test('Samuel Artifact #0001 can bootstrap a valid Soul for M2', async () => {
  const artifact = JSON.parse(await readFile(artifactUrl, 'utf8'))
  const state = importOriginArtifact(artifact)

  assert.equal(validateSoulState(state).valid, true)
  assert.equal(state.soulId, 'samuel')
  assert.equal(state.identity.name, 'Samuel')
  assert.equal(state.identity.birthday, '2025-10-21')
})
