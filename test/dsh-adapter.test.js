import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { apply, createSoulState, FileSoulStore } from '../src/index.js'

test('loads configured Soul and registers DSH dynamic context', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-adapter-'))
  const store = new FileSoulStore({ rootDir })
  const state = createSoulState({ soulId: 'soul-2', name: 'Second Soul' })
  await store.save(state)

  const registrations = []
  const ctx = {
    systemPrompt: {
      context(definition) {
        registrations.push(definition)
        return () => {}
      },
    },
  }

  await apply(ctx, { soulId: 'soul-2', storeDir: rootDir })

  assert.equal(registrations.length, 1)
  assert.equal(registrations[0].name, 'ai-soul:soul-2')
  assert.equal(registrations[0].order, -10)
  assert.match(registrations[0].text, /Name: Second Soul/)
})

test('adapter has no Samuel-specific default', async () => {
  const ctx = { systemPrompt: { context() {} } }
  await assert.rejects(() => apply(ctx, {}), /config\.soulId is required/)
})

test('adapter reports missing systemPrompt service at the runtime boundary', async () => {
  await assert.rejects(
    () => apply({}, { soulId: 'soul-2', storeDir: '.souls' }),
    /required DSH systemPrompt service is unavailable/,
  )
})

test('adapter reports store-load failures without dumping Soul state', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-adapter-missing-'))
  const ctx = { systemPrompt: { context() {} } }

  await assert.rejects(
    () => apply(ctx, { soulId: 'missing-soul', storeDir: rootDir }),
    (error) => {
      assert.match(error.message, /store-load error/)
      assert.match(error.message, /soulId=missing-soul/)
      assert.match(error.message, /storeDir=/)
      return true
    },
  )
})
