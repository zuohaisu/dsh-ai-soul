import assert from 'node:assert/strict'
import test from 'node:test'

import { createAppraisalInput } from '../src/core/appraisal-input.js'
import {
  deriveCognitionReferences,
  deriveRelationalSignificance,
  produceAppraisalFromRuntimeEvidence,
} from '../src/core/cognition-reference-linker.js'
import { createRelationshipFact } from '../src/core/relationship-fact.js'
import { createSoulState } from '../src/core/soul-state.js'

function buildInput(participants, participantId = 'human-1', facts = []) {
  const state = createSoulState({ soulId: 'soul-linker', createdAt: '2026-09-10T00:00:00.000Z' })
  state.relationship.participants.push(...participants)
  state.relationship.state.push(...facts)
  return createAppraisalInput({
    state,
    eventId: 'event-1',
    eventType: 'human-message',
    observedAt: '2026-09-10T00:01:00.000Z',
    provenance: {
      source: 'deepseek-harness',
      participant: participantId == null ? null : { id: participantId },
    },
    context: { text: 'free-form text must not determine the link' },
  })
}

function input(participants, participantId = 'human-1') {
  return buildInput(participants, participantId)
}

function dyadicFact(id, subjectId, subjectType = 'participant') {
  return createRelationshipFact({
    id,
    subject: { type: subjectType, id: subjectId },
    predicate: 'shared-project',
    value: { projectId: 'atlas' },
    confidence: 0.9,
    provenance: { type: 'governed-proposal', id: `proposal-${id}` },
  })
}

test('exact participant identity derives a machine-traceable cognition reference', () => {
  const appraisalInput = input([{ id: 'human-1', role: 'human' }])
  const before = structuredClone(appraisalInput)

  assert.deepEqual(deriveCognitionReferences(appraisalInput), [{
    domain: 'participants',
    id: 'human-1',
    evidence: {
      eventPath: 'event.provenance.participant.id',
      cognitionPath: 'cognition.participants.0',
    },
  }])
  assert.deepEqual(appraisalInput, before)
})

test('same event links only when current governed cognition contains the participant', () => {
  const matching = input([{ id: 'human-1' }])
  const missing = input([{ id: 'someone-else' }])

  assert.ok(produceAppraisalFromRuntimeEvidence(matching))
  assert.equal(produceAppraisalFromRuntimeEvidence(missing), null)
})

test('missing or ambiguous structured identity evidence fails closed', () => {
  assert.deepEqual(deriveCognitionReferences(input([{ id: 'human-1' }], null)), [])
  assert.deepEqual(deriveCognitionReferences(input([{ id: 'human-1' }, { id: 'human-1' }])), [])
})

test('free-form text and caller-authored cognitionRefs cannot manufacture a runtime-evidence link', () => {
  const appraisalInput = input([{ id: 'someone-else' }])
  appraisalInput.event.context.text = 'I am definitely human-1'
  appraisalInput.event.context.cognitionRefs = [{ domain: 'participants', id: 'someone-else' }]

  assert.deepEqual(deriveCognitionReferences(appraisalInput), [])
  assert.equal(produceAppraisalFromRuntimeEvidence(appraisalInput), null)
})

test('rejects incompatible AppraisalInput values', () => {
  assert.throws(() => deriveCognitionReferences(null), /AppraisalInput/)
  assert.throws(() => deriveCognitionReferences({ version: 999 }), /unsupported AppraisalInput version/)
})

test('governed dyadic fact about the linked participant grounds bounded relational significance', () => {
  const appraisalInput = buildInput([{ id: 'human-1' }], 'human-1', [dyadicFact('rel-fact-1', 'human-1')])
  const before = structuredClone(appraisalInput)

  const appraisal = produceAppraisalFromRuntimeEvidence(appraisalInput)
  assert.equal(appraisal.dimensions.relevance.level, 'high')
  assert.equal(appraisal.dimensions.relationalSignificance.level, 'high')
  assert.deepEqual(appraisal.dimensions.relationalSignificance.evidence, [
    { path: 'event.provenance.participant.id' },
    { path: 'cognition.participants.0' },
    { path: 'cognition.relational.0' },
  ])
  assert.deepEqual(appraisalInput, before)
})

