import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assessExperienceErasureImpact,
  createSoulState,
} from '../src/core/index.js'

function fixtureState(experienceId) {
  const state = createSoulState({ soulId: 'soul-erasure-test' })
  state.autobiography.push({
    id: `autobiography:${experienceId}`,
    sourceExperienceId: experienceId,
    payload: { secret: 'copied sensitive content' },
  })
  state.evolution.push({
    id: 'evolution-1',
    at: '2026-09-04T00:00:00.000Z',
    kind: 'governed-state-transition',
    reason: 'test',
    provenance: { evidence: [{ experienceId }] },
    change: null,
  })
  return state
}

test('reports deterministic direct impacts and never claims global completeness', () => {
  const experienceId = 'experience-1'
  const state = fixtureState(experienceId)
  const report = assessExperienceErasureImpact({
    experienceId,
    state,
    significanceAssessments: [{ id: 'sig-1', experienceId }],
    candidateClaims: [{ id: 'candidate-1', source: { experienceId } }],
    proposals: [{ id: 'proposal-1', provenance: { experienceId } }],
  })

  assert.equal(report.complete, false)
  assert.equal(report.knownScopeComplete, true)
  assert.deepEqual(
    report.impacts.map(({ artifactType }) => artifactType),
    [
      'autobiography-entry',
      'candidate-claim',
      'evolution-entry',
      'significance-assessment',
      'state-transition-proposal',
    ],
  )
  assert.equal(report.impacts[0].risk, 'content-bearing')
  assert.equal(report.coverage.logs, false)
  assert.equal(report.coverage.backups, false)
  assert.equal(report.coverage.externalStores, false)
})

test('marks scope incomplete when optional artifact collections were not supplied', () => {
  const report = assessExperienceErasureImpact({
    experienceId: 'experience-2',
    state: createSoulState({ soulId: 'soul-erasure-test-2' }),
  })

  assert.equal(report.complete, false)
  assert.equal(report.knownScopeComplete, false)
  assert.deepEqual(report.impacts, [])
  assert.equal(report.coverage.candidateClaims, false)
})

test('rejects malformed collections instead of producing a false complete report', () => {
  assert.throws(
    () => assessExperienceErasureImpact({
      experienceId: 'experience-3',
      state: createSoulState({ soulId: 'soul-erasure-test-3' }),
      significanceAssessments: {},
    }),
    /significanceAssessments must be an array/,
  )
})

test('uses exact structured ids and does not semantically match copied text', () => {
  const report = assessExperienceErasureImpact({
    experienceId: 'experience-exact',
    state: createSoulState({ soulId: 'soul-erasure-test-4' }),
    significanceAssessments: [],
    candidateClaims: [{
      id: 'candidate-text-only',
      statement: 'mentions experience-exact in prose',
      source: { experienceId: 'other-experience' },
    }],
    proposals: [],
  })

  assert.equal(report.knownScopeComplete, true)
  assert.deepEqual(report.impacts, [])
})
