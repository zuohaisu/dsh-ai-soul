import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createGenesisRecord,
  EXPLICIT_WORLD_CONTEXT_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
  validateCandidateClaim,
  validateSignificanceAssessment,
} from '../src/index.js'

const participant = { id: 'human-world', kind: 'human' }

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-world-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T17:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  return store
}

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-03T17:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

test('explicit active-project declaration yields a non-authoritative worldModel candidate', async () => {
  const soulId = 'ember-world-project'
  const store = await makeStore(soulId)
  const session = { id: 'session-world-project' }

  await processDshHumanInteraction({ store, soulId, session, event: humanMessage(1, 'hello'), participant })
  const before = await store.load(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, "Please remember that AI Soul is an active project we're working on."),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.significanceAssessment.level, 'high')
  assert.equal(result.significanceAssessment.provenance.policy.id, EXPLICIT_WORLD_CONTEXT_POLICY.id)
  assert.equal(result.significanceAssessment.provenance.kind, 'active-project')
  assert.deepEqual(validateSignificanceAssessment(result.significanceAssessment), { valid: true, errors: [] })

  assert.deepEqual(validateCandidateClaim(result.candidateClaim), { valid: true, errors: [] })
  assert.equal(result.candidateClaim.target, 'worldModel')
  assert.equal(result.candidateClaim.statement, 'Active shared project: AI Soul.')
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.equal(result.candidateClaim.source.experienceId, result.experience.id)
  assert.equal(result.candidateClaim.source.significanceAssessmentId, result.significanceAssessment.id)
  assert.deepEqual(after, before)
})

test('explicit durable shared commitment yields a worldModel candidate', async () => {
  const soulId = 'ember-world-commitment'
  const store = await makeStore(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-world-commitment' },
    event: humanMessage(1, 'Please remember that we are committed to shipping a model-independent Soul runtime.'),
    participant,
  })

  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.significanceAssessment.provenance.kind, 'durable-commitment')
  assert.equal(result.candidateClaim.target, 'worldModel')
  assert.equal(result.candidateClaim.statement, 'Shared durable commitment: shipping a model-independent Soul runtime.')
})

test('ordinary or transient world references remain fail-closed', async () => {
  const soulId = 'ember-world-control'
  const store = await makeStore(soulId)
  const session = { id: 'session-world-control' }

  for (const [seq, text] of [
    [1, 'AI Soul is a project we are working on.'],
    [2, 'Today we are fixing the web adapter.'],
    [3, 'I am in Shenzhen.'],
    [4, 'OpenAI released a new model.'],
    [5, 'Alice joined the meeting.'],
  ]) {
    const result = await processDshHumanInteraction({
      store,
      soulId,
      session,
      event: humanMessage(seq, text),
      participant,
    })
    assert.equal(result.significanceAssessment.recommendPromotion, false)
    assert.equal(result.candidateClaim, null)
  }
})

test('existing OTHER inference remains intact after WORLD inference is added', async () => {
  const soulId = 'ember-world-regression'
  const store = await makeStore(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-world-regression' },
    event: humanMessage(1, 'Please remember that I prefer concise implementation notes.'),
    participant,
  })

  assert.equal(result.candidateClaim.target, 'userModel')
  assert.equal(result.candidateClaim.statement, 'The user prefers concise implementation notes.')
})
