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
  assert.match(rendered, /not permission to rewrite identity/i)
})
