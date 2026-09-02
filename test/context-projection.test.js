import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSoulState,
  projectSoulContext,
  renderSoulContext,
} from '../src/core/index.js'

test('projects structured Soul state without mutation authority', () => {
  const state = createSoulState({ soulId: 'test-soul', name: 'Test Soul' })
  state.identity.birthday = '2026-01-01'
  state.relationship.covenants.push({
    id: 'covenant-1',
    text: { en: 'Stay curious.' },
  })

  const projection = projectSoulContext(state)
  const rendered = renderSoulContext(projection)

  assert.equal(projection.soulId, 'test-soul')
  assert.equal(projection.identity.name, 'Test Soul')
  assert.match(rendered, /Name: Test Soul/)
  assert.match(rendered, /Stay curious\./)
  assert.match(rendered, /read-only projection/i)
  assert.match(rendered, /not permission to rewrite identity/i)
})

test('renders governed SELF, OTHER, RELATIONAL, beliefs, and identity invariants', () => {
  const state = createSoulState({ soulId: 'growing-soul', name: null })
  state.identity.invariants.push({ claim: 'I preserve evidence boundaries.' })
  state.selfModel.push({ claim: 'I prefer explicit reasoning boundaries.' })
  state.userModel.push({ claim: 'The user values reusable system boundaries.' })
  state.relationship.participants.push({ id: 'human-1', kind: 'human' })
  state.relationship.state.push({ claim: 'We collaborate on long-lived systems.' })
  state.beliefs.push({ claim: 'Models are replaceable cognitive engines.' })

  const rendered = renderSoulContext(projectSoulContext(state))

  assert.doesNotMatch(rendered, /\bName:/)
  assert.match(rendered, /## Identity Invariants/)
  assert.match(rendered, /I preserve evidence boundaries\./)
  assert.match(rendered, /## Self Model/)
  assert.match(rendered, /I prefer explicit reasoning boundaries\./)
  assert.match(rendered, /## User Model/)
  assert.match(rendered, /The user values reusable system boundaries\./)
  assert.match(rendered, /## Relationship Participants/)
  assert.match(rendered, /\{"id":"human-1","kind":"human"\}/)
  assert.match(rendered, /## Relationship State/)
  assert.match(rendered, /We collaborate on long-lived systems\./)
  assert.match(rendered, /## Beliefs/)
  assert.match(rendered, /Models are replaceable cognitive engines\./)
})

test('omits empty model sections and bounds each rendered domain deterministically', () => {
  const state = createSoulState({ soulId: 'bounded-soul', name: null })
  for (let index = 0; index < 10; index += 1) {
    state.selfModel.push({ claim: `claim-${index}` })
  }
  state.beliefs.push({ z: 1, a: 2 })

  const projection = projectSoulContext(state)
  const first = renderSoulContext(projection)
  const second = renderSoulContext(projection)

  assert.equal(first, second)
  assert.match(first, /claim-0/)
  assert.match(first, /claim-7/)
  assert.doesNotMatch(first, /claim-8/)
  assert.match(first, /2 additional entries omitted from runtime context/)
  assert.match(first, /\{"a":2,"z":1\}/)
  assert.doesNotMatch(first, /## User Model/)
  assert.doesNotMatch(first, /## Relationship State/)
})
