import { createHomeostasisAssessment } from './homeostasis-assessment.js'
import { applyStateTransitionProposal } from './state-transition.js'

function clone(value) {
  return structuredClone(value)
}

function boundedViolations(assessment) {
  return assessment.violations.map((violation) => ({
    code: violation.code,
    ...(typeof violation.path === 'string' ? { path: violation.path } : {}),
  }))
}

/**
 * Evaluate the exact reviewed transition without persistence or mutation authority.
 *
 * The canonical apply function is intentionally reused to construct the candidate,
 * so preflight cannot drift into a second transition implementation. A failing
 * homeostasis assertion carries the canonical evidence-bound assessment; a passing
 * transition is assessed against the candidate returned by the same apply path.
 */
export function preflightStateTransitionProposal(state, proposal) {
  const baseline = clone(state)

  try {
    const candidate = applyStateTransitionProposal(state, proposal)
    const assessment = createHomeostasisAssessment({ baseline, proposal, candidate })
    return Object.freeze({
      passed: true,
      assessment: clone(assessment),
      summary: Object.freeze({ passed: true, violations: [] }),
    })
  } catch (error) {
    if (error?.code !== 'SOUL_HOMEOSTASIS_VIOLATION' || !error.homeostasis) throw error
    const assessment = clone(error.homeostasis)
    return Object.freeze({
      passed: false,
      assessment,
      summary: Object.freeze({
        passed: false,
        violations: boundedViolations(assessment),
      }),
    })
  }
}
