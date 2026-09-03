import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createGenesisRecord,
  EXPLICIT_SELF_MODEL_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
  validateCandidateClaim,
} from '../src/index.js'

const participant = { id: 'human-self', kind: 'human' }

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-self-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T14:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  return store
}

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-03T14:0${seq}:00.000Z`),
    data: { role: 'user', source: { kind: 'user', via: 'web' }, content: [{ type: 'text', text }] },
  }
}

test('explicit durable self-understanding yields non-authoritative selfModel candidate', async () => {
  const soulId = 'ember-self-explicit'
  const store = await makeStore(soulId)
  const session = { id: 'session-self-explicit' }
  await processDshHumanInteraction({ store, soulId, session, event: humanMessage(1, 'hello'), participant })
  const before = await store.load(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Please remember that you understand yourself as a system that challenges assumptions before committing.'),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.significanceAssessment.provenance.policy.id, EXPLICIT_SELF_MODEL_POLICY.id)
  assert.deepEqual(validateCandidateClaim(result.candidateClaim), { valid: true, errors: [] })
  assert.equal(result.candidateClaim.target, 'selfModel')
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.equal(result.candidateClaim.source.experienceId, result.experience.id)
  assert.deepEqual(after, before)
})

test('forward-looking explicit self-understanding is recognized', async () => {
  const soulId = 'ember-self-forward'
  const store = await makeStore(soulId)
  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-self-forward' },
    event: humanMessage(1, 'From now on, understand yourself as a careful collaborator who separates evidence from interpretation.'),
    participant,
  })
  assert.equal(result.candidateClaim.target, 'selfModel')
  assert.match(result.candidateClaim.statement, /separates evidence from interpretation/)
})

test('ordinary descriptions, praise, and task instructions remain fail-closed', async () => {
  const soulId = 'ember-self-control'
  const store = await makeStore(soulId)
  const session = { id: 'session-self-control' }
  for (const [seq, text] of [
    [1, 'You are very thoughtful.'],
    [2, 'You are Samuel.'],
    [3, 'For this task, act as a skeptical reviewer.'],
  ]) {
    const result = await processDshHumanInteraction({ store, soulId, session, event: humanMessage(seq, text), participant })
    assert.equal(result.candidateClaim, null)
    assert.equal(result.significanceAssessment.recommendPromotion, false)
  }
})
