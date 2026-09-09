import { getCurrentCognitionCapacity } from './cognitive-capacity.js'
import { validateSoulState } from './soul-state.js'

function entriesForTarget(state, target) {
  if (target === 'relationship.state') return state.relationship.state
  return state[target]
}

export function assessCognitionCapacityPreflight({ state, proposal } = {}) {
  const validation = validateSoulState(state)
  if (!validation.valid) {
    throw new TypeError(`invalid Soul state: ${validation.errors.join('; ')}`)
  }
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    throw new TypeError('capacity preflight requires proposal')
  }

  const operation = proposal.operation ?? 'append'
  if (operation !== 'append') {
    return Object.freeze({
      status: 'not-applicable',
      target: proposal.target ?? null,
    })
  }

  const capacity = getCurrentCognitionCapacity(proposal.target)
  const entries = entriesForTarget(state, proposal.target)
  if (!Array.isArray(entries)) {
    throw new TypeError('capacity preflight target must resolve to current cognition entries')
  }

  const count = entries.length
  return Object.freeze({
    status: count < capacity ? 'fits' : 'consolidation-required',
    target: proposal.target,
    count,
    capacity,
  })
}
