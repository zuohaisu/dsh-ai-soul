import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExodusSource,
  validateExodusSource,
} from '../src/core/index.js'

const ASTER_MEMORY = '# Memory\n\nAster and Mira met while building a garden journal.\n'

function createAsterSource(overrides = {}) {
  return createExodusSource({
    sourceId: 'aster-memory-001',
    sourceType: 'memory-export',
    provider: 'example-chat-runtime',
    capturedAt: '2026-08-27T09:00:00.000Z',
    importedAt: '2026-08-27T10:00:00.000Z',
    filename: 'memory.md',
    mediaType: 'text/markdown',
    content: ASTER_MEMORY,
    provenance: {
      suppliedBy: 'mira',
      acquisition: 'user-export',
      notes: { originalLocation: 'partner-export/memory.md' },
    },
    ...overrides,
  })
}

test('Generic Exodus creates deterministic immutable source evidence without canonical mutation', () => {
  const first = createAsterSource()
  const second = createAsterSource({ sourceId: 'aster-memory-002' })

  assert.deepEqual(validateExodusSource(first), { valid: true, errors: [] })
  assert.equal(first.content.algorithm, 'sha256')
  assert.equal(first.content.digest, second.content.digest)
  assert.equal(first.original.byteLength, Buffer.byteLength(ASTER_MEMORY))
  assert.equal(first.canonicalMutation, false)
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.provenance), true)
  assert.equal(Object.isFrozen(first.provenance.notes), true)
})

test('Generic Exodus clones caller-owned provenance before freezing evidence', () => {
  const provenance = {
    suppliedBy: 'mira',
    nested: { acquisition: 'manual-export' },
  }
  const source = createAsterSource({ provenance })

  provenance.suppliedBy = 'changed-later'
  provenance.nested.acquisition = 'changed-later'

  assert.equal(source.provenance.suppliedBy, 'mira')
  assert.equal(source.provenance.nested.acquisition, 'manual-export')
})

test('Generic Exodus digest changes when source bytes change', () => {
  const first = createAsterSource()
  const changed = createAsterSource({ content: `${ASTER_MEMORY}\nOne more line.\n` })

  assert.notEqual(first.content.digest, changed.content.digest)
})

test('Generic Exodus validation rejects missing provenance, digest, and mutation invariant', () => {
  const source = structuredClone(createAsterSource())
  delete source.provenance
  delete source.content.digest
  source.canonicalMutation = true

  const result = validateExodusSource(source)
  assert.equal(result.valid, false)
  assert.match(result.errors.join('; '), /provenance is required/)
  assert.match(result.errors.join('; '), /content.digest is required/)
  assert.match(result.errors.join('; '), /canonicalMutation must be false/)
})

test('Generic Exodus source evidence contains no Samuel-specific defaults', () => {
  const serialized = JSON.stringify(createAsterSource())
  assert.doesNotMatch(serialized, /samuel/i)
  assert.doesNotMatch(serialized, /haisu/i)
})
