import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createCandidatePromotionProposal,
  createGenesisRecord,
  EXPLICIT_DURABLE_PREFERENCE_REVISION_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
} from '../src/index.js'

const participant = { id: 'human-212', kind: 'human' }

async function makeStore(soulId, userModel = []) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-preference-revision-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-04T02:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  const state = await store.load(soulId)
  state.userModel.push(...structuredClone(userModel))
  await store.save(state)
  return store
}

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-04T02:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

async function processRevision(store, soulId, text, seq = 2) {
  return processDshHumanInteraction({
    store,
    soulId,
    session: { id: `session-${soulId}` },
    event: humanMessage(seq, text),
    participant,
  })
}

async function recordFirstEncounter(store, soulId) {
  await processDshHumanInteraction({
    store,
    soulId,
    session: { id: `session-${soulId}` },
    event: humanMessage(1, 'hello'),
    participant,
  })
}

test('explicit revision with exactly one current old preference yields a replace intent without mutation', async () => {
  const soulId = 'ember-212-revision'
  const oldPreference = { claim: 'The user prefers concise answers.' }
  const store = await makeStore(soulId, [oldPreference])
  await recordFirstEncounter(store, soulId)
  const before = await store.load(soulId)

  const result = await processRevision(
    store,
    soulId,
    'I used to prefer concise answers, but from now on I prefer detailed answers.',
  )
  const after = await store.load(soulId)

  assert.equal(result.significanceAssessment.provenance.policy.id, EXPLICIT_DURABLE_PREFERENCE_REVISION_POLICY.id)
  assert.equal(result.candidateClaim.statement, 'The user prefers detailed answers.')
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.deepEqual(result.transitionIntent, {
    operation: 'replace',
    previousValue: oldPreference,
  })
  assert.deepEqual(after, before)

  const proposal = createCandidatePromotionProposal(result.candidateClaim, {
    id: 'proposal-212',
    at: result.candidateClaim.createdAt,
    reason: 'Explicit durable preference revision requires independent governance.',
    proposer: 'test:reflection',
    provenance: { source: 'test' },
    operation: result.transitionIntent.operation,
    previousValue: result.transitionIntent.previousValue,
  })

  assert.equal(proposal.operation, 'replace')
  assert.deepEqual(proposal.previousValue, oldPreference)
  assert.deepEqual(proposal.value, { claim: 'The user prefers detailed answers.' })
  assert.equal(proposal.review, null)
})

test('revision fails closed when the stated old preference is absent', async () => {
  const soulId = 'ember-212-missing'
  const store = await makeStore(soulId, [{ claim: 'The user prefers short summaries.' }])

  const result = await processRevision(
    store,
    soulId,
    'I used to prefer concise answers, but from now on I prefer detailed answers.',
  )

  assert.equal(result.candidateClaim, null)
  assert.equal(result.transitionIntent, null)
  assert.equal(result.significanceAssessment.recommendPromotion, false)
})

test('revision fails closed when the stated old preference is duplicated', async () => {
  const soulId = 'ember-212-duplicate'
  const oldPreference = { claim: 'The user prefers concise answers.' }
  const store = await makeStore(soulId, [oldPreference, oldPreference])

  const result = await processRevision(
    store,
    soulId,
    'I used to prefer concise answers, but from now on I prefer detailed answers.',
  )

  assert.equal(result.candidateClaim, null)
  assert.equal(result.transitionIntent, null)
})

test('vague change language does not become a revision', async () => {
  const soulId = 'ember-212-vague'
  const store = await makeStore(soulId, [{ claim: 'The user prefers concise answers.' }])

  const result = await processRevision(store, soulId, 'I think I want more detail now.')

  assert.equal(result.candidateClaim, null)
  assert.equal(result.transitionIntent, null)
  assert.equal(result.significanceAssessment.recommendPromotion, false)
})

test('existing explicit append preference behavior remains append-oriented', async () => {
  const soulId = 'ember-212-append'
  const store = await makeStore(soulId)

  const result = await processRevision(store, soulId, 'From now on, I prefer detailed answers.')

  assert.equal(result.candidateClaim.statement, 'The user prefers detailed answers.')
  assert.equal(result.transitionIntent, null)
  const proposal = createCandidatePromotionProposal(result.candidateClaim, {
    id: 'proposal-212-append',
    at: result.candidateClaim.createdAt,
    reason: 'New durable preference requires governance.',
    proposer: 'test:reflection',
    provenance: { source: 'test' },
  })
  assert.equal(proposal.operation, 'append')
  assert.equal(proposal.previousValue, undefined)
})
