import assert from 'node:assert/strict'
import test from 'node:test'

import { createAgencyIntentFromExplicitUserRequest } from '../src/core/agency-initiation.js'
import { createAgencyTriggerEvidence } from '../src/core/agency-trigger-evidence.js'

function evidence(overrides = {}) {
  return createAgencyTriggerEvidence({
    id: 'trigger-evidence-1',
    soulId: 'soul-1',
    triggerClass: 'explicit-user-request',
    source: { type: 'experience', id: 'experience:dsh:session-1:event-1' },
    provenance: { source: 'dsh-session-event', sessionId: 'session-1', eventId: 'event-1' },
    ...overrides,
  })
}

const grounded = {
  soulId: 'soul-1',
  triggerEvidence: evidence(),
  kind: 'request',
  reason: 'The human explicitly asked the Soul to prepare a bounded follow-up.',
  proposedAction: 'Prepare the requested follow-up for the human to review.',
  contextRefs: [{ type: 'experience', id: 'experience:dsh:session-1:event-1' }],
  provenance: { source: 'agency-initiation', boundary: 'explicit-user-request-v1' },
  id: 'intent-1',
  at: '2026-09-07T10:00:00.000Z',
}

test('composes matching explicit request evidence into an authority-free AgencyIntent', () => {
  const intent = createAgencyIntentFromExplicitUserRequest(grounded)
  assert.equal(intent.id, 'intent-1')
  assert.equal(intent.soulId, 'soul-1')
  assert.equal(intent.authority, 'none')
  assert.equal(intent.provenance.triggerEvidence.id, 'trigger-evidence-1')
  assert.equal(intent.provenance.triggerEvidence.type, 'user-request-evidence')
  assert.deepEqual(intent.provenance.triggerEvidence.source, grounded.triggerEvidence.source)
  assert.deepEqual(intent.provenance.triggerEvidence.provenance, grounded.triggerEvidence.provenance)
  assert.equal(Object.hasOwn(intent, 'execution'), false)
  assert.equal(Object.hasOwn(intent, 'toolCall'), false)
})

test('fails closed on Soul mismatch before intent creation', () => {
  assert.throws(
    () => createAgencyIntentFromExplicitUserRequest({ ...grounded, soulId: 'soul-2' }),
    /agency initiation is not eligible/,
  )
})

test('fails closed on wrong trigger evidence class', () => {
  const wrong = evidence({ triggerClass: 'governed-reflection-result' })
  assert.throws(
    () => createAgencyIntentFromExplicitUserRequest({ ...grounded, triggerEvidence: wrong }),
    /agency initiation is not eligible/,
  )
})

test('fails closed when reason, context, or provenance are missing', () => {
  assert.throws(() => createAgencyIntentFromExplicitUserRequest({ ...grounded, reason: ' ' }), /not eligible/)
  assert.throws(() => createAgencyIntentFromExplicitUserRequest({ ...grounded, contextRefs: [] }), /not eligible/)
  assert.throws(() => createAgencyIntentFromExplicitUserRequest({ ...grounded, provenance: {} }), /not eligible/)
})

test('rejects authority-bearing composition input', () => {
  for (const input of [{ authority: 'granted' }, { approved: true }, { toolCall: { name: 'x' } }, { scheduled: true }]) {
    assert.throws(() => createAgencyIntentFromExplicitUserRequest({ ...grounded, ...input }), /must not carry/)
  }
})
