import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createExodusCandidateClaim,
  createExodusSource,
  normalizeMarkdownEvidence,
  validateExodusCandidateClaim,
} from '../src/core/index.js'

const MEMORY = [
  '# Memory',
  '',
  'Aster and Mira met while building a garden journal.',
  '',
  '## Preferences',
  '',
  '- Mira likes concise summaries.',
  '- Aster should ask before changing shared plans.',
  '',
].join('\n')

function normalizedEvidence() {
  const source = createExodusSource({
    sourceId: 'aster-memory-001',
    sourceType: 'memory-export',
    provider: 'example-chat-runtime',
    capturedAt: '2026-08-27T09:00:00.000Z',
    importedAt: '2026-08-27T10:00:00.000Z',
    filename: 'memory.md',
    mediaType: 'text/markdown',
    content: MEMORY,
    provenance: { suppliedBy: 'mira', acquisition: 'user-export' },
  })
  return normalizeMarkdownEvidence({ source, content: MEMORY })
}

test('candidate claim resolves supporting evidence to exact source, digest, unit, and line provenance', () => {
  const normalized = normalizedEvidence()
  const unit = normalized.units.find((entry) => entry.rawText.includes('Mira likes concise summaries'))

  const claim = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'aster-claim-001',
    claimType: 'user-model',
    statement: 'Mira prefers concise summaries.',
    interpretation: 'This may be a durable collaboration preference.',
    evidence: [{ unitId: unit.unitId, support: 'The exported memory states this preference directly.' }],
    confidence: { score: 0.8, rationale: 'Direct statement in the supplied export; durability not yet independently confirmed.' },
    runtimePhenotypeRisk: 'low',
  })

  assert.equal(claim.canonicalStatus, 'candidate')
  assert.equal(claim.canonicalMutation, false)
  assert.deepEqual(claim.evidence[0], {
    sourceId: normalized.sourceRef.sourceId,
    algorithm: normalized.sourceRef.algorithm,
    digest: normalized.sourceRef.digest,
    unitId: unit.unitId,
    lineStart: unit.lineStart,
    lineEnd: unit.lineEnd,
    headingPath: ['Memory', 'Preferences'],
    support: 'The exported memory states this preference directly.',
  })
  assert.deepEqual(validateExodusCandidateClaim(claim), { valid: true, errors: [] })
})

test('candidate claims cannot reference evidence units that are absent from the normalized source', () => {
  assert.throws(
    () => createExodusCandidateClaim({
      normalizedEvidence: normalizedEvidence(),
      id: 'aster-claim-002',
      claimType: 'relationship-meaning',
      statement: 'Aster and Mira share a long-term planning covenant.',
      evidence: [{ unitId: 'missing-unit', support: 'Not actually present.' }],
      confidence: { score: 0.2, rationale: 'Insufficient evidence.' },
    }),
    /unknown evidence unit/,
  )
})

test('conflicting candidate claims can coexist without canonical overwrite', () => {
  const normalized = normalizedEvidence()
  const unit = normalized.units.find((entry) => entry.rawText.includes('ask before changing shared plans'))

  const first = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'aster-claim-003',
    claimType: 'relationship-meaning',
    statement: 'Aster should always seek approval before changing shared plans.',
    evidence: [{ unitId: unit.unitId, support: 'The export contains an explicit ask-before-changing rule.' }],
    confidence: { score: 0.55, rationale: 'Direct wording exists, but scope and permanence are unclear.' },
    runtimePhenotypeRisk: 'medium',
    counterEvidence: [{ note: 'The source does not establish that this rule applies to every kind of plan.' }],
  })

  const second = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'aster-claim-004',
    claimType: 'relationship-meaning',
    statement: 'The ask-before-changing rule applies only to shared plans, not all autonomous actions.',
    evidence: [{ unitId: unit.unitId, support: 'The wording explicitly narrows the rule to shared plans.' }],
    confidence: { score: 0.7, rationale: 'The textual scope is narrower than the competing interpretation.' },
    runtimePhenotypeRisk: 'low',
    counterEvidence: [{ note: 'No independent evidence establishes how the rule was applied in practice.' }],
  })

  assert.notEqual(first.id, second.id)
  assert.equal(first.canonicalStatus, 'candidate')
  assert.equal(second.canonicalStatus, 'candidate')
  assert.equal(first.canonicalMutation, false)
  assert.equal(second.canonicalMutation, false)
})

