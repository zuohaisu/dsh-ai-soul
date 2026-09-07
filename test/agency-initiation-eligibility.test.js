import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AGENCY_INITIATION_TRIGGER_CLASSES,
  assessAgencyInitiationEligibility,
} from '../src/core/agency-initiation-eligibility.js'
import { createAgencyTriggerEvidence } from '../src/core/agency-trigger-evidence.js'

const triggerEvidence = createAgencyTriggerEvidence({
  id: 'trigger-evidence-1',
  soulId: 'soul-1',
  triggerClass: 'explicit-user-request',
  source: { type: 'interaction', id: 'interaction-1' },
  provenance: { source: 'dsh-session-event', id: 'event-1' },
})

const grounded = {
  soulId: 'soul-1',
  candidateSoulId: 'soul-1',
  triggerClass: 'explicit-user-request',
  triggerEvidence,
  reason: 'The user explicitly asked the Soul to surface this follow-up.',
  contextRefs: [{ type: 'interaction', id: 'interaction-1' }],
  provenance: { source: 'dsh-session-event', id: 'event-1' },
}

test('allows only bounded explicit trigger classes with matching typed evidence', () => {
  assert.deepEqual(AGENCY_INITIATION_TRIGGER_CLASSES, [
    'explicit-user-request',
    'governed-commitment-due',
    'governed-safety-concern',
    'governed-reflection-result',
  ])

  const result = assessAgencyInitiationEligibility(grounded)
  assert.equal(result.eligible, true)
  assert.deepEqual(result.reasons, [])
  assert.equal(result.triggerEvidenceId, 'trigger-evidence-1')
  assert.equal(result.authority, 'none')
  assert.deepEqual(result.effects, {
    permission: false,
    authorization: false,
    execution: false,
    scheduling: false,
    polling: false,
    memoryWrite: false,
    canonicalMutation: false,
  })
})

test('allowed trigger label without typed evidence is insufficient', () => {
  const result = assessAgencyInitiationEligibility({ ...grounded, triggerEvidence: undefined })
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('trigger-evidence-required'))
})

test('fails closed when trigger class and evidence class disagree', () => {
  const result = assessAgencyInitiationEligibility({ ...grounded, triggerClass: 'governed-commitment-due' })
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('trigger-evidence-class-mismatch'))
})

test('fails closed when trigger evidence belongs to another Soul', () => {
  const result = assessAgencyInitiationEligibility({ ...grounded, soulId: 'soul-2', candidateSoulId: 'soul-2' })
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('trigger-evidence-soul-mismatch'))
})

test('mere runtime presence and ordinary interaction are not initiative triggers', () => {
  for (const triggerClass of ['runtime-attached', 'ordinary-interaction']) {
    const result = assessAgencyInitiationEligibility({ ...grounded, triggerClass })
    assert.equal(result.eligible, false)
    assert.ok(result.reasons.includes('explicit-trigger-required'))
  }
})

test('fails closed without attributable reason, context, or provenance', () => {
  const result = assessAgencyInitiationEligibility({
    ...grounded,
    reason: ' ',
    contextRefs: [],
    provenance: {},
  })
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('reason-required'))
  assert.ok(result.reasons.includes('context-required'))
  assert.ok(result.reasons.includes('provenance-required'))
})
