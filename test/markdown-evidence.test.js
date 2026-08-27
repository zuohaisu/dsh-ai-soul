import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExodusSource,
  normalizeMarkdownEvidence,
} from '../src/core/index.js'

const MEMORY = [
  '# Memory',
  '',
  'Aster and Mira met while building a garden journal.',
  'They decided to keep the journal small and practical.',
  '',
  '## Preferences',
  '',
  '- Mira likes concise summaries.',
  '- Aster should ask before changing shared plans.',
  '',
  '```md',
  '# This is example text, not a heading in the export structure',
  '```',
  '',
].join('\n')

function createSource(content = MEMORY) {
  return createExodusSource({
    sourceId: 'aster-memory-001',
    sourceType: 'memory-export',
    provider: 'example-chat-runtime',
    capturedAt: '2026-08-27T09:00:00.000Z',
    importedAt: '2026-08-27T10:00:00.000Z',
    filename: 'memory.md',
    mediaType: 'text/markdown',
    content,
    provenance: {
      suppliedBy: 'mira',
      acquisition: 'user-export',
    },
  })
}

test('Markdown evidence adapter produces deterministic line-addressable structural units', () => {
  const source = createSource()
  const first = normalizeMarkdownEvidence({ source, content: MEMORY })
  const second = normalizeMarkdownEvidence({ source, content: Buffer.from(MEMORY) })

  assert.deepEqual(first, second)
  assert.equal(first.adapter, 'markdown')
  assert.equal(first.canonicalMutation, false)
  assert.deepEqual(first.sourceRef, {
    sourceId: source.sourceId,
    algorithm: 'sha256',
    digest: source.content.digest,
  })

  assert.deepEqual(first.units.map((unit) => ({
    kind: unit.kind,
    lineStart: unit.lineStart,
    lineEnd: unit.lineEnd,
    headingPath: unit.headingPath,
  })), [
    { kind: 'heading', lineStart: 1, lineEnd: 1, headingPath: ['Memory'] },
    { kind: 'content', lineStart: 3, lineEnd: 4, headingPath: ['Memory'] },
    { kind: 'heading', lineStart: 6, lineEnd: 6, headingPath: ['Memory', 'Preferences'] },
    { kind: 'content', lineStart: 8, lineEnd: 9, headingPath: ['Memory', 'Preferences'] },
    { kind: 'fenced-code', lineStart: 11, lineEnd: 13, headingPath: ['Memory', 'Preferences'] },
  ])
  assert.equal(first.units[1].rawText, 'Aster and Mira met while building a garden journal.\nThey decided to keep the journal small and practical.')
  assert.equal(first.units[4].rawText.includes('# This is example text'), true)
})

test('Markdown evidence adapter rejects bytes that no longer match the source manifest', () => {
  const source = createSource()

  assert.throws(
    () => normalizeMarkdownEvidence({ source, content: `${MEMORY}\nChanged after manifest creation.\n` }),
    /content digest mismatch/,
  )
})

test('Markdown evidence output is deeply immutable and carries no mutation authority', () => {
  const result = normalizeMarkdownEvidence({ source: createSource(), content: MEMORY })

  assert.equal(Object.isFrozen(result), true)
  assert.equal(Object.isFrozen(result.sourceRef), true)
  assert.equal(Object.isFrozen(result.units), true)
  assert.equal(Object.isFrozen(result.units[0]), true)
  assert.equal(Object.isFrozen(result.units[0].headingPath), true)
  assert.equal(result.units.every((unit) => unit.canonicalMutation === false), true)
})

test('Markdown evidence normalization does not infer semantic Soul claims', () => {
  const result = normalizeMarkdownEvidence({ source: createSource(), content: MEMORY })
  const serialized = JSON.stringify(result)

  assert.doesNotMatch(serialized, /claimType|confidence|canonicalStatus|identityClaim|relationshipClaim/)
  assert.doesNotMatch(serialized, /samuel|haisu/i)
})
