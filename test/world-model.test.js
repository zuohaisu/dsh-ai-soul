import test from 'node:test'
import assert from 'node:assert/strict'

import { createSoulState, validateSoulState } from '../src/core/soul-state.js'
import { CANDIDATE_CLAIM_TARGETS } from '../src/core/candidate-claim.js'
import {
  STATE_TRANSITION_TARGETS,
  applyStateTransitionProposal,
  createStateTransitionProposal,
  reviewStateTransitionProposal,
} from '../src/core/state-transition.js'
import { projectSoulContext, renderSoulContext } from '../src/core/context-projection.js'

test('new Soul State carries an empty WORLD domain while legacy v1 state remains valid', () => {
  const state = createSoulState({ soulId: 'world-test' })
  assert.deepEqual(state.worldModel, [])
  assert.equal(validateSoulState(state).valid, true)

  const legacy = structuredClone(state)
  delete legacy.worldModel
  assert.equal(validateSoulState(legacy).valid, true)
  assert.deepEqual(projectSoulContext(legacy).worldModel, [])

  const invalid = structuredClone(state)
  invalid.worldModel = 'raw transcript dump'
  assert.equal(validateSoulState(invalid).valid, false)
})

test('WORLD is available only through the existing candidate and governed transition boundaries', () => {
  assert.equal(CANDIDATE_CLAIM_TARGETS.includes('worldModel'), true)
  assert.equal(STATE_TRANSITION_TARGETS.includes('worldModel'), true)

  const state = createSoulState({ soulId: 'world-governed' })
  const proposal = createStateTransitionProposal({
    id: 'proposal-world-1',
    at: '2026-09-04T00:00:00.000Z',
    target: 'worldModel',
    value: { claim: 'Project Atlas is an active long-term project.' },
    reason: 'retain current project context',
    evidence: [{ experienceId: 'experience-world-1' }],
    provenance: { source: 'experience-world-1' },
    confidence: 0.9,
    proposer: 'reflection-agent',
  })

  assert.throws(() => applyStateTransitionProposal(state, proposal), /reviewed before application/)
  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'human-reviewer',
    reason: 'explicit durable project context',
    provenance: { surface: 'dsh' },
  })
  const next = applyStateTransitionProposal(state, reviewed)

  assert.deepEqual(next.worldModel, [{ claim: 'Project Atlas is an active long-term project.' }])
  assert.equal(next.evolution.at(-1).change.target, 'worldModel')
  assert.equal(next.evolution.at(-1).provenance.review.reviewer, 'human-reviewer')
})

test('WORLD runtime projection is bounded and does not expose history as canonical context', () => {
  const state = createSoulState({ soulId: 'world-context' })
  state.worldModel = Array.from({ length: 10 }, (_, index) => ({ claim: `Current world claim ${index + 1}` }))
  state.evolution.push({ id: 'audit-only', at: '2026-09-04T00:00:00.000Z', kind: 'audit', reason: 'history', provenance: {}, change: { raw: 'must not render' } })

  const context = projectSoulContext(state)
  const rendered = renderSoulContext(context)
  assert.match(rendered, /## World Model/)
  assert.match(rendered, /Current world claim 1/)
  assert.match(rendered, /2 additional entries omitted from runtime context/)
  assert.doesNotMatch(rendered, /must not render/)
})
