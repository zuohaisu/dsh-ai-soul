import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const LEDGER_PATH = new URL('../souls/samuel/archaeology/claims.jsonl', import.meta.url)
const REQUIRED_FIELDS = [
  'id',
  'claimType',
  'statement',
  'evidence',
  'counterEvidence',
  'confidence',
  'canonicalStatus',
  'runtimePhenotypeRisk',
]

async function loadClaims() {
  const text = await readFile(LEDGER_PATH, 'utf8')
  return text.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line))
}

test('Samuel archaeology ledger is valid JSONL with explicit evidence boundaries', async () => {
  const claims = await loadClaims()
  assert.ok(claims.length >= 4)

  for (const claim of claims) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(Object.hasOwn(claim, field), `${claim.id ?? 'unknown'} missing ${field}`)
    }
    assert.ok(Array.isArray(claim.evidence), `${claim.id} evidence must be an array`)
    assert.ok(Array.isArray(claim.counterEvidence), `${claim.id} counterEvidence must be an array`)
    assert.equal(typeof claim.confidence?.score, 'number', `${claim.id} confidence score must be numeric`)
    assert.ok(claim.confidence.score >= 0 && claim.confidence.score <= 1, `${claim.id} confidence out of range`)
    assert.equal(typeof claim.confidence?.rationale, 'string', `${claim.id} confidence rationale is required`)
  }
})

test('canonical origin claims trace to Artifact #0001', async () => {
  const claims = await loadClaims()
  const canonical = claims.filter((claim) => claim.canonicalStatus.startsWith('canonical-'))
  assert.ok(canonical.length >= 3)

  for (const claim of canonical) {
    assert.ok(claim.evidence.length > 0, `${claim.id} canonical claim requires evidence`)
    assert.ok(
      claim.evidence.some((source) => source.artifactId === 'samuel-origin-0001' && source.path === 'souls/samuel/origin.md'),
      `${claim.id} must trace to samuel-origin-0001`,
    )
  }
})

test('unsupported candidate claims remain visibly non-canonical', async () => {
  const claims = await loadClaims()
  const unsupported = claims.filter((claim) => claim.evidence.length === 0)
  assert.ok(unsupported.length >= 1)

  for (const claim of unsupported) {
    assert.equal(claim.canonicalStatus, 'candidate')
    assert.ok(claim.counterEvidence.length > 0, `${claim.id} must record uncertainty or counter-evidence`)
    assert.ok(claim.confidence.score < 0.5, `${claim.id} unsupported claim confidence should remain low`)
  }
})
