import { assessCognitionCapacityPreflight } from './cognition-capacity-preflight.js'

export const COGNITION_CAPACITY_GUIDANCE_VERSION = 1

export function deriveCognitionCapacityGuidance({ state, proposal } = {}) {
  const preflight = assessCognitionCapacityPreflight({ state, proposal })

  if (preflight.status !== 'consolidation-required') {
    return Object.freeze({
      version: COGNITION_CAPACITY_GUIDANCE_VERSION,
      status: 'not-required',
      target: preflight.target,
    })
  }

  return Object.freeze({
    version: COGNITION_CAPACITY_GUIDANCE_VERSION,
    status: 'consolidation-required',
    target: preflight.target,
    nextStep: Object.freeze({
      operation: 'consolidate',
      minimumSources: 2,
      authority: 'governed-state-transition',
    }),
  })
}
