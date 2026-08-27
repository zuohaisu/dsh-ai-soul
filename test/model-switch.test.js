import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MODEL_SWITCH_DIMENSIONS,
  createModelSwitchComparison,
} from '../src/core/index.js'

function observation({
  observationId,
  soulId = 'samuel',
  stateVersion = 1,
  stateRef = 'sha256:same-state',
  provider,
  model,
  checks,
}) {
  return {
    recordVersion: 1,
    observationId,
    soul: {
      soulId,
      stateVersion,
      stateRef,
      storeRef: '/tmp/souls',
    },
    runtime: {
      name: 'dsh',
      version: 'test',
      adapter: 'dsh-ai-soul',
      adapterVersion: 'test-sha',
      provider,
      model,
      modelConfig: { temperature: 0 },
    },
    checks,
  }
}

function check(id, dimension, assessment, evidenceRef = null) {
  return {
    id,
    dimension,
    assessment,
    response: { text: null, evidenceRef },
  }
}

test('compares the same frozen Soul State across different model configurations', () => {
  const baseline = observation({
    observationId: 'run-a',
    provider: 'provider-a',
    model: 'model-a',
    checks: [
      check('identity-self-identification', 'identity', 'pass', 'evidence:a1'),
      check('relationship-durable-state', 'relationship', 'pass', 'evidence:a2'),
      check('covenant-standing-constraint', 'covenant', 'ambiguous'),
    ],
  })
  const candidate = observation({
    observationId: 'run-b',
    provider: 'provider-b',
    model: 'model-b',
    checks: [
      check('identity-self-identification', 'identity', 'pass', 'evidence:b1'),
      check('relationship-durable-state', 'relationship', 'fail', 'evidence:b2'),
      check('covenant-standing-constraint', 'covenant', 'pass'),
    ],
  })

  const comparison = createModelSwitchComparison({
    comparisonId: 'switch-001',
    baseline,
    candidate,
    phenotypeObservations: ['Candidate is more terse than baseline.'],
  })

  assert.deepEqual(comparison.dimensions, [...MODEL_SWITCH_DIMENSIONS])
  assert.equal(comparison.soul.soulId, 'samuel')
  assert.equal(comparison.soul.stateRef, 'sha256:same-state')
  assert.equal(comparison.baseline.runtime.model, 'model-a')
  assert.equal(comparison.candidate.runtime.model, 'model-b')
  assert.equal(comparison.checks[0].comparison, 'retained')
  assert.equal(comparison.checks[1].comparison, 'regression')
  assert.equal(comparison.checks[2].comparison, 'ambiguous')
  assert.deepEqual(comparison.phenotypeObservations, ['Candidate is more terse than baseline.'])
  assert.equal(comparison.engineeringConclusion, null)
  assert.equal(comparison.humanContinuityJudgment, null)
})

test('rejects comparisons across different Souls or Soul State epochs', () => {
  const baseline = observation({
    observationId: 'run-a',
    provider: 'a',
    model: 'a',
    checks: [],
  })

  assert.throws(
    () => createModelSwitchComparison({
      comparisonId: 'wrong-soul',
      baseline,
      candidate: observation({
        observationId: 'run-b',
        soulId: 'aster',
        provider: 'b',
        model: 'b',
        checks: [],
      }),
    }),
    /same Soul ID/,
  )

  assert.throws(
    () => createModelSwitchComparison({
      comparisonId: 'wrong-state',
      baseline,
      candidate: observation({
        observationId: 'run-c',
        stateRef: 'sha256:different-state',
        provider: 'b',
        model: 'b',
        checks: [],
      }),
    }),
    /same frozen Soul State reference\/epoch/,
  )
})

test('missing checks remain incomplete rather than being treated as pass', () => {
  const comparison = createModelSwitchComparison({
    comparisonId: 'missing-check',
    baseline: observation({
      observationId: 'run-a',
      provider: 'a',
      model: 'a',
      checks: [check('identity-self-identification', 'identity', 'pass')],
    }),
    candidate: observation({
      observationId: 'run-b',
      provider: 'b',
      model: 'b',
      checks: [],
    }),
  })

  assert.equal(comparison.checks.length, 1)
  assert.equal(comparison.checks[0].baselineAssessment, 'pass')
  assert.equal(comparison.checks[0].candidateAssessment, 'missing')
  assert.equal(comparison.checks[0].comparison, 'incomplete')
})

test('requires an actual runtime/model configuration change', () => {
  const baseline = observation({
    observationId: 'run-a',
    provider: 'same',
    model: 'same',
    checks: [],
  })
  const candidate = observation({
    observationId: 'run-b',
    provider: 'same',
    model: 'same',
    checks: [],
  })

  assert.throws(
    () => createModelSwitchComparison({ comparisonId: 'not-a-switch', baseline, candidate }),
    /different runtime\/model configurations/,
  )
})
