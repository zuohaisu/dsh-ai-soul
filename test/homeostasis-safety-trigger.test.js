import assert from 'node:assert/strict'
import test from 'node:test'

import { createHomeostasisSafetyTrigger } from '../src/adapters/homeostasis-safety-trigger.js'
import { createHomeostasisAssessment } from '../src/core/homeostasis-assessment.js'
import { createSoulState } from '../src/core/soul-state.js'

function fixture({ discontinuous = false } = {}) {
  const baseline = createSoulState({
    soulId: 'soul-safety-trigger',
    genesis: {
      version: 2,
      soulId: 'soul-safety-trigger',
      createdAt: '2026-09-11T00:00:00.000Z',
      activation: { runtime: 'test', surface: 'test' },
      identity: { name: null },
    },
  })
  const proposal = { version: 1, id: 'proposal-1', target: 'beliefs', operation: 'append', value: { statement: 'Bounded growth.' } }
  const candidate = structuredClone(baseline)
  candidate.beliefs.push(structuredClone(proposal.value))
  if (discontinuous) candidate.soulId = 'different-soul'
  const assessment = createHomeostasisAssessment({ baseline, proposal, candidate })
  return { baseline, proposal, candidate, assessment }
}

test('verified failed homeostasis assessment becomes authority-free governed safety evidence', () => {
  const input = fixture({ discontinuous: true })
  const assessmentBefore = structuredClone(input.assessment)
  const candidateBefore = structuredClone(input.candidate)
  const evidence = createHomeostasisSafetyTrigger({ id: 'safety-1', ...input })
  assert.equal(evidence.triggerClass, 'governed-safety-concern')
  assert.equal(evidence.type, 'safety-concern-evidence')
  assert.equal(evidence.authority, 'none')
  assert.equal(evidence.source.type, 'homeostasis-assessment')
  assert.equal(evidence.provenance.proposalFingerprint, input.assessment.proposalFingerprint)
  assert.ok(evidence.provenance.violations.length > 0)
  assert.deepEqual(input.assessment, assessmentBefore)
  assert.deepEqual(input.candidate, candidateBefore)
})

test('verified passing homeostasis assessment produces no safety trigger', () => {
  const input = fixture()
  assert.equal(createHomeostasisSafetyTrigger({ id: 'safety-2', ...input }), null)
})

test('stale or tampered assessment evidence fails closed', () => {
  const input = fixture({ discontinuous: true })
  const changedProposal = structuredClone(input.proposal)
  changedProposal.value.statement = 'Different mutation.'
  assert.throws(
    () => createHomeostasisSafetyTrigger({ id: 'safety-3', ...input, proposal: changedProposal }),
    (error) => error?.code === 'HOMEOSTASIS_ASSESSMENT_MISMATCH',
  )
  assert.throws(
    () => createHomeostasisSafetyTrigger({ id: 'safety-4', ...input, assessment: { ...input.assessment, passed: true } }),
    (error) => error?.code === 'HOMEOSTASIS_ASSESSMENT_MISMATCH',
  )
})
