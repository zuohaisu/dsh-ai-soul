import { evaluateSoulHomeostasis } from './homeostasis.js'
import { projectContinuityDigestDelta } from './continuity-digest-delta.js'

export const CONTINUITY_TRAJECTORY_VERSION = 1

function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b) }
function assertArray(value, label) { if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`) }

export function verifyGovernedContinuityTrajectory({ checkpoints } = {}) {
  assertArray(checkpoints, 'checkpoints')
  if (checkpoints.length < 2) throw new TypeError('checkpoints must contain at least two Soul states')

  const soulId = checkpoints[0]?.soulId
  const steps = []
  const seenProposalIds = new Set()

  for (let index = 1; index < checkpoints.length; index += 1) {
    const baseline = checkpoints[index - 1]
    const current = checkpoints[index]
    const homeostasis = evaluateSoulHomeostasis({ baseline, current })
    if (!homeostasis.passed) throw new TypeError(`trajectory homeostasis violation at step ${index}`)
    if (baseline.soulId !== soulId || current.soulId !== soulId) throw new TypeError(`trajectory soulId mismatch at step ${index}`)
    if (current.evolution.length !== baseline.evolution.length + 1) throw new TypeError(`trajectory must contain exactly one evolution entry per step at step ${index}`)

    const entry = current.evolution[current.evolution.length - 1]
    if (entry?.kind !== 'governed-state-transition') throw new TypeError(`trajectory step ${index} must end in governed-state-transition evidence`)
    const proposalId = entry.provenance?.proposalId
    if (!proposalId || typeof proposalId !== 'string') throw new TypeError(`trajectory step ${index} proposalId is required`)
    if (seenProposalIds.has(proposalId)) throw new TypeError(`trajectory contains duplicate proposalId at step ${index}`)
    seenProposalIds.add(proposalId)

    if (entry.continuityImpact == null) {
      steps.push({ index, proposalId, status: 'legacy-unsupported' })
      continue
    }

    const actual = projectContinuityDigestDelta({ before: baseline, after: current })
    if (!equal(actual, entry.continuityImpact)) throw new TypeError(`trajectory continuity impact mismatch at step ${index}`)
    steps.push({ index, proposalId, status: 'verified', delta: structuredClone(actual) })
  }

  return {
    version: CONTINUITY_TRAJECTORY_VERSION,
    soulId,
    verified: steps.every((step) => step.status === 'verified'),
    legacyUnsupported: steps.filter((step) => step.status === 'legacy-unsupported').length,
    steps,
  }
}
