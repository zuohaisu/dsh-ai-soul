import assert from 'node:assert/strict'
import test from 'node:test'

import {
  deriveExplicitUserRequestEvidenceFromDsh,
  validateAgencyTriggerEvidence,
} from '../src/index.js'

function session() { return { id: 'session-1' } }
function event(text, overrides = {}) {
  return {
    type: 'user/message',
    seq: 7,
    time: Date.parse('2026-09-07T08:30:00Z'),
    data: { source: { kind: 'user', id: 'haisu' }, content: [{ type: 'text', text }] },
    ...overrides,
  }
}
const options = { soulId: 'soul-1', participant: { id: 'haisu' } }

test('explicit human action request derives stable authority-free evidence', () => {
  const evidence = deriveExplicitUserRequestEvidenceFromDsh(session(), event('Please check the project status.'), options)
  assert.ok(evidence)
  assert.equal(evidence.triggerClass, 'explicit-user-request')
  assert.equal(evidence.type, 'user-request-evidence')
  assert.equal(evidence.soulId, 'soul-1')
  assert.equal(evidence.authority, 'none')
  assert.equal(evidence.source.type, 'experience-record')
  assert.match(evidence.source.id, /deepseek-harness:session-1:user-message%3A7/)
  assert.equal(validateAgencyTriggerEvidence(evidence, { soulId: 'soul-1', triggerClass: 'explicit-user-request' }).valid, true)
})

test('Chinese explicit human action request derives evidence', () => {
  assert.ok(deriveExplicitUserRequestEvidenceFromDsh(session(), event('请帮我检查这个任务。'), options))
})

test('ordinary interaction does not become agency evidence', () => {
  for (const text of ['Hello.', 'The project status matters to me.', 'I am thinking about the roadmap.', 'Can you explain what agency means?']) {
    assert.equal(deriveExplicitUserRequestEvidenceFromDsh(session(), event(text), options), null)
  }
})

test('synthetic/plugin messages cannot derive user request evidence', () => {
  const synthetic = event('Please check the project status.')
  synthetic.data.source = { kind: 'plugin', id: 'test-plugin' }
  assert.equal(deriveExplicitUserRequestEvidenceFromDsh(session(), synthetic, options), null)
})

test('soulId is mandatory and evidence does not add execution authority', () => {
  assert.throws(() => deriveExplicitUserRequestEvidenceFromDsh(session(), event('Please check the project status.'), { participant: { id: 'haisu' } }), /requires soulId/)
  const evidence = deriveExplicitUserRequestEvidenceFromDsh(session(), event('Please check the project status.'), options)
  for (const forbidden of ['permission', 'authorization', 'execution', 'schedule', 'toolCall', 'memoryWrite']) {
    assert.equal(Object.hasOwn(evidence, forbidden), false)
  }
})
