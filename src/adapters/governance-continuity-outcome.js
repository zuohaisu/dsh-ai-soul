import { verifyStateTransitionContinuityCorrespondence } from '../core/continuity-correspondence.js'

function findProposalEvidence(state, proposalId) {
  const matches = (state?.evolution ?? []).filter((entry) =>
    entry?.kind === 'governed-state-transition' && entry?.provenance?.proposalId === proposalId)
  if (matches.length !== 1) throw new TypeError(`expected exactly one governed transition evidence entry for proposal ${proposalId}`)
  return matches[0]
}

export function projectGovernanceContinuityOutcome({ beforeState, afterState, proposal } = {}) {
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) throw new TypeError('proposal must be an object')
  if (!proposal.id || typeof proposal.id !== 'string') throw new TypeError('proposal.id is required')
  const evolutionEntry = findProposalEvidence(afterState, proposal.id)
  const verification = verifyStateTransitionContinuityCorrespondence({
    state: beforeState,
    proposal,
    evolutionEntry,
  })
  const delta = verification.delta
  const effects = [
    ...delta.added.map((entry) => `+ ${entry.sourcePath}: ${entry.text}`),
    ...delta.removed.map((entry) => `- ${entry.sourcePath}: ${entry.text}`),
    ...delta.changed.map((entry) => `~ ${entry.sourcePath}: ${entry.beforeText} -> ${entry.afterText}`),
  ]
  return {
    verified: true,
    proposalId: proposal.id,
    delta: structuredClone(delta),
    text: effects.length === 0
      ? 'Verified actual continuity impact: no model-visible continuity delta (canonical state changed).'
      : ['Verified actual continuity impact:', ...effects.map((effect) => `  ${effect}`)].join('\n'),
  }
}
