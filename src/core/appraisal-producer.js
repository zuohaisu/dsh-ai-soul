import { APPRAISAL_INPUT_VERSION } from './appraisal-input.js'
import { createAppraisalResult } from './appraisal-result.js'

const COGNITION_DOMAINS = Object.freeze(['self', 'other', 'relational', 'world', 'beliefs'])

function requireInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('input must be an AppraisalInput object')
  }
  if (input.version !== APPRAISAL_INPUT_VERSION) {
    throw new TypeError(`unsupported AppraisalInput version: ${input.version}`)
  }
  if (!input.event || typeof input.event !== 'object' || Array.isArray(input.event)) {
    throw new TypeError('input.event must be an object')
  }
  if (!input.cognition || typeof input.cognition !== 'object' || Array.isArray(input.cognition)) {
    throw new TypeError('input.cognition must be an object')
  }
}

function cognitionPathForRef(input, reference) {
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)) return null
  if (!COGNITION_DOMAINS.includes(reference.domain)) return null
  if (typeof reference.id !== 'string' || reference.id.trim() === '') return null

  const entries = input.cognition[reference.domain]
  if (!Array.isArray(entries)) return null
  const index = entries.findIndex((entry) => entry && typeof entry === 'object' && entry.id === reference.id)
  return index >= 0 ? `cognition.${reference.domain}.${index}` : null
}

/**
 * Produce only appraisals justified by explicit runtime evidence.
 *
 * Rule v1 deliberately supports one claim: an event is highly relevant when
 * its structured context explicitly references cognition entries that exist in
 * the current AppraisalInput. Missing or stale references produce no appraisal
 * rather than a guessed default.
 */
export function produceAppraisal(input) {
  requireInput(input)

  const refs = input.event.context?.cognitionRefs
  if (!Array.isArray(refs) || refs.length === 0) return null

  const cognitionPaths = [...new Set(refs.map((ref) => cognitionPathForRef(input, ref)).filter(Boolean))]
  if (cognitionPaths.length === 0) return null

  return createAppraisalResult({
    input,
    assessment: {
      relevance: {
        level: 'high',
        evidence: [
          { path: 'event.context.cognitionRefs' },
          ...cognitionPaths.map((path) => ({ path })),
        ],
      },
    },
  })
}
