import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  FileSoulStore,
  applyStateTransitionProposal,
  createCandidatePromotionProposal,
  createGenesisRecord,
  persistGenesisSoul,
  processDshHumanInteraction,
  projectSoulContext,
  renderSoulContext,
  reviewStateTransitionProposal,
} from '../src/index.js'

const participant = { id: 'human-178', kind: 'human' }

function humanMessage(seq, text) {
  return {
    type: 'user/message',
    seq,
    time: Date.parse(`2026-09-03T02:0${seq}:00.000Z`),
    data: {
      role: 'user',
      source: { kind: 'user', via: 'web' },
      content: [{ type: 'text', text }],
    },
  }
}

async function makeStore(soulId) {
  const rootDir = await mkdtemp(join(tmpdir(), 'dsh-ai-soul-governed-preference-'))
  const store = new FileSoulStore({ rootDir })
  await persistGenesisSoul(store, createGenesisRecord({
    id: `${soulId}-genesis`,
    at: '2026-09-03T02:00:00.000Z',
    soulId,
    provenance: { source: 'test-genesis' },
  }))
  return store
}

test('explicit durable preference can be independently governed, persisted, reloaded, and rendered', async () => {
  const soulId = 'ember-178-growth-loop'
  const store = await makeStore(soulId)
  const session = { id: 'session-178-growth-loop' }

  const control = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(1, 'That build finished quickly.'),
    participant,
  })
  const afterControl = await store.load(soulId)
  assert.equal(control.significanceAssessment.recommendPromotion, false)
  assert.equal(control.candidateClaim, null)
  assert.equal(afterControl.userModel.length, 0)

  const inferred = await processDshHumanInteraction({
    store,
    soulId,
    session,
    event: humanMessage(2, 'Please remember that I prefer concise implementation notes.'),
    participant,
  })
  assert.equal(inferred.significanceAssessment.recommendPromotion, true)
  assert.equal(inferred.candidateClaim.statement, 'The user prefers concise implementation notes.')

  const proposal = createCandidatePromotionProposal(inferred.candidateClaim, {
    id: 'proposal-178-durable-preference',
    at: '2026-09-03T02:03:00.000Z',
    reason: 'The human explicitly requested durable retention of this collaboration preference.',
    proposer: 'dsh-ai-soul:test-growth-loop',
    provenance: {
      source: 'automated-integration-test',
      issue: 178,
    },
  })
  assert.equal(proposal.review, null)
  assert.throws(
    () => applyStateTransitionProposal(afterControl, proposal),
    /must be reviewed before application/,
  )

  const reviewed = reviewStateTransitionProposal(proposal, {
    decision: 'approved',
    reviewer: 'independent-test-reviewer',
    reason: 'Explicit persistence intent and bounded userModel target satisfy this test policy.',
    provenance: {
      source: 'automated-integration-test',
      issue: 178,
      independentFromProposer: true,
    },
    policy: { minimumConfidence: 0.9 },
    conflicts: [],
    at: '2026-09-03T02:04:00.000Z',
  })

  const evolved = applyStateTransitionProposal(afterControl, reviewed)
  assert.equal(evolved.soulId, soulId)
  assert.deepEqual(evolved.userModel, [
    { claim: 'The user prefers concise implementation notes.' },
  ])

  await store.save(evolved)
  const reloaded = await store.load(soulId)
  assert.equal(reloaded.soulId, soulId)
  assert.equal(reloaded.userModel.length, 1)
  assert.deepEqual(reloaded.userModel[0], {
    claim: 'The user prefers concise implementation notes.',
  })

  const rendered = renderSoulContext(projectSoulContext(reloaded))
  assert.match(rendered, /## User Model/)
  assert.match(rendered, /The user prefers concise implementation notes\./)
  assert.doesNotMatch(rendered, /Please remember that I prefer/)
})
