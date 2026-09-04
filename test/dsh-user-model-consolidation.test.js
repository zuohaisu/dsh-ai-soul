import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createGenesisRecord,
  EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
} from '../src/index.js'

const participant = { id: 'human-224', kind: 'human' }

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-consolidation-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-04T01:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  return store
}

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-04T01:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

test('explicit consolidation resolves two exact current preferences and emits non-authoritative N-to-1 intent', async () => {
  const soulId = 'ember-224-consolidate'
  const store = await makeStore(soulId)
  const session = { id: 'session-224-consolidate' }
  await processDshHumanInteraction({ store, soulId, session, event: humanMessage(1, 'hello'), participant })

  const seeded = await store.load(soulId)
  seeded.userModel.push(
    { claim: 'The user prefers concise status updates.' },
    { claim: 'The user prefers explicit acceptance criteria.' },
  )
  await store.save(seeded)
  const before = await store.load(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Please consolidate my preferences "concise status updates" and "explicit acceptance criteria" into "concise status updates with explicit acceptance criteria".'),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.significanceAssessment.provenance.policy.id, EXPLICIT_USER_MODEL_CONSOLIDATION_POLICY.id)
  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.candidateClaim.target, 'userModel')
  assert.equal(result.candidateClaim.statement, 'The user prefers concise status updates with explicit acceptance criteria.')
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.deepEqual(result.transitionIntent, {
    operation: 'consolidate',
    previousValues: [
      { claim: 'The user prefers concise status updates.' },
      { claim: 'The user prefers explicit acceptance criteria.' },
    ],
  })
  assert.deepEqual(after, before)
})

test('consolidation fails closed when any source is missing, duplicated in state, or duplicated in request', async () => {
  const soulId = 'ember-224-fail-closed'
  const store = await makeStore(soulId)
  const state = await store.load(soulId)
  state.userModel.push(
    { claim: 'The user prefers concise status updates.' },
    { claim: 'The user prefers concise status updates.' },
  )
  await store.save(state)

  for (const text of [
    'Please consolidate my preferences "concise status updates" and "explicit acceptance criteria" into "clear engineering communication".',
    'Please consolidate my preferences "concise status updates" and "concise status updates" into "clear engineering communication".',
  ]) {
    const result = await processDshHumanInteraction({
      store,
      soulId,
      session: { id: `session-${encodeURIComponent(text)}` },
      event: humanMessage(1, text),
      participant,
    })
    assert.equal(result.significanceAssessment.recommendPromotion, false)
    assert.equal(result.candidateClaim, null)
    assert.equal(result.transitionIntent, null)
  }
})

test('implicit or semantic consolidation language remains fail closed', async () => {
  const soulId = 'ember-224-implicit'
  const store = await makeStore(soulId)
  const state = await store.load(soulId)
  state.userModel.push(
    { claim: 'The user prefers concise status updates.' },
    { claim: 'The user prefers explicit acceptance criteria.' },
  )
  await store.save(state)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-224-implicit' },
    event: humanMessage(1, 'Those two preferences basically mean I like clear engineering communication.'),
    participant,
  })

  assert.equal(result.significanceAssessment.recommendPromotion, false)
  assert.equal(result.candidateClaim, null)
  assert.equal(result.transitionIntent, null)
})
