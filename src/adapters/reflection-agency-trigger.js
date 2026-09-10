import { createAgencyTriggerEvidence } from '../core/agency-trigger-evidence.js'
import { validateReflectionResult } from '../core/reflection.js'

export const GOVERNED_REFLECTION_AGENCY_TRIGGER_POLICY = 'governed-reflection-agency-trigger-v1'

export function deriveAgencyTriggerEvidenceFromReflection(reflection, { soulId } = {}) {
  if (typeof soulId !== 'string' || !soulId.trim()) {
    throw new TypeError('reflection agency trigger evidence requires soulId')
  }

  const validation = validateReflectionResult(reflection)
  if (!validation.valid) return null

  // A proposal is the only structural signal in ReflectionResult that expresses
  // a concrete candidate change. Free-form observations are deliberately not
  // interpreted as initiative reasons.
  if (reflection.proposals.length === 0) return null

  return createAgencyTriggerEvidence({
    id: `agency-trigger:${encodeURIComponent(soulId)}:reflection:${encodeURIComponent(reflection.id)}`,
    soulId,
    triggerClass: 'governed-reflection-result',
    source: {
      type: 'reflection-result',
      id: reflection.id,
    },
    provenance: {
      policy: GOVERNED_REFLECTION_AGENCY_TRIGGER_POLICY,
      sourceReflectionId: reflection.id,
      sourceReflectionAt: reflection.at,
      sourceExperienceIds: reflection.sources.map((source) => source.experienceId),
      reflectionProvenance: structuredClone(reflection.provenance),
    },
  })
}
