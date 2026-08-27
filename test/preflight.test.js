import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createSoulState,
  FileSoulStore,
  preflightSoul,
} from '../src/index.js'

test('preflight loads, projects, and renders a persisted Soul', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-preflight-'))
  const store = new FileSoulStore({ rootDir })
  const state = createSoulState({ soulId: 'preflight-soul', name: 'Preflight Soul' })
  await store.save(state)

  const result = await preflightSoul({ soulId: 'preflight-soul', storeDir: rootDir })

  assert.equal(result.soulId, 'preflight-soul')
  assert.equal(result.state.identity.name, 'Preflight Soul')
  assert.equal(result.projection.identity.name, 'Preflight Soul')
  assert.match(result.renderedContext, /Name: Preflight Soul/)
})

test('preflight identifies store-load failures without dumping Soul content', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-preflight-missing-'))

  await assert.rejects(
    () => preflightSoul({ soulId: 'missing-soul', storeDir: rootDir }),
    (error) => {
      assert.match(error.message, /store-load boundary/)
      assert.match(error.message, /soulId=missing-soul/)
      assert.match(error.message, /storeDir=/)
      return true
    },
  )
})

test('preflight requires explicit Soul selection', async () => {
  await assert.rejects(
    () => preflightSoul({ storeDir: '.souls' }),
    /preflight soulId is required/,
  )
})
