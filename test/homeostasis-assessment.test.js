import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertMatchingHomeostasisAssessment,
  createHomeostasisAssessment,
  fingerprintHomeostasisEvidence,
  verifyHomeostasisAssessment,
} from '../src/core/homeostasis-assessment.js'
import { createSoulState } from '../src/core/soul-state.js'

function fixture() {
  const baseline = createSoulState({
    soulId: 'soul-homeostasis-assessment',
    genesis: {
      version: 2,
      soulId: 'soul-homeostasis-assessment',
      createdAt: '2026-09-08T00:00:00.000Z',
      activation: { runtime: 'test', surface: 'test' },
      identity: { name: null },
    },
  })
  const proposal = {
    version: 1,
    id: 'proposal-1',
    target: 'beliefs',
    operation: 'append',
    value: { statement: 'Evidence-bound continuity matters.' },
  }
  const candidate = structuredClone(baseline)
  candidate.beliefs.push(structuredClone(proposal.value))
  return { baseline, proposal, candidate }
}

test('canonical fingerprints ignore object key insertion order', () => {
  assert.equal(
    fingerprintHomeostasisEvidence({ b: 2, a: { d: 4, c: 3 } }),
    fingerprintHomeostasisEvidence({ a: { c: 3, d: 4 }, b: 2 }),
  )
})

test('assessment verifies only for the exact baseline, proposal, and candidate', () => {
  const input = fixture()
  const assessment = createHomeostasisAssessment(input)
  assert.equal(assessment.passed, true)
  assert.equal(verifyHomeostasisAssessment({ assessment, ...input }), true)
  assert.equal(assertMatchingHomeostasisAssessment({ assessment, ...input }), assessment)
})

test('stale baseline invalidates an otherwise passing assessment', () => {
  const input = fixture()
  const assessment = createHomeostasisAssessment(input)
  const staleBaseline = structuredClone(input.baseline)
  staleBaseline.updatedAt = '2026-09-08T00:01:00.000Z'
  assert.equal(verifyHomeostasisAssessment({ assessment, ...input, baseline: staleBaseline }), false)
})

test('changed proposal invalidates an otherwise passing assessment', () => {
  const input = fixture()
  const assessment = createHomeostasisAssessment(input)
  const changedProposal = structuredClone(input.proposal)
  changedProposal.value.statement = 'Different reviewed mutation.'
  assert.equal(verifyHomeostasisAssessment({ assessment, ...input, proposal: changedProposal }), false)
})

test('changed candidate invalidates an otherwise passing assessment', () => {
  const input = fixture()
  const assessment = createHomeostasisAssessment(input)
  const changedCandidate = structuredClone(input.candidate)
  changedCandidate.beliefs.push({ statement: 'Unassessed mutation.' })
  assert.equal(verifyHomeostasisAssessment({ assessment, ...input, candidate: changedCandidate }), false)
})

test('tampered result or violations invalidate the assessment', () => {
  const input = fixture()
  const assessment = createHomeostasisAssessment(input)
  assert.equal(verifyHomeostasisAssessment({ assessment: { ...assessment, passed: false }, ...input }), false)
  assert.equal(verifyHomeostasisAssessment({ assessment: { ...assessment, violations: ['forged'] }, ...input }), false)
})

test('a failed assessment cannot be asserted as apply-safe evidence', () => {
  const input = fixture()
  const discontinuous = structuredClone(input.candidate)
  discontinuous.soulId = 'different-soul'
  const assessment = createHomeostasisAssessment({ ...input, candidate: discontinuous })
  assert.equal(assessment.passed, false)
  assert.throws(
    () => assertMatchingHomeostasisAssessment({ assessment, ...input, candidate: discontinuous }),
    (error) => error?.code === 'SOUL_HOMEOSTASIS_VIOLATION',
  )
})
