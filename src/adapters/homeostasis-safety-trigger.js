import { verifyHomeostasisAssessment } from '../core/homeostasis-assessment.js'
import { createAgencyTriggerEvidence } from '../core/agency-trigger-evidence.js'

export function createHomeostasisSafetyTrigger({ id, assessment, baseline, proposal, candidate } = {}) {
  if (!verifyHomeostasisAssessment({ assessment, baseline, proposal, candidate })) {
    const error = new TypeError('homeostasis assessment does not match supplied evidence')
    error.code = 'HOMEOSTASIS_ASSESSMENT_MISMATCH'
    throw error
  }

  if (assessment.passed) return null

  return createAgencyTriggerEvidence({
    id,
    soulId: assessment.soulId,
    triggerClass: 'governed-safety-concern',
    source: {
      type: 'homeostasis-assessment',
      id: assessment.proposalFingerprint,
    },
    provenance: {
      homeostasisAssessmentVersion: assessment.version,
      homeostasisVersion: assessment.homeostasisVersion,
      baselineFingerprint: assessment.baselineFingerprint,
      proposalFingerprint: assessment.proposalFingerprint,
      candidateFingerprint: assessment.candidateFingerprint,
      violations: structuredClone(assessment.violations),
    },
  })
}
