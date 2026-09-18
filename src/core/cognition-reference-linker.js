import { APPRAISAL_INPUT_VERSION } from './appraisal-input.js'
import { produceAppraisal } from './appraisal-producer.js'
import { createAppraisalResult } from './appraisal-result.js'
import { validateRelationshipFact } from './relationship-fact.js'

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
 * Rule identity for the bounded relational appraisal rule. The rule keys only on
 * structure that is already canonical — a governed RelationshipFact whose subject
 * is the exactly-linked participant — and never interprets predicate/value text.
 */
export const RELATIONAL_APPRAISAL_RULE = Object.freeze({
  id: 'dyadic-governed-fact-v1',
  version: 1,
})

/**
 * Rule v2: derive a bounded relationalSignificance assessment only when the
 * runtime-evidence participant link and at least one valid governed
 * relationship fact about that exact participant coexist. Facts with other
 * subjects, non-participant subjects, or invalid/tampered shapes produce no
 * relational appraisal. Predicate and value semantics are deliberately not
 * interpreted: inventing relationship meaning here would be ontology
 * invention, which fails closed per the governed-evolution boundary.
 */
export function deriveRelationalSignificance(input, participantLink) {
  requireInput(input)
  if (!participantLink
    || typeof participantLink !== 'object'
    || participantLink.domain !== 'participants'
    || typeof participantLink.id !== 'string'
    || participantLink.id.trim() === ''
    || typeof participantLink.evidence?.cognitionPath !== 'string') return null

  const facts = input.cognition?.relational
  if (!Array.isArray(facts)) return null

  const matchedPaths = []
  facts.forEach((fact, index) => {
    if (!fact || typeof fact !== 'object' || Array.isArray(fact)) return
    if (!validateRelationshipFact(fact).valid) return
    if (fact.subject?.type !== 'participant' || fact.subject?.id !== participantLink.id) return
    matchedPaths.push({ path: `cognition.relational.${index}` })
  })

  if (matchedPaths.length === 0) return null
  return {
    level: 'high',
    evidence: [
      { path: 'event.provenance.participant.id' },
      { path: participantLink.evidence.cognitionPath },
      ...matchedPaths,
    ],
  }
}

/**
 * Form an appraisal from derived runtime evidence without mutating AppraisalInput.
 * No derived link means no appraisal; callers cannot use this path to hand-author
 * cognition references. The relational dimension appears only when rule v2 finds
 * governed dyadic facts about the linked participant.
 */
export function produceAppraisalFromRuntimeEvidence(input) {
  const cognitionRefs = deriveCognitionReferences(input)
  if (cognitionRefs.length === 0) return null

  const derivedInput = structuredClone(input)
  derivedInput.event.context = {
    ...(derivedInput.event.context ?? {}),
    cognitionRefs: cognitionRefs.map(({ domain, id }) => ({ domain, id })),
  }

  const relevanceAppraisal = produceAppraisal(derivedInput)
  if (!relevanceAppraisal) return null

  const relationalSignificance = deriveRelationalSignificance(derivedInput, cognitionRefs[0])
  if (!relationalSignificance) return relevanceAppraisal

  return createAppraisalResult({
    input: derivedInput,
    assessment: {
      relevance: relevanceAppraisal.dimensions.relevance,
      relationalSignificance,
    },
  })
}
