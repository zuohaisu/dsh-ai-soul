import assert from 'node:assert/strict'
import test from 'node:test'

import { createAgencyTriggerEvidence } from '../src/core/agency-trigger-evidence.js'
import { composeGovernedAgencyPresenceForDsh } from '../src/adapters/governed-agency-presence.js'

function evidence(triggerClass, overrides = {}) {
  return createAgencyTriggerEvidence({
    id: `trigger-${triggerClass}`,
    soulId: 'soul-1',
    triggerClass,
    source: {
      type: triggerClass === 'governed-reflection-result' ? 'reflection-result' : 'homeostasis-assessment',
      id: `source-${triggerClass}`,
    },
    provenance: { source: 'governed-evidence', evidenceId: `evidence-${triggerClass}` },
    ...overrides,
  })
}

function input(triggerClass, overrides = {}) {
  return {
    soulId: 'soul-1',
    triggerEvidence: evidence(triggerClass),
    id: `intent-${triggerClass}`,
    kind: 'communicate',
    reason: 'A governed reason became salient and may be surfaced without action authority.',
    proposedAction: 'Surface the governed reason for human attention.',
    contextRefs: [{ type: 'world', id: 'context-1' }],
    at: '2026-09-11T06:00:00.000Z',
    provenance: { source: 'governed-dsh-composition', boundary: 'governed-dsh-agency-presence-v1' },
    sessionId: 'session-1',
    surface: 'tui',
    ...overrides,
  }
}

test('projects governed reflection and safety reasons into authority-free DSH presence', () => {
  for (const triggerClass of ['governed-reflection-result', 'governed-safety-concern']) {
    const presence = composeGovernedAgencyPresenceForDsh(input(triggerClass))
    assert.equal(presence.authority, 'none')
    assert.equal(presence.soulId, 'soul-1')
    assert.equal(presence.intentId, `intent-${triggerClass}`)
    assert.equal(presence.provenance.triggerEvidence.triggerClass, triggerClass)
    assert.deepEqual(presence.runtime, { name: 'deepseek-harness', sessionId: 'session-1', surface: 'tui' })
    for (const forbidden of ['permission', 'authorization', 'execution', 'toolCall', 'scheduled', 'memoryWrite', 'canonicalMutation']) {
      assert.equal(Object.hasOwn(presence, forbidden), false)
    }
  }
})

test('fails closed on Soul mismatch and tampered trigger evidence', () => {
  assert.throws(
    () => composeGovernedAgencyPresenceForDsh(input('governed-reflection-result', { soulId: 'soul-2' })),
    /not eligible/,
  )
  const original = evidence('governed-reflection-result')
  const tampered = { ...original, triggerClass: 'governed-safety-concern' }
  assert.throws(
    () => composeGovernedAgencyPresenceForDsh(input('governed-reflection-result', { triggerEvidence: tampered })),
    /not eligible/,
  )
})

test('fails closed on missing grounding or provenance and rejects authority smuggling', () => {
  assert.throws(() => composeGovernedAgencyPresenceForDsh(input('governed-reflection-result', { reason: ' ' })), /not eligible/)
  assert.throws(() => composeGovernedAgencyPresenceForDsh(input('governed-reflection-result', { contextRefs: [] })), /not eligible/)
  assert.throws(() => composeGovernedAgencyPresenceForDsh(input('governed-reflection-result', { provenance: {} })), /not eligible/)
  for (const smuggled of [{ approved: true }, { authorization: {} }, { execution: {} }, { permission: true }, { scheduled: true }, { toolCall: {} }, { memoryWrite: true }, { canonicalMutation: true }]) {
    assert.throws(() => composeGovernedAgencyPresenceForDsh({ ...input('governed-reflection-result'), ...smuggled }), /rejects authority-bearing field/)
  }
})

test('does not mutate composition inputs', () => {
  const composedInput = input('governed-safety-concern')
  const before = structuredClone(composedInput)
  composeGovernedAgencyPresenceForDsh(composedInput)
  assert.deepEqual(composedInput, before)
})
