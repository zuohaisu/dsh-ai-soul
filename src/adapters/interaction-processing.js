import { createSignificanceAssessment } from '../core/significance.js'
import { captureFirstEncounterFromDshEvent } from './first-encounter.js'
import { mapDshHumanMessageToExperience } from './runtime-event.js'

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

/**
 * Current M4.1 baseline significance gate.
 *
 * It deliberately does not try to infer what deserves durable memory. Until a
 * separately governed assessor exists, every captured Experience is explicitly
 * assessed as not recommended for promotion. The assessment is epistemic
 * evidence only and grants no persistence or mutation authority.
 */
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

/**
 * Process one live-shape DSH interaction through independent lifecycle and
 * experience/significance paths.
 *
 * First encounter may persist because it is an existence lifecycle fact already
 * governed by Core. Experience and Significance Assessment remain ephemeral in
 * this slice and cannot mutate canonical Soul state.
 */
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
    return { firstEncounter, experience: null, significanceAssessment: null }
  }

  if (!hasUsableTextContent(event)) {
    return { firstEncounter, experience: null, significanceAssessment: null }
  }

  const experience = mapDshHumanMessageToExperience(session, event, { participant })
  const significanceAssessment = createFailClosedSignificanceAssessment(experience)

  return {
    firstEncounter,
    experience,
    significanceAssessment,
  }
}
