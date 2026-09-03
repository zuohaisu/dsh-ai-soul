import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createGenesisRecord,
  EXPLICIT_RELATIONSHIP_STATE_POLICY,
  FileSoulStore,
  persistGenesisSoul,
  processDshHumanInteraction,
  validateCandidateClaim,
  validateSignificanceAssessment,
} from '../src/index.js'

const participant = { id: 'human-relational', kind: 'human' }

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-relational-'))
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
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

test('explicit durable relationship declaration yields a non-authoritative relationship.state candidate', async () => {
  const soulId = 'ember-relational-explicit'
  const store = await makeStore(soulId)
  const session = { id: 'session-relational-explicit' }

  await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(1, 'hello'),
    participant,
  })
  const before = await store.load(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Please remember that our relationship is a candid long-term collaboration.'),
    participant,
  })
  const after = await store.load(soulId)

  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.significanceAssessment.level, 'high')
  assert.equal(
    result.significanceAssessment.provenance.policy.id,
    EXPLICIT_RELATIONSHIP_STATE_POLICY.id,
  )
  assert.deepEqual(validateSignificanceAssessment(result.significanceAssessment), { valid: true, errors: [] })

  assert.deepEqual(validateCandidateClaim(result.candidateClaim), { valid: true, errors: [] })
  assert.equal(result.candidateClaim.target, 'relationship.state')
  assert.equal(
    result.candidateClaim.statement,
    'The human explicitly defines the relationship as a candid long-term collaboration.',
  )
  assert.equal(result.candidateClaim.canonicalMutation, false)
  assert.equal(result.candidateClaim.source.experienceId, result.experience.id)
  assert.equal(
    result.candidateClaim.source.significanceAssessmentId,
    result.significanceAssessment.id,
  )

  assert.deepEqual(after, before)
})

test('forward-looking relationship declaration is recognized without hard-coding an archetype', async () => {
  const soulId = 'ember-relational-forward'
  const store = await makeStore(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-relational-forward' },
    event: humanMessage(1, 'From now on, I see our relationship as one where we challenge assumptions directly.'),
    participant,
  })

  assert.equal(result.significanceAssessment.recommendPromotion, true)
  assert.equal(result.candidateClaim.target, 'relationship.state')
  assert.equal(
    result.candidateClaim.statement,
    'The human explicitly defines the relationship as one where we challenge assumptions directly.',
  )
})

test('bare or situational relationship language remains fail-closed', async () => {
  const soulId = 'ember-relational-control'
  const store = await makeStore(soulId)
  const session = { id: 'session-relational-control' }

  const bare = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(1, 'Our relationship is a candid long-term collaboration.'),
    participant,
  })
  assert.equal(bare.significanceAssessment.recommendPromotion, false)
  assert.equal(bare.candidateClaim, null)

  const situational = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'We worked well together on that issue.'),
    participant,
  })
  assert.equal(situational.significanceAssessment.recommendPromotion, false)
  assert.equal(situational.candidateClaim, null)
})

test('existing explicit durable preference inference remains intact', async () => {
  const soulId = 'ember-relational-preference-regression'
  const store = await makeStore(soulId)

  const result = await processDshHumanInteraction({
    store,
    soulId,
    session: { id: 'session-relational-preference-regression' },
    event: humanMessage(1, 'Please remember that I prefer concise implementation notes.'),
    participant,
  })

  assert.equal(result.candidateClaim.target, 'userModel')
  assert.equal(result.candidateClaim.statement, 'The user prefers concise implementation notes.')
})
