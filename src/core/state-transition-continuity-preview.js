import { assertCurrentCognitionAppendCapacity } from './cognitive-capacity.js'
import { projectContinuityDigestDelta } from './continuity-digest-delta.js'
import { validateSoulState } from './soul-state.js'
import { validateStateTransitionProposal } from './state-transition.js'

export const STATE_TRANSITION_CONTINUITY_PREVIEW_VERSION = 1

function clone(value) {
  return structuredClone(value)
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function mutableTarget(state, target) {
  switch (target) {
    case 'selfModel': return state.selfModel
    case 'userModel': return state.userModel
    case 'relationship.state': return state.relationship.state
    case 'beliefs': return state.beliefs
    case 'worldModel': state.worldModel ??= []; return state.worldModel
    default: throw new TypeError('target is not mutable through the generic transition pipeline')
  }
}

function projectHypotheticalState(state, proposal) {
  const next = clone(state)
  const target = mutableTarget(next, proposal.target)

  if (proposal.operation === 'append') {
    assertCurrentCognitionAppendCapacity(proposal.target, target)
    target.push(clone(proposal.value))
    return next
  }

  if (proposal.operation === 'consolidate') {
    const sourceIndexes = []
    proposal.previousValues.forEach((source) => {
      const matches = []
      target.forEach((entry, index) => {
        if (deepEqual(entry, source)) matches.push(index)
      })
      if (matches.length === 0) throw new TypeError('consolidate previousValues contains a value that does not match current state')
      if (matches.length > 1) throw new TypeError('consolidate previousValues contains a value that matches multiple current values')
      sourceIndexes.push(matches[0])
    })
    const insertionIndex = Math.min(...sourceIndexes)
    sourceIndexes.slice().sort((a, b) => b - a).forEach((index) => target.splice(index, 1))
    target.splice(insertionIndex, 0, clone(proposal.value))
    return next
  }

  const matches = []
  target.forEach((entry, index) => {
    if (deepEqual(entry, proposal.previousValue)) matches.push(index)
  })
  if (matches.length === 0) throw new TypeError(`${proposal.operation} previousValue does not match current state`)
  if (matches.length > 1) throw new TypeError(`${proposal.operation} previousValue matches multiple current values`)

  if (proposal.operation === 'replace') target[matches[0]] = clone(proposal.value)
  else target.splice(matches[0], 1)
  return next
}

export function projectStateTransitionContinuityPreview({ state, proposal } = {}) {
  const stateValidation = validateSoulState(state)
  if (!stateValidation.valid) throw new TypeError(`invalid Soul state: ${stateValidation.errors.join('; ')}`)

  const proposalValidation = validateStateTransitionProposal(proposal)
  if (!proposalValidation.valid) throw new TypeError(`invalid state transition proposal: ${proposalValidation.errors.join('; ')}`)

  const hypothetical = projectHypotheticalState(state, proposal)
  const delta = projectContinuityDigestDelta({ before: state, after: hypothetical })

  return {
    version: STATE_TRANSITION_CONTINUITY_PREVIEW_VERSION,
    soulId: state.soulId,
    proposalId: proposal.id,
    target: proposal.target,
    operation: proposal.operation,
    delta,
  }
}