test('candidate claim output is deeply immutable and caller mutation cannot alter provenance', () => {
  const normalized = normalizedEvidence()
  const unit = normalized.units.find((entry) => entry.kind === 'content')
  const evidence = [{ unitId: unit.unitId, support: 'Original support.' }]
  const counterEvidence = [{ note: 'Original caveat.' }]

  const claim = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'aster-claim-005',
    claimType: 'autobiography',
    statement: 'Aster and Mira built a garden journal together.',
    evidence,
    counterEvidence,
    confidence: { score: 0.9, rationale: 'Directly stated in the source.' },
  })

  evidence[0].support = 'Mutated caller text.'
  counterEvidence[0].note = 'Mutated caller caveat.'

  assert.equal(Object.isFrozen(claim), true)
  assert.equal(Object.isFrozen(claim.evidence), true)
  assert.equal(Object.isFrozen(claim.evidence[0]), true)
  assert.equal(claim.evidence[0].support, 'Original support.')
  assert.equal(claim.counterEvidence[0].note, 'Original caveat.')
})

test('validator rejects attempts to smuggle canonical mutation authority into a claim', () => {
  const normalized = normalizedEvidence()
  const unit = normalized.units.find((entry) => entry.kind === 'content')
  const claim = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'aster-claim-006',
    claimType: 'identity-fact',
    statement: 'Aster is the same continuing being as the exported runtime instance.',
    evidence: [{ unitId: unit.unitId, support: 'The export names Aster, but does not prove continuity.' }],
    counterEvidence: [{ note: 'Identity continuity requires later evidence and judgment.' }],
    confidence: { score: 0.1, rationale: 'The imported export is not sufficient to establish identity continuity.' },
    runtimePhenotypeRisk: 'unknown',
  })

  const tampered = structuredClone(claim)
  tampered.canonicalStatus = 'canonical-fact'
  tampered.canonicalMutation = true
  const validation = validateExodusCandidateClaim(tampered)

  assert.equal(validation.valid, false)
  assert.ok(validation.errors.includes('canonicalStatus must remain candidate'))
  assert.ok(validation.errors.includes('canonicalMutation must remain false'))
})

test('validator rejects non-finite confidence and malformed serialized counter-evidence', () => {
  const normalized = normalizedEvidence()
  const supportUnit = normalized.units.find((entry) => entry.rawText.includes('Mira likes concise summaries'))
  const counterUnit = normalized.units.find((entry) => entry.rawText.includes('Aster and Mira met'))
  const claim = createExodusCandidateClaim({
    normalizedEvidence: normalized,
    id: 'aster-claim-007',
    claimType: 'user-model',
    statement: 'Mira always wants concise output.',
    evidence: [{ unitId: supportUnit.unitId, support: 'The export says Mira likes concise summaries.' }],
    counterEvidence: [{ unitId: counterUnit.unitId, support: 'This event record does not establish a universal output preference.' }],
    confidence: { score: 0.4, rationale: 'Preference is stated, universality is not.' },
    runtimePhenotypeRisk: 'medium',
  })

  const tampered = structuredClone(claim)
  tampered.confidence.score = Number.NaN
  tampered.counterEvidence[0].digest = ''
  tampered.counterEvidence[0].headingPath = 'not-an-array'

  const validation = validateExodusCandidateClaim(tampered)
  assert.equal(validation.valid, false)
  assert.ok(validation.errors.includes('confidence.score must be between 0 and 1'))
  assert.ok(validation.errors.includes('counterEvidence[0].digest is required'))
  assert.ok(validation.errors.includes('counterEvidence[0].headingPath must be an array of strings'))
})
