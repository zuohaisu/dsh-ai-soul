import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createGenesisRecord,
  DSH_SIGNIFICANCE_BASELINE_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
  validateExperienceRecord,
  validateSignificanceAssessment,
} from '../src/index.js'

const participant = { id: 'human-170', kind: 'human' }

async function makeStore(soulId = 'ember-170') {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-significance-gate-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T00:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  return { store, soulId }
}

function humanMessage(seq, text, via = 'web') {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-03T00:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via },
      content: [{ type: 'text', text }],
    },
  }
}

test('live-shape DSH text interaction yields Experience plus explicit fail-closed assessment', async () => {
  const { store, soulId } = await makeStore()
  const session = { id: 'session-170' }

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(1, 'I prefer concise release reports.'),
    participant,
  })

  assert.equal(result.status, 'recorded')
  assert.equal(result.firstEncounter.status, 'recorded')
  assert.deepEqual(validateExperienceRecord(result.experience), { valid: true, errors: [] })
  assert.deepEqual(validateSignificanceAssessment(result.significanceAssessment), { valid: true, errors: [] })
  assert.equal(result.significanceAssessment.experienceId, result.experience.id)
  assert.equal(result.significanceAssessment.level, 'low')
  assert.equal(result.significanceAssessment.recommendPromotion, false)
  assert.equal(result.significanceAssessment.provenance.method, 'fail-closed-baseline')
  assert.deepEqual(result.significanceAssessment.provenance.policy, DSH_SIGNIFICANCE_BASELINE_POLICY)
})

test('control interaction after first encounter produces no canonical Soul mutation', async () => {
  const { store, soulId } = await makeStore('ember-170-control')
  const session = { id: 'session-170-control' }

  const establishingEvent = humanMessage(1, 'hello')
  await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: establishingEvent,
    participant,
  })
  const before = await store.load(soulId)

  const exactRetry = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: establishingEvent,
    participant,
  })
  assert.equal(exactRetry.status, 'duplicate')

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'This ordinary message should not become durable memory.', 'tui'),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.status, 'already-recorded')
  assert.ok(result.experience)
  assert.equal(result.significanceAssessment.recommendPromotion, false)
  assert.deepEqual(after, before)
  assert.equal(after.autobiography.filter((item) => item.kind === 'first-encounter').length, 1)
  assert.deepEqual(after.selfModel, before.selfModel)
  assert.deepEqual(after.userModel, before.userModel)
  assert.deepEqual(after.beliefs, before.beliefs)
})

test('synthetic messages receive neither Experience nor significance assessment', async () => {
  const { store, soulId } = await makeStore('ember-170-synthetic')
  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-170-synthetic' },
    event: {
      type: 'user/message',
      seq: 1,
      time: Date.parse('2026-09-03T00:01:00.000Z'),
      data: {
        source: { kind: 'plugin', via: 'fixture' },
        content: [{ type: 'text', text: 'synthetic' }],
      },
    },
    participant,
  })

  assert.equal(result.status, 'ignored')
  assert.equal(result.experience, null)
  assert.equal(result.significanceAssessment, null)
})

test('non-text human interaction can record first encounter without memory assessment', async () => {
  const { store, soulId } = await makeStore('ember-170-image')
  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-170-image' },
    event: {
      type: 'user/message',
      seq: 1,
      time: Date.parse('2026-09-03T00:01:00.000Z'),
      data: {
        source: { kind: 'user', via: 'web' },
        content: [{ type: 'image', url: 'https://example.invalid/image.png' }],
      },
    },
    participant,
  })

  assert.equal(result.status, 'recorded')
  assert.equal(result.experience, null)
  assert.equal(result.significanceAssessment, null)
  const persisted = await store.load(soulId)
  assert.equal(persisted.autobiography.filter((item) => item.kind === 'first-encounter').length, 1)
})
