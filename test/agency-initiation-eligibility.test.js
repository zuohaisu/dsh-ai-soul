import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AGENCY_INITIATION_TRIGGER_CLASSES,
  assessAgencyInitiationEligibility,
} from '../src/core/agency-initiation-eligibility.js'

const grounded = {
  soulId: 'soul-1',
  candidateSoulId: 'soul-1',
  triggerClass: 'explicit-user-request',
  reason: 'The user explicitly asked the Soul to surface this follow-up.',
  contextRefs: [{ type: 'interaction', id: 'interaction-1' }],
  provenance: { source: 'dsh-session-event', id: 'event-1' },
}

test('allows only bounded explicit trigger classes', () => {
  assert.deepEqual(AGENCY_INITIATION_TRIGGER_CLASSES, [
    'explicit-user-request',
    'governed-commitment-due',
    'governed-safety-concern',
    'governed-reflection-result',
  ])

  const result = assessAgencyInitiationEligibility(grounded)
  assert.equal(result.eligible, true)
  assert.deepEqual(result.reasons, [])
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

test('mere runtime presence is not an initiative trigger', () => {
  const result = assessAgencyInitiationEligibility({ ...grounded, triggerClass: 'runtime-attached' })
  assert.equal(result.eligible, false)
  assert.deepEqual(result.reasons, ['explicit-trigger-required'])
})

test('ordinary interaction is not initiative-worthy by default', () => {
  const result = assessAgencyInitiationEligibility({ ...grounded, triggerClass: 'ordinary-interaction' })
  assert.equal(result.eligible, false)
  assert.deepEqual(result.reasons, ['explicit-trigger-required'])
})

test('fails closed on Soul mismatch', () => {
  const result = assessAgencyInitiationEligibility({ ...grounded, candidateSoulId: 'soul-2' })
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('soul-mismatch'))
})

test('fails closed without attributable reason, context, or provenance', () => {
  const result = assessAgencyInitiationEligibility({
    ...grounded,
    reason: ' ',
    contextRefs: [],
    provenance: {},
  })
  assert.equal(result.eligible, false)
  assert.deepEqual(result.reasons, ['reason-required', 'context-required', 'provenance-required'])
})
