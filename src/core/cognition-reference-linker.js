import { APPRAISAL_INPUT_VERSION } from './appraisal-input.js'
import { produceAppraisal } from './appraisal-producer.js'

function requireInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('input must be an AppraisalInput object')
  }
  if (input.version !== APPRAISAL_INPUT_VERSION) {
    throw new TypeError(`unsupported AppraisalInput version: ${input.version}`)
  }
}

/**
 * Derive only cognition links proven by structured runtime identity evidence.
 *
 * Rule v1: event.provenance.participant.id may link to exactly one governed
 * relationship participant with the same id. Missing or ambiguous identity
 * evidence produces no link. Free-form event text is never inspected.
 */
export function deriveCognitionReferences(input) {
  requireInput(input)

  const participantId = input.event?.provenance?.participant?.id
  if (typeof participantId !== 'string' || participantId.trim() === '') return []

  const participants = input.cognition?.participants
  if (!Array.isArray(participants)) return []

  const matches = participants
    .map((participant, index) => ({ participant, index }))
    .filter(({ participant }) => participant && typeof participant === 'object' && participant.id === participantId)

  if (matches.length !== 1) return []

  const [{ participant, index }] = matches
  return [{
    domain: 'participants',
    id: participant.id,
    evidence: {
      eventPath: 'event.provenance.participant.id',
      cognitionPath: `cognition.participants.${index}`,
    },
  }]
}

/**
 * Form an appraisal from derived runtime evidence without mutating AppraisalInput.
 * No derived link means no appraisal; callers cannot use this path to hand-author
 * cognition references.
 */
export function produceAppraisalFromRuntimeEvidence(input) {
  const cognitionRefs = deriveCognitionReferences(input)
  if (cognitionRefs.length === 0) return null

  const derivedInput = structuredClone(input)
  derivedInput.event.context = {
    ...(derivedInput.event.context ?? {}),
    cognitionRefs: cognitionRefs.map(({ domain, id }) => ({ domain, id })),
  }
  return produceAppraisal(derivedInput)
}
