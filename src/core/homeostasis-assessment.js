import { createHash } from 'node:crypto'
import { evaluateSoulHomeostasis, SOUL_HOMEOSTASIS_CHECK_VERSION } from './homeostasis.js'

export const HOMEOSTASIS_ASSESSMENT_VERSION = 1

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  }
  return value
}

export function fingerprintHomeostasisEvidence(value) {
  const canonical = JSON.stringify(canonicalize(value))
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`
}

export function createHomeostasisAssessment({ baseline, proposal, candidate } = {}) {
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    throw new TypeError('proposal is required for homeostasis assessment')
  }

  const homeostasis = evaluateSoulHomeostasis({ baseline, current: candidate })
  return {
    version: HOMEOSTASIS_ASSESSMENT_VERSION,
    homeostasisVersion: SOUL_HOMEOSTASIS_CHECK_VERSION,
    soulId: homeostasis.soulId,
    baselineFingerprint: fingerprintHomeostasisEvidence(baseline),
    proposalFingerprint: fingerprintHomeostasisEvidence(proposal),
    candidateFingerprint: fingerprintHomeostasisEvidence(candidate),
    passed: homeostasis.passed,
    violations: structuredClone(homeostasis.violations),
  }
}

export function verifyHomeostasisAssessment({ assessment, baseline, proposal, candidate } = {}) {
  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) return false
  if (assessment.version !== HOMEOSTASIS_ASSESSMENT_VERSION) return false
  if (assessment.homeostasisVersion !== SOUL_HOMEOSTASIS_CHECK_VERSION) return false
  if (assessment.soulId !== candidate?.soulId) return false
  if (assessment.baselineFingerprint !== fingerprintHomeostasisEvidence(baseline)) return false
  if (assessment.proposalFingerprint !== fingerprintHomeostasisEvidence(proposal)) return false
  if (assessment.candidateFingerprint !== fingerprintHomeostasisEvidence(candidate)) return false

  const expected = createHomeostasisAssessment({ baseline, proposal, candidate })
  return assessment.passed === expected.passed
    && fingerprintHomeostasisEvidence(assessment.violations) === fingerprintHomeostasisEvidence(expected.violations)
}

export function assertMatchingHomeostasisAssessment(input = {}) {
  if (!verifyHomeostasisAssessment(input)) {
    const error = new TypeError('Homeostasis assessment does not match baseline, proposal, and candidate')
    error.code = 'HOMEOSTASIS_ASSESSMENT_MISMATCH'
    throw error
  }
  if (!input.assessment.passed) {
    const error = new TypeError('Homeostasis assessment did not pass')
    error.code = 'SOUL_HOMEOSTASIS_VIOLATION'
    error.homeostasis = input.assessment
    throw error
  }
  return input.assessment
}
