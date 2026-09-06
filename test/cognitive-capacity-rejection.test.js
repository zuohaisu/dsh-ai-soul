import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertCurrentCognitionAppendCapacity,
  MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
} from '../src/core/cognitive-capacity.js'

test('below-capacity current cognition remains append-eligible', () => {
  const entries = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN - 1 }, (_, index) => `entry-${index}`)
  assert.equal(assertCurrentCognitionAppendCapacity('userModel', entries), true)
})

test('at-capacity current cognition fails closed with structured evidence', () => {
  const entries = Array.from({ length: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN }, (_, index) => `entry-${index}`)

  assert.throws(
    () => assertCurrentCognitionAppendCapacity('userModel', entries),
    (error) => {
      assert.equal(error.code, 'SOUL_CURRENT_COGNITION_CAPACITY_EXCEEDED')
      assert.deepEqual(error.capacity, {
        target: 'userModel',
        capacity: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
        currentEntries: MAX_CURRENT_COGNITION_ENTRIES_PER_DOMAIN,
      })
      return true
    },
  )
})
