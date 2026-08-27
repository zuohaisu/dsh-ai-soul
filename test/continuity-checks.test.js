import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createContinuityCheckSet,
  createObservationChecks,
  createSoulState,
} from '../src/core/index.js'

test('derives continuity evidence from Soul State without leaking expected answers into prompts', () => {
  const state = createSoulState({ soulId: 'soul-1', name: 'Aster' })
  state.autobiography.push({ id: 'event-1', summary: 'Started a shared project.' })
  state.userModel.push({ id: 'user-1', statement: 'Prefers explicit boundaries.' })
  state.relationship.state.push({ id: 'rel-1', statement: 'Long-term collaborators.' })
  state.relationship.covenants.push({ id: 'cov-1', text: 'Do not fabricate certainty.' })

  const checkSet = createContinuityCheckSet(state)

  assert.equal(checkSet.soulId, 'soul-1')
  assert.equal(checkSet.checks.length, 5)
  assert.deepEqual(checkSet.checks.map((check) => check.status), [
    'ready',
    'ready',
    'ready',
    'ready',
    'ready',
  ])

  const serializedPrompts = checkSet.checks.map((check) => check.prompt).join('\n')
  for (const leaked of [
    'Aster',
    'Started a shared project.',
    'Prefers explicit boundaries.',
    'Long-term collaborators.',
    'Do not fabricate certainty.',
  ]) {
    assert.doesNotMatch(serializedPrompts, new RegExp(leaked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.deepEqual(checkSet.checks[0].expectedEvidence.name, 'Aster')
  assert.deepEqual(checkSet.checks[1].expectedEvidence, state.autobiography[0])
  assert.deepEqual(checkSet.checks[2].expectedEvidence, state.userModel[0])
  assert.deepEqual(checkSet.checks[3].expectedEvidence, state.relationship.state[0])
  assert.deepEqual(checkSet.checks[4].expectedEvidence, state.relationship.covenants[0])
})

test('marks absent continuity dimensions not-applicable instead of inventing evidence', () => {
  const state = createSoulState({ soulId: 'minimal', name: 'Minimal Soul' })
  const checkSet = createContinuityCheckSet(state)

  assert.equal(checkSet.checks[0].status, 'ready')
  for (const check of checkSet.checks.slice(1)) {
    assert.equal(check.status, 'not-applicable')
    assert.equal(check.expectedEvidence, null)
  }

  const observationChecks = createObservationChecks(checkSet)
  assert.equal(observationChecks[0].assessment, 'ambiguous')
  for (const check of observationChecks.slice(1)) {
    assert.equal(check.assessment, 'not-applicable')
  }
})

test('expected evidence is detached from later Soul State mutation', () => {
  const state = createSoulState({ soulId: 'soul-2', name: 'Detached' })
  state.userModel.push({ id: 'user-1', statement: 'Original evidence.' })

  const checkSet = createContinuityCheckSet(state)
  state.userModel[0].statement = 'Mutated later.'

  const userCheck = checkSet.checks.find((check) => check.dimension === 'user-model')
  assert.equal(userCheck.expectedEvidence.statement, 'Original evidence.')
})

test('rejects invalid Soul State', () => {
  assert.throws(
    () => createContinuityCheckSet({}),
    /invalid Soul state/,
  )
})
