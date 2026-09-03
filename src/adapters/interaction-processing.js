import { createSignificanceAssessment } from '../core/significance.js'
import { inferExplicitDurableUserPreference } from './durable-preference.js'
import { captureFirstEncounterFromDshEvent } from './first-encounter.js'
import { inferExplicitRelationshipState } from './relationship-state.js'
import { mapDshHumanMessageToExperience } from './runtime-event.js'
import { inferExplicitSelfModel } from './self-model.js'

export const DSH_SIGNIFICANCE_BASELINE_POLICY = Object.freeze({
  id: 'dsh-fail-closed-baseline-v1',
  version: 1,
})

function hasUsableTextContent(event) {
  if (!Array.isArray(event?.data?.content)) return false
  return event.data.content.some((part) => (
    part
    && typeof part === 'object'
    && !Array.isArray(part)
    && part.type === 'text'
    && typeof part.text === 'string'
    && part.text.trim().length > 0
  ))
}

function result(firstEncounter, experience = null, significanceAssessment = null, candidateClaim = null) {
  return {
    status: firstEncounter.status,
    firstEncounter,
    experience,
    significanceAssessment,
    candidateClaim,
  }
}

export function createFailClosedSignificanceAssessment(experience) {
  if (!experience?.id || typeof experience.id !== 'string') {
    throw new TypeError('Experience with id is required for significance assessment')
  }

  return createSignificanceAssessment({
    id: `significance:${DSH_SIGNIFICANCE_BASELINE_POLICY.id}:${encodeURIComponent(experience.id)}`,
    experienceId: experience.id,
    assessedAt: experience.at,
    level: 'low',
    rationale: 'No governed significance assessor has established a durable-memory promotion signal.',
    confidence: 1,
    provenance: {
      assessor: 'dsh-ai-soul',
      method: 'fail-closed-baseline',
      policy: structuredClone(DSH_SIGNIFICANCE_BASELINE_POLICY),
      experienceId: experience.id,
    },
    recommendPromotion: false,
  })
}

export async function processDshHumanInteraction({
  store,
  soulId,
  session,
  event,
  participant,
}) {
  const firstEncounter = await captureFirstEncounterFromDshEvent({
    store,
    soulId,
    session,
    event,
    participant,
  })

  if (event?.type !== 'user/message' || event?.data?.source?.kind !== 'user') {
    return result(firstEncounter)
  }

  if (!hasUsableTextContent(event)) {
    return result(firstEncounter)
  }

  const experience = mapDshHumanMessageToExperience(session, event, { participant })

  const relationshipState = inferExplicitRelationshipState(experience)
  if (relationshipState) {
    return result(
      firstEncounter,
      experience,
      relationshipState.significanceAssessment,
      relationshipState.candidateClaim,
    )
  }

  const selfModel = inferExplicitSelfModel(experience)
  if (selfModel) {
    return result(
      firstEncounter,
      experience,
      selfModel.significanceAssessment,
      selfModel.candidateClaim,
    )
  }

  const durablePreference = inferExplicitDurableUserPreference(experience)
  if (durablePreference) {
    return result(
      firstEncounter,
      experience,
      durablePreference.significanceAssessment,
      durablePreference.candidateClaim,
    )
  }

  const significanceAssessment = createFailClosedSignificanceAssessment(experience)
  return result(firstEncounter, experience, significanceAssessment)
}
