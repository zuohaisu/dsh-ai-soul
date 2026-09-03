import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createGenesisRecord,
  EXPLICIT_DURABLE_PREFERENCE_FORGET_POLICY,
  EXPLICIT_DURABLE_PREFERENCE_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
  validateCandidateClaim,
  validateSignificanceAssessment,
} from '../src/index.js'

const participant = { id: 'human-176', kind: 'human' }

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-durable-preference-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T01:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  return store
}

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-03T01:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

test('explicit remember-intent preference yields positive assessment and non-authoritative candidate', async () => {
  const soulId = 'ember-176-explicit'
  const store = await makeStore(soulId)
  const session = { id: 'session-176-explicit' }

  await processDshHumanInteraction({ store, soulId, session, event: humanMessage(1, 'hello'), participant })
  const before = await store.load(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Please remember that I prefer concise implementation notes.'),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.status, 'already-recorded')
  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.significanceAssessment.level, 'medium')
  assert.equal(result.significanceAssessment.provenance.policy.id, EXPLICIT_DURABLE_PREFERENCE_POLICY.id)
  assert.deepEqual(validateSignificanceAssessment(result.significanceAssessment), { valid: true, errors: [] })
  assert.deepEqual(validateCandidateClaim(result.candidateClaim), { valid: true, errors: [] })
  assert.equal(result.candidateClaim.target, 'userModel')
  assert.equal(result.candidateClaim.statement, 'The user prefers concise implementation notes.')
  assert.equal(result.candidateClaim.status, 'candidate')
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.equal(result.candidateClaim.source.experienceId, result.experience.id)
  assert.equal(result.candidateClaim.source.significanceAssessmentId, result.significanceAssessment.id)
  assert.deepEqual(after, before)
})

test('forward-looking explicit preference is recognized without granting mutation authority', async () => {
  const soulId = 'ember-176-forward'
  const store = await makeStore(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-176-forward' },
    event: humanMessage(1, 'From now on, I prefer release reports under five bullets.'),
    participant,
  })

  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.candidateClaim.statement, 'The user prefers release reports under five bullets.')
  assert.equal(result.candidateClaim.canonicalMutation, false)
})

test('explicit forget request yields a non-authoritative retirement intent for one exact current preference', async () => {
  const soulId = 'ember-216-forget'
  const store = await makeStore(soulId)
  const session = { id: 'session-216-forget' }
  await processDshHumanInteraction({ store, soulId, session, event: humanMessage(1, 'hello'), participant })

  const seeded = await store.load(soulId)
  seeded.userModel.push({ claim: 'The user prefers concise implementation notes.' })
  await store.save(seeded)
  const before = await store.load(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Please forget that I prefer concise implementation notes.'),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.significanceAssessment.provenance.policy.id, EXPLICIT_DURABLE_PREFERENCE_FORGET_POLICY.id)
  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.candidateClaim.statement, 'The user prefers concise implementation notes.')
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.deepEqual(result.transitionIntent, {
    operation: 'retire',
    previousValue: { claim: 'The user prefers concise implementation notes.' },
  })
  assert.deepEqual(after, before)
})

test('forget inference fails closed when the exact current preference is missing or duplicated', async () => {
  const missingSoulId = 'ember-216-forget-missing'
  const missingStore = await makeStore(missingSoulId)
  const missing = await processDshHumanInteraction({
    store: missingStore,
    soulId: missingSoulId,
    session: { id: 'session-216-forget-missing' },
    event: humanMessage(1, 'Please forget that I prefer concise implementation notes.'),
    participant,
  })
  assert.equal(missing.significanceAssessment.recommendPromotion, false)
  assert.equal(missing.candidateClaim, null)
  assert.equal(missing.transitionIntent, null)

  const duplicateSoulId = 'ember-216-forget-duplicate'
  const duplicateStore = await makeStore(duplicateSoulId)
  const duplicateState = await duplicateStore.load(duplicateSoulId)
  duplicateState.userModel.push(
    { claim: 'The user prefers concise implementation notes.' },
    { claim: 'The user prefers concise implementation notes.' },
  )
  await duplicateStore.save(duplicateState)

  const duplicate = await processDshHumanInteraction({
    store: duplicateStore,
    soulId: duplicateSoulId,
    session: { id: 'session-216-forget-duplicate' },
    event: humanMessage(1, 'Please forget that I prefer concise implementation notes.'),
    participant,
  })
  assert.equal(duplicate.significanceAssessment.recommendPromotion, false)
  assert.equal(duplicate.candidateClaim, null)
  assert.equal(duplicate.transitionIntent, null)
})

test('ambiguous bare preference and non-explicit forget language remain fail-closed with no candidate', async () => {
  const soulId = 'ember-176-control'
  const store = await makeStore(soulId)
  const session = { id: 'session-176-control' }

  const barePreference = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(1, 'I prefer concise implementation notes.'),
    participant,
  })
  assert.equal(barePreference.significanceAssessment.recommendPromotion, false)
  assert.equal(barePreference.candidateClaim, null)

  const state = await store.load(soulId)
  state.userModel.push({ claim: 'The user prefers concise implementation notes.' })
  await store.save(state)

  const ambiguousForget = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Do not worry about my concise implementation notes preference anymore.'),
    participant,
  })
  assert.equal(ambiguousForget.significanceAssessment.recommendPromotion, false)
  assert.equal(ambiguousForget.candidateClaim, null)

  const ordinary = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(3, 'That build finished quickly.'),
    participant,
  })
  assert.equal(ordinary.significanceAssessment.recommendPromotion, false)
  assert.equal(ordinary.candidateClaim, null)
})
