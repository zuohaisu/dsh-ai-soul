import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createReflectionResult,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
  validateReflectionResult,
} from '../src/core/index.js'

function proposal(overrides = {}) {
  return createStateTransitionProposal({
    id: 'proposal-reflection-1',
    at: '2026-08-27T07:45:00.000Z',
    target: 'selfModel',
    value: { claim: 'I preserve uncertainty when evidence conflicts.' },
    reason: 'The reflected experience supports this working self-model claim.',
    evidence: [{ type: 'experience', id: 'exp-1' }],
    provenance: { reflectionId: 'reflection-1' },
    confidence: 0.78,
    proposer: 'reflection:test',
    ...overrides,
  })
}

function source(overrides = {}) {
  return {
    experienceId: 'exp-1',
    significanceAssessmentId: 'sig-1',
    provenance: { source: 'experience-store', eventId: 'event-1' },
    ...overrides,
  }
}

test('reflection may produce observations with zero proposals', () => {
  const result = createReflectionResult({
    id: 'reflection-zero',
    at: '2026-08-27T07:46:00.000Z',
    sources: [source()],
    observations: [{ text: 'The event is meaningful but does not justify a durable model change.' }],
    proposals: [],
    provenance: { reflector: 'test', method: 'deterministic-fixture' },
  })

  assert.deepEqual(validateReflectionResult(result), { valid: true, errors: [] })
  assert.equal(result.proposals.length, 0)
})

test('reflection may emit multiple unreviewed proposals and preserves evidence links', () => {
  const proposals = [
    proposal(),
    proposal({
      id: 'proposal-reflection-2',
      target: 'userModel',
      value: { claim: 'The user prefers architecture boundaries to implicit coupling.' },
      confidence: 0.81,
    }),
  ]

  const result = createReflectionResult({
    id: 'reflection-1',
    at: '2026-08-27T07:47:00.000Z',
    sources: [source()],
    observations: [{ text: 'The interaction reinforced two working-model hypotheses.' }],
    proposals,
    provenance: { reflector: 'test', runId: 'reflection-run-1' },
  })

  assert.equal(result.proposals.length, 2)
  assert.equal(result.proposals[0].review, null)
  assert.equal(result.proposals[1].review, null)
  assert.equal(result.sources[0].experienceId, 'exp-1')
  assert.equal(result.sources[0].significanceAssessmentId, 'sig-1')
  assert.equal(result.provenance.runId, 'reflection-run-1')
})

test('reflection rejects reviewed proposals so it cannot smuggle approval authority', () => {
  const reviewed = reviewStateTransitionProposal(proposal(), {
    decision: 'approved',
    reviewer: 'governance:test',
    reason: 'Approved outside reflection.',
    provenance: { reviewId: 'review-reflection-smuggle' },
  })

  assert.throws(
    () => createReflectionResult({
      sources: [source()],
      observations: [],
      proposals: [reviewed],
      provenance: { reflector: 'test' },
    }),
    /must be unreviewed/,
  )
})

test('reflection creation clones inputs and does not mutate proposal or evidence objects', () => {
  const sources = [source()]
  const proposals = [proposal()]
  const sourceBefore = structuredClone(sources)
  const proposalBefore = structuredClone(proposals)

  const result = createReflectionResult({
    sources,
    observations: [{ text: 'Working observation.' }],
    proposals,
    provenance: { reflector: 'test' },
  })

  result.sources[0].provenance.eventId = 'changed-in-result'
  result.proposals[0].value.claim = 'changed-in-result'

  assert.deepEqual(sources, sourceBefore)
  assert.deepEqual(proposals, proposalBefore)
})

test('reflection requires traceable experience sources and provenance', () => {
  assert.throws(
    () => createReflectionResult({
      sources: [],
      observations: [],
      proposals: [],
      provenance: { reflector: 'test' },
    }),
    /sources must be a non-empty array/,
  )

  assert.throws(
    () => createReflectionResult({
      sources: [{ experienceId: 'exp-1' }],
      observations: [],
      proposals: [],
      provenance: { reflector: 'test' },
    }),
    /sources\[0\]\.provenance is required/,
  )

  assert.throws(
    () => createReflectionResult({
      sources: [source()],
      observations: [],
      proposals: [],
    }),
    /provenance is required/,
  )
})