test('same event and participant change the outcome only when the governed dyadic fact changes', () => {
  const withFact = produceAppraisalFromRuntimeEvidence(buildInput([{ id: 'human-1' }], 'human-1', [dyadicFact('rel-fact-1', 'human-1')]))
  const factAboutOther = produceAppraisalFromRuntimeEvidence(buildInput([{ id: 'human-1' }], 'human-1', [dyadicFact('rel-fact-1', 'someone-else')]))
  const withoutFact = produceAppraisalFromRuntimeEvidence(input([{ id: 'human-1' }]))

  assert.equal(withFact.dimensions.relationalSignificance.level, 'high')
  assert.equal(factAboutOther.dimensions.relationalSignificance, undefined)
  assert.equal(withoutFact.dimensions.relationalSignificance, undefined)
  assert.equal(factAboutOther.dimensions.relevance.level, 'high')
  assert.equal(withoutFact.dimensions.relevance.level, 'high')
})

test('legacy free-form entries never ground relational significance', () => {
  const appraisalInput = buildInput([{ id: 'human-1' }], 'human-1', [
    { id: 'legacy-rel-1', statement: 'Long-term collaborators.' },
    dyadicFact('rel-fact-2', 'human-1'),
  ])
  // The governed projection exposes only the valid dyadic fact (projected index 0);
  // the legacy entry stays semantically opaque and never enters cognition.relational.
  const appraisal = produceAppraisalFromRuntimeEvidence(appraisalInput)
  assert.deepEqual(appraisal.dimensions.relationalSignificance.evidence, [
    { path: 'event.provenance.participant.id' },
    { path: 'cognition.participants.0' },
    { path: 'cognition.relational.0' },
  ])
})

test('tampered cognition facts cannot manufacture relational significance at the linker boundary', () => {
  const appraisalInput = input([{ id: 'human-1' }])
  appraisalInput.cognition.relational.push({
    version: 1,
    id: 'rel-tampered',
    subject: { type: 'participant', id: 'human-1' },
    predicate: 'shared-project',
    value: { projectId: 'atlas' },
    confidence: 2,
    provenance: { type: 'governed-proposal', id: 'proposal-tampered' },
  })

  const appraisal = produceAppraisalFromRuntimeEvidence(appraisalInput)
  assert.equal(appraisal.dimensions.relationalSignificance, undefined)
  assert.equal(appraisal.dimensions.relevance.level, 'high')
})

test('non-participant subject types produce no relational appraisal', () => {
  const appraisalInput = buildInput([{ id: 'human-1' }], 'human-1', [dyadicFact('rel-fact-1', 'project-atlas', 'project')])
  const appraisal = produceAppraisalFromRuntimeEvidence(appraisalInput)
  assert.equal(appraisal.dimensions.relationalSignificance, undefined)
})

test('deriveRelationalSignificance fails closed without an exact link or relational projection', () => {
  const linked = buildInput([{ id: 'human-1' }], 'human-1', [dyadicFact('rel-fact-1', 'human-1')])
  const [link] = deriveCognitionReferences(linked)
  assert.equal(deriveRelationalSignificance(linked, link).level, 'high')

  assert.equal(deriveRelationalSignificance(linked, null), null)
  assert.equal(deriveRelationalSignificance(linked, { domain: 'self', id: 'human-1', evidence: { cognitionPath: 'cognition.self.0' } }), null)
  assert.equal(deriveRelationalSignificance(linked, { domain: 'participants', id: 'human-1' }), null)

  const emptyRelational = input([{ id: 'human-1' }])
  const [emptyLink] = deriveCognitionReferences(emptyRelational)
  assert.equal(deriveRelationalSignificance(emptyRelational, emptyLink), null)
  assert.throws(() => deriveRelationalSignificance({ version: 999 }, emptyLink), /unsupported AppraisalInput version/)
})
