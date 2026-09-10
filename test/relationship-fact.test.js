import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createRelationshipFact,
  getRelationshipFact,
  validateRelationshipFact,
} from '../src/core/relationship-fact.js'

const input = () => ({
  id: 'rel-fact-1',
  subject: { type: 'participant', id: 'human-1' },
  predicate: 'shared-project',
  value: { projectId: 'project-1' },
  confidence: 0.9,
  provenance: { type: 'governed-proposal', id: 'proposal-1' },
})

test('creates a detached machine-readable relationship fact without assigning appraisal meaning', () => {
  const source = input()
  const fact = createRelationshipFact(source)

  assert.equal(validateRelationshipFact(fact).valid, true)
  assert.equal(fact.subject.id, 'human-1')
  assert.equal(fact.predicate, 'shared-project')
  assert.equal(Object.hasOwn(fact, 'relationalSignificance'), false)

  fact.value.projectId = 'mutated'
  assert.equal(source.value.projectId, 'project-1')
})

test('legacy free-form relationship state remains readable but cannot silently become a semantic fact', () => {
  const legacy = 'Haisu is important'
  assert.equal(validateRelationshipFact(legacy).valid, false)

  const state = { relationship: { state: [legacy, { note: 'trusted friend' }] } }
  assert.equal(getRelationshipFact(state, 'rel-fact-1'), null)
})

test('malformed facts fail closed', () => {
  for (const malformed of [
    { ...input(), predicate: '' },
    { ...input(), confidence: 1.1 },
    { ...input(), provenance: null },
    { ...input(), subject: { type: 'participant' } },
  ]) {
    assert.equal(validateRelationshipFact({ version: 1, ...malformed }).valid, false)
  }
})

test('duplicate semantic ids are ambiguous and fail closed', () => {
  const fact = createRelationshipFact(input())
  const state = { relationship: { state: [fact, structuredClone(fact)] } }
  assert.throws(() => getRelationshipFact(state, fact.id), /ambiguous relationship fact id/)
})
