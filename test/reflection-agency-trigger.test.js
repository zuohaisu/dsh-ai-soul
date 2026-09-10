import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createReflectionResult,
  createStateTransitionProposal,
  deriveAgencyTriggerEvidenceFromReflection,
  validateAgencyTriggerEvidence,
} from '../src/index.js'

function proposal() {
  return createStateTransitionProposal({
    id: 'proposal:reflection:1',
    at: '2026-09-11T00:00:00.000Z',
    target: { domain: 'userModel' },
    operation: 'append',
    value: { preference: 'concise answers' },
    reason: 'Explicit durable preference evidence',
    confidence: 0.9,
    provenance: { source: 'experience:1' },
    proposer: 'reflection:test',
  })
}

function reflection({ proposals = [proposal()] } = {}) {
  return createReflectionResult({
    id: 'reflection:1',
    at: '2026-09-11T00:01:00.000Z',
    sources: [{ experienceId: 'experience:1', provenance: { runtime: 'test' } }],
    observations: ['bounded observation'],
    proposals,
    provenance: { process: 'reflection:test' },
  })
}

test('derives authority-free trigger evidence only from a valid reflection with structural proposals', () => {
  const input = reflection()
  const before = structuredClone(input)
  const evidence = deriveAgencyTriggerEvidenceFromReflection(input, { soulId: 'soul:test' })

  assert.equal(evidence.triggerClass, 'governed-reflection-result')
  assert.equal(evidence.authority, 'none')
  assert.deepEqual(evidence.source, { type: 'reflection-result', id: 'reflection:1' })
  assert.deepEqual(evidence.provenance.sourceExperienceIds, ['experience:1'])
  assert.equal(validateAgencyTriggerEvidence(evidence, { soulId: 'soul:test', triggerClass: 'governed-reflection-result' }).valid, true)
  assert.deepEqual(input, before)
})

test('observations alone do not become initiative reasons', () => {
  const input = reflection({ proposals: [] })
  assert.equal(deriveAgencyTriggerEvidenceFromReflection(input, { soulId: 'soul:test' }), null)
})

test('invalid or authority-smuggling reflection fails closed', () => {
  const invalid = reflection()
  invalid.proposals[0].review = { decision: 'approved' }
  assert.equal(deriveAgencyTriggerEvidenceFromReflection(invalid, { soulId: 'soul:test' }), null)
})

test('requires an explicit soul identity', () => {
  assert.throws(() => deriveAgencyTriggerEvidenceFromReflection(reflection()), /requires soulId/)
})
