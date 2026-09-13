import { projectStateTransitionContinuityPreview } from './state-transition-continuity-preview.js'

export const CONTINUITY_CORRESPONDENCE_VERSION = 1

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
}

export function verifyStateTransitionContinuityCorrespondence({ state, proposal, evolutionEntry } = {}) {
  const preview = projectStateTransitionContinuityPreview({ state, proposal })
  assertObject(evolutionEntry, 'evolutionEntry')
  if (evolutionEntry.kind !== 'governed-state-transition') throw new TypeError('evolutionEntry must be a governed-state-transition')
  if (evolutionEntry.provenance?.proposalId !== proposal.id) throw new TypeError('evolutionEntry proposalId does not match proposal')
  if (evolutionEntry.change?.target !== proposal.target) throw new TypeError('evolutionEntry target does not match proposal')
  if (evolutionEntry.change?.operation !== proposal.operation) throw new TypeError('evolutionEntry operation does not match proposal')
  assertObject(evolutionEntry.continuityImpact, 'evolutionEntry.continuityImpact')
  if (!deepEqual(preview.delta, evolutionEntry.continuityImpact)) throw new TypeError('preview continuity delta does not match actual continuity impact')

  return {
    version: CONTINUITY_CORRESPONDENCE_VERSION,
    verified: true,
    soulId: preview.soulId,
    proposalId: preview.proposalId,
    target: preview.target,
    operation: preview.operation,
    delta: structuredClone(preview.delta),
  }
}
